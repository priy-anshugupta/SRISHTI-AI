'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Network, RefreshCw, ZoomIn, ZoomOut, Search,
  RotateCcw, ShieldCheck, AlertTriangle, X,
  ArrowRight, Wrench, Flame, BookOpen, Layers,
  ShieldAlert, Maximize2, Sparkles,
  ExternalLink, Eye, MapPin, ChevronRight, CheckCircle2, Move,
  Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

/* ─── TYPES ─── */
type Node = {
  id: string;
  type: 'well' | 'event' | 'formation' | 'document' | 'barrier' | 'hazard' | 'standard' | 'mitigation' | string;
  label: string;
  severity?: string;
  page?: number;
  field?: string;
  depth_md?: number;
  description?: string;
  mitigation?: string;
  well_name?: string;
  color?: string;
  category?: string;
  system?: string;
  organization?: string;
  x: number;
  y: number;
  radius: number;
};

type Edge = {
  source: string;
  target: string;
  source_label?: string;
  target_label?: string;
  type: string;
  label?: string;
};

type GraphData = {
  nodes: Node[];
  edges: Edge[];
  metrics?: {
    total_nodes: number;
    total_edges: number;
    graph_density: number;
    connected_components: number;
  };
  notice: string;
};

type BowtiePathway = {
  pathway_id: string;
  well: { id: string; name: string; field: string };
  threat: { formation: string; depth_range: string; lithology: string };
  hazard: { name: string; energy_type: string; severity: string };
  preventive_barrier: { name: string; system: string; status: string };
  top_event: { id: string; event_type: string; depth_md: number; severity: string; description: string };
  mitigation_sop: { name: string; category: string; action_summary: string };
  regulatory_standard: { code: string; name: string; organization: string };
};

type BowtieResponse = {
  total_pathways: number;
  pathways: BowtiePathway[];
  methodology: string;
  basin: string;
};

/* ─── HIGH-CONTRAST VIBRANT COLOR PALETTE ─── */
const TYPE_CONFIG: Record<string, { fill: string; stroke: string; line: string; label: string; icon: string }> = {
  well:       { fill: '#0369a1', stroke: '#38bdf8', line: '#38bdf8', label: 'Well Rig',          icon: 'W' },
  event:      { fill: '#991b1b', stroke: '#f87171', line: '#f87171', label: 'Incident',          icon: '!' },
  formation:  { fill: '#6b21a8', stroke: '#c084fc', line: '#c084fc', label: 'Rock Layer',        icon: 'R' },
  hazard:     { fill: '#9a3412', stroke: '#fb923c', line: '#fb923c', label: 'Subsurface Hazard', icon: 'H' },
  barrier:    { fill: '#854d0e', stroke: '#facc15', line: '#facc15', label: 'Safety Barrier',    icon: 'B' },
  mitigation: { fill: '#065f46', stroke: '#34d399', line: '#34d399', label: 'Remedy / SOP',      icon: 'S' },
  standard:   { fill: '#1e40af', stroke: '#60a5fa', line: '#60a5fa', label: 'Safety Standard',   icon: '§' },
  document:   { fill: '#115e59', stroke: '#2dd4bf', line: '#2dd4bf', label: 'Well Report',       icon: 'D' },
};

function getNodeConfig(type: string, severity?: string) {
  const cfg = TYPE_CONFIG[type] || { fill: '#1e293b', stroke: '#94a3b8', line: '#94a3b8', label: type, icon: '?' };
  if (type === 'event' && severity === 'CRITICAL') {
    return { ...cfg, fill: '#b91c1c', stroke: '#ef4444', line: '#ef4444' };
  }
  return cfg;
}

function friendlyEdgeLabel(type: string): string {
  const map: Record<string, string> = {
    'RECORDED_INCIDENT': 'had incident',
    'BARRIER_DEGRADATION': 'barrier degraded',
    'EVIDENCED_BY': 'source report',
    'DEPLOYED_IN': 'drilled in layer',
    'MITIGATED_BY': 'resolved by',
    'CONTAINS_THREAT': 'formation hazard',
    'FAILED_ENERGY_BARRIER': 'barrier breached',
    'VIOLATES_STANDARD': 'safety rule',
    'IN_FORMATION': 'rock stratum',
    'GOVERNED_BY': 'governed by',
  };
  return map[type] || type.toLowerCase().replace(/_/g, ' ');
}

function truncateLabel(text: string, maxLen = 20): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

