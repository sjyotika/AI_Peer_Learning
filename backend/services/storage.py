"""MongoDB Atlas helper with an in-memory fallback for local development.

File storage uses GridFS so no files are ever written to disk in production.
Sessions are tagged with user_email so they can be listed per user.
"""

from datetime import datetime
import os

from pymongo import MongoClient, DESCENDING
import gridfs

_client = None
_memory_sessions: dict[str, dict] = {}
_memory_files: dict[str, bytes] = {}


def _use_memory_store() -> bool:
    return not os.getenv("MONGODB_URI")


def get_db():
    global _client
    uri = os.getenv("MONGODB_URI")
    if not uri:
        return None
    if _client is None:
        _client = MongoClient(uri)
    return _client["peer_learning"]


def get_fs():
    db = get_db()
    if db is None:
        return None
    return gridfs.GridFS(db)


# ─────────────────────── File storage ────────────────────────────────────────

def save_file(session_id: str, filename: str, file_bytes: bytes,
              content_type: str = "application/octet-stream") -> str:
    if _use_memory_store():
        _memory_files[session_id] = file_bytes
        return session_id

    fs = get_fs()
    file_id = fs.put(
        file_bytes,
        filename=filename,
        session_id=session_id,
        content_type=content_type,
        upload_date=datetime.utcnow(),
    )
    return str(file_id)


def load_file(file_id: str, session_id: str = None) -> bytes | None:
    if _use_memory_store():
        return _memory_files.get(session_id or file_id)

    from bson import ObjectId
    fs = get_fs()
    try:
        return fs.get(ObjectId(file_id)).read()
    except Exception as e:
        print(f"[Storage] load_file error: {e}")
        return None


# ─────────────────────── Session storage ─────────────────────────────────────

def save_session(session_id: str, data: dict):
    """Upsert session data. Merges with existing document."""
    data = dict(data)
    data["session_id"] = session_id
    data["updated_at"] = datetime.utcnow().isoformat()

    if _use_memory_store():
        existing = _memory_sessions.get(session_id, {})
        existing.update(data)
        _memory_sessions[session_id] = existing
        return

    try:
        db = get_db()
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": data},
            upsert=True,
        )
    except Exception as e:
        print(f"[Storage] save_session error: {e}")
        raise


def get_session(session_id: str) -> dict:
    if _use_memory_store():
        return dict(_memory_sessions.get(session_id, {}))

    try:
        db = get_db()
        doc = db.sessions.find_one({"session_id": session_id}, {"_id": 0})
        return doc if doc else {}
    except Exception as e:
        print(f"[Storage] get_session error: {e}")
        return {}


def save_report(session_id: str, report: dict):
    payload = {
        "report": report,
        "report_generated_at": datetime.utcnow().isoformat(),
    }

    if _use_memory_store():
        existing = _memory_sessions.get(session_id, {})
        existing.update(payload)
        _memory_sessions[session_id] = existing
        return

    try:
        db = get_db()
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": payload},
            upsert=True,
        )
    except Exception as e:
        print(f"[Storage] save_report error: {e}")
        raise


def list_user_sessions(email: str) -> list:
    """Return all sessions for a given user email, newest first."""
    projection = {
        "_id": 0,
        "session_id": 1,
        "topic": 1,
        "original_filename": 1,
        "keywords": 1,
        "updated_at": 1,
        "report": 1,
    }

    if _use_memory_store():
        results = [
            {k: v for k, v in s.items() if k in projection}
            for s in _memory_sessions.values()
            if s.get("user_email") == email
        ]
        results.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
        return results

    try:
        db = get_db()
        cursor = db.sessions.find(
            {"user_email": email}, projection
        ).sort("updated_at", DESCENDING)
        return list(cursor)
    except Exception as e:
        print(f"[Storage] list_user_sessions error: {e}")
        return []


def list_sessions() -> list:
    if _use_memory_store():
        return [{"session_id": sid, "updated_at": s.get("updated_at")}
                for sid, s in _memory_sessions.items()]
    try:
        db = get_db()
        return list(db.sessions.find({}, {"_id": 0, "session_id": 1, "updated_at": 1}))
    except Exception as e:
        print(f"[Storage] list_sessions error: {e}")
        return []
