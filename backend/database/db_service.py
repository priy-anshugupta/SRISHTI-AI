"""
SRISHTI·AI - Database & Evidence Persistence Service
Directly integrates with Supabase / PostgreSQL with resilient local caching and audit logging.
"""

import math
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import urllib.request
import urllib.error

# Supabase Credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://fsoioyteimbcoesuuqxl.supabase.co")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_1ypf3B6vi-sEbxhQDweuZQ_XbITiWMI")

# Local Persistent Cache File
LOCAL_CACHE_FILE = os.path.join(os.path.dirname(__file__), "local_store.json")

def load_initial_seed() -> Dict[str, Any]:
    try:
        from backend.database.mock_db import WELLS_DB, FORMATIONS_DB, DRILLING_EVENTS_DB, DOCUMENTS_DB
    except ImportError:
        from .mock_db import WELLS_DB, FORMATIONS_DB, DRILLING_EVENTS_DB, DOCUMENTS_DB
    
    initial_alerts = [
        {
            "id": "ALT-101",
            "well_id": "MOR-29",
            "severity": "CRITICAL",
            "title": "Approaching 2,450m — Barail Gas Precursor Horizon",
            "description": "Offset well BAGHJAN-5 (13.2 km NE) encountered severe gas influx with 22 bbl pit volume gain at 3,380m MD in Barail carbonaceous sand. BAGHJAN-9 confirmed same hazard at 3,380m. Current bit at 2,418m — 32m above historical precursor horizon.",
            "recommended_action": "1. Check trip tank & flow sensor calibration. 2. Prepare 12.8 ppg kill mud in reserve pit. 3. Perform remote BOP choke drill per OISD-STD-174. 4. Review Baghjan-5 EVT-03 mitigation: Wait & Weight kill procedure.",
            "offset_wells": ["BAGHJAN-5", "BAGHJAN-9", "MORAN-12"],
            "depth_md": 2418.0,
            "hazard_horizon_md": 2450.0,
            "distance_to_hazard_m": 32.0,
            "acknowledged": False,
            "acknowledged_by": None,
            "action_taken": None,
            "timestamp": "2026-09-18T18:00:00Z"
        },
        {
            "id": "ALT-102",
            "well_id": "MOR-29",
            "severity": "MEDIUM",
            "title": "ROP Deviation vs. Offset Well Benchmark",
            "description": "Current ROP (6.8 m/hr) is 18% below NHK-162 benchmark (8.3 m/hr) in lower Barail sandstone-shale sequence at equivalent depth.",
            "recommended_action": "Inspect bit dull grading upon next trip; consider increasing WOB from 18.5 to 22 klbs. Review NHK-162 drilling parameters for Barail interval optimization.",
            "offset_wells": ["NAHORKATIYA-162"],
            "depth_md": 2418.0,
            "hazard_horizon_md": 2418.0,
            "distance_to_hazard_m": 0.0,
            "acknowledged": True,
            "acknowledged_by": "K. Sarma (Toolpusher)",
            "action_taken": "Adjusted WOB to 21 klbs, ROP improved to 7.6 m/hr.",
            "timestamp": "2026-09-18T17:30:00Z"
        },
        {
            "id": "ALT-103",
            "well_id": "NHK-561",
            "severity": "HIGH",
            "title": "Kopili Overpressure Zone Approach — 600m Remaining",
            "description": "NHK-561 is at 3,100m MD drilling towards target 3,800m. Kopili Formation expected at 3,700m. Offset well NHK-656 encountered severe borehole breakout at 3,780m. BGH-21 required MW increase to 12.3 ppg.",
            "recommended_action": "1. Pre-drill geomechanical model mandatory before Kopili entry. 2. Prepare weighted kill mud (12.0 ppg). 3. Plan 7\" liner setting depth at 3,650m shoe. 4. Review NHK-656 EVT-09 and BGH-21 EVT-10 mitigations.",
            "offset_wells": ["NAHORKATIYA-656", "BAGHJAN-21"],
            "depth_md": 3100.0,
            "hazard_horizon_md": 3700.0,
            "distance_to_hazard_m": 600.0,
            "acknowledged": False,
            "acknowledged_by": None,
            "action_taken": None,
            "timestamp": "2026-09-18T16:00:00Z"
        },
        {
            "id": "ALT-104",
            "well_id": "MOR-29",
            "severity": "LOW",
            "title": "Girujan Clay Interval Transit Complete — Lessons Logged",
            "description": "MOR-29 successfully transited Girujan Clay (1,500–2,200m) with minor sticking at 1,720m (EVT-04). Total Girujan NPT: 6 hrs vs. 336 hrs for MOR-07.",
            "recommended_action": "Log completion: KCl-polymer mud system effective. Maintain >60 RPM rotation policy in Girujan intervals for future wells.",
            "offset_wells": ["MORAN-7", "RUDRASAGAR-25"],
            "depth_md": 2200.0,
            "hazard_horizon_md": 2200.0,
            "distance_to_hazard_m": 0.0,
            "acknowledged": True,
            "acknowledged_by": "K. Sarma (Toolpusher)",
            "action_taken": "Girujan lessons documented in well file. Rotation policy confirmed for remaining wells.",
            "timestamp": "2026-09-18T14:00:00Z"
        },
        {
            "id": "ALT-105",
            "well_id": "MOR-29",
            "severity": "MEDIUM",
            "title": "Tipam Lost Circulation Risk — Approaching TS-3 Thief Zone",
            "description": "MOR-29 approaching Tipam TS-3 interval (~2,450m) where offset wells MOR-12 and HGJ-48 experienced 40–60 bbl/hr losses. NHK-162 lost 38 bbl active volume at 2,540m in same unit.",
            "recommended_action": "1. Pre-mix 30 bbl coarse CaCO3 + mica LCM pill in slug tank. 2. Maintain MW at 10.4–10.6 ppg (not >10.8 ppg to avoid fracture propagation). 3. Monitor pit volume continuously through TS-3.",
            "offset_wells": ["MORAN-12", "HUGRIJAN-48", "NAHORKATIYA-162"],
            "depth_md": 2418.0,
            "hazard_horizon_md": 2450.0,
            "distance_to_hazard_m": 32.0,
            "acknowledged": False,
            "acknowledged_by": None,
            "action_taken": None,
            "timestamp": "2026-09-18T17:00:00Z"
        },
        {
            "id": "ALT-106",
            "well_id": "RDS-147",
            "severity": "CRITICAL",
            "title": "Active Well Control Event — Rudrasagar-147 Gas Leak",
            "description": "Uncontrolled gas leak during workover on Rudrasagar-147. Well control unit mobilized. This alert is for fleet awareness — no action required at your rig.",
            "recommended_action": "Fleet awareness only. Monitor OIL safety bulletin channel. Ensure BOP equipment on all active wells has passed recent function test.",
            "offset_wells": ["RUDRASAGAR-25"],
            "depth_md": 3350.0,
            "hazard_horizon_md": 3350.0,
            "distance_to_hazard_m": 0.0,
            "acknowledged": True,
            "acknowledged_by": "D. Kalita (Drilling Supt, ONGC)",
            "action_taken": "Well control unit from Cudd Energy capped the well. All BOP function tests verified across fleet.",
            "timestamp": "2026-09-18T12:00:00Z"
        }
    ]

    initial_audits = [
        {
            "id": "AUD-001",
            "timestamp": "2026-09-18T17:00:00Z",
            "actor": "SYSTEM",
            "action": "DATABASE_SYNC",
            "entity_type": "SYSTEM",
            "entity_id": "SYS-INIT",
            "details": "SRISHTI·AI Subsurface Evidence Database initialized with Upper Assam oilfield stratigraphy — 18 wells, 11 formations, 15 drilling events, 12 documents."
        },
        {
            "id": "AUD-002",
            "timestamp": "2026-09-18T17:30:00Z",
            "actor": "K. Sarma (Toolpusher)",
            "action": "ALERT_ACKNOWLEDGED",
            "entity_type": "ALERT",
            "entity_id": "ALT-102",
            "details": "Acknowledged ROP deviation alert for MORAN-29. Action taken: Adjusted WOB to 21 klbs, ROP improved to 7.6 m/hr."
        },
        {
            "id": "AUD-003",
            "timestamp": "2026-09-18T14:00:00Z",
            "actor": "K. Sarma (Toolpusher)",
            "action": "ALERT_ACKNOWLEDGED",
            "entity_type": "ALERT",
            "entity_id": "ALT-104",
            "details": "Logged Girujan Clay interval completion for MORAN-29. Rotation policy confirmed."
        },
        {
            "id": "AUD-004",
            "timestamp": "2026-09-18T12:00:00Z",
            "actor": "D. Kalita (Drilling Supt, ONGC)",
            "action": "ALERT_ACKNOWLEDGED",
            "entity_type": "ALERT",
            "entity_id": "ALT-106",
            "details": "Fleet awareness alert for Rudrasagar-147 gas leak acknowledged. BOP tests verified."
        },
        {
            "id": "AUD-005",
            "timestamp": "2026-09-18T10:00:00Z",
            "actor": "SYSTEM",
            "action": "EVIDENCE_COMMIT",
            "entity_type": "DRILLING_EVENT",
            "entity_id": "EVT-05",
            "details": "Committed Baghjan-5 blowout investigation report (NGT Katakey Committee) into evidence database."
        }
    ]

    return {
        "wells": list(WELLS_DB),
        "formations": list(FORMATIONS_DB),
        "drilling_events": list(DRILLING_EVENTS_DB),
        "documents": list(DOCUMENTS_DB),
        "alerts": initial_alerts,
        "audit_logs": initial_audits
    }

