'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Network, RefreshCw, ZoomIn, ZoomOut,
  RotateCcw, ShieldCheck, AlertTriangle, X,
  Wrench, Flame,
  ShieldAlert, Maximize2, Sparkles,
  ExternalLink, Eye, MapPin, ChevronRight, CheckCircle2, Move,
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

/* ─── PROFESSIONAL ENTERPRISE COLOR PALETTE ─── */
const TYPE_CONFIG: Record<string, { fill: string; stroke: string; line: string; label: string; icon: string }> = {
  well:       { fill: '#0D5C75', stroke: '#38BDF8', line: '#38BDF8', label: 'Well Rig',          icon: 'W' },
  event:      { fill: '#7F1D1D', stroke: '#F87171', line: '#EF4444', label: 'Incident',          icon: '!' },
  formation:  { fill: '#1E293B', stroke: '#94A3B8', line: '#64748B', label: 'Rock Layer',        icon: 'R' },
  hazard:     { fill: '#7C2D12', stroke: '#FB923C', line: '#EA580C', label: 'Subsurface Hazard', icon: 'H' },
  barrier:    { fill: '#1E3A8A', stroke: '#60A5FA', line: '#3B82F6', label: 'Safety Barrier',    icon: 'B' },
  mitigation: { fill: '#064E3B', stroke: '#34D399', line: '#10B981', label: 'Remedy / SOP',      icon: 'S' },
  standard:   { fill: '#1E293B', stroke: '#38BDF8', line: '#0284C7', label: 'Safety Standard',   icon: '§' },
  document:   { fill: '#1E293B', stroke: '#64748B', line: '#475569', label: 'Well Report',       icon: 'D' },
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

function labelLines(text: string, maxLength = 24): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= maxLength) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : ['Unnamed record'];
}

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;

