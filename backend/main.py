from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

from backend.routers import wells, formations, alerts, ask, documents, reports, graph, telemetry
from backend.integrations.ertmac import ertmac_stream
from backend.database.db_service import db_service

app = FastAPI(
    title="SRISHTI·AI — Drilling Intelligence & Offset Memory Platform",
    description="Evidence-first historical drilling memory and offset-well intelligence companion for eRTMAC (Oil India Limited). Compliant with OISD-STD-174 & WITSML 1.4/2.0.",
    version="2.0.0"
)

# Enable CORS for frontend Next.js on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(wells.router)
app.include_router(formations.router)
app.include_router(alerts.router)
app.include_router(ask.router)
app.include_router(documents.router)
app.include_router(reports.router)
app.include_router(graph.router)
app.include_router(telemetry.router)

@app.get("/")
def root():
    return {
        "system": "SRISHTI·AI",
        "tagline": "सृष्टि — The Drilling Memory of Oil India",
        "status": "OPERATIONAL",
        "mode": "EVIDENCE_FIRST_INTELLIGENCE_COMPANION",
        "compliance": ["OISD-STD-174", "WITSML 1.4/2.0"],
        "docs_url": "/docs",
        "workspaces": [
            {"name": "Plan a Well", "endpoint": "/api/wells/nearby"},
            {"name": "Monitor a Well", "endpoint": "/api/telemetry/current"},
            {"name": "Review Knowledge", "endpoint": "/api/documents"},
            {"name": "Audit Trail", "endpoint": "/api/alerts/audit"}
        ]
    }

from backend.core.config import get_settings

@app.get("/health")
def health_check():
    settings = get_settings()
    wells_count = len(db_service.get_wells())
    events_count = len(db_service.get_events())
    docs_count = len(db_service.get_documents())
    current_frame = ertmac_stream.get_current_frame()

    status = "ready" if settings.supabase_ready else "configuration_required"

    return {
        "status": status,
        "health": "HEALTHY",
        "dependencies": {
            "supabase": "configured" if settings.supabase_ready else "unconfigured_local_fallback",
            "ai_provider": settings.ai_provider,
            "evidence_store": "persistent_local_and_cloud"
        },
        "evidence_store": "PERSISTENT",
        "database": {
            "wells_loaded": wells_count,
            "drilling_events": events_count,
            "documents_indexed": docs_count,
            "geological_basin": "Upper Assam (Moran, Naharkatiya, Baghjan, Duliajan)"
        },
        "telemetry_stream": {
            "active_well": current_frame["well"],
            "depth_md": current_frame["depth_md"],
            "formation": current_frame["formation"],
            "status": current_frame["corridor_status"]
        },
        "standards": "OISD-STD-174 (Well Control Operations)"
    }

@app.websocket("/ws/ertmac")
async def websocket_ertmac_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            packet = ertmac_stream.get_current_frame()
            if ertmac_stream.is_playing:
                packet = ertmac_stream.step_forward()
            await websocket.send_text(json.dumps(packet))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
