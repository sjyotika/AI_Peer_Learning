"""Pydantic request and response models."""

from typing import List

from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    explanation_text: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    user_message: str = Field(..., min_length=1)


class ReportRequest(BaseModel):
    session_id: str = Field(..., min_length=1)


class UploadResponse(BaseModel):
    session_id: str
    topic: str
    keywords: List[str]
    message: str


class ExplainResponse(BaseModel):
    ai_message: str
    is_done: bool


class ChatResponse(BaseModel):
    ai_message: str
    is_done: bool


class ReportResponse(BaseModel):
    coverage_pct: float
    accuracy_pct: float
    gaps: List[str]
    misconceptions: List[str]
    suggestions: List[str]
    radar_data: dict
