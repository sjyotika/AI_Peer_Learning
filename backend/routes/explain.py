"""Student explanation endpoint."""

import re

from fastapi import APIRouter, HTTPException

from models.schemas import ExplainRequest, ExplainResponse
from services.ai_engine import generate_opening_question
from services.storage import get_session, save_session

router = APIRouter()


def _plan_max_doubts(explanation_text: str, keywords: list[str]) -> int:
    """
    Decide how many doubts the AI peer should ask (0-3 total),
    based on explanation quality and keyword grounding.
    """
    text = explanation_text.lower()
    tokens = set(re.findall(r"[a-zA-Z]{4,}", text))

    check_keywords = keywords[:10] if keywords else []
    hits = 0
    for kw in check_keywords:
        parts = [p for p in re.findall(r"[a-zA-Z]{3,}", kw.lower()) if p]
        if parts and all(part in tokens for part in parts):
            hits += 1

    coverage = hits / max(len(check_keywords), 1)
    length = len(explanation_text)

    # Excellent explanation: skip Q&A and go directly to report.
    if (coverage >= 0.60 and length >= 320) or length >= 900:
        return 0

    # Good explanation: keep Q&A short.
    if coverage >= 0.55 and length >= 260:
        return 1

    # Moderate explanation: ask two doubts.
    if coverage >= 0.35 or length >= 180:
        return 2

    # Weak/short explanation: ask at most three doubts.
    return 3


@router.post("/explain", response_model=ExplainResponse)
async def submit_explanation(body: ExplainRequest):
    """
    Accept student's initial explanation of the material.
    Returns the AI peer's first Socratic question.
    """
    explanation_text = body.explanation_text.strip()
    if not explanation_text:
        raise HTTPException(status_code=400, detail="Explanation cannot be empty.")

    if len(explanation_text) < 20:
        raise HTTPException(status_code=400, detail="Please provide a more detailed explanation (at least 20 characters).")

    session = get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload your file again.")

    keywords = session.get("keywords", [])
    topic = session.get("topic", "")
    max_doubts = _plan_max_doubts(explanation_text, keywords)

    if max_doubts == 0:
        completion_message = "Your explanation is already strong and well-grounded, so I do not have further doubts. I will end the session and generate your report."
        save_session(body.session_id, {
            "student_explanation": explanation_text,
            "chat_plan": {"max_doubts": 0},
            "conversation": [
                {"role": "assistant", "content": completion_message}
            ]
        })
        return ExplainResponse(ai_message=completion_message, is_done=True)

    # Generate opening Socratic question
    try:
        opening_question = generate_opening_question(
            session_id=body.session_id,
            keywords=keywords,
            student_explanation=explanation_text,
            topic=topic,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI engine error: {str(e)}")

    # Save explanation and start conversation with AI's opening question
    save_session(body.session_id, {
        "student_explanation": explanation_text,
        "chat_plan": {"max_doubts": max_doubts},
        "conversation": [
            {"role": "assistant", "content": opening_question}
        ]
    })

    return ExplainResponse(ai_message=opening_question, is_done=False)
