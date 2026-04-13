"""MongoDB Atlas helper with an in-memory fallback for local development.

File storage uses GridFS so no files are ever written to disk in production.
Sessions are tagged with user_email so they can be listed per user.
"""

from datetime import datetime
import os

from pymongo import MongoClient, DESCENDING
import gridfs

_client = None
_mongo_unavailable = False
_memory_sessions: dict[str, dict] = {}
_memory_files: dict[str, bytes] = {}


def _use_memory_store() -> bool:
    return _mongo_unavailable or not os.getenv("MONGODB_URI")


def get_db():
    global _client, _mongo_unavailable
    uri = os.getenv("MONGODB_URI")
    if not uri or _mongo_unavailable:
        return None
    if _client is None:
        try:
            _client = MongoClient(uri, serverSelectionTimeoutMS=3000)
            _client.admin.command("ping")
        except Exception as e:
            print(f"[Storage] Mongo unavailable, using memory store: {e}")
            _mongo_unavailable = True
            _client = None
            return None
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
    if fs is None:
        _memory_files[session_id] = file_bytes
        return session_id

    try:
        file_id = fs.put(
            file_bytes,
            filename=filename,
            session_id=session_id,
            content_type=content_type,
            upload_date=datetime.utcnow(),
        )
        return str(file_id)
    except Exception as e:
        print(f"[Storage] save_file fallback to memory: {e}")
        _memory_files[session_id] = file_bytes
        return session_id


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

    db = get_db()
    if db is None:
        existing = _memory_sessions.get(session_id, {})
        existing.update(data)
        _memory_sessions[session_id] = existing
        return

    try:
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": data},
            upsert=True,
        )
    except Exception as e:
        print(f"[Storage] save_session fallback to memory: {e}")
        existing = _memory_sessions.get(session_id, {})
        existing.update(data)
        _memory_sessions[session_id] = existing


def get_session(session_id: str) -> dict:
    if _use_memory_store():
        return dict(_memory_sessions.get(session_id, {}))

    db = get_db()
    if db is None:
        return dict(_memory_sessions.get(session_id, {}))

    try:
        doc = db.sessions.find_one({"session_id": session_id}, {"_id": 0})
        return doc if doc else {}
    except Exception as e:
        print(f"[Storage] get_session fallback to memory: {e}")
        return dict(_memory_sessions.get(session_id, {}))


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

    db = get_db()
    if db is None:
        existing = _memory_sessions.get(session_id, {})
        existing.update(payload)
        _memory_sessions[session_id] = existing
        return

    try:
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": payload},
            upsert=True,
        )
    except Exception as e:
        print(f"[Storage] save_report fallback to memory: {e}")
        existing = _memory_sessions.get(session_id, {})
        existing.update(payload)
        _memory_sessions[session_id] = existing


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

    db = get_db()
    if db is None:
        results = [
            {k: v for k, v in s.items() if k in projection}
            for s in _memory_sessions.values()
            if s.get("user_email") == email
        ]
        results.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
        return results

    try:
        cursor = db.sessions.find(
            {"user_email": email}, projection
        ).sort("updated_at", DESCENDING)
        return list(cursor)
    except Exception as e:
        print(f"[Storage] list_user_sessions fallback to memory: {e}")
        results = [
            {k: v for k, v in s.items() if k in projection}
            for s in _memory_sessions.values()
            if s.get("user_email") == email
        ]
        results.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
        return results


def list_sessions() -> list:
    if _use_memory_store():
        return [{"session_id": sid, "updated_at": s.get("updated_at")}
                for sid, s in _memory_sessions.items()]
    db = get_db()
    if db is None:
        return [{"session_id": sid, "updated_at": s.get("updated_at")}
                for sid, s in _memory_sessions.items()]
    try:
        return list(db.sessions.find({}, {"_id": 0, "session_id": 1, "updated_at": 1}))
    except Exception as e:
        print(f"[Storage] list_sessions fallback to memory: {e}")
        return [{"session_id": sid, "updated_at": s.get("updated_at")}
                for sid, s in _memory_sessions.items()]
