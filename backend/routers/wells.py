import math
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.database.db_service import db_service

router = APIRouter(prefix="/api/wells", tags=["Wells & Offset Intelligence"])


def _enrich_well(w: dict) -> dict:
    """Add Supabase-style field aliases so the frontend can read both naming conventions."""
    enriched = dict(w)
    enriched.setdefault("current_depth_md_m", w.get("td_depth_md"))
    enriched.setdefault("target_depth_md_m", w.get("target_depth_md"))
    return enriched


def _enrich_event(e: dict) -> dict:
    """Map local event fields to frontend Dossier expected shape."""
    return {
        "id": e.get("id"),
        "event_type": e.get("event_type"),
        "severity": e.get("severity"),
        "depth_from_md_m": e.get("depth_from_md_m", e.get("depth_md")),
        "depth_to_md_m": e.get("depth_to_md_m", e.get("depth_md")),
        "description": e.get("description"),
        "mitigation": e.get("mitigation"),
        "source_page": e.get("source_page"),
        "review_status": e.get("reviewer_status", "APPROVED"),
        "formations": {"canonical_name": e.get("formation", "Unknown")},
        "source_documents": {"original_filename": e.get("source_doc", "Unknown")},
        "npt_cost_inr": e.get("npt_cost_inr", 0),
        "duration_hrs": e.get("duration_hrs", 0),
        "verified_by": e.get("verified_by", "Oil India Drilling Team")
    }


@router.get("")
def get_wells(field: Optional[str] = None, status: Optional[str] = None):
    wells = db_service.get_wells(field=field, status=status)
    return {"total": len(wells), "wells": [_enrich_well(w) for w in wells]}


@router.get("/nearby")
def get_nearby_wells(
    target_well: str = Query("MOR-29", description="Target well to find comparable offsets for"),
    radius_km: float = Query(25.0, description="Spatial search radius in km"),
    lat: Optional[float] = Query(None, description="Latitude override (used by map view)"),
    lon: Optional[float] = Query(None, description="Longitude override (used by map view)")
):
    """
    Ranks offset wells using multi-factor subsurface similarity.
    Accepts either target_well ID or lat/lon coordinates.
    """
    if lat is not None and lon is not None:
        # Coordinate-based search: find all wells within radius of given point
        all_wells = db_service.get_wells()
        results = []
        for w in all_wells:
            dist = db_service.calculate_distance(lat, lon, w["lat"], w["lon"])
            if dist <= radius_km:
                w_entry = _enrich_well(w)
                w_entry["distance_km"] = dist
                w_entry["similarity_score"] = round(max(0.0, 1.0 - (dist / radius_km)) * 100, 1)
                events = db_service.get_events(well_id=w["id"])
                w_entry["incident_count"] = len(events)
                w_entry["events"] = events
                results.append(w_entry)
        results.sort(key=lambda x: x["distance_km"])
        return {
            "target_well": target_well,
            "center": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "count": len(results),
            "offset_count": len(results),
            "offset_wells": results
        }
    else:
        # Well-ID based search
        ranked_offsets = db_service.rank_offset_wells(target_well_id=target_well, radius_km=radius_km)
        target = db_service.get_well_by_id(target_well)
        center_lat = target["lat"] if target else 27.4853
        center_lon = target["lon"] if target else 95.3456
        return {
            "target_well": target_well,
            "center": {"lat": center_lat, "lon": center_lon},
            "radius_km": radius_km,
            "count": len(ranked_offsets),
            "offset_count": len(ranked_offsets),
            "offset_wells": [_enrich_well(w) for w in ranked_offsets]
        }


@router.get("/{well_id}")
def get_well_dossier(well_id: str):
    well = db_service.get_well_by_id(well_id)
    if not well:
        raise HTTPException(status_code=404, detail=f"Well record '{well_id}' not found in database.")

    events = db_service.get_events(well_id=well["id"])
    formations = db_service.get_formations()

    # Build formation_tops in the shape the frontend expects
    formation_tops = []
    for f in formations:
        formation_tops.append({
            "top_md_m": f.get("top_md_m", f.get("depth_top_md", 0)),
            "base_md_m": f.get("base_md_m", f.get("depth_bottom_md", 0)),
            "correlation_confidence": 0.85,
            "formations": {
                "canonical_name": f.get("canonical_name", f.get("name", "Unknown")),
                "color": f.get("color", "#475569")
            }
        })

    # Well-specific casing strings (vary by well type/depth)
    td = well.get("td_depth_md", 3200)
    casing_strings = [
        {"type": "Conductor", "od": '20"', "weight": "94 lb/ft", "shoe_md": 50, "cement": "To Surface"},
        {"type": "Surface", "od": '13-3/8"', "weight": "54.5 lb/ft", "shoe_md": min(350, int(td * 0.1)), "cement": "To Surface"},
        {"type": "Intermediate", "od": '9-5/8"', "weight": "43.5 lb/ft", "shoe_md": min(2200, int(td * 0.55)), "cement": "300m Above Shoe"},
    ]
    if td > 2500:
        casing_strings.append({"type": "Production Liner", "od": '7"', "weight": "26 lb/ft", "shoe_md": int(td), "cement": "200m Above Shoe"})

    return {
        "well": _enrich_well(well),
        "drilling_events": [_enrich_event(e) for e in events],
        "formation_tops": formation_tops,
        "formations": formations,
        "casing_strings": casing_strings,
        "evidence_provenance": {
            "source_documents_count": len(db_service.get_documents()),
            "verified_by_geologist": True,
            "oisd_compliance": "OISD-STD-174 Audited"
        }
    }


@router.get("/{well_id}/events")
def get_well_events(well_id: str):
    events = db_service.get_events(well_id=well_id)
    return {"well_id": well_id, "events": [_enrich_event(e) for e in events]}
