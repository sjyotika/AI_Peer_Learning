# AI Peer Learning

An AI peer learning system that lets a student upload study material, explain a chosen topic, chat with an AI student that asks Socratic questions, and then review a final report dashboard.

## Structure

- `backend/` FastAPI app, RAG pipeline, Gemini evaluation, MongoDB storage
- `frontend/` Vite + React app with the four-stage learning flow

## Backend

Set these environment variables in `backend/.env`.
You can start by copying `backend/.env.example`.

- `GEMINI_API_KEY`
- `MONGODB_URI` when using MongoDB Atlas

Run the backend:

```bash
cd backend
uvicorn main:app --reload
```

## Frontend

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000` by default. You can override it with `VITE_API_BASE_URL`.

## Quick End-to-End Check

1. Start backend with `uvicorn main:app --reload` from `backend/`.
2. Start frontend with `npm run dev` from `frontend/`.
3. Open app and do the full flow:
	- Upload PDF/TXT and set topic.
	- Submit explanation.
	- Answer AI peer questions until session completes.
	- Verify report page shows coverage, accuracy, gaps, suggestions, and radar chart.