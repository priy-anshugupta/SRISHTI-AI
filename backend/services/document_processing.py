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

try:
    import fitz
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    import logging
    logging.warning("OCR dependencies (pymupdf, pytesseract, Pillow) are not installed. OCR will be disabled.")


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


def calculate_extraction_confidence(text: str) -> float:
    if not text:
        return 0.0
    text_length = len(text)
    length_score = min(text_length / 1000.0, 1.0) * 0.3
    keywords = ["drilling", "well", "formation", "depth", "incident", "mud", "kick", "loss"]
    keyword_count = sum(1 for kw in keywords if kw in text.lower())
    keyword_score = min(keyword_count / 5.0, 1.0) * 0.3
    alnum_count = sum(1 for c in text if c.isalnum() or c.isspace())
    ratio = alnum_count / text_length if text_length > 0 else 0
    ratio_score = min(ratio, 1.0) * 0.4
    return min((length_score + keyword_score + ratio_score) * 100.0, 100.0)


def ocr_pdf_pages(file_bytes: bytes) -> list[dict]:
    if not OCR_AVAILABLE:
        return []
    results = []
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for i, page in enumerate(doc):
            pix = page.get_pixmap()
            img_data = pix.tobytes("png")
            img = Image.open(BytesIO(img_data))
            
            ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            texts = ocr_data.get('text', [])
            confs = ocr_data.get('conf', [])
            
            valid_texts = []
            valid_confs = []
            for text, conf in zip(texts, confs):
                text_strip = text.strip()
                if text_strip:
                    try:
                        conf_val = float(conf)
                        if conf_val > 0:
                            valid_texts.append(text_strip)
                            valid_confs.append(conf_val)
                    except ValueError:
                        pass
                        
            page_text = " ".join(valid_texts)
            avg_conf = sum(valid_confs) / len(valid_confs) if valid_confs else 0.0
            results.append({
                "page": i + 1,
                "text": page_text,
                "confidence": avg_conf
            })
    except Exception as e:
        import logging
        logging.error(f"OCR processing failed: {e}")
        
    return results


def extract_pdf_pages(content: bytes) -> list[str]:
    reader = PdfReader(BytesIO(content))
    pages = []
    ocr_results = None
    
    for i, page in enumerate(reader.pages):
        text = (page.extract_text() or "").strip()
        if len(text) < 50 and OCR_AVAILABLE:
            if ocr_results is None:
                ocr_results = ocr_pdf_pages(content)
            if i < len(ocr_results):
                text = ocr_results[i]["text"]
        pages.append(text)
    return pages


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
