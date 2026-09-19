"""
SRISHTI·AI — Evidence & Causal Safety Graph API Router
Connects FastAPI to the NetworkX DrillingCausalGraphStore.
Exposes network topologies, Cytoscape serialization, Bow-Tie causal chains,
and node neighbor inspection endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.graph.graph_store import get_graph_store

router = APIRouter(prefix="/api/graph", tags=["Evidence & Causal Safety Graph"])


@router.get("/explore")
async def explore_graph(
    well_id: Optional[str] = Query(None, description="Optional well ID to filter subnetwork (e.g., MOR-29)"),
    type: Optional[str] = Query(None, description="Optional node type filter (well, event, formation, barrier, hazard, standard, mitigation, document)")
):
    """
    Returns the network graph projection of verified offset drilling memory,
    connecting Well Assets ↔ Formations ↔ Barriers ↔ Hazards ↔ Mitigations ↔ Regulations.
    """
    store = get_graph_store()
    return store.to_network_graph(well_id=well_id, node_type_filter=type)


@router.get("/bowtie")
async def get_bowtie_chains(
    well_id: Optional[str] = Query(None, description="Filter Bow-Tie pathways by well ID (e.g., BGH-05, MOR-29)")
):
    """
    Returns structured 5-layer Bow-Tie safety causal pathways:
    Threat (Formation) -> Preventive Barrier -> Top Event (Incident) -> Mitigation SOP -> Regulation / Safety Standard.
    """
    store = get_graph_store()
    pathways = store.get_bowtie_chains(well_id=well_id)
    return {
        "total_pathways": len(pathways),
        "pathways": pathways,
        "methodology": "Structured Bow-Tie / Swiss Cheese Safety Model (OISD-STD-174 & API RP 53)",
        "basin": "Upper Assam Shelf"
    }


@router.get("/bowtie/{event_id}")
async def get_single_bowtie(event_id: str):
    """Returns the Bow-Tie causal chain for a specific drilling event (e.g. EVT-01, EVT-03, EVT-05)."""
    store = get_graph_store()
    pathways = store.get_bowtie_chains(event_id=event_id)
    if not pathways:
        raise HTTPException(status_code=404, detail=f"No Bow-Tie chain found for event ID '{event_id}'")
    return pathways[0]


@router.get("/cytoscape")
async def get_cytoscape_elements(
    well_id: Optional[str] = Query(None, description="Optional well ID filter")
):
    """Returns Cytoscape.js compatible elements (nodes and edges) for advanced graph layouts."""
    store = get_graph_store()
    return store.to_cytoscape_json(well_id=well_id)


@router.get("/node/{node_id:path}")
async def inspect_node(node_id: str):
    """Returns 2-hop causal upstream influences and downstream consequences for a node."""
    store = get_graph_store()
    result = store.get_node_details(node_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/stats")
async def graph_statistics():
    """Returns graph topological metrics and safety standards enforcement stats."""
    store = get_graph_store()
    return store.get_statistics()
