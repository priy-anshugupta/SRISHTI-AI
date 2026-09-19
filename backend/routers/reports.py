from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.database.db_service import db_service
from backend.core.config import get_settings

router = APIRouter(prefix="/api/reports", tags=["Evidence Briefs"])


class OffsetBriefRequest(BaseModel):
    well_id: str
    radius_km: float = Field(default=5, gt=0, le=50)


@router.post("/offset-brief")
async def generate_offset_brief(request: OffsetBriefRequest):
    """Returns a review-ready evidence brief, never a fabricated drilling programme."""
    settings = get_settings()
    if settings.supabase_ready:
        try:
            from backend.database.supabase import SupabaseRepository
            repository = SupabaseRepository()
            wells = await repository.request("GET", "wells", params={"select": "id,name,field,current_depth_md_m,target_depth_md_m", "id": f"eq.{request.well_id}"})
            if not wells:
                raise HTTPException(status_code=404, detail="Well not found")
            events = await repository.request("GET", "drilling_events", params={
                "select": "event_type,severity,depth_from_md_m,depth_to_md_m,description,mitigation,source_page,wells(name),formations(canonical_name),source_documents(original_filename)",
                "review_status": "eq.APPROVED", "order": "severity.desc,depth_from_md_m.asc", "limit": "100"
            })
            return {
                "title": f"Offset evidence brief — {wells[0]['name']}", "well": wells[0], "radius_km": request.radius_km,
                "approved_historical_events": events,
                "required_review": ["Confirm comparable offset selection with drilling and geology leads.", "Verify all source pages against the original report.", "Apply only controls present in the approved well programme."],
                "disclaimer": "This is a decision-support evidence brief, not an approved drilling programme or automated operating instruction."
            }
        except HTTPException:
            raise
        except Exception:
            pass

    # Local fallback
    well = db_service.get_well_by_id(request.well_id)
    if not well:
        raise HTTPException(status_code=404, detail=f"Well '{request.well_id}' not found")

    # Get offset wells within radius
    offset_wells = db_service.rank_offset_wells(target_well_id=request.well_id, radius_km=request.radius_km)
    offset_ids = {request.well_id} | {w["id"] for w in offset_wells}

    # Gather all events from target + offset wells
    all_events = []
    for eid in offset_ids:
        all_events.extend(db_service.get_events(well_id=eid))

    # Enrich events with well name and formation name
    wells_map = {w["id"]: w for w in db_service.get_wells()}
    enriched = []
    for e in all_events:
        enriched.append({
            "event_type": e.get("event_type"),
            "severity": e.get("severity"),
            "depth_from_md_m": e.get("depth_from_md_m", e.get("depth_md")),
            "depth_to_md_m": e.get("depth_to_md_m"),
            "description": e.get("description"),
            "mitigation": e.get("mitigation"),
            "source_page": e.get("source_page"),
            "wells": {"name": wells_map.get(e["well_id"], {}).get("name", e["well_id"])},
            "formations": {"canonical_name": e.get("formation", "Unknown")},
            "source_documents": {"original_filename": e.get("source_doc", "Unknown")}
        })

    enriched.sort(key=lambda x: (0 if x["severity"] == "CRITICAL" else 1 if x["severity"] == "HIGH" else 2, x.get("depth_from_md_m", 0)))

    well_summary = {
        "id": well["id"],
        "name": well["name"],
        "field": well.get("field"),
        "current_depth_md_m": well.get("td_depth_md"),
        "target_depth_md_m": well.get("target_depth_md")
    }

    return {
        "title": f"Offset evidence brief — {well['name']}",
        "well": well_summary,
        "radius_km": request.radius_km,
        "offset_wells_count": len(offset_wells),
        "approved_historical_events": enriched,
        "required_review": [
            "Confirm comparable offset selection with drilling and geology leads.",
            "Verify all source pages against the original report.",
            "Apply only controls present in the approved well programme."
        ],
        "disclaimer": "This is a decision-support evidence brief, not an approved drilling programme or automated operating instruction."
    }