class DatabaseService:
    def __init__(self):
        self.data: Dict[str, Any] = {}
        self._load_local_store()

    def _load_local_store(self):
        if os.path.exists(LOCAL_CACHE_FILE):
            try:
                with open(LOCAL_CACHE_FILE, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
                    return
            except Exception:
                pass
        self.data = load_initial_seed()
        self._save_local_store()

    def _save_local_store(self):
        try:
            with open(LOCAL_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving local store: {e}")

    # Distance calculation
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)

    # 1. WELLS
    def get_wells(self, field: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        wells = self.data.get("wells", [])
        if field:
            wells = [w for w in wells if w.get("field", "").lower() == field.lower()]
        if status:
            wells = [w for w in wells if w.get("status", "").lower() == status.lower()]
        return wells

    def get_well_by_id(self, well_id: str) -> Optional[Dict[str, Any]]:
        lookup = well_id.lower().strip()
        # Aliases for backward compatibility
        if lookup.startswith("mrn-"):
            lookup = "mor-" + lookup[4:]
        elif lookup == "nhk-512":
            lookup = "nhk-162"

        for w in self.data.get("wells", []):
            if w["id"].lower() == lookup or w["name"].lower() == lookup:
                return dict(w)
            if lookup.startswith("moran-") and w["name"].lower() == ("moran-" + lookup[6:]):
                return dict(w)
            if lookup.startswith("naharkatiya-") and w["name"].lower() == ("naharkatiya-" + lookup[12:]):
                return dict(w)
        return None

    # Multi-Factor Offset Well Similarity Ranking (PRD / Engineering Spec)
    def rank_offset_wells(self, target_well_id: str = "MOR-29", radius_km: float = 25.0) -> List[Dict[str, Any]]:
        target = self.get_well_by_id(target_well_id) or self.data["wells"][0]
        results = []

        for w in self.data.get("wells", []):
            if w["id"] == target["id"]:
                continue
            dist = self.calculate_distance(target["lat"], target["lon"], w["lat"], w["lon"])
            if dist > radius_km:
                continue

            # Multi-factor similarity computation:
            # 1. Spatial proximity score (decay with distance)
            spatial_sim = max(0.0, 1.0 - (dist / radius_km))
            # 2. Target depth similarity
            depth_diff = abs(w.get("td_depth_md", 3000) - target.get("target_depth_md", 3200))
            depth_sim = max(0.0, 1.0 - (depth_diff / 1500.0))
            # 3. Formation / Block relevance
            block_sim = 1.0 if w.get("field") == target.get("field") else 0.6
            # 4. Historical incident relevance bonus
            events = [e for e in self.data.get("drilling_events", []) if e["well_id"] == w["id"]]
            incident_relevance = 0.9 if events else 0.5

            overall_similarity = round((spatial_sim * 0.4 + depth_sim * 0.25 + block_sim * 0.2 + incident_relevance * 0.15) * 100, 1)

            w_entry = dict(w)
            w_entry["distance_km"] = dist
            w_entry["similarity_score"] = overall_similarity
            w_entry["incident_count"] = len(events)
            w_entry["events"] = events
            results.append(w_entry)

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results

    # 2. FORMATIONS
    def get_formations(self) -> List[Dict[str, Any]]:
        return self.data.get("formations", [])

    # 3. DRILLING EVENTS
    def get_events(self, well_id: Optional[str] = None) -> List[Dict[str, Any]]:
        events = self.data.get("drilling_events", [])
        if well_id:
            events = [e for e in events if e.get("well_id", "").lower() == well_id.lower()]
        return events

    def add_drilling_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in event:
            event["id"] = f"EVT-{len(self.data['drilling_events']) + 1:02d}"
        event["created_at"] = datetime.utcnow().isoformat() + "Z"
        self.data["drilling_events"].append(event)
        self._save_local_store()
        self.log_audit(
            actor=event.get("verified_by", "ENGINEER"),
            action="COMMITTED_EVIDENCE",
            entity_type="DRILLING_EVENT",
            entity_id=event["id"],
            details=f"Committed approved event: {event.get('event_type')} at {event.get('depth_md')}m in {event.get('formation')}."
        )
        return event

    # 4. DOCUMENTS & HUMAN-IN-THE-LOOP EXTRACTION
    def get_documents(self) -> List[Dict[str, Any]]:
        return self.data.get("documents", [])

    def add_document(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in doc:
            doc["id"] = f"DOC-{len(self.data['documents']) + 1:03d}"
        doc["uploaded_at"] = datetime.utcnow().isoformat() + "Z"
        self.data["documents"].append(doc)
        self._save_local_store()
        self.log_audit(
            actor="SYSTEM",
            action="DOCUMENT_UPLOAD",
            entity_type="DOCUMENT",
            entity_id=doc["id"],
            details=f"Uploaded and queued: {doc.get('filename')} ({doc.get('pages', 0)} pages)."
        )
        return doc

    def approve_document_extraction(self, doc_id: str, reviewer_name: str, approved_facts: Dict[str, Any]) -> Dict[str, Any]:
        doc = None
        for d in self.data["documents"]:
            if d["id"] == doc_id:
                d["status"] = "COMPLETED"
                d["reviewer_status"] = "APPROVED"
                d["reviewed_by"] = reviewer_name
                doc = d
                break

        # Generate a verified drilling event from approved extraction if it contains incident data
        new_event = None
        if approved_facts.get("event_type"):
            new_event = self.add_drilling_event({
                "well_id": approved_facts.get("well_id", "MOR-07"),
                "event_type": approved_facts.get("event_type"),
                "formation": approved_facts.get("formation", "Tipam Sandstone"),
                "depth_md": float(approved_facts.get("depth_md", 1840)),
                "severity": approved_facts.get("severity", "MEDIUM"),
                "npt_cost_inr": float(approved_facts.get("npt_cost_inr", 15000000)),
                "duration_hrs": float(approved_facts.get("duration_hrs", 48)),
                "description": approved_facts.get("description", "Approved extraction from report."),
                "mitigation": approved_facts.get("mitigation", "Approved field mitigation."),
                "source_doc": doc.get("filename", "Uploaded_Report.pdf") if doc else "Report.pdf",
                "source_page": int(approved_facts.get("source_page", 1)),
                "reviewer_status": "APPROVED",
                "verified_by": reviewer_name
            })

        self._save_local_store()
        self.log_audit(
            actor=reviewer_name,
            action="EXTRACTION_APPROVED",
            entity_type="DOCUMENT",
            entity_id=doc_id,
            details=f"Engineer {reviewer_name} verified and committed extracted facts into canonical database."
        )

        return {"document": doc, "committed_event": new_event}

    # 5. ALERTS & ACKNOWLEDGMENT
    def get_alerts(self) -> List[Dict[str, Any]]:
        return self.data.get("alerts", [])

    def acknowledge_alert(self, alert_id: str, driller_badge: str, action_taken: str) -> Optional[Dict[str, Any]]:
        for a in self.data.get("alerts", []):
            if a["id"] == alert_id:
                a["acknowledged"] = True
                a["acknowledged_by"] = driller_badge
                a["action_taken"] = action_taken
                a["acknowledged_at"] = datetime.utcnow().isoformat() + "Z"
                self._save_local_store()
                self.log_audit(
                    actor=driller_badge,
                    action="ALERT_ACKNOWLEDGED",
                    entity_type="ALERT",
                    entity_id=alert_id,
                    details=f"Driller {driller_badge} acknowledged {a['title']}. Action recorded: {action_taken}."
                )
                return a
        return None

    # 6. AUDIT LOGS
    def log_audit(self, actor: str, action: str, entity_type: str, entity_id: str, details: str):
        audit_entry = {
            "id": f"AUD-{len(self.data.get('audit_logs', [])) + 1:03d}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "actor": actor,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details
        }
        self.data.setdefault("audit_logs", []).insert(0, audit_entry)
        self._save_local_store()

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.data.get("audit_logs", [])[:limit]

# Singleton instance
db_service = DatabaseService()
