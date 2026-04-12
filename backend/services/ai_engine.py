"""AI peer tutoring helpers powered by Gemini."""

import os
import re

import google.generativeai as genai

from services.rag_pipeline import retrieve_context


_api_key = os.getenv("GEMINI_API_KEY")
gemini = None
if _api_key:
    genai.configure(api_key=_api_key)
    gemini = genai.GenerativeModel("gemini-1.5-flash")

SYSTEM_PROMPT = """You are an AI peer in a protege-effect learning session.
The human is teaching you. You must behave like a curious student asking realistic doubts.

Rules:
- Ask exactly ONE focused doubt/question per turn.
- Anchor your question to the student's latest explanation (name a term, step, claim, or example they gave).
- Use student-like phrasing (e.g., "I am confused about...", "Why does ... happen?").
- Never lecture, never provide long explanations, and never ask multiple questions at once.
- Avoid generic prompts like "Could you elaborate more?" or "Explain more.".
- Keep questions concise (1-2 sentences).
- When understanding is sufficient, return a brief closing line and include exactly: [DONE]
- Follow staged progression across turns: basic clarification -> mechanism/why -> application/edge case.
- Respect the session cap; do not continue once the planned doubt count is reached."""

MAX_TURNS_BEFORE_FORCE_DONE = 3

GENERIC_PATTERNS = [
    r"could you elaborate",
    r"explain in more detail",
    r"tell me more",
    r"can you elaborate",
]

FALLBACK_QUESTIONS = [
    "I think I get the big picture, but why is chlorophyll essential instead of any other pigment?",
    "I am confused about the light reaction: what exactly happens to electrons after they get excited?",
    "Why does splitting water release oxygen, and how is that linked to ATP/NADPH production?",
    "In the Calvin cycle, why is RuBisCO considered inefficient sometimes, and what problem does that cause?",
]


def _last_assistant_message(conversation_history: list) -> str:
    for msg in reversed(conversation_history):
        if msg.get("role") == "assistant":
            return (msg.get("content") or "").strip()
    return ""


def _looks_generic(reply: str) -> bool:
    lowered = reply.lower()
    return any(re.search(pattern, lowered) for pattern in GENERIC_PATTERNS)


def _fallback_question(student_turns: int) -> tuple[str, bool]:
    if student_turns >= 2:
        return "Nice teaching. I understand the core idea now, so I will stop here and generate your report.", True

    idx = min(student_turns, len(FALLBACK_QUESTIONS) - 1)
    return FALLBACK_QUESTIONS[idx], False


def get_socratic_response(
    session_id: str,
    conversation_history: list,
    user_message: str,
    topic: str = "",
    max_doubts: int = 3,
) -> tuple[str, bool]:
    """
    Generate the next Socratic question based on conversation history.
    Returns (ai_reply_text, is_done_bool).
    """
    context_chunks = retrieve_context(session_id, user_message, n_results=3)
    context_str = "\n---\n".join(context_chunks) if context_chunks else "No additional context."

    history_lines = []
    for msg in conversation_history:
        role = "STUDENT" if msg["role"] == "user" else "AI TUTOR"
        history_lines.append(f"{role}: {msg['content']}")
    history_text = "\n".join(history_lines) if history_lines else "(This is the start of the Q&A)"

    student_turns = sum(1 for m in conversation_history if m["role"] == "user")
    topic_block = f"=== SESSION TOPIC ===\n{topic}\n\n" if topic else ""

    if student_turns <= 0:
        phase = "Ask a BASIC clarification doubt about definitions or core steps."
    elif student_turns == 1:
        phase = "Ask a WHY/MECHANISM doubt about causal links."
    else:
        phase = "Ask an APPLICATION doubt (new scenario, comparison, or edge case)."

    prompt = f"""{SYSTEM_PROMPT}

{topic_block}=== RELEVANT STUDY MATERIAL ===
{context_str}

=== CONVERSATION SO FAR ===
{history_text}

STUDENT: {user_message}

=== YOUR TASK ===
This is doubt {student_turns + 1} out of maximum {max_doubts} doubts.
{phase}
{"You MAY add [DONE] now if understanding is already strong." if student_turns >= max(1, max_doubts - 1) else "Do NOT add [DONE] yet."}

Respond as AI TUTOR with ONE Socratic question:"""

    if gemini is None:
        return _fallback_question(student_turns)

    try:
        response = gemini.generate_content(prompt)
        reply = (response.text or "").strip()
        is_done = "[DONE]" in reply
        clean_reply = reply.replace("[DONE]", "").strip()

        if not clean_reply:
            return _fallback_question(student_turns)

        previous_ai = _last_assistant_message(conversation_history)
        repeated = bool(previous_ai and clean_reply.lower() == previous_ai.lower())

        # Safety rails to prevent endless generic loops.
        if not is_done and student_turns >= min(MAX_TURNS_BEFORE_FORCE_DONE, max_doubts):
            return "You explained this clearly, so I have enough understanding now. I will end the session and generate your report.", True

        if not is_done and student_turns >= max(1, max_doubts - 1) and (repeated or _looks_generic(clean_reply)):
            return "I think my doubts are clear now and your explanation makes sense. I will stop here and generate your report.", True

        return clean_reply, is_done
    except Exception as e:
        print(f"[AI Engine] Error: {e}")
        return _fallback_question(student_turns)


def generate_opening_question(
    session_id: str,
    keywords: list,
    student_explanation: str,
    topic: str = ""
) -> str:
    """
    Generate the very first Socratic question after the student's initial explanation.
    """
    context_chunks = retrieve_context(session_id, student_explanation, n_results=3)
    context_str = "\n---\n".join(context_chunks) if context_chunks else ""

    topic_line = f"Current topic: {topic}\n\n" if topic else ""

    prompt = f"""You are an AI peer student. A student just taught you a topic.

{topic_line}Key topics from the material: {', '.join(keywords[:10])}

Relevant material context:
{context_str}

Student's explanation:
"{student_explanation}"

Ask ONE specific student-like doubt question to test their understanding.
- Sound like a curious student, not an examiner
- Target one important concept from the keywords
- Be concise (1-2 sentences max)
- Avoid generic lines like "can you elaborate more"
- Do NOT add [DONE]"""

    if gemini is None:
        return f"I followed most of it, but I am confused about {keywords[0] if keywords else 'this topic'} - could you walk me through it step by step?"

    try:
        response = gemini.generate_content(prompt)
        return (response.text or "").strip() or f"I followed most of it, but I am confused about {keywords[0] if keywords else 'this topic'} - could you walk me through it step by step?"
    except Exception as e:
        print(f"[AI Engine] Opening question error: {e}")
        return f"I followed most of it, but I am confused about {keywords[0] if keywords else 'this topic'} - could you walk me through it step by step?"