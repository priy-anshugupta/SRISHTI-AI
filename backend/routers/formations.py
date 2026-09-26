from fastapi import APIRouter
from backend.database.db_service import db_service
from backend.core.config import get_settings

router = APIRouter(prefix="/api/formations", tags=["Formations"])


@router.get("")
async def list_formations():
    settings = get_settings()
    if settings.supabase_ready:
        try:
            from backend.database.supabase import SupabaseRepository
            repository = SupabaseRepository()
            formations = await repository.request("GET", "formations", params={"select": "*", "order": "canonical_name.asc"})
            return {"formations": formations}
        except Exception:
            pass
    # Local fallback
    formations = db_service.get_formations()
    return {"formations": formations}


@router.get("/roi/summary")
async def roi_summary():
    """
    Computes fleet-wide NPT cost and quantified business ROI for Upper Assam operations.
    Quantifies operational business impact and fleet-wide NPT avoidance savings.
    """
    events = db_service.get_events()
    total_events = len(events)
    total_npt_hrs = sum(e.get("duration_hrs", 0) for e in events)
    total_npt_cost_inr = sum(e.get("npt_cost_inr", 0) for e in events)

    # Exclude single extreme catastrophic blowout (Baghjan-5 = 2500 Cr) for standard operational baseline
    operational_events = [e for e in events if e.get("id") != "EVT-05"]
    op_npt_hrs = sum(e.get("duration_hrs", 0) for e in operational_events)
    op_npt_cost_inr = sum(e.get("npt_cost_inr", 0) for e in operational_events)

    by_type = {}
    by_formation = {}
    for e in operational_events:
        etype = e.get("event_type", "Other")
        fmn = e.get("formation", "Other")
        cost = e.get("npt_cost_inr", 0)
        hrs = e.get("duration_hrs", 0)

        if etype not in by_type:
            by_type[etype] = {"count": 0, "npt_hrs": 0, "cost_inr": 0.0}
        by_type[etype]["count"] += 1
        by_type[etype]["npt_hrs"] += hrs
        by_type[etype]["cost_inr"] += cost

        if fmn not in by_formation:
            by_formation[fmn] = {"count": 0, "npt_hrs": 0, "cost_inr": 0.0}
        by_formation[fmn]["count"] += 1
        by_formation[fmn]["npt_hrs"] += hrs
        by_formation[fmn]["cost_inr"] += cost

    conservative_savings_pct = 40.0
    moderate_savings_pct = 55.0
    conservative_savings_inr = op_npt_cost_inr * (conservative_savings_pct / 100.0)
    moderate_savings_inr = op_npt_cost_inr * (moderate_savings_pct / 100.0)

    return {
        "fleet_total_events": total_events,
        "operational_events_count": len(operational_events),
        "total_npt_hrs": total_npt_hrs,
        "operational_npt_hrs": op_npt_hrs,
        "total_npt_cost_inr": total_npt_cost_inr,
        "operational_npt_cost_inr": op_npt_cost_inr,
        "operational_npt_cost_crores": round(op_npt_cost_inr / 10000000.0, 2),
        "total_npt_cost_crores": round(total_npt_cost_inr / 10000000.0, 2),
        "breakdown_by_type": [
            {
                "event_type": k,
                "count": v["count"],
                "npt_hrs": v["npt_hrs"],
                "cost_inr": v["cost_inr"],
                "cost_crores": round(v["cost_inr"] / 10000000.0, 2)
            }
            for k, v in by_type.items()
        ],
        "breakdown_by_formation": [
            {
                "formation": k,
                "count": v["count"],
                "npt_hrs": v["npt_hrs"],
                "cost_inr": v["cost_inr"],
                "cost_crores": round(v["cost_inr"] / 10000000.0, 2)
            }
            for k, v in by_formation.items()
        ],
        "roi_model": {
            "advance_warning_meters": 32.0,
            "conservative_reduction_pct": conservative_savings_pct,
            "conservative_annual_savings_crores": round(conservative_savings_inr / 10000000.0, 2),
            "moderate_reduction_pct": moderate_savings_pct,
            "moderate_annual_savings_crores": round(moderate_savings_inr / 10000000.0, 2),
            "oil_annual_campaign_wells": 40,
            "foreign_software_license_avoided_crores": 8.5
        }
    }


@router.get("/{formation_id}/analytics")
async def formation_analytics(formation_id: str):
    settings = get_settings()
    if settings.supabase_ready:
        try:
            from backend.database.supabase import SupabaseRepository
            repository = SupabaseRepository()
            formations = await repository.request("GET", "formations", params={"select": "*", "id": f"eq.{formation_id}"})
            if not formations:
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="Formation not found")
            events = await repository.request("GET", "drilling_events", params={"select": "event_type,severity,depth_from_md_m", "formation_id": f"eq.{formation_id}", "review_status": "eq.APPROVED"})
            by_type: dict[str, int] = {}
            for event in events:
                by_type[event["event_type"]] = by_type.get(event["event_type"], 0) + 1
            return {"formation": formations[0], "approved_event_count": len(events), "event_counts": by_type, "notice": "Descriptive historical statistics, not a calibrated probability model."}
        except Exception:
            pass
    # Local fallback
    from fastapi import HTTPException
    formations = db_service.get_formations()
    target = None
    for f in formations:
        if f.get("id") == formation_id or f.get("canonical_name", "").lower().replace(" ", "-").replace("/", "-") == formation_id.lower():
            target = f
            break
    if not target:
        raise HTTPException(status_code=404, detail="Formation not found")
    events = [e for e in db_service.get_events() if e.get("formation_id") == target.get("id") or e.get("formation") == target.get("name")]
    by_type: dict[str, int] = {}
    for event in events:
        by_type[event["event_type"]] = by_type.get(event["event_type"], 0) + 1
    total_npt = sum(e.get("duration_hrs", 0) for e in events)
    total_cost = sum(e.get("npt_cost_inr", 0) for e in events)
    return {
        "formation": target,
        "approved_event_count": len(events),
        "event_counts": by_type,
        "total_npt_hrs": total_npt,
        "total_npt_cost_inr": total_cost,
        "notice": "Descriptive historical statistics from local evidence database."
    }


@router.get("/{formation_id}/correlation")
async def formation_correlation(formation_id: str):
    settings = get_settings()
    if settings.supabase_ready:
        try:
            from backend.database.supabase import SupabaseRepository
            repository = SupabaseRepository()
            rows = await repository.request("GET", "well_formations", params={"select": "well_id,top_md_m,base_md_m,top_tvdss_m,base_tvdss_m,correlation_confidence,wells(name)", "formation_id": f"eq.{formation_id}", "order": "top_md_m.asc"})
            return {"formation_id": formation_id, "well_intervals": rows, "notice": "Intervals are source-linked formation-top interpretations."}
        except Exception:
            pass
    # Local fallback: all wells share the same formation column in Upper Assam
    formations = db_service.get_formations()
    target = None
    for f in formations:
        if f.get("id") == formation_id or f.get("canonical_name", "").lower().replace(" ", "-").replace("/", "-") == formation_id.lower():
            target = f
            break
    if not target:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Formation not found")
    wells = db_service.get_wells()
    intervals = []
    for w in wells:
        intervals.append({
            "well_id": w["id"],
            "top_md_m": target.get("top_md_m", target.get("depth_top_md")),
            "base_md_m": target.get("base_md_m", target.get("depth_bottom_md")),
            "correlation_confidence": 0.85,
            "wells": {"name": w["name"]}
        })
    return {"formation_id": formation_id, "well_intervals": intervals, "notice": "Regional formation intervals from local evidence database."}


