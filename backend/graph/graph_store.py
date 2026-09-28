"""
SRISHTI·AI — Drilling Causal Safety Knowledge Graph Engine
NetworkX-backed in-memory causal graph store modeling subsurface drilling operations,
well control barrier failures, energy containment threats, and Bow-Tie causal chains.

Calibrated strictly for Oil India Limited (OIL) & ONGC operations in the Upper Assam Basin:
- Moran, Naharkatiya, Baghjan, Hugrijan, Lakwa, Rudrasagar, Digboi fields.
- Formations: Alluvium, Dhekiajuli, Namsang, Girujan Clay, Tipam Sandstone, Barail Group, Kopili, Sylhet, Lakadong/Therria.
- Standards: OISD-STD-174, OISD-GDN-182, DGMS Petroleum Regulations 2002, API RP 53.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
import logging
import re
try:
    import networkx as nx
except ImportError:
    nx = None

logger = logging.getLogger("srishti.graph")

# ─────────────────────────────────────────────────────────────────────────────
# 1. CANONICAL DRILLING TAXONOMY DICTIONARIES
# ─────────────────────────────────────────────────────────────────────────────

CANONICAL_FORMATIONS: Dict[str, Dict[str, Any]] = {
    "FMN-01": {
        "id": "FMN-01",
        "canonical_name": "Alluvium / Dihing",
        "aliases": ["alluvium", "dihing", "surface gravels", "shallow gravel", "freshwater zone"],
        "lithology": "Unconsolidated sands, gravels, clays, silt",
        "depth_range": "0–300m",
        "color": "#94a3b8"
    },
    "FMN-02": {
        "id": "FMN-02",
        "canonical_name": "Dhekiajuli Formation",
        "aliases": ["dhekiajuli", "dhekiajuli sand", "shallow sand"],
        "lithology": "Massive coarse sandstones, pebbles, minor clay bands",
        "depth_range": "300–700m",
        "color": "#64748b"
    },
    "FMN-03": {
        "id": "FMN-03",
        "canonical_name": "Namsang Formation",
        "aliases": ["namsang", "namsang sandstone", "namsang gravel"],
        "lithology": "Alternating sandstones, siltstones, claystones, conglomerate lenses",
        "depth_range": "700–1500m",
        "color": "#f59e0b"
    },
    "FMN-04": {
        "id": "FMN-04",
        "canonical_name": "Girujan Clay",
        "aliases": ["girujan", "girujan clay", "girujan shale", "mottled clay", "smectite zone", "montmorillonite"],
        "lithology": "Mottled plastic clays, smectite/montmorillonite rich, sticky reactive shale",
        "depth_range": "1500–2200m",
        "color": "#ec4899"
    },
    "FMN-05": {
        "id": "FMN-05",
        "canonical_name": "Tipam Sandstone",
        "aliases": ["tipam", "tipam sandstone", "ts-1", "ts-2", "ts-3", "ts-4", "ts-5", "thief zone", "tipam thief zone"],
        "lithology": "Medium to coarse porous sandstones with microfractures, clay streaks",
        "depth_range": "2200–2800m",
        "color": "#38bdf8"
    },
    "FMN-06": {
        "id": "FMN-06",
        "canonical_name": "Bokabil Formation",
        "aliases": ["bokabil", "surma", "bokabil shale"],
        "lithology": "Silty shales, laminated sandstones, transition facies",
        "depth_range": "2800–3000m",
        "color": "#6366f1"
    },
    "FMN-07": {
        "id": "FMN-07",
        "canonical_name": "Barail Group",
        "aliases": ["barail", "barail group", "barail coal", "barail sand", "tikak parbat", "baragolai", "naogaon", "carbonaceous sand"],
        "lithology": "Coal-shale-sandstone cyclothems, carbonaceous gas sands, high pore pressure",
        "depth_range": "3000–3700m",
        "color": "#f97316"
    },
    "FMN-08": {
        "id": "FMN-08",
        "canonical_name": "Kopili Formation",
        "aliases": ["kopili", "kopili shale", "kopili formation", "jaintia shale"],
        "lithology": "Dark grey fossiliferous marine shales, geomechanically reactive, narrow MW window",
        "depth_range": "3700–4000m",
        "color": "#a855f7"
    },
    "FMN-09": {
        "id": "FMN-09",
        "canonical_name": "Sylhet Limestone",
        "aliases": ["sylhet", "sylhet limestone", "shelf carbonate", "nummulitic"],
        "lithology": "Nummulitic dense shelf limestone, dolomitic streaks, hard abrasive rock",
        "depth_range": "4000–4200m",
        "color": "#06b6d4"
    },
    "FMN-10": {
        "id": "FMN-10",
        "canonical_name": "Lakadong / Therria",
        "aliases": ["lakadong", "therria", "lakadong / therria", "langpar", "deep gas condensate"],
        "lithology": "Calcareous sandstones, basal clastics, high pressure condensate reservoir",
        "depth_range": "4200–4500m",
        "color": "#ef4444"
    },
    "FMN-11": {
        "id": "FMN-11",
        "canonical_name": "Pre-Cambrian Basement",
        "aliases": ["basement", "granite", "gneiss", "archean basement"],
        "lithology": "Granite, granodiorite, gneissic complex",
        "depth_range": "4500m+",
        "color": "#475569"
    }
}

CANONICAL_BARRIERS: Dict[str, Dict[str, Any]] = {
    "BAR-01": {
        "id": "BAR-01",
        "canonical_name": "Hydrostatic Mud Weight Column",
        "aliases": ["mud weight", "hydrostatic head", "mud column", "hydrostatic barrier", "mud density", "primary well barrier"],
        "category": "PREVENTIVE",
        "system": "Drilling Fluid Primary Containment",
        "description": "Primary hydrostatic overbalance (0.5–1.0 ppg margin) holding formation pore pressure in check."
    },
    "BAR-02": {
        "id": "BAR-02",
        "canonical_name": "Annular Blowout Preventer (BOP Stack)",
        "aliases": ["annular bop", "bop", "bop stack", "blind shear rams", "pipe rams", "choke manifold", "diverter"],
        "category": "REACTIVE_CONTAINMENT",
        "system": "Surface Pressure Containment",
        "description": "Secondary surface pressure containment capable of packing off pipe or open hole up to 5,000/10,000 psi."
    },
    "BAR-03": {
        "id": "BAR-03",
        "canonical_name": "9-5/8 Casing Shoe & Cement Integrity",
        "aliases": ["casing shoe", "9-5/8 casing", "7 liner shoe", "cement sheath", "shoe leak-off integrity", "lot"],
        "category": "PREVENTIVE",
        "system": "Wellbore Structural Envelope",
        "description": "Casing shoe structural integrity preventing fracture propagation and zonal cross-flow."
    },
    "BAR-04": {
        "id": "BAR-04",
        "canonical_name": "Continuous Drill String Rotation (>60 RPM)",
        "aliases": ["pipe rotation", "continuous rotation", "rotation policy", "stationary drillstring limit", "wiper trip"],
        "category": "PREVENTIVE",
        "system": "Mechanical Sticking Barrier",
        "description": "Operational barrier preventing stationary filter cake embedment in reactive swelling clays."
    },
    "BAR-05": {
        "id": "BAR-05",
        "canonical_name": "LCM Bridging Filter Cake Matrix",
        "aliases": ["lcm pill", "filter cake", "mud cake", "caco3 bridging", "sealing matrix", "thief barrier"],
        "category": "PREVENTIVE",
        "system": "Wellbore Fluid Loss Control",
        "description": "Physical permeability bridging across porous thief sands (Tipam TS-3) to maintain hydrostatic column."
    },
    "BAR-06": {
        "id": "BAR-06",
        "canonical_name": "Dual Mechanical Downhole Plugs",
        "aliases": ["dual mechanical barrier", "cement plug", "bridge plug", "retrievable packer", "workover barrier"],
        "category": "PREVENTIVE",
        "system": "Subsurface Isolation Envelope",
        "description": "Verified mechanical isolating barriers placed directly above hydrocarbon perforations prior to BOP removal."
    },
    "BAR-07": {
        "id": "BAR-07",
        "canonical_name": "Inhibitive KCl-Polymer Chemical Shield",
        "aliases": ["kcl polymer", "kcl-polymer", "clay inhibitor", "anti-balling mud", "shale encapsulation"],
        "category": "PREVENTIVE",
        "system": "Chemical Wellbore Stabilization",
        "description": "Potassium ion exchange stabilizing smectite clays to prevent swelling, bit balling, and cavings."
    }
}

CANONICAL_HAZARDS: Dict[str, Dict[str, Any]] = {
    "HAZ-01": {
        "id": "HAZ-01",
        "canonical_name": "Overpressured Gas Kick (48–54 MPa)",
        "aliases": ["gas kick", "gas influx", "pore pressure surge", "uncontrolled flow", "pit gain", "gas kick precursor"],
        "energy_type": "HIGH_PRESSURE_HYDROCARBON",
        "severity": "CRITICAL",
        "description": "Pressurized methane influx exceeding mud hydrostatic head, threatening wellbore blowout."
    },
    "HAZ-02": {
        "id": "HAZ-02",
        "canonical_name": "Reactive Clay Swelling & Differential Sticking",
        "aliases": ["differential sticking", "stuck pipe", "tight hole", "montmorillonite swelling", "thick filter cake", "clay hydration"],
        "energy_type": "MECHANICAL_FRICTIONAL_TRAP",
        "severity": "HIGH",
        "description": "High differential pressure (>1,200 psi) trapping stationary pipe against thick mud cake in hydrated clays."
    },
    "HAZ-03": {
        "id": "HAZ-03",
        "canonical_name": "Micro-fractured Thief Zone Lost Circulation",
        "aliases": ["lost circulation", "loss of returns", "thief zone loss", "seepage losses", "pit volume drop"],
        "energy_type": "HYDROSTATIC_HEAD_COLLAPSE",
        "severity": "MEDIUM",
        "description": "Fluid loss into underpressured, permeable sandstone causing sudden drop in annular hydrostatic barrier."
    },
    "HAZ-04": {
        "id": "HAZ-04",
        "canonical_name": "Narrow MW Window & Borehole Breakout",
        "aliases": ["borehole breakout", "kopili breakout", "cavings", "pack-off", "hole enlargement", "spalling shale"],
        "energy_type": "GEOMECHANICAL_SHEAR_FAILURE",
        "severity": "HIGH",
        "description": "Narrow drilling margin (10.15–10.8 ppg) where mud weight below shear failure causes massive spalling."
    },
    "HAZ-05": {
        "id": "HAZ-05",
        "canonical_name": "Shallow Biogenic Gas Migration Pocket",
        "aliases": ["shallow gas", "dihing gas", "conductor gas", "surface gas influx"],
        "energy_type": "SHALLOW_PRESSURE_POCKET",
        "severity": "MEDIUM",
        "description": "Shallow pockets (0–300m) capable of gas cutting freshwater mud before surface casing is set."
    },
    "HAZ-06": {
        "id": "HAZ-06",
        "canonical_name": "Deep High-Pressure Condensate Blowout Threat",
        "aliases": ["blowout", "uncontrolled blowout", "langpar gas", "lakadong blowout", "surface fire"],
        "energy_type": "UNCONFINED_HIGH_ENERGY_RESERVOIR",
        "severity": "CRITICAL",
        "description": "Unconfined high-pressure reservoir discharge through wellhead resulting in environmental and asset catastrophe."
    }
}

CANONICAL_STANDARDS: Dict[str, Dict[str, Any]] = {
    "STD-01": {
        "id": "STD-01",
        "canonical_name": "OISD-STD-174 (Well Control Operations and Practices)",
        "code": "OISD-STD-174",
        "organization": "Oil Industry Safety Directorate (Govt. of India)",
        "focus": "Mandatory kick detection, trip margin, shut-in procedures, and choke drill verification.",
        "url": "https://www.oisd.gov.in"
    },
    "STD-02": {
        "id": "STD-02",
        "canonical_name": "OISD-GDN-182 (Stuck Pipe Prevention & Remedial SOP)",
        "code": "OISD-GDN-182",
        "organization": "Oil Industry Safety Directorate (Govt. of India)",
        "focus": "Stationary string limits (<5 min in reactive shales), rotation thresholds (>60 RPM), and jar placement.",
        "url": "https://www.oisd.gov.in"
    },
    "STD-03": {
        "id": "STD-03",
        "canonical_name": "DGMS Petroleum Regulations 2002 (Rule 84/85 Precaution Against Blowout)",
        "code": "DGMS-PETRO-2002",
        "organization": "Directorate General of Mines Safety (India)",
        "focus": "Statutory requirements for dual well barriers during workover and testing operations before BOP removal.",
        "url": "https://www.dgms.gov.in"
    },
    "STD-04": {
        "id": "STD-04",
        "canonical_name": "API RP 53 (Blowout Prevention Equipment Systems for Drilling)",
        "code": "API-RP-53",
        "organization": "American Petroleum Institute",
        "focus": "Installation, testing, and maintenance of surface and subsea blowout preventer stacks and remote chokes.",
        "url": "https://www.api.org"
    },
    "STD-05": {
        "id": "STD-05",
        "canonical_name": "OISD-STD-175 (Workover Operations and Well Servicing)",
        "code": "OISD-STD-175",
        "organization": "Oil Industry Safety Directorate (Govt. of India)",
        "focus": "Isolation requirements during recompletion, workover fluid hydrostatic margins, and barrier logging.",
        "url": "https://www.oisd.gov.in"
    }
}

CANONICAL_MITIGATIONS: Dict[str, Dict[str, Any]] = {
    "MIT-01": {
        "id": "MIT-01",
        "canonical_name": "Wait & Weight Well Kill (12.8 ppg Kill Mud)",
        "aliases": ["wait & weight", "wait and weight", "driller's method", "kill mud", "circulate out kick", "shut in on bop"],
        "category": "WELL_CONTROL_KILL",
        "description": "Calculated constant bottom-hole pressure circulation displacing influx in single circulation with weighted mud."
    },
    "MIT-02": {
        "id": "MIT-02",
        "canonical_name": "50 bbl OBM Lubricant Soak Pill & Mechanical Jarring",
        "aliases": ["soak pill", "lubricant pill", "pipe release surfactant", "jarring", "fishing", "pipe-release"],
        "category": "MECHANICAL_STUCK_PIPE_REMEDY",
        "description": "Surfactant-weighted lubricant spot across stuck zone reducing mud-cake friction coefficient, followed by upward/downward jarring."
    },
    "MIT-03": {
        "id": "MIT-03",
        "canonical_name": "Coarse CaCO3 (30 ppb) + Medium Mica (15 ppb) LCM Squeeze",
        "aliases": ["lcm squeeze", "caco3 pill", "mica lcm", "loss pill", "lost circulation pill", "squeeze cementing"],
        "category": "FLUID_LOSS_REMEDIAL",
        "description": "Graded particle size distribution (PSD) bridging pore throats and micro-fractures under 250 psi hesitation squeeze."
    },
    "MIT-04": {
        "id": "MIT-04",
        "canonical_name": "Dual Retrievable Bridge Plugs & Deep Cement Barrier Placement",
        "aliases": ["dual mechanical barrier", "dual plugs", "retrievable bridge plug", "cement plug placement", "snubbing kill"],
        "category": "ZONAL_ISOLATION_REMEDIAL",
        "description": "Independent tandem barrier elements pressure-tested to 5,000 psi placed directly above perforated intervals."
    },
    "MIT-05": {
        "id": "MIT-05",
        "canonical_name": "Pre-drill Geomechanical 1D-MEM & Deep 7\" Liner Setting",
        "aliases": ["geomechanical model", "liner setting", "7 liner", "mw window planning", "wiper trips", "narrow mw"],
        "category": "GEOMECHANICAL_ENGINEERING",
        "description": "Pre-drill stress calibration isolating reactive Kopili shales with 7\" liner shoe before penetrating overpressured Barail/Langpar."
    },
    "MIT-06": {
        "id": "MIT-06",
        "canonical_name": "Continuous Rotation Policy (>60 RPM) & 5-Min Stationary Limit",
        "aliases": ["rotation policy", "60 rpm", "avoid stationary", "wiper trips every 50m"],
        "category": "OPERATIONAL_PROCEDURAL_CONTROL",
        "description": "Rig-floor policy enforcing continuous pipe agitation during connections and surveys in Girujan Clay."
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. CANONICAL TAXONOMY NORMALIZATION FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def normalize_formation(text: str) -> Optional[Dict[str, Any]]:
    """Fuzzy / token match raw string to canonical Upper Assam formation."""
    if not text:
        return None
    cleaned = text.strip().lower()
    for f_id, data in CANONICAL_FORMATIONS.items():
        if data["canonical_name"].lower() in cleaned or cleaned in data["canonical_name"].lower():
            return data
        for alias in data["aliases"]:
            if alias in cleaned:
                return data
    return None

def normalize_barrier(text: str) -> Optional[Dict[str, Any]]:
    """Match raw event text to canonical well barrier."""
    if not text:
        return None
    cleaned = text.strip().lower()
    for b_id, data in CANONICAL_BARRIERS.items():
        if data["canonical_name"].lower() in cleaned:
            return data
        for alias in data["aliases"]:
            if alias in cleaned:
                return data
    # Context-based defaults for drilling
    if "kick" in cleaned or "influx" in cleaned or "gas" in cleaned:
        return CANONICAL_BARRIERS["BAR-01"]  # Hydrostatic Mud Weight
    if "stuck" in cleaned or "sticking" in cleaned:
        return CANONICAL_BARRIERS["BAR-04"]  # Continuous Rotation
    if "loss" in cleaned or "lost circulation" in cleaned:
        return CANONICAL_BARRIERS["BAR-05"]  # LCM Bridging Cake
    if "blowout" in cleaned:
        return CANONICAL_BARRIERS["BAR-06"]  # Dual Mechanical Plugs
    if "breakout" in cleaned:
        return CANONICAL_BARRIERS["BAR-03"]  # Casing Shoe / Mud Window
    return CANONICAL_BARRIERS["BAR-01"]

def normalize_hazard(text: str) -> Optional[Dict[str, Any]]:
    """Match raw event text to canonical subsurface hazard."""
    if not text:
        return None
    cleaned = text.strip().lower()
    for h_id, data in CANONICAL_HAZARDS.items():
        if data["canonical_name"].lower() in cleaned:
            return data
        for alias in data["aliases"]:
            if alias in cleaned:
                return data
    if "kick" in cleaned or "gas" in cleaned:
        return CANONICAL_HAZARDS["HAZ-01"]
    if "stuck" in cleaned or "sticking" in cleaned or "drag" in cleaned:
        return CANONICAL_HAZARDS["HAZ-02"]
    if "loss" in cleaned or "thief" in cleaned:
        return CANONICAL_HAZARDS["HAZ-03"]
    if "breakout" in cleaned or "caving" in cleaned:
        return CANONICAL_HAZARDS["HAZ-04"]
    if "blowout" in cleaned:
        return CANONICAL_HAZARDS["HAZ-06"]
    return CANONICAL_HAZARDS["HAZ-01"]

def normalize_standard(text: str) -> Optional[Dict[str, Any]]:
    """Match raw event text to governing safety standard."""
    if not text:
        return None
    cleaned = text.strip().lower()
    for s_id, data in CANONICAL_STANDARDS.items():
        if data["code"].lower() in cleaned or data["canonical_name"].lower() in cleaned:
            return data
    if "kick" in cleaned or "gas" in cleaned:
        return CANONICAL_STANDARDS["STD-01"]  # OISD-STD-174
    if "stuck" in cleaned or "sticking" in cleaned:
        return CANONICAL_STANDARDS["STD-02"]  # OISD-GDN-182
    if "blowout" in cleaned or "workover" in cleaned:
        return CANONICAL_STANDARDS["STD-03"]  # DGMS Petro Regs 2002
    return CANONICAL_STANDARDS["STD-01"]

def normalize_mitigation(text: str) -> Optional[Dict[str, Any]]:
    """Match raw event text to canonical mitigation SOP."""
    if not text:
        return None
    cleaned = text.strip().lower()
    for m_id, data in CANONICAL_MITIGATIONS.items():
        if data["canonical_name"].lower() in cleaned:
            return data
        for alias in data["aliases"]:
            if alias in cleaned:
                return data
    if "soak" in cleaned or "jar" in cleaned or "lubricant" in cleaned or "stuck" in cleaned:
        return CANONICAL_MITIGATIONS["MIT-02"]
    if "lcm" in cleaned or "caco3" in cleaned or "loss" in cleaned:
        return CANONICAL_MITIGATIONS["MIT-03"]
    if "kill" in cleaned or "wait" in cleaned or "weight" in cleaned or "kick" in cleaned:
        return CANONICAL_MITIGATIONS["MIT-01"]
    if "blowout" in cleaned or "snubbing" in cleaned or "plug" in cleaned:
        return CANONICAL_MITIGATIONS["MIT-04"]
    return CANONICAL_MITIGATIONS["MIT-01"]


# ─────────────────────────────────────────────────────────────────────────────
# 3. CAUSAL DRILLING GRAPH STORE CLASS (NetworkX)
# ─────────────────────────────────────────────────────────────────────────────

class DrillingCausalGraphStore:
    """
    In-memory NetworkX directed graph modeling structured Bow-Tie Causal Pathways
    for oilfield drilling, barrier degradation, and regulatory compliance.
    """

    def __init__(self):
        self.graph = nx.DiGraph()
        self._initialized = False
        logger.info("Initializing DrillingCausalGraphStore (NetworkX)")

    def clear(self):
        """Reset the graph."""
        self.graph.clear()
        self._initialized = False

    # ─────────────────────────────────────────────────────────────────────────
    # Node Addition Helpers with Typing & Metadata
    # ─────────────────────────────────────────────────────────────────────────

    def add_asset_node(self, well_id: str, name: str, field: str, rig: str = "", status: str = "") -> str:
        node_id = f"well:{well_id}"
        self.graph.add_node(
            node_id,
            node_type="well",
            canonical_id=well_id,
            label=name,
            field=field,
            rig=rig,
            status=status,
            color="#06b6d4"
        )
        return node_id

    def add_formation_node(self, formation_id: str, name: str, depth_range: str = "", lithology: str = "", color: str = "") -> str:
        node_id = f"formation:{formation_id}"
        self.graph.add_node(
            node_id,
            node_type="formation",
            canonical_id=formation_id,
            label=name,
            depth_range=depth_range,
            lithology=lithology,
            color=color or "#a855f7"
        )
        return node_id

    def add_barrier_node(self, barrier_id: str, name: str, category: str, system: str, description: str = "") -> str:
        node_id = f"barrier:{barrier_id}"
        self.graph.add_node(
            node_id,
            node_type="barrier",
            canonical_id=barrier_id,
            label=name,
            category=category,
            system=system,
            description=description,
            color="#eab308"
        )
        return node_id

    def add_hazard_node(self, hazard_id: str, name: str, energy_type: str, severity: str, description: str = "") -> str:
        node_id = f"hazard:{hazard_id}"
        self.graph.add_node(
            node_id,
            node_type="hazard",
            canonical_id=hazard_id,
            label=name,
            energy_type=energy_type,
            severity=severity,
            description=description,
            color="#ef4444" if severity == "CRITICAL" else "#f97316"
        )
        return node_id

    def add_event_node(self, event_id: str, event_type: str, depth_md: float, severity: str, description: str, mitigation: str = "", well_name: str = "") -> str:
        node_id = f"event:{event_id}"
        self.graph.add_node(
            node_id,
            node_type="event",
            canonical_id=event_id,
            label=f"{event_type} ({depth_md:.0f}m)",
            event_type=event_type,
            depth_md=depth_md,
            severity=severity,
            description=description,
            mitigation=mitigation,
            well_name=well_name,
            color="#dc2626" if severity == "CRITICAL" else "#ea580c" if severity == "HIGH" else "#d97706"
        )
        return node_id

    def add_standard_node(self, standard_id: str, code: str, name: str, organization: str, focus: str) -> str:
        node_id = f"standard:{standard_id}"
        self.graph.add_node(
            node_id,
            node_type="standard",
            canonical_id=standard_id,
            label=code,
            full_name=name,
            organization=organization,
            focus=focus,
            color="#3b82f6"
        )
        return node_id

    def add_mitigation_node(self, mitigation_id: str, name: str, category: str, description: str) -> str:
        node_id = f"mitigation:{mitigation_id}"
        self.graph.add_node(
            node_id,
            node_type="mitigation",
            canonical_id=mitigation_id,
            label=name,
            category=category,
            description=description,
            color="#10b981"
        )
        return node_id

    def add_document_node(self, doc_id: str, filename: str, page: Optional[int] = None) -> str:
        node_id = f"document:{doc_id}"
        self.graph.add_node(
            node_id,
            node_type="document",
            canonical_id=doc_id,
            label=filename,
            page=page,
            color="#14b8a6"
        )
        return node_id

    # ─────────────────────────────────────────────────────────────────────────
    # Bow-Tie Structured Chain Construction
    # ─────────────────────────────────────────────────────────────────────────

    def add_drilling_event_chain(self, event: Dict[str, Any], well: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        Constructs a structured 5-layer Bow-Tie Causal Chain from an incoming drilling event:
        [ WELL ASSET ] ──(deployed_in)──▶ [ FORMATION ] ──(contains_threat)──▶ [ HAZARD ]
                                                 ▲                                │
                               (relies_on)       │                       (failed) │
        [ DRILLING BARRIER ] ────────────────────┤ ◀──────────────────────────────┘
               │                                 │
               ▼ (barrier_degradation)           ▼ (causes_event)
        [ DRILLING EVENT ] ─────────────▶ [ FIELD MITIGATION SOP ]
               │                                 │
               ▼ (violates_standard)             ▼ (governed_by)
        [ REGULATORY STANDARD ] ◀────────────────┘
        """
        created_nodes = {}

        # 1. Well Asset Node
        well_id = event.get("well_id", "UNKNOWN")
        well_name = well.get("name", well_id) if well else well_id
        well_field = well.get("field", "Upper Assam") if well else "Upper Assam"
        well_rig = well.get("rig", "") if well else ""
        well_status = well.get("status", "") if well else ""
        well_node = self.add_asset_node(well_id, well_name, well_field, well_rig, well_status)
        created_nodes["well"] = well_node

        # 2. Formation Node (Normalized)
        form_raw = event.get("formation") or event.get("formation_id") or "Barail Group"
        fmn = normalize_formation(str(form_raw)) or CANONICAL_FORMATIONS["FMN-07"]
        fmn_node = self.add_formation_node(fmn["id"], fmn["canonical_name"], fmn.get("depth_range", ""), fmn.get("lithology", ""), fmn.get("color", ""))
        created_nodes["formation"] = fmn_node

        # Edge: Well -> Formation (DEPLOYED_IN)
        self.graph.add_edge(well_node, fmn_node, type="DEPLOYED_IN", label="drills through")

        # 3. Subsurface Hazard Node (Normalized)
        event_desc = event.get("description", "")
        event_type = event.get("event_type", "Operational Anomaly")
        haz = normalize_hazard(f"{event_type} {event_desc}") or CANONICAL_HAZARDS["HAZ-01"]
        haz_node = self.add_hazard_node(haz["id"], haz["canonical_name"], haz["energy_type"], haz["severity"], haz["description"])
        created_nodes["hazard"] = haz_node

        # Edge: Formation -> Hazard (CONTAINS_THREAT)
        self.graph.add_edge(fmn_node, haz_node, type="CONTAINS_THREAT", label="hosts geohazard")

        # 4. Barrier Node (Normalized)
        bar = normalize_barrier(f"{event_type} {event_desc}") or CANONICAL_BARRIERS["BAR-01"]
        bar_node = self.add_barrier_node(bar["id"], bar["canonical_name"], bar["category"], bar["system"], bar["description"])
        created_nodes["barrier"] = bar_node

        # Edge: Barrier -> Hazard (FAILED_ENERGY_BARRIER)
        self.graph.add_edge(bar_node, haz_node, type="FAILED_ENERGY_BARRIER", label="failed to contain")

        # 5. Drilling Event Node
        event_id = event.get("id", f"EVT-{len(self.graph.nodes)}")
        depth_md = float(event.get("depth_md") or event.get("depth_from_md_m") or 2500.0)
        severity = event.get("severity", "MEDIUM")
        mitigation_text = event.get("mitigation", "")
        evt_node = self.add_event_node(event_id, event_type, depth_md, severity, event_desc, mitigation_text, well_name)
        created_nodes["event"] = evt_node

        # Edge: Well -> Event (RECORDED_INCIDENT)
        self.graph.add_edge(well_node, evt_node, type="RECORDED_INCIDENT", label="suffered incident")
        # Edge: Event -> Formation (IN_FORMATION)
        self.graph.add_edge(evt_node, fmn_node, type="IN_FORMATION", label="occurred within")
        # Edge: Event -> Barrier (BARRIER_DEGRADATION)
        self.graph.add_edge(evt_node, bar_node, type="BARRIER_DEGRADATION", label="compromised")

        # 6. Safety Standard / Rule Node (Normalized)
        std = normalize_standard(f"{event_type} {event_desc} {mitigation_text}") or CANONICAL_STANDARDS["STD-01"]
        std_node = self.add_standard_node(std["id"], std["code"], std["canonical_name"], std["organization"], std["focus"])
        created_nodes["standard"] = std_node

        # Edge: Barrier -> Standard (VIOLATES_STANDARD)
        self.graph.add_edge(bar_node, std_node, type="VIOLATES_STANDARD", label="audited under")

        # 7. Field Mitigation Node (Normalized)
        mit = normalize_mitigation(f"{mitigation_text} {event_type}") or CANONICAL_MITIGATIONS["MIT-01"]
        mit_node = self.add_mitigation_node(mit["id"], mit["canonical_name"], mit["category"], mit["description"])
        created_nodes["mitigation"] = mit_node

        # Edge: Event -> Mitigation (MITIGATED_BY)
        self.graph.add_edge(evt_node, mit_node, type="MITIGATED_BY", label="rectified via SOP")
        # Edge: Mitigation -> Standard (GOVERNED_BY)
        self.graph.add_edge(mit_node, std_node, type="GOVERNED_BY", label="standardized in")

        # 8. Document Evidence Node
        source_doc = event.get("source_doc") or event.get("source_document_id")
        if source_doc:
            doc_node = self.add_document_node(str(source_doc), str(source_doc), event.get("source_page"))
            self.graph.add_edge(evt_node, doc_node, type="EVIDENCED_BY", label="documented in")
            created_nodes["document"] = doc_node

        return created_nodes

    # ─────────────────────────────────────────────────────────────────────────
    # Initial Database Seeding
    # ─────────────────────────────────────────────────────────────────────────

    def populate_from_db(self):
        """Populate NetworkX graph using Upper Assam wells, formations, and drilling events."""
        if self._initialized:
            return

        try:
            from backend.database.mock_db import WELLS_DB, FORMATIONS_DB, DRILLING_EVENTS_DB
        except ImportError:
            from .mock_db import WELLS_DB, FORMATIONS_DB, DRILLING_EVENTS_DB

        logger.info(f"Populating Causal Graph with {len(WELLS_DB)} wells, {len(FORMATIONS_DB)} formations, {len(DRILLING_EVENTS_DB)} events")

        # Index wells by ID
        wells_by_id = {w["id"]: w for w in WELLS_DB}

        # Seed formations
        for f in FORMATIONS_DB:
            self.add_formation_node(
                f["id"],
                f.get("canonical_name", f["name"]),
                depth_range=f"{f.get('top_md_m', 0)}–{f.get('base_md_m', 0)}m",
                lithology=f.get("lithology", ""),
                color=f.get("color", "#a855f7")
            )

        # Seed wells
        for w in WELLS_DB:
            self.add_asset_node(
                w["id"],
                w["name"],
                w.get("field", "Upper Assam"),
                w.get("rig", ""),
                w.get("status", "")
            )

        # Build causal chains for all drilling events
        for evt in DRILLING_EVENTS_DB:
            well_data = wells_by_id.get(evt.get("well_id", ""))
            self.add_drilling_event_chain(evt, well_data)

        self._initialized = True
        logger.info(f"Causal Graph successfully compiled: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")

    # ─────────────────────────────────────────────────────────────────────────
    # Frontend Serialization (SVG & Cytoscape)
    # ─────────────────────────────────────────────────────────────────────────

    def to_network_graph(self, well_id: Optional[str] = None, node_type_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Serializes the graph for SVG/Canvas visualization.
        Supports filtering by well_id or node_type.
        """
        self.populate_from_db()

        target_nodes: Set[str] = set()
        if well_id:
            well_key = f"well:{well_id}" if not well_id.startswith("well:") else well_id
            if well_key in self.graph:
                target_nodes.add(well_key)
                # Include 2 hops around this well
                for neighbor in self.graph.neighbors(well_key):
                    target_nodes.add(neighbor)
                    for hop2 in self.graph.neighbors(neighbor):
                        target_nodes.add(hop2)
                for predecessor in self.graph.predecessors(well_key):
                    target_nodes.add(predecessor)
        else:
            target_nodes = set(self.graph.nodes())

        nodes_list = []
        for n_id in target_nodes:
            data = self.graph.nodes[n_id]
            if node_type_filter and data.get("node_type") != node_type_filter:
                continue

            nodes_list.append({
                "id": n_id,
                "type": data.get("node_type", "unknown"),
                "label": data.get("label", n_id),
                "severity": data.get("severity"),
                "depth_md": data.get("depth_md"),
                "field": data.get("field"),
                "rig": data.get("rig"),
                "color": data.get("color"),
                "description": data.get("description"),
                "mitigation": data.get("mitigation"),
                "well_name": data.get("well_name"),
                "page": data.get("page"),
                "category": data.get("category"),
                "system": data.get("system"),
                "organization": data.get("organization")
            })

        edges_list = []
        for u, v, d in self.graph.edges(data=True):
            if u in target_nodes and v in target_nodes:
                edges_list.append({
                    "source": u,
                    "target": v,
                    "type": d.get("type", "CONNECTED_TO"),
                    "label": d.get("label", ""),
                    "source_label": self.graph.nodes[u].get("label", u),
                    "target_label": self.graph.nodes[v].get("label", v)
                })

        metrics = {
            "total_nodes": len(nodes_list),
            "total_edges": len(edges_list),
            "graph_density": round(nx.density(self.graph), 4) if self.graph.number_of_nodes() > 0 else 0,
            "connected_components": nx.number_weakly_connected_components(self.graph) if self.graph.number_of_nodes() > 0 else 0
        }

        return {
            "nodes": nodes_list,
            "edges": edges_list,
            "metrics": metrics,
            "notice": "Bow-Tie Causal Safety Graph calibrated for Upper Assam drilling operations (OISD-STD-174)."
        }

    def to_cytoscape_json(self, well_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Serializes graph to Cytoscape.js format:
        { "elements": [ { "data": { ... } } ] }
        """
        net_data = self.to_network_graph(well_id=well_id)
        elements = []

        for node in net_data["nodes"]:
            elements.append({
                "group": "nodes",
                "data": {
                    "id": node["id"],
                    "label": node["label"],
                    "type": node["type"],
                    "color": node.get("color", "#06b6d4"),
                    "severity": node.get("severity"),
                    "depth_md": node.get("depth_md")
                },
                "classes": f"type-{node['type']} {(node.get('severity') or '').lower()}"
            })

        for edge in net_data["edges"]:
            elements.append({
                "group": "edges",
                "data": {
                    "id": f"{edge['source']}_{edge['target']}_{edge['type']}",
                    "source": edge["source"],
                    "target": edge["target"],
                    "type": edge["type"],
                    "label": edge.get("label", "")
                },
                "classes": f"rel-{edge['type'].lower()}"
            })

        return {
            "elements": elements,
            "metrics": net_data["metrics"]
        }

    def get_bowtie_chains(self, well_id: Optional[str] = None, event_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Extracts structured 5-stage Bow-Tie Pathways:
        1. Threat (Geological Formation & Pore Pressure)
        2. Prevention Barrier (Mud Weight / Casing / Rotation)
        3. Top Event (Loss of Control / Sticking / Kick)
        4. Recovery Mitigation (Kill Method / Lubricant Soak / LCM Squeeze)
        5. Consequence & Standard (Disaster Avoidance & OISD / DGMS Compliance)
        """
        self.populate_from_db()

        event_nodes = [
            n for n, d in self.graph.nodes(data=True)
            if d.get("node_type") == "event"
        ]

        if event_id:
            event_key = f"event:{event_id}" if not event_id.startswith("event:") else event_id
            event_nodes = [n for n in event_nodes if n == event_key]

        pathways = []
        for evt in event_nodes:
            evt_data = self.graph.nodes[evt]

            # Upstream Well
            well_node = None
            for p in self.graph.predecessors(evt):
                if self.graph.nodes[p].get("node_type") == "well":
                    well_node = self.graph.nodes[p]
                    break

            if well_id and well_node and well_node.get("canonical_id") != well_id:
                continue

            # Formation (Threat Stratum)
            fmn_node = None
            for s in self.graph.successors(evt):
                if self.graph.nodes[s].get("node_type") == "formation":
                    fmn_node = self.graph.nodes[s]
                    break

            # Compromised Barrier
            barrier_node = None
            for s in self.graph.successors(evt):
                if self.graph.nodes[s].get("node_type") == "barrier":
                    barrier_node = self.graph.nodes[s]
                    break

            # Associated Subsurface Hazard
            hazard_node = None
            if barrier_node:
                b_key = f"barrier:{barrier_node.get('canonical_id')}"
                for s in self.graph.successors(b_key):
                    if self.graph.nodes[s].get("node_type") == "hazard":
                        hazard_node = self.graph.nodes[s]
                        break

            # Mitigation SOP
            mitigation_node = None
            for s in self.graph.successors(evt):
                if self.graph.nodes[s].get("node_type") == "mitigation":
                    mitigation_node = self.graph.nodes[s]
                    break

            # Regulatory Standard
            standard_node = None
            if barrier_node:
                b_key = f"barrier:{barrier_node.get('canonical_id')}"
                for s in self.graph.successors(b_key):
                    if self.graph.nodes[s].get("node_type") == "standard":
                        standard_node = self.graph.nodes[s]
                        break

            pathways.append({
                "pathway_id": f"BOWTIE-{evt.replace('event:', '')}",
                "well": {
                    "id": well_node.get("canonical_id") if well_node else "OIL-WELL",
                    "name": well_node.get("label") if well_node else "Offset Well",
                    "field": well_node.get("field") if well_node else "Upper Assam"
                },
                "threat": {
                    "formation": fmn_node.get("label") if fmn_node else "Subsurface Stratum",
                    "depth_range": fmn_node.get("depth_range", ""),
                    "lithology": fmn_node.get("lithology", "")
                },
                "hazard": {
                    "name": hazard_node.get("label") if hazard_node else "Pore Pressure Influx",
                    "energy_type": hazard_node.get("energy_type", "HYDROCARBON_PRESSURE"),
                    "severity": hazard_node.get("severity", "HIGH")
                },
                "preventive_barrier": {
                    "name": barrier_node.get("label") if barrier_node else "Primary Hydrostatic Column",
                    "system": barrier_node.get("system", "Wellbore Containment"),
                    "status": "COMPROMISED"
                },
                "top_event": {
                    "id": evt.replace("event:", ""),
                    "event_type": evt_data.get("event_type", "Drilling Anomaly"),
                    "depth_md": evt_data.get("depth_md", 0.0),
                    "severity": evt_data.get("severity", "MEDIUM"),
                    "description": evt_data.get("description", "")
                },
                "mitigation_sop": {
                    "name": mitigation_node.get("label") if mitigation_node else "Wait & Weight Well Kill",
                    "category": mitigation_node.get("category", "WELL_CONTROL"),
                    "action_summary": evt_data.get("mitigation", "")
                },
                "regulatory_standard": {
                    "code": standard_node.get("label") if standard_node else "OISD-STD-174",
                    "name": standard_node.get("full_name", "Well Control Operations"),
                    "organization": standard_node.get("organization", "OISD India")
                }
            })

        return pathways

    def get_node_details(self, node_id: str) -> Dict[str, Any]:
        """Returns comprehensive inspection metadata and 2-hop causal neighborhood for a node."""
        self.populate_from_db()
        if node_id not in self.graph:
            return {"error": f"Node '{node_id}' not found in causal knowledge store"}

        node_data = self.graph.nodes[node_id]

        upstream = []
        for p in self.graph.predecessors(node_id):
            edge_data = self.graph.get_edge_data(p, node_id) or {}
            upstream.append({
                "id": p,
                "label": self.graph.nodes[p].get("label", p),
                "type": self.graph.nodes[p].get("node_type", "unknown"),
                "relation": edge_data.get("type", "LEADS_TO")
            })

        downstream = []
        for s in self.graph.successors(node_id):
            edge_data = self.graph.get_edge_data(node_id, s) or {}
            downstream.append({
                "id": s,
                "label": self.graph.nodes[s].get("label", s),
                "type": self.graph.nodes[s].get("node_type", "unknown"),
                "relation": edge_data.get("type", "LEADS_TO")
            })

        return {
            "node": {
                "id": node_id,
                **node_data
            },
            "upstream_causal_influences": upstream,
            "downstream_causal_consequences": downstream,
            "in_degree": self.graph.in_degree(node_id),
            "out_degree": self.graph.out_degree(node_id)
        }

    def get_statistics(self) -> Dict[str, Any]:
        """Returns topological safety metrics."""
        self.populate_from_db()
        by_type = {}
        for _, d in self.graph.nodes(data=True):
            t = d.get("node_type", "unknown")
            by_type[t] = by_type.get(t, 0) + 1

        by_relation = {}
        for _, _, d in self.graph.edges(data=True):
            r = d.get("type", "UNKNOWN")
            by_relation[r] = by_relation.get(r, 0) + 1

        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "node_counts_by_type": by_type,
            "edge_counts_by_relation": by_relation,
            "standards_enforced": ["OISD-STD-174", "OISD-GDN-182", "DGMS-PETRO-2002", "API-RP-53", "OISD-STD-175"],
            "basin": "Upper Assam Shelf (OIL / ONGC operational sector)"
        }


# ─────────────────────────────────────────────────────────────────────────────
# 4. SINGLETON ACCESSOR
# ─────────────────────────────────────────────────────────────────────────────

_GRAPH_STORE_INSTANCE: Optional[DrillingCausalGraphStore] = None

def get_graph_store() -> DrillingCausalGraphStore:
    """Returns the singleton instance of the DrillingCausalGraphStore."""
    global _GRAPH_STORE_INSTANCE
    if _GRAPH_STORE_INSTANCE is None:
        _GRAPH_STORE_INSTANCE = DrillingCausalGraphStore()
        _GRAPH_STORE_INSTANCE.populate_from_db()
    return _GRAPH_STORE_INSTANCE
