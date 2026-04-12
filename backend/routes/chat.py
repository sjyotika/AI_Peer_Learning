"""AI peer Socratic Q&A endpoint."""

from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest, ChatResponse
from services.ai_engine import get_socratic_response
from services.storage import get_session, save_session

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    """
    Handle one turn of the Socratic Q&A conversation.
    Returns the AI's next question, and is_done=True when session is complete.
    """
    user_message = body.user_message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    session = get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    history = session.get("conversation", [])
    topic = session.get("topic", "")
    chat_plan = session.get("chat_plan", {}) if isinstance(session.get("chat_plan", {}), dict) else {}
    max_doubts = int(chat_plan.get("max_doubts", 3))
    max_doubts = max(0, min(3, max_doubts))

    assistant_doubts_so_far = sum(1 for m in history if m.get("role") == "assistant")

    # If planned doubts are already exhausted, close and move to report.
    if assistant_doubts_so_far >= max_doubts:
        closing = "I understand now. I will stop asking doubts and generate your report."
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": closing})
        save_session(body.session_id, {"conversation": history})
        return ChatResponse(ai_message=closing, is_done=True)

    # Get AI response
    try:
        ai_reply, is_done = get_socratic_response(
            session_id=body.session_id,
            conversation_history=history,
            user_message=user_message,
            topic=topic,
            max_doubts=max_doubts,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI engine error: {str(e)}")

    # Append both turns to history
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": ai_reply})

    # Save updated conversation
    save_session(body.session_id, {"conversation": history})

    return ChatResponse(ai_message=ai_reply, is_done=is_done)


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get full conversation history for a session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"conversation": session.get("conversation", [])}