/* ─── PLAIN ENGLISH INCIDENT SIMPLIFIER (NO HEAVY JARGON) ─── */
function getSimplifiedIncident(item: BowtiePathway): { summary: string; fix: string } {
  const well = item.well.name.toUpperCase();
  const event = item.top_event.event_type.toLowerCase();

  if (well.includes('BAGHJAN-5') && event.includes('blowout')) {
    return {
      summary: 'High-pressure gas blew out during workover because the blowout preventer (BOP) was removed before testing barriers.',
      fix: 'Enforce DGMS Rule 84: Never remove safety barriers until pressure tests are digitally confirmed.'
    };
  }
  if (well.includes('BAGHJAN-5') && event.includes('kick')) {
    return {
      summary: 'Gas surged into the wellbore from deep coal-shale, causing a sudden spike in surface pressure.',
      fix: 'Shut in well via annular BOP and circulated out gas kick using 12.8 ppg heavy kill mud.'
    };
  }
  if (well.includes('MORAN-29')) {
    return {
      summary: 'Drill pipe dragged heavily in sticky clay at 1,720m during joint connection.',
      fix: 'Pumped lubricant soak pill and kept pipe rotating (>60 RPM) to prevent severe sticking.'
    };
  }
  if (well.includes('MORAN-7')) {
    return {
      summary: 'Drill pipe got stuck in sticky clay after stopping rotation during a directional survey.',
      fix: 'Pumped 50 bbl lubricant pill and jarred pipe free. Rule: Keep drill string rotating (>60 RPM).'
    };
  }
  if (well.includes('MORAN-12')) {
    return {
      summary: 'Lost 40 barrels/hour of drilling mud into porous fractured sandstone.',
      fix: 'Pumped sealing pill to seal rock fractures and restored full mud circulation.'
    };
  }
  if (well.includes('NAHORKATIYA-162')) {
    return {
      summary: 'Sudden loss of drilling fluid (60 bbl/hr) upon drilling into porous sandstone.',
      fix: 'Pumped bridging pill to seal rock pores and adjusted mud weight to safe operating window.'
    };
  }
  if (well.includes('NAHORKATIYA-342')) {
    return {
      summary: 'Brittle coal layer crumbled into borehole, packing tightly around the drill string.',
      fix: 'Pumped thick cleaning sweep to clear coal pieces and raised mud weight to 10.6 ppg.'
    };
  }
  if (well.includes('NAHORKATIYA-656')) {
    return {
      summary: 'Weak shale collapsed into the borehole due to narrow mud weight window.',
      fix: 'Adjusted mud weight to 10.8 ppg to support borehole walls and stop further breakout.'
    };
  }
  if (well.includes('BAGHJAN-9')) {
    return {
      summary: 'Encountered high-pressure gas kick in overpressured Barail sandstone at 3,380m.',
      fix: 'Shut in well using BOP and increased mud weight to 12.6 ppg to regain pressure control.'
    };
  }
  if (well.includes('BAGHJAN-21')) {
    return {
      summary: 'Gas kick in Kopili formation at 3,850m with sharp rise in mud pit volume.',
      fix: 'Applied Wait & Weight well control method with 12.8 ppg mud to safely circulate out gas.'
    };
  }
  if (well.includes('LAKWA-112')) {
    return {
      summary: 'Gas kick at 3,220m depth; standpipe pressure rose rapidly.',
      fix: 'Closed BOP, waited for pressure stabilization, and circulated out gas safely.'
    };
  }
  if (well.includes('LAKWA-245')) {
    return {
      summary: 'Sticky clay gummed up the drill bit, drastically slowing drilling speed.',
      fix: 'Added anti-balling chemical to drilling mud and increased pump circulation rate.'
    };
  }
  if (well.includes('RUDRASAGAR-25')) {
    return {
      summary: 'Drill pipe stuck in reactive clay formation at 1,720m.',
      fix: 'Spotted chemical release pill and jarred string free without delay.'
    };
  }
  if (well.includes('DIGBOI-1001')) {
    return {
      summary: 'Hit shallow pocket of trapped gas near surface during top hole drilling.',
      fix: 'Diverted gas safely through separator until shallow pocket bled off.'
    };
  }
  if (well.includes('HUGRIJAN-48')) {
    return {
      summary: 'Partial mud loss into porous sandstone at 2,540m.',
      fix: 'Spotted bridging pill to seal thief zone and resumed normal drilling.'
    };
  }

  return {
    summary: item.top_event.description.length > 110 
      ? item.top_event.description.slice(0, 105) + '…' 
      : item.top_event.description,
    fix: item.mitigation_sop.action_summary.length > 110
      ? item.mitigation_sop.action_summary.slice(0, 105) + '…'
      : item.mitigation_sop.action_summary
  };
}

