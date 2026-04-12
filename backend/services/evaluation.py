"""Student understanding evaluation helpers."""

import json
import os

import google.generativeai as genai
from sentence_transformers import SentenceTransformer, util


_embed_model = None


def _get_embed_model() -> SentenceTransformer:
    """Lazy-load sentence transformer model for scoring."""
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embed_model

_api_key = os.getenv("GEMINI_API_KEY")
gemini = None
if _api_key:
    genai.configure(api_key=_api_key)
    gemini = genai.GenerativeModel("gemini-1.5-flash")


def compute_coverage(keywords: list, student_text: str) -> tuple[float, list, list]:
    """
    Use semantic similarity to determine which keywords the student covered.
    Returns (coverage_pct, covered_keywords, missing_keywords).
    """
    if not keywords:
        return 0.0, [], []

    model = _get_embed_model()
    student_embedding = model.encode([student_text])[0]
    keyword_embeddings = model.encode(keywords)

    covered = []
    missing = []

    for i, kw in enumerate(keywords):
        score = util.cos_sim(student_embedding, keyword_embeddings[i]).item()
        if score > 0.30:
            covered.append(kw)
        else:
            missing.append(kw)

    coverage_pct = round(len(covered) / len(keywords) * 100, 1)
    return coverage_pct, covered, missing


def evaluate_with_gemini(
    original_text: str,
    student_explanation: str,
    conversation_history: list,
    topic: str = "",
) -> dict:
    """
    Use Gemini to evaluate accuracy, find misconceptions, and generate suggestions.
    Returns a dict with accuracy_pct, misconceptions, suggestions.
    """
    convo_lines = []
    for msg in conversation_history[-12:]:
        role = "STUDENT" if msg["role"] == "user" else "AI TUTOR"
        convo_lines.append(f"{role}: {msg['content']}")
    convo_text = "\n".join(convo_lines)

    topic_block = f"=== SESSION TOPIC ===\n{topic}\n\n" if topic else ""

    eval_prompt = f"""You are an expert evaluator. Assess a student's understanding of study material.

{topic_block}=== ORIGINAL MATERIAL (first 2000 chars) ===
{original_text[:2000]}

=== STUDENT'S EXPLANATION ===
{student_explanation}

=== Q&A CONVERSATION ===
{convo_text}

=== YOUR TASK ===
Evaluate how well the student understood the material.
Return ONLY a valid JSON object — no markdown, no code blocks, no extra text.

The JSON must have exactly this structure:
{{
  "accuracy_pct": <integer 0-100>,
  "misconceptions": ["<specific misconception 1>", "<specific misconception 2>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"]
}}

Rules:
- accuracy_pct: how accurate/correct was the student's understanding (0-100)
- misconceptions: specific wrong ideas the student showed (empty array [] if none)
- suggestions: concrete things to study or review to improve"""

    if gemini is None:
        return {"accuracy_pct": 50.0, "misconceptions": [], "suggestions": ["Review the material again carefully."]}

    raw = ""
    try:
        response = gemini.generate_content(eval_prompt)
        raw = (response.text or "").strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)
        return {
            "accuracy_pct": float(result.get("accuracy_pct", 50)),
            "misconceptions": result.get("misconceptions", []),
            "suggestions": result.get("suggestions", []),
        }
    except json.JSONDecodeError as e:
        print(f"[Evaluation] JSON parse error: {e}\nRaw: {raw[:300]}")
        return {"accuracy_pct": 50.0, "misconceptions": [], "suggestions": ["Review the material again carefully."]}
    except Exception as e:
        print(f"[Evaluation] Gemini error: {e}")
        return {"accuracy_pct": 50.0, "misconceptions": [], "suggestions": ["Review the material again carefully."]}


def evaluate_understanding(
    original_text: str,
    keywords: list,
    student_explanation: str,
    conversation_history: list,
    topic: str = "",
) -> dict:
    """
    Full evaluation pipeline:
    1. Semantic coverage scoring (Sentence-BERT)
    2. Accuracy + misconception detection (Gemini)
    3. Build radar chart data
    """
    student_all_text = student_explanation + " " + " ".join(
        [m["content"] for m in conversation_history if m["role"] == "user"]
    )

    coverage_pct, covered, missing = compute_coverage(keywords, student_all_text)
    ai_eval = evaluate_with_gemini(original_text, student_explanation, conversation_history, topic)

    recall_score = (len(covered) / max(len(keywords), 1)) * 100
    depth_score = min(coverage_pct * 0.9, 100)
    clarity_score = min(ai_eval["accuracy_pct"] * 0.85, 100)

    radar_data = {
        "labels": ["Coverage", "Accuracy", "Depth", "Clarity", "Recall"],
        "scores": [
            round(coverage_pct, 1),
            round(ai_eval["accuracy_pct"], 1),
            round(depth_score, 1),
            round(clarity_score, 1),
            round(recall_score, 1),
        ],
    }

    return {
        "coverage_pct": coverage_pct,
        "accuracy_pct": ai_eval["accuracy_pct"],
        "gaps": missing,
        "misconceptions": ai_eval["misconceptions"],
        "suggestions": ai_eval["suggestions"],
        "radar_data": radar_data,
    }