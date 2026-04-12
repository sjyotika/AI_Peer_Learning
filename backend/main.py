"""FastAPI app entry point."""

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

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

@app.get("/")
def root():
    return {"status": "AI Peer Learning API is running", "version": app.version}


@app.get("/health")
def health():
    return {"status": "ok"}