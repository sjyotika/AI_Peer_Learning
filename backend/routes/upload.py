"""File upload endpoint — stores files in MongoDB GridFS, never on disk."""

import uuid

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from typing import Optional

from models.schemas import UploadResponse
from services.rag_pipeline import process_file_bytes
from services.storage import save_file, save_session

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE_MB = 20


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    topic: str = Form(""),
    x_user_email: Optional[str] = Header(None),  # frontend sends logged-in user's email
):
    """
    Upload a PDF or TXT study file.
    Stores raw bytes in MongoDB GridFS, processes through the RAG pipeline,
    and returns a session_id + extracted keywords.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file name is required.")

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF and TXT files are supported. Got: '{ext}'"
        )

    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {MAX_FILE_SIZE_MB} MB."
        )

    session_id = str(uuid.uuid4())
    session_topic = topic.strip() or file.filename.rsplit(".", 1)[0]

    content_type = "application/pdf" if ext == ".pdf" else "text/plain"
    file_id = save_file(
        session_id=session_id,
        filename=file.filename,
        file_bytes=file_bytes,
        content_type=content_type,
    )

    try:
        result = process_file_bytes(file_bytes, ext, session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    if not result["full_text"].strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the file. Is it a scanned image PDF?"
        )

    save_session(session_id, {
        "session_id": session_id,
        "original_filename": file.filename,
        "file_id": file_id,
        "file_ext": ext,
        "topic": session_topic,
        "keywords": result["keywords"],
        "full_text": result["full_text"],
        "conversation": [],
        "student_explanation": "",
        "user_email": x_user_email or "",   # links session to the logged-in user
    })

    return UploadResponse(
        session_id=session_id,
        topic=session_topic,
        keywords=result["keywords"],
        message=(
            f"File processed successfully. "
            f"Found {result['chunk_count']} chunks and {len(result['keywords'])} key topics."
        ),
    )
