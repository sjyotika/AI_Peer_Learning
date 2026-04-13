"""FastAPI app entry point."""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

load_dotenv(override=True)

from routes import upload, explain, chat, report
from routes.sessions import router as sessions_router


app = FastAPI(title="AI Peer Learning System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1",
],
    # Allow local dev ports and GitHub Codespaces preview URLs.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$|https://.*\.app\.github\.dev$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(report.router, prefix="/api", tags=["report"])
app.include_router(sessions_router, prefix="/api")

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")


def resolve_frontend_base_url(request: Request) -> str:
    host = request.headers.get("host", "")
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)

    if host.endswith("-8000.app.github.dev"):
        return f"{scheme}://{host.replace('-8000.app.github.dev', '-5173.app.github.dev')}"

    return FRONTEND_BASE_URL

@app.get("/")
def root():
    return {"status": "AI Peer Learning API is running", "version": app.version}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/{path:path}")
def frontend_redirect(path: str, request: Request):
    """Redirect browser visits on backend port to the frontend dev app."""
    if path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not Found")
    normalized_path = "upload" if path == ".upload" else path
    frontend_base = resolve_frontend_base_url(request)
    target = f"{frontend_base}/{normalized_path}" if normalized_path else frontend_base
    return RedirectResponse(url=target, status_code=307)