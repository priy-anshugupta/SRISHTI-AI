from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.agents.orchestrator import agent_orchestrator

try:
    from backend.agents.langgraph_pipeline import _trace_store
except ImportError:
    _trace_store = {"trace": []}

router = APIRouter(prefix="/api/ask", tags=["Hybrid Multi-Agent Q&A & Evidence Grounding"])

class QueryRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    target_well: Optional[str] = "MORAN-29"
    current_depth_md: Optional[float] = 2418.0
    language: Optional[str] = "EN"
    mode: Optional[str] = None  # "cloud" or "edge"

@router.get("/agent-trace")
def get_agent_trace():
    return {"agent_trace": _trace_store.get("trace", [])}

@router.post("")
def ask_drilling_intelligence(req: QueryRequest):
    # Support both 'question' (from frontend chat) and 'query' (from direct API)
    user_query = req.question or req.query or "What are the drilling hazards in Barail near Moran?"
    lang = req.language or "EN"
    target = req.target_well or "MORAN-29"
    depth = req.current_depth_md if req.current_depth_md is not None else 2418.0
    mode = req.mode

    result = agent_orchestrator.run_query(
        query=user_query,
        target_well=target,
        current_depth_md=depth,
        language=lang,
        mode=mode
    )
    
    try:
        from backend.agents.langgraph_pipeline import _trace_store as current_store
        current_trace = current_store.get("trace", [])
    except ImportError:
        current_trace = []

    # Ensure backward compatibility with all fields expected by frontend
    response_data = {
        "question": user_query,
        "query": user_query,
        "language": lang,
        "answer": result.get("answer", ""),
        "evidence_grounded_answer": result.get("evidence_grounded_answer", ""),
        "evidence": result.get("evidence", []),
        "evidence_sources": result.get("evidence_sources", []),
        "model": result.get("model", "SRISHTI Evidence Engine"),
        "mode": result.get("mode", "HYBRID"),
        "tools_used": result.get("tools_used", []),
        "matched_offset_records": result.get("matched_offset_records", 0),
        "verification_status": result.get("verification_status", "COMMITTED_EVIDENCE_RETRIEVAL"),
        "oisd_standard": result.get("oisd_standard", "OISD-STD-174 (Well Control Operations)"),
        "abstained": result.get("abstained", False),
    }
    
    if "LANGGRAPH" in str(result.get("mode", "")) or current_trace:
        response_data["agent_trace"] = current_trace
        response_data["mode"] = result.get("mode", "LANGGRAPH_10_AGENT")
        
    return response_data

