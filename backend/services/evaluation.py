"""Student understanding evaluation helpers."""

import json
import os
import re
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR.parent / ".env", override=False)


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
- suggestions: concrete things to study or review to improve
- Do NOT over-penalize isolated mistakes. If understanding is mostly correct and only one minor sentence is wrong, accuracy should usually stay >= 70."""

    if gemini is None:
        return {}

    def _extract_json_blob(raw_text: str) -> str:
        text = raw_text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return text
        return text[start:end + 1]

    raw = ""
    try:
        response = gemini.generate_content(eval_prompt)
        raw = (response.text or "").strip()
        result = json.loads(_extract_json_blob(raw))
        return {
            "accuracy_pct": float(result.get("accuracy_pct", 50)),
            "misconceptions": [str(x) for x in result.get("misconceptions", []) if str(x).strip()],
            "suggestions": [str(x) for x in result.get("suggestions", []) if str(x).strip()],
        }
    except json.JSONDecodeError as e:
        print(f"[Evaluation] JSON parse error: {e}\nRaw: {raw[:300]}")
        return {}
    except Exception as e:
        print(f"[Evaluation] Gemini error: {e}")
        return {}


def _heuristic_accuracy(
    coverage_pct: float,
    student_explanation: str,
    conversation_history: list,
    misconceptions: list[str],
) -> float:
    all_user_text = student_explanation + " " + " ".join(
        [m.get("content", "") for m in conversation_history if m.get("role") == "user"]
    )
    word_count = len(re.findall(r"[a-zA-Z]+", all_user_text))
    sentence_count = len([s for s in re.split(r"[.!?]+", all_user_text) if s.strip()])

    # Base from coverage with mild structure bonus.
    accuracy = 40.0 + 0.55 * coverage_pct
    if word_count >= 120:
        accuracy += 6
    if sentence_count >= 5:
        accuracy += 4

    # Penalize misconceptions, but avoid extreme drops for one small issue.
    accuracy -= min(len(misconceptions) * 8, 24)

    return max(0.0, min(100.0, accuracy))


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

    misconceptions = ai_eval.get("misconceptions", [])
    suggestions = ai_eval.get("suggestions", [])

    heuristic_acc = _heuristic_accuracy(
        coverage_pct=coverage_pct,
        student_explanation=student_explanation,
        conversation_history=conversation_history,
        misconceptions=misconceptions,
    )

    if "accuracy_pct" in ai_eval:
        # Blend model judgment with measurable coverage/structure signal for stability.
        accuracy_pct = round(0.7 * float(ai_eval["accuracy_pct"]) + 0.3 * heuristic_acc, 1)
    else:
        accuracy_pct = round(heuristic_acc, 1)
        if not suggestions:
            suggestions = ["Review unclear concepts and add one real-world example for each key idea."]

    recall_score = (len(covered) / max(len(keywords), 1)) * 100
    depth_score = min(coverage_pct * 0.9, 100)
    clarity_score = min(accuracy_pct * 0.9, 100)

    radar_data = {
        "labels": ["Coverage", "Accuracy", "Depth", "Clarity", "Recall"],
        "scores": [
            round(coverage_pct, 1),
            round(accuracy_pct, 1),
            round(depth_score, 1),
            round(clarity_score, 1),
            round(recall_score, 1),
        ],
    }

    return {
        "coverage_pct": coverage_pct,
        "accuracy_pct": accuracy_pct,
        "gaps": missing,
        "misconceptions": misconceptions,
        "suggestions": suggestions,
        "radar_data": radar_data,
    }