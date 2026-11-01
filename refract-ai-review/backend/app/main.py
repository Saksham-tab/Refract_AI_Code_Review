from __future__ import annotations

from contextlib import asynccontextmanager
import httpx

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import database
from .config import FRONTEND_ORIGIN, OLLAMA_MODEL, OLLAMA_URL
from .reviewer import run_code_review
from .schemas import HealthResponse, ReviewRequest


@asynccontextmanager
async def lifespan(_: FastAPI):
    database.initialize_database()
    yield


app = FastAPI(
    title="Refract AI Code Review API",
    description="Python API for local Ollama-powered code reviews.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    ollama_connected = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            ollama_connected = response.status_code == 200
    except httpx.HTTPError:
        ollama_connected = False
    return HealthResponse(
        status="ok" if ollama_connected else "degraded",
        service="refract-api",
        ollama_connected=ollama_connected,
        model=OLLAMA_MODEL,
    )


@app.post("/api/reviews")
async def create_review(payload: ReviewRequest):
    if not payload.code.strip():
        raise HTTPException(status_code=422, detail="Paste or upload code before starting a review.")
    try:
        review = await run_code_review(
            code=payload.code,
            filename=payload.filename,
            language=payload.language,
            focus=payload.focus,
        )
        database.save_review(review)
        return review
    except RuntimeError as exc:
        message = str(exc)
        status_code = 503 if "not configured" in message.lower() else 502
        if "no remaining" in message.lower() or "credits" in message.lower():
            status_code = 402
        elif "temporarily unavailable" in message.lower() or "retry" in message.lower():
            status_code = 503
        raise HTTPException(status_code=status_code, detail=message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/api/reviews")
async def get_reviews():
    return {"reviews": database.list_reviews(limit=100)}


@app.get("/api/reviews/{review_id}")
async def get_review(review_id: str):
    review = database.get_review(review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found.")
    return review
