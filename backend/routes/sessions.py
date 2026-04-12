"""Session listing and detail endpoints for the user dashboard."""

from fastapi import APIRouter, HTTPException, Query
from services.storage import get_session, list_user_sessions

router = APIRouter()


@router.get("/sessions")
async def get_user_sessions(email: str = Query(..., min_length=1)):
    """
    Return all sessions belonging to a user (identified by email).
    Used by the Dashboard page.
    """
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    sessions = list_user_sessions(email)
    return {"sessions": sessions}


@router.get("/sessions/{session_id}")
async def get_session_detail(session_id: str):
    """
    Return full session data for the Session Detail page:
    topic, keywords, student_explanation, conversation, report.
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Strip internal-only fields before sending to frontend
    session.pop("full_text", None)   # can be large
    session.pop("file_id", None)
    session.pop("file_ext", None)

    return session
