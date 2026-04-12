"""Document processing and retrieval pipeline.

Works entirely on in-memory bytes — no temporary files written to disk.
"""

import io
import os
import re
import uuid
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions
import fitz  # PyMuPDF
from keybert import KeyBERT


BASE_DIR = Path(__file__).resolve().parent
CHROMA_PATH = BASE_DIR.parent / "chroma_store"
CHROMA_PATH.mkdir(parents=True, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))

_kw_model = None
_embedding_fn = None


def _get_kw_model() -> KeyBERT:
    global _kw_model
    if _kw_model is None:
        _kw_model = KeyBERT(model="all-MiniLM-L6-v2")
    return _kw_model


def _get_embedding_fn():
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
    return _embedding_fn


def _fallback_keywords(text: str, top_n: int = 15) -> list[str]:
    stopwords = {
        "the", "and", "for", "that", "with", "from", "this", "are", "was", "were",
        "into", "have", "has", "had", "you", "your", "their", "they", "them", "about",
        "than", "then", "because", "when", "where", "which", "what", "why", "how",
        "can", "could", "would", "should", "will", "shall", "also", "very", "more",
        "most", "some", "many", "much", "such", "only", "over", "under", "between",
        "within", "without", "through", "while", "after", "before", "during", "each",
        "other", "onto", "upon", "across", "it", "its", "of", "to", "in", "on",
        "a", "an",
    }
    tokens = re.findall(r"[a-zA-Z]{4,}", text.lower())
    freq: dict[str, int] = {}
    for tok in tokens:
        if tok in stopwords:
            continue
        freq[tok] = freq.get(tok, 0) + 1
    ranked = sorted(freq.items(), key=lambda item: item[1], reverse=True)
    return [word for word, _ in ranked[:top_n]]


# ─────────────────────── Text extraction (from bytes) ────────────────────────

def _extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """Extract text from PDF bytes without writing to disk."""
    full_text = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            full_text.append(page.get_text())
    return "\n".join(full_text)


def _extract_text_from_txt_bytes(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore")


# ─────────────────────── Public API ──────────────────────────────────────────

def process_file_bytes(file_bytes: bytes, ext: str, session_id: str) -> dict:
    """
    Extract text + keywords from raw file bytes, then store chunks in ChromaDB.
    Supports .pdf and .txt extensions.
    """
    if ext == ".pdf":
        full_text = _extract_text_from_pdf_bytes(file_bytes)
    elif ext == ".txt":
        full_text = _extract_text_from_txt_bytes(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    if not full_text.strip():
        return {"full_text": "", "keywords": [], "chunk_count": 0}

    # Keyword extraction
    try:
        keywords = _get_kw_model().extract_keywords(
            full_text,
            keyphrase_ngram_range=(1, 2),
            stop_words="english",
            top_n=15,
            diversity=0.5,
        )
        keyword_list = [kw for kw, _ in keywords]
    except Exception as e:
        print(f"[RAG] KeyBERT failed, using fallback: {e}")
        keyword_list = _fallback_keywords(full_text, top_n=15)

    # Chunking with overlap
    chunk_size = 500
    overlap = 50
    chunks = []
    start = 0
    while start < len(full_text):
        end = min(start + chunk_size, len(full_text))
        chunks.append(full_text[start:end])
        start += chunk_size - overlap

    chunks = [c.strip() for c in chunks if c.strip()] or [full_text.strip()]

    # Store in ChromaDB
    collection = chroma_client.get_or_create_collection(
        name=f"session_{session_id}",
        embedding_function=_get_embedding_fn(),
    )
    collection.add(
        documents=chunks,
        ids=[str(uuid.uuid4()) for _ in chunks],
    )

    return {"full_text": full_text, "keywords": keyword_list, "chunk_count": len(chunks)}


# Kept for backward-compat; internally uses bytes variant
def process_file(file_path: str, session_id: str) -> dict:
    ext = os.path.splitext(file_path)[1].lower()
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    return process_file_bytes(file_bytes, ext, session_id)


def retrieve_context(session_id: str, query: str, n_results: int = 4) -> list:
    """RAG retrieval — returns most relevant chunks for a query."""
    try:
        collection = chroma_client.get_or_create_collection(
            name=f"session_{session_id}",
            embedding_function=_get_embedding_fn(),
        )
        count = collection.count()
        if count == 0:
            return []
        results = collection.query(query_texts=[query], n_results=min(n_results, count))
        return results["documents"][0] if results["documents"] else []
    except Exception as e:
        print(f"[RAG] Retrieval error: {e}")
        return []


def delete_session_collection(session_id: str):
    """Clean up ChromaDB collection for a session."""
    try:
        chroma_client.delete_collection(name=f"session_{session_id}")
    except Exception:
        pass
