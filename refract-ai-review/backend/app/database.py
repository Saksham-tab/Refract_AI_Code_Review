from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from .config import DATABASE_PATH


def _connect() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                filename TEXT NOT NULL,
                language TEXT NOT NULL,
                model TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                total_findings INTEGER NOT NULL,
                payload_json TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)"
        )


def save_review(review: dict[str, Any]) -> None:
    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO reviews (
                id, created_at, filename, language, model,
                risk_level, total_findings, payload_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                review["id"],
                review["created_at"],
                review["filename"],
                review["language"],
                review["model"],
                review["summary"]["risk_level"],
                review["metrics"]["total_findings"],
                json.dumps(review, ensure_ascii=False),
            ),
        )


def list_reviews(limit: int = 100) -> list[dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            "SELECT payload_json FROM reviews ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    reviews = []
    for row in rows:
        payload = json.loads(row["payload_json"])
        # The list view only needs metadata; source and detailed findings load on demand.
        reviews.append({key: value for key, value in payload.items() if key not in {"code", "findings"}})
    return reviews


def get_review(review_id: str) -> dict[str, Any] | None:
    with _connect() as connection:
        row = connection.execute(
            "SELECT payload_json FROM reviews WHERE id = ?",
            (review_id,),
        ).fetchone()
    return json.loads(row["payload_json"]) if row else None
