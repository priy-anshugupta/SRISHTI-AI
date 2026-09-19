"""Evidence-preserving document processing.

Raw files are retained before any model call. Extracted items are candidates until an
engineer approves them, so generated text can never silently become operational fact.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import datetime, timezone
from io import BytesIO
from typing import Any

from openai import OpenAI
from pypdf import PdfReader

from backend.core.config import get_settings
from backend.database.supabase import SupabaseRepository


EXTRACTION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "event_type": {"type": "string"},
                    "severity": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]},
                    "depth_from_md_m": {"type": ["number", "null"]},
                    "depth_to_md_m": {"type": ["number", "null"]},
                    "formation": {"type": ["string", "null"]},
                    "description": {"type": "string"},
                    "mitigation": {"type": ["string", "null"]},
                    "page_number": {"type": "integer"},
                    "evidence_quote": {"type": "string"}
                },
                "required": ["event_type", "severity", "depth_from_md_m", "depth_to_md_m", "formation", "description", "mitigation", "page_number", "evidence_quote"]
            }
        }
    },
    "required": ["events"]
}


def file_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def extract_pdf_pages(content: bytes) -> list[str]:
    reader = PdfReader(BytesIO(content))
    return [(page.extract_text() or "").strip() for page in reader.pages]


def _llm_extract(pages: list[str]) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        return {"events": []}
    # Bound context: ingestion workers should process large reports in page batches in production.
    source = "\n\n".join(f"[PAGE {index + 1}]\n{text[:5000]}" for index, text in enumerate(pages[:25]) if text)
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.responses.create(
        model=settings.openai_model,
        instructions=(
            "Extract only explicitly stated drilling events from the provided report. "
            "Do not infer values, do not prescribe actions, and use null when a depth is absent. "
            "Every event must contain a short verbatim evidence quote and its page number."
        ),
        input=source,
        text={"format": {"type": "json_schema", "name": "drilling_event_candidates", "strict": True, "schema": EXTRACTION_SCHEMA}},
    )
    return json.loads(response.output_text)


async def process_document(document_id: str, content: bytes) -> None:
    repository = SupabaseRepository()
    settings = get_settings()
    try:
        await repository.update("source_documents", {"id": f"eq.{document_id}"}, {"processing_status": "EXTRACTING", "processing_error": None})
        pages = await asyncio.to_thread(extract_pdf_pages, content)
        for index, text in enumerate(pages, start=1):
            await repository.insert("document_pages", {"document_id": document_id, "page_number": index, "extracted_text": text, "ocr_confidence": None})

        extracted = await asyncio.to_thread(_llm_extract, pages)
        for event in extracted.get("events", []):
            await repository.insert("extraction_candidates", {
                "document_id": document_id,
                "page_number": event["page_number"],
                "entity_type": "DRILLING_EVENT",
                "payload": event,
                "extraction_method": "openai_structured_output" if settings.openai_api_key else "pdf_text_only",
                "model_name": settings.openai_model if settings.openai_api_key else None,
                "confidence": None,
                "review_status": "PENDING",
            })
        final_status = "REVIEW_REQUIRED" if settings.openai_api_key else "TEXT_EXTRACTED"
        await repository.update("source_documents", {"id": f"eq.{document_id}"}, {
            "processing_status": final_status,
            "page_count": len(pages),
            "processed_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as exc:  # Store operational failure; never claim success on extraction failure.
        await repository.update("source_documents", {"id": f"eq.{document_id}"}, {
            "processing_status": "FAILED",
            "processing_error": str(exc)[:1000],
            "processed_at": datetime.now(timezone.utc).isoformat(),
        })
