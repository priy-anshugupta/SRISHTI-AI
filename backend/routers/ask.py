from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.agents.orchestrator import agent_orchestrator

router = APIRouter(prefix="/api/ask", tags=["Hybrid Multi-Agent Q&A & Evidence Grounding"])

class QueryRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    target_well: Optional[str] = "MORAN-29"
    current_depth_md: Optional[float] = 2418.0
    language: Optional[str] = "EN"

@router.post("")
def ask_drilling_intelligence(req: QueryRequest):
    # Support both 'question' (from frontend chat) and 'query' (from direct API)
    user_query = req.question or req.query or "What are the drilling hazards in Barail near Moran?"
    lang = req.language or "EN"
    target = req.target_well or "MORAN-29"
    depth = req.current_depth_md if req.current_depth_md is not None else 2418.0

    result = agent_orchestrator.run_query(
        query=user_query,
        target_well=target,
        current_depth_md=depth,
        language=lang
    )

    # Ensure backward compatibility with all fields expected by frontend
    return {
        "question": user_query,
        "query": user_query,
        "language": lang,
        "answer": result["answer"],
        "evidence_grounded_answer": result["evidence_grounded_answer"],
        "evidence": result["evidence"],
        "evidence_sources": result["evidence_sources"],
        "model": result.get("model", "SRISHTI Evidence Engine"),
        "mode": result.get("mode", "HYBRID"),
        "tools_used": result.get("tools_used", []),
        "matched_offset_records": result.get("matched_offset_records", 0),
        "verification_status": result.get("verification_status", "COMMITTED_EVIDENCE_RETRIEVAL"),
        "oisd_standard": result.get("oisd_standard", "OISD-STD-174 (Well Control Operations)"),
        "abstained": result.get("abstained", False)
    }