export default function KnowledgePage() {
  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected well to focus on (defaults to MORAN-29)
  const [selectedWellId, setSelectedWellId] = useState<string>('well:MOR-29');

  // Bow-Tie data & Registry display mode
  const [showBaghjanModal, setShowBaghjanModal] = useState(false);
  const [bowtieData, setBowtieData] = useState<BowtiePathway[]>([]);
  const [registrySearch, setRegistrySearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [showAllCards, setShowAllCards] = useState(false);

  // Interactive node selection & hover
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Dragging and custom node positions
  const [customNodePositions, setCustomNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);

  // Pan & Zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.95 });
  const panStateRef = useRef<{ isPanning: boolean; startX: number; startY: number; initX: number; initY: number }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const nodeDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initNodeX: number;
    initNodeY: number;
    hasMoved: boolean;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  /* ─── 1. FETCH GRAPH & BOWTIE DATA ─── */
  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resGraph, resBowtie] = await Promise.all([
        api<GraphData>('/api/graph/explore'),
        api<BowtieResponse>('/api/graph/bowtie')
      ]);

      if (resGraph && resGraph.nodes) {
        setRawNodes(resGraph.nodes);
        setRawEdges(resGraph.edges || []);
      }

      if (resBowtie && resBowtie.pathways) {
        setBowtieData(resBowtie.pathways);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge map data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  /* ─── 2. BUILD GRAPH ADJACENCY & LOOKUPS ─── */
  const { nodeMap, adjMap } = useMemo(() => {
    const map = new Map<string, Node>();
    const adj = new Map<string, Set<string>>();

    rawNodes.forEach(n => {
      map.set(n.id, n);
      adj.set(n.id, new Set());
    });

    rawEdges.forEach(e => {
      if (adj.has(e.source)) adj.get(e.source)!.add(e.target);
      if (adj.has(e.target)) adj.get(e.target)!.add(e.source);
    });

    return { nodeMap: map, adjMap: adj };
  }, [rawNodes, rawEdges]);

  // List of all wells for the quick switcher
  const wellList = useMemo(() => {
    return rawNodes.filter(n => n.type === 'well').sort((a, b) => {
      if (a.id === 'well:MOR-29') return -1;
      if (b.id === 'well:MOR-29') return 1;
      if (a.id === 'well:BGH-05') return -1;
      if (b.id === 'well:BGH-05') return 1;
      return a.label.localeCompare(b.label);
    });
  }, [rawNodes]);

  /* ─── 3. DYNAMIC WORLD-CLASS NODE LAYOUT ─── */
  const { baseNodes, baseEdges } = useMemo(() => {
    if (rawNodes.length === 0) return { baseNodes: [], baseEdges: [] };

    // Canvas center
    const CX = 620;
    const CY = 300;

    // SCENARIO A: FOCUSED WELL MODE (Radial tree with zero overlaps)
    if (selectedWellId !== 'ALL') {
      const targetWell = nodeMap.get(selectedWellId);
      if (targetWell) {
        const hop1Ids = Array.from(adjMap.get(selectedWellId) || []);
        
        // Find hop 2 nodes
        const hop2Ids = new Set<string>();
        hop1Ids.forEach(h1 => {
          (adjMap.get(h1) || []).forEach(h2 => {
            if (h2 !== selectedWellId && !hop1Ids.includes(h2)) {
              hop2Ids.add(h2);
            }
          });
        });

        const positionedNodes: Node[] = [];

        // 1. Center Well Node
        positionedNodes.push({
          ...targetWell,
          x: CX,
          y: CY,
          radius: 36,
        });

        // 2. Hop 1 Ring (Direct Formation, Incidents) - radius 195px
        const r1 = 195;
        const hop1Count = hop1Ids.length;
        hop1Ids.forEach((id, i) => {
          const n = nodeMap.get(id);
          if (!n) return;
          const angle = (i / Math.max(hop1Count, 1)) * Math.PI * 2 - Math.PI / 2;
          positionedNodes.push({
            ...n,
            x: CX + Math.cos(angle) * r1,
            y: CY + Math.sin(angle) * r1,
            radius: n.type === 'event' ? 26 : 24,
          });
        });

        // 3. Hop 2 Ring (Hazards, Barriers, Fix SOPs, Standards) - radius 360px
        const r2 = 360;
        const hop2List = Array.from(hop2Ids);
        const hop2Count = hop2List.length;
        hop2List.forEach((id, i) => {
          const n = nodeMap.get(id);
          if (!n) return;
          const angle = (i / Math.max(hop2Count, 1)) * Math.PI * 2 - Math.PI / 2 + 0.15;
          positionedNodes.push({
            ...n,
            x: CX + Math.cos(angle) * r2,
            y: CY + Math.sin(angle) * r2,
            radius: 20,
          });
        });

        const activeNodeIdSet = new Set(positionedNodes.map(n => n.id));
        const filteredEdges = rawEdges.filter(
          e => activeNodeIdSet.has(e.source) && activeNodeIdSet.has(e.target)
        );

        return { baseNodes: positionedNodes, baseEdges: filteredEdges };
      }
    }

    // SCENARIO B: ALL BASIN WELLS (Spacious 5-Oilfield Regional Clusters)
    const fieldCenters: Record<string, { x: number; y: number; label: string }> = {
      'Moran':        { x: 340,  y: 220, label: 'Moran Field' },
      'Baghjan':      { x: 920,  y: 220, label: 'Baghjan Field' },
      'Nahorkatiya':  { x: 920,  y: 440, label: 'Nahorkatiya Field' },
      'Lakwa':        { x: 340,  y: 440, label: 'Lakwa Field' },
      'Rudrasagar':   { x: 630,  y: 520, label: 'Rudrasagar & Others' },
    };

    const positionedNodes: Node[] = [];
    const placedIds = new Set<string>();

    // 1. Place wells in their oilfield hubs
    const wellsByField: Record<string, Node[]> = {};
    rawNodes.filter(n => n.type === 'well').forEach(w => {
      const f = w.field && fieldCenters[w.field] ? w.field : 'Rudrasagar';
      wellsByField[f] = wellsByField[f] || [];
      wellsByField[f].push(w);
    });

    Object.entries(wellsByField).forEach(([f, wList]) => {
      const center = fieldCenters[f] || fieldCenters['Rudrasagar'];
      const count = wList.length;
      const hubRadius = count > 1 ? 85 : 0;
      wList.forEach((w, i) => {
        const ang = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
        positionedNodes.push({
          ...w,
          x: center.x + Math.cos(ang) * hubRadius,
          y: center.y + Math.sin(ang) * hubRadius,
          radius: 26,
        });
        placedIds.add(w.id);
      });
    });

    // 2. Place events next to their recorded wells
    const layoutMap = new Map<string, Node>();
    positionedNodes.forEach(n => layoutMap.set(n.id, n));

    rawNodes.filter(n => n.type === 'event').forEach((evt, idx) => {
      const parentEdge = rawEdges.find(e => e.type === 'RECORDED_INCIDENT' && e.target === evt.id);
      const parentWell = parentEdge ? layoutMap.get(parentEdge.source) : null;

      if (parentWell) {
        const ang = (idx % 6) * (Math.PI / 3) + 0.3;
        positionedNodes.push({
          ...evt,
          x: parentWell.x + Math.cos(ang) * 95,
          y: parentWell.y + Math.sin(ang) * 95,
          radius: evt.severity === 'CRITICAL' ? 22 : 18,
        });
      } else {
        positionedNodes.push({
          ...evt,
          x: 630 + (idx % 5) * 70 - 140,
          y: 350 + Math.floor(idx / 5) * 60,
          radius: 18,
        });
      }
      placedIds.add(evt.id);
    });

    // 3. Place remaining nodes (Formations, Hazards, Barriers, SOPs, Standards) in logical center arcs
    const remaining = rawNodes.filter(n => !placedIds.has(n.id));
    const sharedCenter = { x: 630, y: 320 };
    const remCount = remaining.length;
    remaining.forEach((n, i) => {
      const ang = (i / Math.max(remCount, 1)) * Math.PI * 2;
      const dist = n.type === 'formation' ? 190 : n.type === 'hazard' ? 250 : 310;
      positionedNodes.push({
        ...n,
        x: sharedCenter.x + Math.cos(ang) * dist,
        y: sharedCenter.y + Math.sin(ang) * dist,
        radius: 16,
      });
    });

    return { baseNodes: positionedNodes, baseEdges: rawEdges };
  }, [rawNodes, rawEdges, selectedWellId, nodeMap, adjMap]);

  // Merge with any custom dragged node positions
  const displayNodes = useMemo(() => {
    return baseNodes.map(n => {
      const custom = customNodePositions.get(n.id);
      if (custom) {
        return { ...n, x: custom.x, y: custom.y };
      }
      return n;
    });
  }, [baseNodes, customNodePositions]);

  const displayEdges = baseEdges;

  /* ─── 4. CONNECTIVITY HIGHLIGHTING ─── */
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, Node>();
    displayNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [displayNodes]);

  const activeFocusId = hoveredNode?.id || selectedNode?.id;

  const connectedIds = useMemo(() => {
    if (!activeFocusId) return null;
    const ids = new Set<string>();
    ids.add(activeFocusId);
    displayEdges.forEach(e => {
      if (e.source === activeFocusId) ids.add(e.target);
      if (e.target === activeFocusId) ids.add(e.source);
    });
    return ids;
  }, [activeFocusId, displayEdges]);

  // Reset transform and custom positions when changing view mode
  useEffect(() => {
    setCustomNodePositions(new Map());
    if (selectedWellId === 'ALL') {
      setTransform({ x: -20, y: 0, scale: 0.78 });
    } else {
      setTransform({ x: 0, y: 0, scale: 0.95 });
    }
    setSelectedNode(null);
  }, [selectedWellId]);

  /* ─── 5. BULLETPROOF POINTER-BASED CANVAS PANNING & DRAGGING ─── */
  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    if (nodeDragRef.current) return;

    panStateRef.current = {
      isPanning: true,
      startX: e.clientX,
      startY: e.clientY,
      initX: transform.x,
      initY: transform.y,
    };
    setIsPanningCanvas(true);
    setSelectedNode(null);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panStateRef.current.isPanning) {
      const dx = e.clientX - panStateRef.current.startX;
      const dy = e.clientY - panStateRef.current.startY;
      setTransform(prev => ({
        ...prev,
        x: panStateRef.current.initX + dx,
        y: panStateRef.current.initY + dy,
      }));
      return;
    }

    if (nodeDragRef.current) {
      const d = nodeDragRef.current;
      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (dist > 3) {
        d.hasMoved = true;
      }

      const dx = (e.clientX - d.startX) / transform.scale;
      const dy = (e.clientY - d.startY) / transform.scale;

      setCustomNodePositions(prev => {
        const next = new Map(prev);
        next.set(d.id, { x: d.initNodeX + dx, y: d.initNodeY + dy });
        return next;
      });
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panStateRef.current.isPanning) {
      panStateRef.current.isPanning = false;
      setIsPanningCanvas(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (nodeDragRef.current) {
      nodeDragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      setTransform(prev => {
        const newScale = Math.min(Math.max(0.35, prev.scale * factor), 2.5);
        if (!svgRef.current) return { ...prev, scale: newScale };
        const rect = svgRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        return {
          x: mx - (mx - prev.x) * (newScale / prev.scale),
          y: my - (my - prev.y) * (newScale / prev.scale),
          scale: newScale,
        };
      });
    }
  };

  const zoomIn = () => setTransform(p => ({ ...p, scale: Math.min(p.scale * 1.2, 2.5) }));
  const zoomOut = () => setTransform(p => ({ ...p, scale: Math.max(p.scale * 0.8, 0.35) }));
  const resetView = () => {
    setCustomNodePositions(new Map());
    if (selectedWellId === 'ALL') {
      setTransform({ x: -20, y: 0, scale: 0.78 });
    } else {
      setTransform({ x: 0, y: 0, scale: 0.95 });
    }
  };

  /* ─── 6. FILTERED REGISTRY CARDS BELOW THE GRAPH (CLEAN & NON-CLUTTERED) ─── */
  const selectedWellLabel = nodeMap.get(selectedWellId)?.label || 'MORAN-29';

  const displayedRegistry = useMemo(() => {
    return bowtieData.filter(p => {
      // If not showing all cards and a specific well is chosen, filter to that well or field
      if (!showAllCards && selectedWellId !== 'ALL') {
        const isExactWell = p.well.name.toUpperCase() === selectedWellLabel.toUpperCase();
        const wellNode = nodeMap.get(selectedWellId);
        const isSameField = wellNode?.field && p.well.field.toLowerCase() === wellNode.field.toLowerCase();
        if (!isExactWell && !isSameField) return false;
      }

      if (severityFilter !== 'ALL' && p.top_event.severity !== severityFilter) return false;
      if (registrySearch.trim()) {
        const q = registrySearch.toLowerCase();
        return (
          p.top_event.event_type.toLowerCase().includes(q) ||
          p.well.name.toLowerCase().includes(q) ||
          p.threat.formation.toLowerCase().includes(q) ||
          p.mitigation_sop.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bowtieData, selectedWellId, selectedWellLabel, showAllCards, severityFilter, registrySearch, nodeMap]);

  return (
    <div className="space-y-4 font-sans text-slate-100 min-h-full pb-16">

      {/* ─── 1. TOP HEADER TOOLBAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Network className="text-cyan-400" size={22} />
              <span>Drilling Safety Knowledge Map</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Institutional drilling memory across 18 wells — linking rock layers, hazards, past incidents, and verified engineering fixes
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-[#020507] border border-[#162D38] text-slate-300 font-mono text-[11px]">
            {displayNodes.length} nodes · {displayEdges.length} links
          </span>

          <button
            onClick={() => setShowBaghjanModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-700/80 text-red-200 text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer"
          >
            <Flame size={14} className="text-red-400 animate-pulse" />
            <span>Baghjan-5 Case Study</span>
          </button>

          <button
            onClick={loadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D5C75] hover:bg-[#147695] text-white rounded-xl font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK WELL SELECTOR TOOLBAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#050C10] border-2 border-[#162D38] rounded-2xl text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Eye size={14} className="text-cyan-400" />
            <span>Focus Well:</span>
          </span>

          {/* Clean Dropdown for all 18 wells */}
          <select
            value={selectedWellId}
            onChange={(e) => {
              if (e.target.value) setSelectedWellId(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#020507] border-2 border-[#162D38] hover:border-cyan-500/60 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner min-w-[200px]"
          >
            <option value="ALL">🌐 View All 18 Basin Wells</option>
            <optgroup label="Active Drilling Asset">
              <option value="well:MOR-29">⭐ MORAN-29 (Active Rig · Moran Field)</option>
            </optgroup>
            <optgroup label="Blowout Lesson">
              <option value="well:BGH-05">🔥 BAGHJAN-5 (Blowout Lesson · Baghjan)</option>
            </optgroup>
            <optgroup label="All Offset Wells">
              {wellList
                .filter(w => w.id !== 'well:MOR-29' && w.id !== 'well:BGH-05')
                .map(w => (
                  <option key={w.id} value={w.id}>
                    {w.label} ({w.field || 'Field'})
                  </option>
                ))}
            </optgroup>
          </select>

          {/* Quick Shortcuts */}
          <button
            onClick={() => setSelectedWellId('well:MOR-29')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWellId === 'well:MOR-29'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 font-extrabold ring-2 ring-cyan-300'
                : 'bg-[#020507] text-cyan-300 border border-cyan-800/60 hover:bg-cyan-950/40'
            }`}
          >
            <Sparkles size={12} />
            <span>MORAN-29 ★</span>
          </button>

          <button
            onClick={() => setSelectedWellId('well:BGH-05')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWellId === 'well:BGH-05'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 font-bold'
                : 'bg-[#020507] text-red-300 border border-red-800/60 hover:bg-red-950/40'
            }`}
          >
            <Flame size={12} />
            <span>BAGHJAN-5</span>
          </button>

          {/* Full Basin Map Button (Always fully visible, never clipped) */}
          <button
            onClick={() => setSelectedWellId('ALL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWellId === 'ALL'
                ? 'bg-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20'
                : 'bg-[#020507] text-amber-300 border border-amber-800/60 hover:bg-amber-950/40'
            }`}
          >
            <Maximize2 size={12} />
            <span>All 18 Wells Basin Map</span>
          </button>
        </div>

        {/* Compact Action Hint */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <Move size={13} className="text-cyan-400" />
          <span>Click & hold to drag graph</span>
        </div>
      </div>

      {/* ─── 3. THE KNOWLEDGE GRAPH CANVAS (SMOOTH DRAG & PAN ENABLED) ─── */}
      <div className="relative bg-[#020507] border-2 border-[#162D38] rounded-2xl overflow-hidden shadow-2xl h-[580px] w-full">
        
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020507]/80 backdrop-blur-sm pointer-events-none">
            <RefreshCw size={28} className="animate-spin text-cyan-400 mb-2" />
            <p className="text-xs text-slate-300 font-medium">Constructing Subsurface Knowledge Graph…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020507]/90 p-4">
            <AlertTriangle size={32} className="text-red-400 mb-2" />
            <p className="text-xs text-red-300 mb-3">{error}</p>
            <button onClick={loadGraph} className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold">
              Retry Loading
            </button>
          </div>
        )}

        {/* Top-Left View Badge */}
        <div className="absolute top-3.5 left-3.5 z-10 bg-[#050C10]/95 backdrop-blur-md border border-[#162D38] rounded-xl px-3.5 py-1.5 shadow-lg flex items-center gap-2 pointer-events-none">
          <MapPin size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-white">
            {selectedWellId === 'ALL'
              ? 'Full Regional Knowledge Map (Upper Assam Basin)'
              : `${nodeMap.get(selectedWellId)?.label || 'Well'} Safety Chain & Connected Hazards`}
          </span>
        </div>

        {/* Top-Right Floating Zoom Controls */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 bg-[#050C10]/95 backdrop-blur-md border border-[#162D38] rounded-xl p-1.5 shadow-lg">
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg hover:bg-[#162D38] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg hover:bg-[#162D38] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg hover:bg-[#162D38] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Bottom Helper Instruction */}
        <div className="absolute bottom-3 right-3.5 z-10 hidden md:block text-[10px] text-slate-400 bg-[#050C10]/90 px-3 py-1 rounded-xl border border-[#162D38] pointer-events-none">
          Left-click & hold anywhere to move graph · Drag nodes · Ctrl + Scroll to zoom
        </div>

        {/* SVG CANVAS WITH BULLETPROOF POINTER DRAGGING */}
        <svg
          ref={svgRef}
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerCancel={handleSvgPointerUp}
          onWheel={handleWheel}
          style={{ cursor: isPanningCanvas ? 'grabbing' : 'grab', touchAction: 'none' }}
          className="w-full h-full select-none"
        >
          <defs>
            {/* Arrow Markers for each category */}
            <marker id="arrow-well" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-event" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f87171" />
            </marker>
            <marker id="arrow-hazard" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#fb923c" />
            </marker>
            <marker id="arrow-barrier" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#facc15" />
            </marker>
            <marker id="arrow-mitigation" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#34d399" />
            </marker>
            <marker id="arrow-formation" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#c084fc" />
            </marker>

            {/* Glowing Halo */}
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Transform Group */}
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Grid Pattern */}
            <pattern id="bg-grid" width="70" height="70" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.9" fill="#334155" opacity="0.35" />
            </pattern>
            <rect x="-4000" y="-4000" width="10000" height="10000" fill="url(#bg-grid)" />

            {/* ─── 1. HIGH-CONTRAST CONNECTING LINES WITH MOVING DOTS ─── */}
            <g className="edges-layer" pointerEvents="none">
              {displayEdges.map((edge, idx) => {
                const src = nodePositionMap.get(edge.source);
                const tgt = nodePositionMap.get(edge.target);
                if (!src || !tgt) return null;

                const isConnected = connectedIds
                  ? (edge.source === activeFocusId || edge.target === activeFocusId)
                  : false;

                const opacity = connectedIds ? (isConnected ? 1.0 : 0.08) : 0.82;

                let strokeColor = '#38bdf8';
                let markerId = 'url(#arrow-well)';
                if (edge.type === 'RECORDED_INCIDENT') {
                  strokeColor = '#f87171';
                  markerId = 'url(#arrow-event)';
                } else if (edge.type === 'CONTAINS_THREAT' || edge.type === 'FAILED_ENERGY_BARRIER') {
                  strokeColor = '#fb923c';
                  markerId = 'url(#arrow-hazard)';
                } else if (edge.type === 'BARRIER_DEGRADATION' || edge.type === 'VIOLATES_STANDARD') {
                  strokeColor = '#facc15';
                  markerId = 'url(#arrow-barrier)';
                } else if (edge.type === 'MITIGATED_BY') {
                  strokeColor = '#34d399';
                  markerId = 'url(#arrow-mitigation)';
                } else if (edge.type === 'IN_FORMATION' || edge.type === 'DEPLOYED_IN') {
                  strokeColor = '#c084fc';
                  markerId = 'url(#arrow-formation)';
                }

                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;
                const dur = 2.4 + (idx % 4) * 0.6;

                return (
                  <g key={`edge-${idx}`} style={{ opacity, transition: 'opacity 0.2s ease' }}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={isConnected ? 3.0 : 2.0}
                      markerEnd={markerId}
                    />

                    <circle
                      r={isConnected ? 4.5 : 3.5}
                      fill="#ffffff"
                      stroke={strokeColor}
                      strokeWidth="1.8"
                    >
                      <animateMotion
                        dur={`${dur}s`}
                        repeatCount="indefinite"
                        path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`}
                      />
                    </circle>

                    {(isConnected || (selectedWellId !== 'ALL' && transform.scale > 0.8)) && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-38"
                          y="-9"
                          width="76"
                          height="16"
                          rx="4"
                          fill="#070D0F"
                          stroke={strokeColor}
                          strokeWidth="1"
                          opacity="0.95"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={strokeColor}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {friendlyEdgeLabel(edge.type)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* ─── 2. NODES WITH DRAGGABILITY, HOVER & SELECTION ─── */}
            <g className="nodes-layer">
              {displayNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const isConnected = connectedIds ? connectedIds.has(node.id) : true;
                const opacity = isConnected ? 1.0 : 0.14;

                const config = getNodeConfig(node.type, node.severity);
                const r = node.radius * (isSelected ? 1.25 : isHovered ? 1.15 : 1.0);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ opacity, cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.stopPropagation();

                      const currentPos = customNodePositions.get(node.id) || { x: node.x, y: node.y };
                      nodeDragRef.current = {
                        id: node.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initNodeX: currentPos.x,
                        initNodeY: currentPos.y,
                        hasMoved: false,
                      };

                      if (svgRef.current) {
                        try {
                          svgRef.current.setPointerCapture(e.pointerId);
                        } catch {}
                      }
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      if (nodeDragRef.current && !nodeDragRef.current.hasMoved) {
                        if (node.type === 'well' && selectedWellId === 'ALL') {
                          setSelectedWellId(node.id);
                        } else {
                          setSelectedNode(node);
                        }
                      }
                      nodeDragRef.current = null;
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {(node.id === 'well:MOR-29' || node.severity === 'CRITICAL') && (
                      <circle
                        r={r + 8}
                        fill="none"
                        stroke={config.stroke}
                        strokeWidth="1.5"
                        opacity="0.6"
                        strokeDasharray="4,4"
                        pointerEvents="none"
                      />
                    )}

                    {(isSelected || isHovered) && (
                      <circle
                        r={r + 6}
                        fill="none"
                        stroke={config.stroke}
                        strokeWidth="3"
                        opacity="0.85"
                        filter="url(#glow)"
                        pointerEvents="none"
                      />
                    )}

                    <circle
                      r={r}
                      fill={config.fill}
                      stroke={config.stroke}
                      strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.8}
                      pointerEvents="none"
                    />

                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={Math.round(r * 0.65)}
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      pointerEvents="none"
                    >
                      {config.icon}
                    </text>

                    <g transform={`translate(0, ${r + 14})`} pointerEvents="none">
                      <rect
                        x="-52"
                        y="-8"
                        width="104"
                        height="16"
                        rx="4"
                        fill="#050C10"
                        stroke={config.stroke}
                        strokeWidth={isSelected ? 1.5 : 0.8}
                        opacity="0.95"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isSelected ? '#38bdf8' : '#f1f5f9'}
                        fontSize="9"
                        fontWeight={isSelected ? 'bold' : '600'}
                        fontFamily="sans-serif"
                      >
                        {truncateLabel(node.label, 18)}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

          </g>
        </svg>

        {/* ─── FLOATING HOVER TOOLTIP CARD ─── */}
        {hoveredNode && !selectedNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#050C10]/95 backdrop-blur-md border border-cyan-500/50 rounded-xl px-4 py-2 shadow-2xl pointer-events-none flex items-center gap-3 animate-in fade-in zoom-in-95 duration-100">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getNodeConfig(hoveredNode.type).stroke }} />
            <div>
              <div className="text-[10px] uppercase font-bold text-cyan-400">
                {getNodeConfig(hoveredNode.type).label} {hoveredNode.field ? `· ${hoveredNode.field} Field` : ''}
              </div>
              <div className="text-xs font-bold text-white">{hoveredNode.label}</div>
            </div>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-3 shrink-0">
              Click to inspect details
            </span>
          </div>
        )}

        {/* ─── BOTTOM-LEFT LEGEND DOCK ─── */}
        <div className="absolute bottom-3 left-3 z-10 bg-[#050C10]/95 backdrop-blur-md border border-[#162D38] rounded-xl p-3 text-[11px] hidden sm:block shadow-xl pointer-events-none">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Entity Legend</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <span key={type} className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.stroke }} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* ─── RIGHT SLIDE-OVER DETAIL INSPECTOR PANEL ─── */}
        {selectedNode && (
          <div className="absolute top-3 right-3 z-20 max-w-sm w-full bg-[#050C10]/98 backdrop-blur-md border-2 border-cyan-500/60 rounded-xl p-4 shadow-2xl space-y-3 max-h-[92%] overflow-y-auto font-sans ring-1 ring-cyan-500/30 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-start justify-between border-b border-[#162D38] pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                  <Sparkles size={11} />
                  {getNodeConfig(selectedNode.type).label}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedNode.label}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-2.5 bg-[#020507] rounded-lg border border-[#162D38] space-y-1.5 text-xs shadow-inner">
              <div className="flex justify-between text-slate-400">
                <span>ID:</span>
                <span className="text-slate-200 font-mono text-[11px]">{selectedNode.id}</span>
              </div>
              {selectedNode.severity && (
                <div className="flex justify-between items-center">
                  <span>Severity:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedNode.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                    selectedNode.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {selectedNode.severity}
                  </span>
                </div>
              )}
              {selectedNode.depth_md && (
                <div className="flex justify-between text-slate-400">
                  <span>Recorded Depth:</span>
                  <span className="text-cyan-300 font-mono font-bold">{selectedNode.depth_md} meters</span>
                </div>
              )}
              {selectedNode.field && (
                <div className="flex justify-between text-slate-400">
                  <span>Oilfield:</span>
                  <span className="text-white font-semibold">{selectedNode.field} Field</span>
                </div>
              )}
              {selectedNode.system && (
                <div className="flex justify-between text-slate-400">
                  <span>Barrier System:</span>
                  <span className="text-amber-300 font-bold">{selectedNode.system}</span>
                </div>
              )}
              {selectedNode.organization && (
                <div className="flex justify-between text-slate-400">
                  <span>Issuing Body:</span>
                  <span className="text-blue-300 font-bold">{selectedNode.organization}</span>
                </div>
              )}
            </div>

            {selectedNode.description && (
              <div className="p-2.5 bg-[#020507] rounded-lg border border-[#162D38] text-xs text-slate-300 space-y-1 shadow-inner">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Operational Context:</div>
                <p className="leading-relaxed">{selectedNode.description}</p>
              </div>
            )}

            {selectedNode.mitigation && (
              <div className="p-2.5 bg-[#020507] rounded-lg border border-emerald-900/60 text-xs text-emerald-200 space-y-1 shadow-inner">
                <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                  <Wrench size={11} />
                  Verified Mitigation Procedure:
                </div>
                <p className="leading-relaxed">{selectedNode.mitigation}</p>
              </div>
            )}

            <div className="p-2.5 bg-[#020507] rounded-lg border border-[#162D38] space-y-1.5 shadow-inner">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Connected Relationships ({displayEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {displayEdges
                  .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map((edge, idx) => {
                    const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                    const other = nodeMap.get(otherId);
                    return (
                      <div
                        key={idx}
                        onClick={() => other && setSelectedNode(other)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-[#050C10] hover:bg-[#0c1c24] border border-[#162D38] hover:border-cyan-500/50 cursor-pointer text-[11px] transition-colors"
                      >
                        <span className="text-cyan-300 font-bold truncate max-w-[150px]">
                          {other?.label ?? otherId}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-[#020507] border border-[#162D38]">
                          {friendlyEdgeLabel(edge.type)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <Link
                href="/ask"
                className="flex-1 text-center py-2 rounded-lg bg-[#0D5C75] hover:bg-[#147695] text-white text-xs font-bold transition-colors shadow-md"
              >
                Query in AI Copilot
              </Link>
              {selectedNode.type === 'well' && (
                <Link
                  href={`/well/${selectedNode.id.replace('well:', '')}`}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <span>Well Profile</span>
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ─── 4. SIMPLIFIED OFFSET INCIDENTS REGISTRY (CLEAN, JARGON-FREE) ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-amber-400" size={18} />
              <span>
                {showAllCards 
                  ? 'All Offset Well Incidents & Lessons Learned (15 Records)'
                  : `${selectedWellLabel} · Relevant Offset Incidents (${displayedRegistry.length})`}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simplified root causes and engineering solutions from offset wells in plain English
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View scope toggle */}
            <div className="flex items-center bg-[#020507] p-1 rounded-xl border border-[#162D38] text-xs">
              <button
                onClick={() => setShowAllCards(false)}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  !showAllCards
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {selectedWellLabel} Incidents
              </button>
              <button
                onClick={() => setShowAllCards(true)}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  showAllCards
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All 15 Basin Incidents
              </button>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 bg-[#020507] p-1 rounded-xl border border-[#162D38] text-xs">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                    severityFilter === sev
                      ? sev === 'CRITICAL' ? 'bg-red-500 text-white' :
                        sev === 'HIGH' ? 'bg-orange-500 text-black' :
                        sev === 'MEDIUM' ? 'bg-amber-500 text-black' :
                        'bg-cyan-500 text-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simplified Incident Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedRegistry.map(item => {
            const isCritical = item.top_event.severity === 'CRITICAL';
            const isHigh = item.top_event.severity === 'HIGH';
            const { summary, fix } = getSimplifiedIncident(item);

            return (
              <div
                key={item.pathway_id}
                className={`p-4 rounded-xl border-2 transition-all shadow-md flex flex-col justify-between space-y-2.5 ${
                  isCritical
                    ? 'bg-[#0f0505] border-red-900/70 hover:border-red-600'
                    : isHigh
                    ? 'bg-[#0c0804] border-orange-900/70 hover:border-orange-600'
                    : 'bg-[#050C10] border-[#162D38] hover:border-cyan-600/70'
                }`}
              >
                <div>
                  {/* Card Header: Well & Severity Badge */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#162D38] mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.well.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({item.well.field} Field)</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCritical ? 'bg-red-950 text-red-300 border border-red-800' :
                      isHigh ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                      'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {item.top_event.severity}
                    </span>
                  </div>

                  {/* Incident Title & Depth */}
                  <div className="text-sm font-bold text-cyan-300 mb-1 flex items-center justify-between">
                    <span>{item.top_event.event_type}</span>
                    <span className="text-xs font-mono text-slate-400">{item.top_event.depth_md}m MD</span>
                  </div>

                  {/* Rock layer chip */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span>Layer: <strong className="text-purple-300 font-semibold">{item.threat.formation}</strong></span>
                    <span>·</span>
                    <span>Barrier: <strong className="text-amber-300 font-semibold">{item.preventive_barrier.name}</strong></span>
                  </div>

                  {/* 1-sentence Plain English Explanation */}
                  <p className="text-xs text-slate-200 leading-relaxed mb-2.5">
                    {summary}
                  </p>

                  {/* 1-sentence Verified Fix Box */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-xs text-emerald-200 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Verified Fix:</span>
                    </div>
                    <p className="text-xs text-emerald-200 font-medium leading-snug">
                      {fix}
                    </p>
                  </div>
                </div>

                {/* Footer Standard Code & Focus on Graph Button */}
                <div className="pt-2 border-t border-[#162D38] flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60 font-semibold">
                    {item.regulatory_standard.code}
                  </span>

                  <button
                    onClick={() => {
                      const wellId = `well:${item.well.id.replace('well:', '')}`;
                      setSelectedWellId(wellId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 font-bold text-xs cursor-pointer"
                  >
                    <span>Focus on Graph</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Empty state if filtered */}
        {displayedRegistry.length === 0 && (
          <div className="p-8 text-center bg-[#050C10] rounded-xl border border-[#162D38] text-slate-400 text-xs space-y-2">
            <p>No incidents match the active filter.</p>
            <button
              onClick={() => { setShowAllCards(true); setSeverityFilter('ALL'); }}
              className="px-3 py-1 bg-cyan-700 text-white rounded-lg text-xs font-semibold"
            >
              Show all 15 incidents
            </button>
          </div>
        )}
      </div>

      {/* ─── 5. BAGHJAN-5 CASE STUDY MODAL ─── */}
      {showBaghjanModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#050C10] border-2 border-red-700/80 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl my-6 ring-1 ring-red-500/20">
            
            <div className="flex items-start justify-between pb-3 border-b border-red-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-600 text-red-400">
                  <Flame size={24} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    Institutional Drilling Lesson · Oil India Limited
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Well BAGHJAN-5 Blowout (2020) & Prevention Framework
                  </h2>
                  <p className="text-slate-400 text-xs">
                    NGT Katakey Committee & CAG Audit No. 42 Analysis
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBaghjanModal(false)}
                className="p-1.5 rounded-lg bg-[#020507] border border-[#162D38] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">DATE OF BLOWOUT</span>
                <div className="text-sm font-bold text-white mt-0.5">27 May 2020</div>
                <div className="text-[10px] text-slate-500">Burned 190 days</div>
              </div>
              <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">RESERVOIR DEPTH</span>
                <div className="text-sm font-bold text-cyan-300 mt-0.5 font-mono">3,870m MD</div>
                <div className="text-[10px] text-slate-500">Lakadong / Therria Sand</div>
              </div>
              <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">HUMAN TOLL</span>
                <div className="text-sm font-bold text-red-400 mt-0.5">3 Fatalities</div>
                <div className="text-[10px] text-slate-500">OIL Firefighters & Crew</div>
              </div>
              <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">ESTIMATED LOSS</span>
                <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono">₹2,500+ Cr</div>
                <div className="text-[10px] text-slate-500">Compensation & Capping</div>
              </div>
            </div>

            {/* 3 Pillars */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-400" />
                Root Causes & SRISHTI AI Prevention
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-3 bg-[#020507] rounded-xl border border-red-900/50 space-y-1.5 shadow-inner">
                  <span className="text-[10px] font-bold text-red-400 uppercase">
                    1. PREMATURE BOP REMOVAL
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Workover crew unbolted the BOP stack before verifying dual mechanical barriers. Gas escaped into the cellar within minutes.
                  </p>
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800 text-emerald-300">
                    <strong>SRISHTI Fix:</strong> Enforces DGMS Rule 84: digitally locks sign-off until dual mechanical barriers are pressure tested.
                  </div>
                </div>

                <div className="p-3 bg-[#020507] rounded-xl border border-red-900/50 space-y-1.5 shadow-inner">
                  <span className="text-[10px] font-bold text-red-400 uppercase">
                    2. SHALLOW PLUG IN DEVIATED HOLE
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    A single cement plug placed at ~1,000m in a 40° deviated hole channeled high-pressure gas along the high side of the casing.
                  </p>
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800 text-emerald-300">
                    <strong>SRISHTI Fix:</strong> Flags high-angle intervals and mandates mechanical bridge plug placement within 50m of perforation.
                  </div>
                </div>

                <div className="p-3 bg-[#020507] rounded-xl border border-red-900/50 space-y-1.5 shadow-inner">
                  <span className="text-[10px] font-bold text-red-400 uppercase">
                    3. KNOWLEDGE DISCONNECT
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Shift crew had no access to offset records showing Wells NHK-162 and Moran-29 experienced major gas kicks under identical Barail overpressure.
                  </p>
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800 text-emerald-300">
                    <strong>SRISHTI Fix:</strong> Projects offset kick signatures onto the active rig display, with 12.8 ppg kill mud mandatory in reserve pits.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Takeaway */}
            <div className="p-3.5 bg-red-950/30 border border-red-800/80 rounded-xl space-y-1 text-xs text-red-200 shadow-md">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>Oil India Executive Takeaway:</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                &ldquo;Baghjan-5 was not an unpredictable geological mystery; it was an institutional memory gap. The precursor gas kicks happened 3 times in nearby offset wells. SRISHTI AI ensures that 60 years of Oil India operational memory lives on the rig floor — safeguarding lives, ecosystems, and national energy assets.&rdquo;
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowBaghjanModal(false)}
                className="px-5 py-2 bg-[#0D5C75] hover:bg-[#147695] text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
              >
                Close Case Study
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* commit-step-42: feat(knowledge) */