function fitGraph(nodes: Node[], width: number, height: number) {
  if (!nodes.length || !width || !height) return { x: 0, y: 0, scale: 1 };
  const minX = Math.min(...nodes.map(n => n.x - Math.max(n.radius, 22) - 120));
  const maxX = Math.max(...nodes.map(n => n.x + Math.max(n.radius, 22) + 120));
  const minY = Math.min(...nodes.map(n => n.y - Math.max(n.radius, 22) - 18));
  const maxY = Math.max(...nodes.map(n => n.y + Math.max(n.radius, 22) + 44));
  const scale = Math.min(1.25, Math.max(MIN_ZOOM, Math.min((width - 64) / (maxX - minX), (height - 128) / (maxY - minY))));
  return { scale, x: (width - (minX + maxX) * scale) / 2, y: (height - (minY + maxY) * scale) / 2 };
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
  const [registrySearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [showAllCards, setShowAllCards] = useState(false);

  // Interactive node selection & hover
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Dragging and custom node positions
  const [customNodePositions, setCustomNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);

  // Pan & Zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const graphContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

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
    const frame = requestAnimationFrame(() => { void loadGraph(); });
    return () => cancelAnimationFrame(frame);
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
    const fieldNames = Array.from(new Set(rawNodes.filter(n => n.type === 'well').map(n => n.field || 'Unassigned'))).sort();
    const fieldCenters = new Map(fieldNames.map((field, index) => [field, {
      x: 300 + (index % 4) * 400,
      y: 240 + Math.floor(index / 4) * 420,
    }]));

    const positionedNodes: Node[] = [];
    const placedIds = new Set<string>();

    // 1. Place wells in their oilfield hubs
    const wellsByField: Record<string, Node[]> = {};
    rawNodes.filter(n => n.type === 'well').forEach(w => {
      const f = w.field || 'Unassigned';
      wellsByField[f] = wellsByField[f] || [];
      wellsByField[f].push(w);
    });

    Object.entries(wellsByField).forEach(([f, wList]) => {
      const center = fieldCenters.get(f)!;
      const count = wList.length;
      const hubRadius = count > 1 ? 112 : 0;
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
          x: parentWell.x + Math.cos(ang) * 118,
          y: parentWell.y + Math.sin(ang) * 118,
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

    // Overview intentionally shows only source-backed well → incident relationships.
    // Selecting a well reveals its formations, hazards, barriers, SOPs and reports.
    const visibleIds = new Set(positionedNodes.map(n => n.id));
    const overviewEdges = rawEdges.filter(e => e.type === 'RECORDED_INCIDENT' && visibleIds.has(e.source) && visibleIds.has(e.target));
    return { baseNodes: positionedNodes, baseEdges: overviewEdges };
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

  // Keep labels at a readable screen size, then place them around nodes without overlaps.
  const nodeLabels = useMemo(() => {
    const placed: Array<{ left: number; right: number; top: number; bottom: number }> = [];
    const labels = new Map<string, { x: number; y: number }>();
    const scale = transform.scale || 1;
    const visible = displayNodes.filter(n => selectedWellId !== 'ALL' || n.type === 'well' || n.id === selectedNode?.id || n.id === hoveredNode?.id);
    const nodeBoxes = displayNodes.map(n => ({
      id: n.id,
      x: n.x * scale + transform.x,
      y: n.y * scale + transform.y,
      r: n.radius * scale + 5,
    }));
    const overlaps = (a: { left: number; right: number; top: number; bottom: number }, b: typeof a) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    for (const node of visible) {
      const sx = node.x * scale + transform.x;
      const sy = node.y * scale + transform.y;
      const r = node.radius * scale;
      const labelHeight = labelLines(node.label).length * 16 + 12;
      const candidates = [
        [0, r + labelHeight / 2 + 10], [0, -r - labelHeight / 2 - 10],
        [r + 98, 0], [-r - 98, 0],
        [r + 98, labelHeight + 8], [-r - 98, labelHeight + 8],
        [r + 98, -labelHeight - 8], [-r - 98, -labelHeight - 8],
        [0, r + labelHeight + 24], [0, -r - labelHeight - 24],
      ];
      let choice = candidates[0];
      let bestPenalty = Infinity;
      for (const candidate of candidates) {
        const cx = sx + candidate[0];
        const cy = sy + candidate[1];
        const box = { left: cx - 90, right: cx + 90, top: cy - labelHeight / 2, bottom: cy + labelHeight / 2 };
        const collisionCount = placed.filter(p => overlaps(box, p)).length;
        const nodeCollisionCount = nodeBoxes.filter(p => p.id !== node.id && overlaps(box, {
          left: p.x - p.r, right: p.x + p.r, top: p.y - p.r, bottom: p.y + p.r,
        })).length;
        const outOfView = canvasSize.width && canvasSize.height &&
          (box.left < 8 || box.right > canvasSize.width - 8 || box.top < 62 || box.bottom > canvasSize.height - 54);
        const penalty = collisionCount * 100 + nodeCollisionCount * 30 + (outOfView ? 200 : 0) + Math.abs(candidate[0]) / 200 + Math.abs(candidate[1]) / 200;
        if (penalty < bestPenalty) { bestPenalty = penalty; choice = candidate; }
        if (penalty < 1) break;
      }
      const cx = sx + choice[0];
      const cy = sy + choice[1];
      placed.push({ left: cx - 90, right: cx + 90, top: cy - labelHeight / 2, bottom: cy + labelHeight / 2 });
      labels.set(node.id, { x: choice[0] / scale, y: choice[1] / scale });
    }
    return labels;
  }, [displayNodes, transform, canvasSize, selectedWellId, selectedNode?.id, hoveredNode?.id]);

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
    const frame = requestAnimationFrame(() => {
      setCustomNodePositions(new Map());
      setTransform(fitGraph(baseNodes, canvasSize.width, canvasSize.height));
      setSelectedNode(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedWellId, baseNodes, canvasSize.width, canvasSize.height]);

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
      const dragged = nodeDragRef.current;
      if (!dragged.hasMoved) {
        const node = nodePositionMap.get(dragged.id);
        if (node) {
          if (node.type === 'well' && selectedWellId === 'ALL') setSelectedWellId(node.id);
          else setSelectedNode(node);
        }
      }
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
        const newScale = Math.min(Math.max(MIN_ZOOM, prev.scale * factor), MAX_ZOOM);
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

  const zoomAroundCenter = (factor: number) => setTransform(p => {
    const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.scale * factor));
    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2;
    return { scale, x: cx - (cx - p.x) * scale / p.scale, y: cy - (cy - p.y) * scale / p.scale };
  });
  const zoomIn = () => zoomAroundCenter(1.2);
  const zoomOut = () => zoomAroundCenter(1 / 1.2);
  const resetView = () => {
    setCustomNodePositions(new Map());
    setTransform(fitGraph(baseNodes, canvasSize.width, canvasSize.height));
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
    <div className="space-y-4 font-sans text-secondary min-h-full pb-16">

      {/* ─── 1. TOP HEADER TOOLBAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border border-line rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-accent " />
            <h1 className=" font-bold tracking-tight text-ink flex items-center gap-2 page-title">
              <Network className="text-accent" size={22} />
              <span>Drilling Safety Knowledge Map</span>
            </h1>
          </div>
          <p className="text-xs text-muted">
            Explore recorded links between wells, rock layers, incidents, hazards, and mitigation notes. Layout shows relationships, not physical distance or depth.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-muted border border-line text-secondary font-mono text-xs">
            {displayNodes.length} nodes · {displayEdges.length} links
          </span>

          <button
            onClick={() => setShowBaghjanModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-danger-soft hover:bg-danger-soft border border-danger/25 text-danger text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Flame size={14} className="text-danger" />
            <span>Baghjan-5 Case Study</span>
          </button>

          <button
            onClick={loadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-ink rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK WELL SELECTOR TOOLBAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-line rounded-lg text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Eye size={14} className="text-accent" />
            <span>Focus Well:</span>
          </span>

          {/* Clean Dropdown for all 18 wells */}
          <select
            value={selectedWellId}
            onChange={(e) => {
              if (e.target.value) setSelectedWellId(e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg bg-surface-muted border border-line hover:border-accent/25 text-accent font-bold text-xs focus:outline-none focus:border-accent/25 cursor-pointer shadow-inner min-w-[200px]"
          >
            <option value="ALL"> View All 18 Basin Wells</option>
            <optgroup label="Active Drilling Asset">
              <option value="well:MOR-29">MORAN-29 (Active Rig · Moran Field)</option>
            </optgroup>
            <optgroup label="Blowout Lesson">
              <option value="well:BGH-05"> BAGHJAN-5 (Blowout Lesson · Baghjan)</option>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedWellId === 'well:MOR-29'
                ? 'bg-accent text-black shadow-lg  font-extrabold ring-2 ring-accent/25'
                : 'bg-surface-muted text-accent border border-accent/25 hover:bg-accent-soft'
            }`}
          >
            <Sparkles size={12} />
            <span>MORAN-29 </span>
          </button>

          <button
            onClick={() => setSelectedWellId('well:BGH-05')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedWellId === 'well:BGH-05'
                ? 'bg-danger text-ink shadow-lg  font-bold'
                : 'bg-surface-muted text-danger border border-danger/25 hover:bg-danger-soft'
            }`}
          >
            <Flame size={12} />
            <span>BAGHJAN-5</span>
          </button>

          {/* Full Basin Map Button (Always fully visible, never clipped) */}
          <button
            onClick={() => setSelectedWellId('ALL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedWellId === 'ALL'
                ? 'bg-warning text-black font-extrabold shadow-lg '
                : 'bg-surface-muted text-warning border border-warning/25 hover:bg-warning-soft'
            }`}
          >
            <Maximize2 size={12} />
            <span>All 18 Wells Relationship Map</span>
          </button>
        </div>

        {/* Compact Action Hint */}
        <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
          <Move size={13} className="text-accent" />
          <span>Click & hold to drag graph</span>
        </div>
      </div>

      {/* ─── 3. THE KNOWLEDGE GRAPH CANVAS (SMOOTH DRAG & PAN ENABLED) ─── */}
      <div ref={graphContainerRef} className="relative bg-surface-muted border border-line rounded-lg overflow-hidden shadow-sm h-[min(740px,82vh)] min-h-[520px] w-full">

        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface-muted/80 backdrop-blur-sm pointer-events-none">
            <RefreshCw size={28} className="animate-spin text-accent mb-2" />
            <p className="text-xs text-secondary font-medium">Constructing Subsurface Knowledge Graph…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface-muted/90 p-4">
            <AlertTriangle size={32} className="text-danger mb-2" />
            <p className="text-xs text-danger mb-3">{error}</p>
            <button onClick={loadGraph} className="px-4 py-1.5 bg-brand hover:bg-accent text-ink rounded-lg text-xs font-semibold">
              Retry Loading
            </button>
          </div>
        )}

        {/* Top-Left View Badge */}
        <div className="absolute top-3.5 left-3.5 z-10 bg-surface/95 backdrop-blur-md border border-line rounded-lg px-3.5 py-1.5 shadow-lg flex items-center gap-2 pointer-events-none">
          <MapPin size={14} className="text-accent" />
          <span className="text-xs font-bold text-ink">
            {selectedWellId === 'ALL'
              ? 'Well-to-incident overview · select a well for its full safety chain'
              : `${nodeMap.get(selectedWellId)?.label || 'Well'} · connected safety records`}
          </span>
        </div>

        {/* Top-Right Floating Zoom Controls */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 bg-surface/95 backdrop-blur-md border border-line rounded-lg p-1.5 shadow-lg">
          <button
            onClick={zoomIn}
            aria-label="Zoom graph in"
            className="p-1.5 rounded-lg hover:bg-surface-muted text-secondary hover:text-ink transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={zoomOut}
            aria-label="Zoom graph out"
            className="p-1.5 rounded-lg hover:bg-surface-muted text-secondary hover:text-ink transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={resetView}
            aria-label="Fit graph to view"
            className="p-1.5 rounded-lg hover:bg-surface-muted text-secondary hover:text-ink transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Bottom Helper Instruction */}
        <div className="absolute bottom-3 right-3.5 z-10 hidden md:block text-xs text-muted bg-surface/90 px-3 py-1 rounded-lg border border-line pointer-events-none">
          Drag canvas to pan · Drag nodes to rearrange · Ctrl + wheel to zoom · Scroll normally elsewhere
        </div>

        {/* SVG CANVAS WITH BULLETPROOF POINTER DRAGGING */}
        <svg
          ref={svgRef}
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerCancel={handleSvgPointerUp}
          onWheel={handleWheel}
          onPointerLeave={() => setHoveredNode(null)}
          style={{ cursor: isPanningCanvas ? 'grabbing' : 'grab', touchAction: 'none' }}
          className="w-full h-full select-none"
          role="img"
          aria-label={`Knowledge map showing ${displayNodes.length} entities and ${displayEdges.length} source relationships. Select a node to inspect its details.`}
        >
          <defs>
            {/* Arrow Markers for each category */}
            <marker id="arrow-well" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b" />
            </marker>
            <marker id="arrow-event" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f87171" />
            </marker>
            <marker id="arrow-hazard" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#fb923c" />
            </marker>
            <marker id="arrow-barrier" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-mitigation" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#34d399" />
            </marker>
            <marker id="arrow-formation" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b" />
            </marker>

          </defs>

          {/* Transform Group */}
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Grid Pattern */}
            <pattern id="bg-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="var(--ui-muted)" opacity="0.22" />
            </pattern>
            <rect x="-4000" y="-4000" width="10000" height="10000" fill="url(#bg-grid)" />

            {/* ─── 1. CLEAN ENGINEERING CONNECTING LINES ─── */}
            <g className="edges-layer" pointerEvents="none">
              {displayEdges.map((edge, idx) => {
                const src = nodePositionMap.get(edge.source);
                const tgt = nodePositionMap.get(edge.target);
                if (!src || !tgt) return null;

                const isConnected = connectedIds
                  ? (edge.source === activeFocusId || edge.target === activeFocusId)
                  : false;

                const opacity = connectedIds ? (isConnected ? 1.0 : 0.14) : 0.55;

                let strokeColor = '#475569';
                let markerId = 'url(#arrow-well)';
                if (edge.type === 'RECORDED_INCIDENT') {
                  strokeColor = '#EF4444';
                  markerId = 'url(#arrow-event)';
                } else if (edge.type === 'CONTAINS_THREAT' || edge.type === 'FAILED_ENERGY_BARRIER') {
                  strokeColor = '#F97316';
                  markerId = 'url(#arrow-hazard)';
                } else if (edge.type === 'BARRIER_DEGRADATION' || edge.type === 'VIOLATES_STANDARD') {
                  strokeColor = '#3B82F6';
                  markerId = 'url(#arrow-barrier)';
                } else if (edge.type === 'MITIGATED_BY') {
                  strokeColor = '#10B981';
                  markerId = 'url(#arrow-mitigation)';
                } else if (edge.type === 'IN_FORMATION' || edge.type === 'DEPLOYED_IN') {
                  strokeColor = '#64748B';
                  markerId = 'url(#arrow-formation)';
                }

                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;
                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const distance = Math.hypot(dx, dy) || 1;
                const startOffset = Math.min(src.radius + 3, distance / 3);
                const endOffset = Math.min(tgt.radius + 8, distance / 3);
                const edgeLabel = friendlyEdgeLabel(edge.type);
                const edgeLabelWidth = Math.max(88, edgeLabel.length * 7.2 + 16);

                return (
                  <g key={`edge-${idx}`} style={{ opacity, transition: 'opacity 0.2s ease' }}>
                    <line
                      x1={src.x + dx * startOffset / distance}
                      y1={src.y + dy * startOffset / distance}
                      x2={tgt.x - dx * endOffset / distance}
                      y2={tgt.y - dy * endOffset / distance}
                      stroke={strokeColor}
                      strokeWidth={isConnected ? 2.5 : 1.5}
                      markerEnd={markerId}
                    />

                    {isConnected && (
                      <g transform={`translate(${midX}, ${midY}) scale(${1 / transform.scale})`}>
                        <rect
                          x={-edgeLabelWidth / 2}
                          y="-12"
                          width={edgeLabelWidth}
                          height="24"
                          rx="4"
                          fill="var(--ui-surface)"
                          stroke={strokeColor}
                          strokeWidth="1"
                          opacity="0.95"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={strokeColor}
                          fontSize="12"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                        >
                          {edgeLabel}
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
                const labelPosition = nodeLabels.get(node.id);
                const lines = labelLines(node.label);
                const labelHeight = lines.length * 16 + 12;

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
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle r={Math.max(r + 10, 28)} fill="transparent" pointerEvents="all" />
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
                        strokeWidth="2"
                        opacity="0.6"
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

                    {labelPosition && <g transform={`translate(${labelPosition.x}, ${labelPosition.y}) scale(${1 / transform.scale})`} pointerEvents="none">
                      <rect
                        x="-90"
                        y={-labelHeight / 2}
                        width="180"
                        height={labelHeight}
                        rx="4"
                        fill="var(--ui-surface)"
                        stroke={config.stroke}
                        strokeWidth={isSelected ? 1.5 : 0.8}
                        opacity="0.95"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isSelected ? 'var(--ui-accent)' : 'var(--ui-ink)'}
                        fontSize="13"
                        fontWeight={isSelected ? 'bold' : '600'}
                        fontFamily="sans-serif"
                        y={(1 - lines.length) * 8}
                      >
                        {lines.map((line, index) => <tspan key={index} x="0" dy={index ? 16 : 0}>{line}</tspan>)}
                      </text>
                    </g>}
                  </g>
                );
              })}
            </g>

          </g>
        </svg>

        {/* ─── FLOATING HOVER TOOLTIP CARD ─── */}
        {hoveredNode && !selectedNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-surface/95 backdrop-blur-md border border-accent/25 rounded-lg px-4 py-2 shadow-sm pointer-events-none flex items-center gap-3 animate-in fade-in zoom-in-95 duration-100">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getNodeConfig(hoveredNode.type).stroke }} />
            <div>
              <div className="text-xs uppercase font-bold text-accent">
                {getNodeConfig(hoveredNode.type).label} {hoveredNode.field ? `· ${hoveredNode.field} Field` : ''}
              </div>
              <div className="text-xs font-bold text-ink">{hoveredNode.label}</div>
            </div>
            <span className="text-xs text-muted border-l border-line pl-3 shrink-0">
              Click to inspect details
            </span>
          </div>
        )}

        {/* ─── RIGHT SLIDE-OVER DETAIL INSPECTOR PANEL ─── */}
        {selectedNode && (
          <div className="absolute top-3 right-3 z-20 max-w-sm w-full bg-surface/98 backdrop-blur-md border border-accent/25 rounded-lg p-4 shadow-sm space-y-3 max-h-[92%] overflow-y-auto font-sans ring-1 ring-accent/25 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-start justify-between border-b border-line pb-2">
              <div>
                <span className="text-xs uppercase font-bold text-accent flex items-center gap-1">
                  <Sparkles size={11} />
                  {getNodeConfig(selectedNode.type).label}
                </span>
                <h3 className="text-sm font-bold text-ink mt-0.5">{selectedNode.label}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted hover:text-ink p-1 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-2.5 bg-surface-muted rounded-lg border border-line space-y-1.5 text-xs shadow-inner">
              <div className="flex justify-between text-muted">
                <span>ID:</span>
                <span className="text-secondary font-mono text-xs">{selectedNode.id}</span>
              </div>
              {selectedNode.severity && (
                <div className="flex justify-between items-center">
                  <span>Severity:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedNode.severity === 'CRITICAL' ? 'bg-danger-soft text-danger border border-danger/25' :
                    selectedNode.severity === 'HIGH' ? 'bg-warning-soft text-warning border border-warning/25' :
                    'bg-warning-soft text-warning border border-warning/25'
                  }`}>
                    {selectedNode.severity}
                  </span>
                </div>
              )}
              {selectedNode.depth_md && (
                <div className="flex justify-between text-muted">
                  <span>Recorded Depth:</span>
                  <span className="text-accent font-mono font-bold">{selectedNode.depth_md} meters</span>
                </div>
              )}
              {selectedNode.field && (
                <div className="flex justify-between text-muted">
                  <span>Oilfield:</span>
                  <span className="text-ink font-semibold">{selectedNode.field} Field</span>
                </div>
              )}
              {selectedNode.system && (
                <div className="flex justify-between text-muted">
                  <span>Barrier System:</span>
                  <span className="text-warning font-bold">{selectedNode.system}</span>
                </div>
              )}
              {selectedNode.organization && (
                <div className="flex justify-between text-muted">
                  <span>Issuing Body:</span>
                  <span className="text-accent font-bold">{selectedNode.organization}</span>
                </div>
              )}
            </div>

            {selectedNode.description && (
              <div className="p-2.5 bg-surface-muted rounded-lg border border-line text-xs text-secondary space-y-1 shadow-inner">
                <div className="text-xs text-muted uppercase font-bold">Operational Context:</div>
                <p className="leading-relaxed">{selectedNode.description}</p>
              </div>
            )}

            {selectedNode.mitigation && (
              <div className="p-2.5 bg-surface-muted rounded-lg border border-success/25 text-xs text-success space-y-1 shadow-inner">
                <div className="text-xs text-success uppercase font-bold flex items-center gap-1">
                  <Wrench size={11} />
                  Verified Mitigation Procedure:
                </div>
                <p className="leading-relaxed">{selectedNode.mitigation}</p>
              </div>
            )}

            <div className="p-2.5 bg-surface-muted rounded-lg border border-line space-y-1.5 shadow-inner">
              <span className="text-xs font-bold uppercase text-muted">
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
                        className="flex items-center justify-between p-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-line hover:border-accent/25 cursor-pointer text-xs transition-colors"
                      >
                        <span className="text-accent font-bold truncate max-w-[150px]">
                          {other?.label ?? otherId}
                        </span>
                        <span className="text-xs text-muted font-mono px-1.5 py-0.5 rounded bg-surface-muted border border-line">
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
                className="flex-1 text-center py-2 rounded-lg bg-brand hover:bg-brand-hover text-ink text-xs font-bold transition-colors shadow-md"
              >
                Query in AI Copilot
              </Link>
              {selectedNode.type === 'well' && (
                <Link
                  href={`/well/${selectedNode.id.replace('well:', '')}`}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-surface-muted hover:bg-surface-muted text-ink text-xs font-semibold transition-colors"
                >
                  <span>Well Profile</span>
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 bg-surface border border-line rounded-lg text-xs shadow-sm" aria-label="Knowledge graph entity legend">
        <span className="font-bold text-muted uppercase tracking-wider">Legend</span>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <span key={type} className="flex items-center gap-1.5 text-secondary font-medium whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.stroke }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* ─── 4. SIMPLIFIED OFFSET INCIDENTS REGISTRY (CLEAN, JARGON-FREE) ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border border-line rounded-lg shadow-sm">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <ShieldAlert className="text-warning" size={18} />
              <span>
                {showAllCards
                  ? 'All Offset Well Incidents & Lessons Learned (15 Records)'
                  : `${selectedWellLabel} · Relevant Offset Incidents (${displayedRegistry.length})`}
              </span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Simplified root causes and engineering solutions from offset wells in plain English
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View scope toggle */}
            <div className="flex items-center bg-surface-muted p-1 rounded-lg border border-line text-xs">
              <button
                onClick={() => setShowAllCards(false)}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  !showAllCards
                    ? 'bg-accent text-black shadow-md'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {selectedWellLabel} Incidents
              </button>
              <button
                onClick={() => setShowAllCards(true)}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  showAllCards
                    ? 'bg-warning text-black shadow-md'
                    : 'text-muted hover:text-ink'
                }`}
              >
                All 15 Basin Incidents
              </button>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-line text-xs">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                    severityFilter === sev
                      ? sev === 'CRITICAL' ? 'bg-danger text-ink' :
                        sev === 'HIGH' ? 'bg-warning text-black' :
                        sev === 'MEDIUM' ? 'bg-warning text-black' :
                        'bg-accent text-black'
                      : 'text-muted hover:text-ink'
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
                className={`p-4 rounded-lg border transition-all shadow-md flex flex-col justify-between space-y-2.5 ${
                  isCritical
                    ? 'bg-danger-soft border-danger/25 hover:border-danger/25'
                    : isHigh
                    ? 'bg-warning-soft border-warning/25 hover:border-warning/25'
                    : 'bg-surface border-line hover:border-accent/25'
                }`}
              >
                <div>
                  {/* Card Header: Well & Severity Badge */}
                  <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink text-sm">{item.well.name}</span>
                      <span className="text-xs text-muted font-medium">({item.well.field} Field)</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isCritical ? 'bg-danger-soft text-danger border border-danger/25' :
                      isHigh ? 'bg-warning-soft text-warning border border-warning/25' :
                      'bg-warning-soft text-warning border border-warning/25'
                    }`}>
                      {item.top_event.severity}
                    </span>
                  </div>

                  {/* Incident Title & Depth */}
                  <div className="text-sm font-bold text-accent mb-1 flex items-center justify-between">
                    <span>{item.top_event.event_type}</span>
                    <span className="text-xs font-mono text-muted">{item.top_event.depth_md}m MD</span>
                  </div>

                  {/* Rock layer chip */}
                  <div className="flex items-center gap-2 text-xs text-muted mb-2">
                    <span>Layer: <strong className="text-accent font-semibold">{item.threat.formation}</strong></span>
                    <span>·</span>
                    <span>Barrier: <strong className="text-warning font-semibold">{item.preventive_barrier.name}</strong></span>
                  </div>

                  {/* 1-sentence Plain English Explanation */}
                  <p className="text-xs text-secondary leading-relaxed mb-2.5">
                    {summary}
                  </p>

                  {/* 1-sentence Verified Fix Box */}
                  <div className="p-2.5 rounded-lg bg-success-soft border border-success/25 text-xs text-success space-y-1">
                    <div className="text-xs font-bold text-success uppercase flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Verified Fix:</span>
                    </div>
                    <p className="text-xs text-success font-medium leading-snug">
                      {fix}
                    </p>
                  </div>
                </div>

                {/* Footer Standard Code & Focus on Graph Button */}
                <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                  <span className="font-mono text-xs text-accent bg-accent-soft px-2 py-0.5 rounded border border-accent/25 font-semibold">
                    {item.regulatory_standard.code}
                  </span>

                  <button
                    onClick={() => {
                      const wellId = `well:${item.well.id.replace('well:', '')}`;
                      setSelectedWellId(wellId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 text-accent hover:text-accent font-bold text-xs cursor-pointer"
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
          <div className="p-8 text-center bg-surface rounded-lg border border-line text-muted text-xs space-y-2">
            <p>No incidents match the active filter.</p>
            <button
              onClick={() => { setShowAllCards(true); setSeverityFilter('ALL'); }}
              className="px-3 py-1 bg-brand text-ink rounded-lg text-xs font-semibold"
            >
              Show all 15 incidents
            </button>
          </div>
        )}
      </div>

      {/* ─── 5. BAGHJAN-5 CASE STUDY MODAL ─── */}
      {showBaghjanModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-danger/25 rounded-lg max-w-3xl w-full p-6 space-y-4 shadow-sm my-6 ring-1 ring-red-500/20">

            <div className="flex items-start justify-between pb-3 border-b border-danger/25">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-danger-soft border border-danger/25 text-danger">
                  <Flame size={24} className="" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-danger tracking-wider">
                    Institutional Drilling Lesson · Oil India Limited
                  </span>
                  <h2 className="text-base font-bold text-ink">
                    Well BAGHJAN-5 Blowout (2020) & Prevention Framework
                  </h2>
                  <p className="text-muted text-xs">
                    NGT Katakey Committee & CAG Audit No. 42 Analysis
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBaghjanModal(false)}
                className="p-1.5 rounded-lg bg-surface-muted border border-line hover:bg-surface-muted text-secondary hover:text-ink transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-surface-muted rounded-lg border border-line shadow-inner">
                <span className="text-xs text-muted uppercase font-bold">DATE OF BLOWOUT</span>
                <div className="text-sm font-bold text-ink mt-0.5">27 May 2020</div>
                <div className="text-xs text-muted">Burned 190 days</div>
              </div>
              <div className="p-2.5 bg-surface-muted rounded-lg border border-line shadow-inner">
                <span className="text-xs text-muted uppercase font-bold">RESERVOIR DEPTH</span>
                <div className="text-sm font-bold text-accent mt-0.5 font-mono">3,870m MD</div>
                <div className="text-xs text-muted">Lakadong / Therria Sand</div>
              </div>
              <div className="p-2.5 bg-surface-muted rounded-lg border border-line shadow-inner">
                <span className="text-xs text-muted uppercase font-bold">HUMAN TOLL</span>
                <div className="text-sm font-bold text-danger mt-0.5">3 Fatalities</div>
                <div className="text-xs text-muted">OIL Firefighters & Crew</div>
              </div>
              <div className="p-2.5 bg-surface-muted rounded-lg border border-line shadow-inner">
                <span className="text-xs text-muted uppercase font-bold">ESTIMATED LOSS</span>
                <div className="text-sm font-bold text-warning mt-0.5 font-mono">₹2,500+ Cr</div>
                <div className="text-xs text-muted">Compensation & Capping</div>
              </div>
            </div>

            {/* 3 Pillars */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-warning" />
                Root Causes & SRISHTI AI Prevention
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-surface-muted rounded-lg border border-danger/25 space-y-1.5 shadow-inner">
                  <span className="text-xs font-bold text-danger uppercase">
                    1. PREMATURE BOP REMOVAL
                  </span>
                  <p className="text-secondary leading-relaxed">
                    Workover crew unbolted the BOP stack before verifying dual mechanical barriers. Gas escaped into the cellar within minutes.
                  </p>
                  <div className="p-2 bg-success-soft rounded-lg border border-success/25 text-success">
                    <strong>SRISHTI Fix:</strong> Enforces DGMS Rule 84: digitally locks sign-off until dual mechanical barriers are pressure tested.
                  </div>
                </div>

                <div className="p-3 bg-surface-muted rounded-lg border border-danger/25 space-y-1.5 shadow-inner">
                  <span className="text-xs font-bold text-danger uppercase">
                    2. SHALLOW PLUG IN DEVIATED HOLE
                  </span>
                  <p className="text-secondary leading-relaxed">
                    A single cement plug placed at ~1,000m in a 40° deviated hole channeled high-pressure gas along the high side of the casing.
                  </p>
                  <div className="p-2 bg-success-soft rounded-lg border border-success/25 text-success">
                    <strong>SRISHTI Fix:</strong> Flags high-angle intervals and mandates mechanical bridge plug placement within 50m of perforation.
                  </div>
                </div>

                <div className="p-3 bg-surface-muted rounded-lg border border-danger/25 space-y-1.5 shadow-inner">
                  <span className="text-xs font-bold text-danger uppercase">
                    3. KNOWLEDGE DISCONNECT
                  </span>
                  <p className="text-secondary leading-relaxed">
                    Shift crew had no access to offset records showing Wells NHK-162 and Moran-29 experienced major gas kicks under identical Barail overpressure.
                  </p>
                  <div className="p-2 bg-success-soft rounded-lg border border-success/25 text-success">
                    <strong>SRISHTI Fix:</strong> Projects offset kick signatures onto the active rig display, with 12.8 ppg kill mud mandatory in reserve pits.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Takeaway */}
            <div className="p-3.5 bg-danger-soft border border-danger/25 rounded-lg space-y-1 text-xs text-danger shadow-md">
              <div className="font-bold text-ink flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-success" />
                <span>Oil India Executive Takeaway:</span>
              </div>
              <p className="leading-relaxed text-xs text-secondary">
                &ldquo;Baghjan-5 was not an unpredictable geological mystery; it was an institutional memory gap. The precursor gas kicks happened 3 times in nearby offset wells. SRISHTI AI ensures that 60 years of Oil India operational memory lives on the rig floor — safeguarding lives, ecosystems, and national energy assets.&rdquo;
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowBaghjanModal(false)}
                className="px-5 py-2 bg-brand hover:bg-brand-hover text-ink font-bold rounded-lg text-xs transition-colors shadow-md cursor-pointer"
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
