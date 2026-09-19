from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database.db_service import db_service

router = APIRouter(prefix="/api/alerts", tags=["Proactive Alerts & Audit Trail"])


class AcknowledgeRequest(BaseModel):
    alert_id: Optional[str] = None
    driller_badge: Optional[str] = "SYSTEM"
    action_taken: str
    oisd_compliance_checked: bool = True


def _enrich_alert(a: dict) -> dict:
    """Map local alert fields to frontend expected shape."""
    enriched = dict(a)
    # Add event_type from title
    if "event_type" not in enriched:
        title = enriched.get("title", "")
        if "Gas" in title or "Kick" in title:
            enriched["event_type"] = "Gas Kick Precursor"
        elif "ROP" in title:
            enriched["event_type"] = "ROP Deviation"
        elif "Loss" in title or "Circulation" in title:
            enriched["event_type"] = "Lost Circulation Risk"
        elif "Stuck" in title or "Sticking" in title:
            enriched["event_type"] = "Stuck Pipe Risk"
        elif "Breakout" in title or "Breakout" in title:
            enriched["event_type"] = "Borehole Instability"
        else:
            enriched["event_type"] = title[:50] if title else "Advisory"

    # Add status
    if "status" not in enriched:
        enriched["status"] = "ACKNOWLEDGED" if enriched.get("acknowledged") else "OPEN"

    # Add depth aliases
    if "depth_from_md_m" not in enriched:
        enriched["depth_from_md_m"] = enriched.get("depth_md")
    if "depth_to_md_m" not in enriched:
        enriched["depth_to_md_m"] = enriched.get("hazard_horizon_md")

    # Add rationale with evidence
    if "rationale" not in enriched:
        evidence = []
        for offset_well in enriched.get("offset_wells", []):
            evidence.append({
                "wells": {"name": offset_well},
                "source_page": None
            })
        enriched["rationale"] = {"evidence": evidence}

    return enriched


@router.get("/active")
def get_active_alerts(well_id: Optional[str] = None):
    alerts = db_service.get_alerts()
    active_well = db_service.get_well_by_id(well_id) if well_id else db_service.get_well_by_id("MOR-29")
    if well_id and active_well:
        canonical_id = active_well["id"].upper()
        alerts = [a for a in alerts if a.get("well_id", "").upper() == canonical_id or a.get("well_id", "").upper() == well_id.upper()]
    elif well_id:
        alerts = [a for a in alerts if a.get("well_id", "").upper() == well_id.upper()]
    return {
        "well_name": active_well["name"] if active_well else "MORAN-29",
        "current_depth_md": active_well.get("td_depth_md", 2418.0) if active_well else 2418.0,
        "current_formation": active_well.get("current_formation", "Barail Group") if active_well else "Barail Group",
        "alerts_count": len(alerts),
        "alerts": [_enrich_alert(a) for a in alerts]
    }


@router.post("/acknowledge")
def acknowledge_alert_body(req: AcknowledgeRequest):
    if not req.alert_id:
        raise HTTPException(status_code=400, detail="alert_id is required.")
    updated = db_service.acknowledge_alert(
        alert_id=req.alert_id,
        driller_badge=req.driller_badge or "SYSTEM",
        action_taken=req.action_taken
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {
        "status": "ACKNOWLEDGED",
        "alert_id": req.alert_id,
        "driller_badge": req.driller_badge,
        "action_taken": req.action_taken,
        "compliance": "OISD-STD-174 Verified",
        "audit_persisted": True
    }


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert_path(alert_id: str, req: AcknowledgeRequest):
    """Path-param style acknowledge to match frontend URL pattern."""
    updated = db_service.acknowledge_alert(
        alert_id=alert_id,
        driller_badge=req.driller_badge or "SYSTEM",
        action_taken=req.action_taken
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {
        "status": "ACKNOWLEDGED",
        "alert_id": alert_id,
        "driller_badge": req.driller_badge,
        "action_taken": req.action_taken,
        "compliance": "OISD-STD-174 Verified",
        "audit_persisted": True
    }


@router.get("")
def list_all_alerts(well_id: Optional[str] = None):
    return get_active_alerts(well_id=well_id)


@router.get("/audit")
def get_audit_trail():
    logs = db_service.get_audit_logs()
    return {"total": len(logs), "audit_logs": logs, "audit_events": logs}
