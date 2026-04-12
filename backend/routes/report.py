"""Final report endpoint."""

from fastapi import APIRouter, HTTPException

from models.schemas import ReportRequest, ReportResponse
from services.evaluation import evaluate_understanding
from services.storage import get_session, save_report

router = APIRouter()


@router.post("/report", response_model=ReportResponse)
async def generate_report(body: ReportRequest):
    """
    Generate the final evaluation report for a completed session.
    Runs coverage analysis + Gemini evaluation + builds radar chart data.
    """
    session = get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Check if report was already generated (cache it)
    if "report" in session:
        r = session["report"]
        return ReportResponse(**r)

    full_text = session.get("full_text", "")
    keywords = session.get("keywords", [])
    student_explanation = session.get("student_explanation", "")
    conversation = session.get("conversation", [])
    topic = session.get("topic", "")

    if not student_explanation:
        raise HTTPException(status_code=400, detail="No student explanation found. Please complete the session first.")

    # Q&A may be intentionally short (or skipped) when the student's initial explanation is strong.
    # In that case, evaluate using the explanation plus whatever conversation exists.

    try:
        result = evaluate_understanding(
            original_text=full_text,
            keywords=keywords,
            student_explanation=student_explanation,
            conversation_history=conversation,
            topic=topic,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

    # Cache the report in MongoDB
    save_report(body.session_id, result)

    return ReportResponse(**result)


@router.get("/report/{session_id}", response_model=ReportResponse)
async def get_cached_report(session_id: str):
    """Retrieve a previously generated report."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if "report" not in session:
        raise HTTPException(status_code=404, detail="Report not yet generated for this session.")
    return ReportResponse(**session["report"])
