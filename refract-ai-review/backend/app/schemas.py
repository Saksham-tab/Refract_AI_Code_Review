from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    code: str = Field(min_length=1, max_length=60_000)
    filename: str = Field(default="snippet.py", min_length=1, max_length=180)
    language: str = Field(default="python", min_length=1, max_length=40)
    focus: Literal["balanced", "security", "performance", "correctness"] = "balanced"


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    ollama_connected: bool
    model: str
