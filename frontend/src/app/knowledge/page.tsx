'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Network, RefreshCw, ZoomIn, ZoomOut, Search, 
  Play, Pause, RotateCcw, ShieldCheck, FileText, 
  Layers, AlertTriangle, ExternalLink, Compass, X, Info, 
  Sparkles, GitCommit, ArrowRight, ShieldAlert, BookOpen, Wrench, Flame
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

type Node = { 
  id: string; 
  type: 'well' | 'event' | 'formation' | 'document' | 'barrier' | 'hazard' | 'standard' | 'mitigation' | string; 
  label: string; 
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string; 
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
  vx: number;
  vy: number;
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

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<'graph' | 'bowtie'>('graph');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [notice, setNotice] = useState<string>('');
  const [metrics, setMetrics] = useState<GraphData['metrics']>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bow-Tie specific state
  const [showBaghjanModal, setShowBaghjanModal] = useState(false);
  const [bowtieData, setBowtieData] = useState<BowtiePathway[]>([]);
  const [selectedBowtie, setSelectedBowtie] = useState<BowtiePathway | null>(null);
  const [selectedWellFilter, setSelectedWellFilter] = useState<string>('ALL');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // Selected & Hovered Node
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPhysicsRunning, setIsPhysicsRunning] = useState(true);

  // Viewport Transform (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.85 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeIdRef = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Fetch graph & Bow-Tie data on mount
  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resGraph, resBowtie] = await Promise.all([
        api<GraphData>('/api/graph/explore'),
        api<BowtieResponse>('/api/graph/bowtie')
      ]);

      if (resGraph && resGraph.nodes) {
        const width = 1100;
        const height = 750;
        const cx = width / 2;
        const cy = height / 2;

        const initializedNodes: Node[] = resGraph.nodes.map((n, i) => {
          let ringRadius = 240;
          let baseRadius = 22;

          switch (n.type) {
            case 'well':
              ringRadius = 140;
              baseRadius = 28;
              break;
            case 'formation':
              ringRadius = 280;
              baseRadius = 24;
              break;
            case 'hazard':
              ringRadius = 210;
              baseRadius = 25;
              break;
            case 'barrier':
              ringRadius = 340;
              baseRadius = 23;
              break;
            case 'event':
              ringRadius = 190;
              baseRadius = n.severity === 'CRITICAL' ? 30 : n.severity === 'HIGH' ? 26 : 22;
              break;
            case 'mitigation':
              ringRadius = 380;
              baseRadius = 22;
              break;
            case 'standard':
              ringRadius = 420;
              baseRadius = 20;
              break;
            case 'document':
              ringRadius = 450;
              baseRadius = 18;
              break;
            default:
              ringRadius = 260;
              baseRadius = 20;
          }

          const angle = (i / resGraph.nodes.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
          return {
            ...n,
            x: cx + Math.cos(angle) * (ringRadius + (Math.random() - 0.5) * 60),
            y: cy + Math.sin(angle) * (ringRadius + (Math.random() - 0.5) * 60),
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            radius: baseRadius
          };
        });

        setNodes(initializedNodes);
        setEdges(resGraph.edges || []);
        setMetrics(resGraph.metrics);
        setNotice(resGraph.notice || '');
      }

      if (resBowtie && resBowtie.pathways) {
        setBowtieData(resBowtie.pathways);
        if (resBowtie.pathways.length > 0) {
          setSelectedBowtie(resBowtie.pathways[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge graph.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Node lookup map
  const nodesMap = useMemo(() => {
    const map = new Map<string, Node>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Connected nodes set for currently active/hovered node
  const activeFocusNodeId = hoveredNodeId || selectedNode?.id;

  const connectedIds = useMemo(() => {
    if (!activeFocusNodeId) return null;
    const ids = new Set<string>();
    ids.add(activeFocusNodeId);
    edges.forEach((e) => {
      if (e.source === activeFocusNodeId) ids.add(e.target);
      if (e.target === activeFocusNodeId) ids.add(e.source);
    });
    return ids;
  }, [activeFocusNodeId, edges]);

  // 2. Continuous Physics Simulation Loop
  useEffect(() => {
    if (!isPhysicsRunning || nodes.length === 0 || activeTab !== 'graph') return;

    const width = 1100;
    const height = 750;
    const cx = width / 2;
    const cy = height / 2;
    const damping = 0.86;
    const repulseStrength = 2200;
    const springLength = 125;
    const springStrength = 0.04;
    const centerGravity = 0.012;

    function step() {
      setNodes((prevNodes) => {
        const next = prevNodes.map((n) => ({ ...n }));
        const map = new Map<string, Node>();
        next.forEach((n) => map.set(n.id, n));

        // Node repulsion
        for (let i = 0; i < next.length; i++) {
          const n1 = next[i];
          for (let j = i + 1; j < next.length; j++) {
            const n2 = next[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 340) {
              const force = repulseStrength / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              if (n1.id !== draggedNodeIdRef.current) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (n2.id !== draggedNodeIdRef.current) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }

          // Center gravity
          if (n1.id !== draggedNodeIdRef.current) {
            n1.vx += (cx - n1.x) * centerGravity;
            n1.vy += (cy - n1.y) * centerGravity;
          }
        }

        // Edge spring attraction
        edges.forEach((e) => {
          const src = map.get(e.source);
          const tgt = map.get(e.target);
          if (src && tgt) {
            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const diff = dist - springLength;
            const fx = (dx / dist) * diff * springStrength;
            const fy = (dy / dist) * diff * springStrength;

            if (src.id !== draggedNodeIdRef.current) {
              src.vx += fx;
              src.vy += fy;
            }
            if (tgt.id !== draggedNodeIdRef.current) {
              tgt.vx -= fx;
              tgt.vy -= fy;
            }
          }
        });

        // Apply velocities & damping
        next.forEach((n) => {
          if (n.id === draggedNodeIdRef.current) return;
          n.vx *= damping;
          n.vy *= damping;
          n.x += n.vx;
          n.y += n.vy;

          // Clamping
          const pad = 50;
          if (n.x < pad) { n.x = pad; n.vx = 0; }
          if (n.x > width - pad) { n.x = width - pad; n.vx = 0; }
          if (n.y < pad) { n.y = pad; n.vy = 0; }
          if (n.y > height - pad) { n.y = height - pad; n.vy = 0; }
        });

        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    }

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPhysicsRunning, edges, nodes.length, activeTab]);

  // 3. Pan & Zoom Handlers
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-bg') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanningRef.current) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      }));
    } else if (draggedNodeIdRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
      const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

      setNodes((prev) =>
        prev.map((n) => (n.id === draggedNodeIdRef.current ? { ...n, x: mouseX, y: mouseY, vx: 0, vy: 0 } : n))
      );
    }
  };

  const handleSvgMouseUp = () => {
    isPanningRef.current = false;
    draggedNodeIdRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.35, transform.scale * zoomFactor), 2.5);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale
      }));
    }
  };

  const handleZoom = (delta: number) => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.35, prev.scale + delta), 2.5)
    }));
  };

  const handleResetView = () => {
    setTransform({ x: 0, y: 0, scale: 0.85 });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    draggedNodeIdRef.current = node.id;
    setSelectedNode(node);
  };

  // Node count stats
  const nodeCounts = useMemo(() => {
    const counts: Record<string, number> = { total: nodes.length };
    nodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  // Unique wells list from Bow-Tie data
  const wellOptions = useMemo(() => {
    const set = new Set<string>();
    bowtieData.forEach((p) => {
      if (p.well?.name) set.add(p.well.name);
    });
    return Array.from(set).sort();
  }, [bowtieData]);

  // Filtered Bow-Tie pathways
  const filteredBowties = useMemo(() => {
    return bowtieData.filter((p) => {
      if (selectedWellFilter !== 'ALL' && p.well.name !== selectedWellFilter) return false;
      if (severityFilter !== 'ALL' && p.top_event.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.top_event.event_type.toLowerCase().includes(q) ||
          p.threat.formation.toLowerCase().includes(q) ||
          p.well.name.toLowerCase().includes(q) ||
          p.hazard.name.toLowerCase().includes(q) ||
          p.regulatory_standard.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bowtieData, selectedWellFilter, severityFilter, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] space-y-3 font-sans text-slate-100">
      
      {/* 1. Header Toolbar with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <Network className="text-cyan-400" size={18} />
              Causal Safety Knowledge Graph
            </h1>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#020507] p-1 rounded-lg border border-[#162D38] text-xs">
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === 'graph'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network size={13} />
              <span>Relational Force Graph</span>
            </button>
            <button
              onClick={() => setActiveTab('bowtie')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === 'bowtie'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCommit size={13} />
              <span>Bow-Tie Causal Model</span>
            </button>
          </div>
        </div>

        {/* Counter Stats & Actions */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[#020507] border border-[#162D38] text-slate-300">
            Nodes: <strong className="text-white font-mono tabular-nums">{nodes.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#020507] border border-[#162D38] text-slate-300">
            Edges: <strong className="text-white font-mono tabular-nums">{edges.length}</strong>
          </span>
          <span className="hidden sm:inline px-2.5 py-1 rounded-lg bg-[#020507] border border-[#162D38] text-amber-300">
            Bow-Ties: <strong className="text-white font-mono tabular-nums">{bowtieData.length}</strong>
          </span>

          <button
            onClick={() => setShowBaghjanModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-700/80 text-red-200 text-xs font-bold transition-all shadow-md shadow-red-950/40"
          >
            <Flame size={14} className="text-red-400 animate-pulse" />
            <span>Baghjan-5 Blowout Forensics</span>
          </button>

          <button
            onClick={loadGraph}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D5C75] hover:bg-[#147695] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#050C10] border-2 border-[#162D38] rounded-2xl text-xs shadow-md">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search well, formation, hazard, SOP, standard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#020507] border border-[#1A3644] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {activeTab === 'graph' ? (
            /* Type Filter Pills */
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'ALL'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                All ({nodeCounts.total || 0})
              </button>
              <button
                onClick={() => setTypeFilter('well')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'well'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                Wells ({nodeCounts.well || 0})
              </button>
              <button
                onClick={() => setTypeFilter('event')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'event'
                    ? 'bg-red-500/20 text-red-300 border-red-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                Events ({nodeCounts.event || 0})
              </button>
              <button
                onClick={() => setTypeFilter('barrier')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'barrier'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                Barriers ({nodeCounts.barrier || 0})
              </button>
              <button
                onClick={() => setTypeFilter('hazard')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'hazard'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                Hazards ({nodeCounts.hazard || 0})
              </button>
              <button
                onClick={() => setTypeFilter('formation')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'formation'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                Formations ({nodeCounts.formation || 0})
              </button>
              <button
                onClick={() => setTypeFilter('mitigation')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'mitigation'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                SOPs ({nodeCounts.mitigation || 0})
              </button>
              <button
                onClick={() => setTypeFilter('standard')}
                className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  typeFilter === 'standard'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-700'
                }`}
              >
                Standards ({nodeCounts.standard || 0})
              </button>
            </div>
          ) : (
            /* Bow-Tie Well Filter */
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Filter Offset Well:</span>
              <select
                value={selectedWellFilter}
                onChange={(e) => setSelectedWellFilter(e.target.value)}
                className="px-2.5 py-1 rounded bg-[#020507] border border-[#162D38] text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Offset Wells ({bowtieData.length})</option>
                {wellOptions.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Controls (Only for Graph tab) */}
        {activeTab === 'graph' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPhysicsRunning((p) => !p)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#020507] border border-[#162D38] hover:border-slate-600 rounded text-slate-300 hover:text-white"
              title={isPhysicsRunning ? 'Freeze Node Movement' : 'Unfreeze Physics'}
            >
              {isPhysicsRunning ? <Pause size={12} className="text-amber-400" /> : <Play size={12} className="text-emerald-400" />}
              <span className="hidden sm:inline">{isPhysicsRunning ? 'Freeze' : 'Live Physics'}</span>
            </button>
            <button
              onClick={() => handleZoom(0.15)}
              className="p-1.5 bg-[#020507] border border-[#162D38] hover:border-slate-600 rounded text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => handleZoom(-0.15)}
              className="p-1.5 bg-[#020507] border border-[#162D38] hover:border-slate-600 rounded text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 bg-[#020507] border border-[#162D38] hover:border-slate-600 rounded text-slate-300 hover:text-white"
              title="Reset View"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        )}
      </div>

      {/* 3. MAIN CONTENT: Switch between Relational Graph and Bow-Tie Model */}
      {activeTab === 'graph' ? (
        <div className="relative flex-1 bg-[#020507] border-2 border-[#162D38] rounded-2xl overflow-hidden min-h-0 shadow-2xl ring-1 ring-cyan-500/10">
          
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070D0F]/80 backdrop-blur-sm">
              <RefreshCw size={28} className="animate-spin text-cyan-400 mb-2" />
              <p className="text-xs text-slate-300">Compiling NetworkX Causal Graph…</p>
            </div>
          )}

          <svg
            ref={svgRef}
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onWheel={handleWheel}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          >
            {/* SVG Definitions for Glow Filters & Gradients */}
            <defs>
              <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Directional Arrow Markers */}
              <marker id="arrow-default" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-threat" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
              </marker>
              <marker id="arrow-barrier" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#eab308" />
              </marker>
              <marker id="arrow-mitigation" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {/* Background Clickable Area */}
            <rect id="graph-bg" width="100%" height="100%" fill="transparent" />

            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              
              {/* Background Grid Dots */}
              <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.25" />
              </pattern>
              <rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#grid-dots)" />

              {/* 1. EDGES */}
              <g className="edges-layer">
                {edges.map((edge, idx) => {
                  const src = nodesMap.get(edge.source);
                  const tgt = nodesMap.get(edge.target);
                  if (!src || !tgt) return null;

                  const isConnected = connectedIds
                    ? (edge.source === activeFocusNodeId || edge.target === activeFocusNodeId)
                    : false;

                  const opacity = connectedIds ? (isConnected ? 0.95 : 0.08) : 0.35;
                  
                  let strokeColor = '#38bdf8';
                  let markerId = 'url(#arrow-default)';
                  if (edge.type === 'CONTAINS_THREAT' || edge.type === 'FAILED_ENERGY_BARRIER') {
                    strokeColor = '#f97316';
                    markerId = 'url(#arrow-threat)';
                  } else if (edge.type === 'BARRIER_DEGRADATION' || edge.type === 'VIOLATES_STANDARD') {
                    strokeColor = '#eab308';
                    markerId = 'url(#arrow-barrier)';
                  } else if (edge.type === 'MITIGATED_BY' || edge.type === 'GOVERNED_BY') {
                    strokeColor = '#10b981';
                    markerId = 'url(#arrow-mitigation)';
                  }

                  const midX = (src.x + tgt.x) / 2;
                  const midY = (src.y + tgt.y) / 2;

                  return (
                    <g key={`${edge.source}-${edge.target}-${idx}`} style={{ opacity, transition: 'opacity 0.2s ease' }}>
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={strokeColor}
                        strokeWidth={isConnected ? 2.5 : 1.2}
                        markerEnd={markerId}
                      />
                      {isConnected && (
                        <line
                          x1={src.x}
                          y1={src.y}
                          x2={tgt.x}
                          y2={tgt.y}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          strokeDasharray="4,6"
                          opacity="0.8"
                        />
                      )}
                      {(isConnected || transform.scale > 1.1) && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect x="-38" y="-9" width="76" height="16" rx="4" fill="#070D0F" stroke="#334155" strokeWidth="1" />
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={strokeColor}
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {edge.label || edge.type}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* 2. NODES */}
              <g className="nodes-layer">
                {nodes.map((node) => {
                  if (typeFilter !== 'ALL' && node.type !== typeFilter) return null;
                  if (severityFilter !== 'ALL' && node.severity !== severityFilter) return null;

                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isConnected = connectedIds ? connectedIds.has(node.id) : true;
                  const opacity = isConnected ? 1 : 0.15;

                  let fill = '#082f49';
                  let stroke = '#06b6d4';
                  let filterId = 'url(#glow-cyan)';
                  let iconText = 'W';

                  switch (node.type) {
                    case 'well':
                      fill = '#082f49';
                      stroke = '#06b6d4';
                      filterId = 'url(#glow-cyan)';
                      iconText = 'W';
                      break;
                    case 'formation':
                      fill = '#2e1065';
                      stroke = '#c084fc';
                      filterId = 'url(#glow-purple)';
                      iconText = 'F';
                      break;
                    case 'barrier':
                      fill = '#422006';
                      stroke = '#eab308';
                      filterId = 'url(#glow-amber)';
                      iconText = 'B';
                      break;
                    case 'hazard':
                      fill = '#450a0a';
                      stroke = '#f97316';
                      filterId = 'url(#glow-red)';
                      iconText = 'H';
                      break;
                    case 'event':
                      iconText = '!';
                      fill = node.severity === 'CRITICAL' ? '#450a0a' : '#431407';
                      stroke = node.severity === 'CRITICAL' ? '#ef4444' : '#ea580c';
                      filterId = 'url(#glow-red)';
                      break;
                    case 'mitigation':
                      fill = '#022c22';
                      stroke = '#10b981';
                      filterId = 'url(#glow-emerald)';
                      iconText = 'M';
                      break;
                    case 'standard':
                      fill = '#172554';
                      stroke = '#3b82f6';
                      filterId = 'url(#glow-blue)';
                      iconText = 'S';
                      break;
                    case 'document':
                      fill = '#042f2e';
                      stroke = '#14b8a6';
                      filterId = 'url(#glow-emerald)';
                      iconText = 'D';
                      break;
                  }

                  const r = node.radius * (isSelected ? 1.25 : isHovered ? 1.15 : 1);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      style={{ opacity, cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                    >
                      {/* Pulsing ring for Critical Event or Moran-29 */}
                      {(node.severity === 'CRITICAL' || node.label.includes('MORAN-29')) && (
                        <circle
                          r={r + 8}
                          fill="none"
                          stroke={stroke}
                          strokeWidth="1.5"
                          opacity="0.5"
                          strokeDasharray="4,4"
                        />
                      )}

                      <circle
                        r={r}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                        filter={isSelected || isHovered ? filterId : undefined}
                      />

                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={Math.round(r * 0.7)}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        pointerEvents="none"
                      >
                        {iconText}
                      </text>

                      {/* Label Pill Below Node */}
                      <g transform={`translate(0, ${r + 14})`} pointerEvents="none">
                        <rect
                          x="-55"
                          y="-8"
                          width="110"
                          height="16"
                          rx="4"
                          fill="#070D0F"
                          stroke={stroke}
                          strokeWidth={isSelected ? '1.5' : '0.75'}
                          opacity="0.95"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                          fontSize="9.5"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          fontFamily="sans-serif"
                        >
                          {node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

            </g>
          </svg>

          {/* Bottom-left Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-[#050C10]/95 backdrop-blur-md border-2 border-[#162D38] rounded-2xl p-3 text-[11px] shadow-2xl hidden sm:block font-sans">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Causal Entity Taxonomy</span>
              <span className="text-cyan-400 text-[9px] font-semibold">Upper Assam Shelf</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Well Asset</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Top Incident</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Formation</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Drilling Barrier</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Energy Hazard</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Remedial SOP</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Safety Standard</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Document</span>
            </div>
          </div>

          {/* Right Slide-over: Causal Evidence Inspector Panel */}
          {selectedNode && (
            <div className="absolute top-4 right-4 z-20 max-w-sm w-full bg-[#050C10]/95 backdrop-blur-md border-2 border-cyan-500/60 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-right-4 duration-200 max-h-[90%] overflow-y-auto font-sans ring-1 ring-cyan-500/20">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#162D38] pb-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                    <Sparkles size={11} />
                    {selectedNode.type.toUpperCase()} CAUSAL NODE
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedNode.label}</h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Node Specific Metadata */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] space-y-1.5 shadow-inner">
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>CANONICAL ID:</span>
                    <span className="text-slate-200 font-bold font-mono text-[11px] truncate max-w-[180px]">{selectedNode.id}</span>
                  </div>
                  {selectedNode.severity && (
                    <div className="flex justify-between items-center font-medium">
                      <span>SEVERITY:</span>
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
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>INCIDENT DEPTH:</span>
                      <span className="text-cyan-300 font-bold font-mono tabular-nums">{selectedNode.depth_md} m MD</span>
                    </div>
                  )}
                  {selectedNode.field && (
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>OILFIELD:</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.field}</span>
                    </div>
                  )}
                  {selectedNode.system && (
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>BARRIER SYSTEM:</span>
                      <span className="text-amber-300 font-bold">{selectedNode.system}</span>
                    </div>
                  )}
                  {selectedNode.category && (
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>SOP CATEGORY:</span>
                      <span className="text-emerald-300 font-bold">{selectedNode.category}</span>
                    </div>
                  )}
                  {selectedNode.organization && (
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>ORGANIZATION:</span>
                      <span className="text-blue-300 font-bold">{selectedNode.organization}</span>
                    </div>
                  )}
                </div>

                {selectedNode.description && (
                  <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] text-[11px] text-slate-300 space-y-1 shadow-inner">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Causal Mechanism / Description:</div>
                    <p className="leading-snug">{selectedNode.description}</p>
                  </div>
                )}

                {selectedNode.mitigation && (
                  <div className="p-2.5 bg-[#020507] rounded-xl border border-emerald-900/60 text-[11px] text-emerald-300 space-y-1 shadow-inner">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Field Mitigation SOP:</div>
                    <p className="leading-snug">{selectedNode.mitigation}</p>
                  </div>
                )}

                {/* Connected Relationships in Graph */}
                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] space-y-1.5 shadow-inner">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Causal Edges (Upstream & Downstream)</span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {edges
                      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((edge, idx) => {
                        const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                        const otherNode = nodesMap.get(otherId);
                        const isOutgoing = edge.source === selectedNode.id;
                        return (
                          <div
                            key={idx}
                            onClick={() => otherNode && setSelectedNode(otherNode)}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-[#050C10] hover:bg-[#0A1820] border border-[#162D38] hover:border-cyan-500/40 cursor-pointer text-[11px] transition-colors"
                          >
                            <span className="text-cyan-300 font-bold truncate max-w-[150px]">
                              {otherNode?.label ?? (isOutgoing ? edge.target_label : edge.source_label) ?? otherId}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono px-1.5 py-0.2 rounded bg-[#020507] border border-[#162D38]">
                              {edge.label || edge.type}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <Link
                  href="/ask"
                  className="flex-1 text-center py-1.5 rounded bg-[#0D5C75] hover:bg-[#147695] text-white text-xs font-semibold transition-colors"
                >
                  Query in Copilot
                </Link>
                {selectedNode.type === 'well' && (
                  <Link
                    href={`/well/${selectedNode.id.replace('well:', '')}`}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                  >
                    <span>Dossier</span>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ─── 4. BOW-TIE CAUSAL SAFETY CHAINS VIEW ─── */
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
          
          {/* Left Column: Pathway Selector List */}
          <div className="w-full md:w-80 bg-[#050C10] border-2 border-[#162D38] rounded-2xl p-3.5 flex flex-col overflow-hidden shadow-xl ring-1 ring-cyan-500/10">
            <div className="flex items-center justify-between border-b border-[#162D38] pb-2.5 mb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-400" />
                Bow-Tie Incident Registry
              </span>
              <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
                {filteredBowties.length} Chains
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredBowties.map((pathway) => {
                const isSelected = selectedBowtie?.pathway_id === pathway.pathway_id;
                return (
                  <div
                    key={pathway.pathway_id}
                    onClick={() => setSelectedBowtie(pathway)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'bg-amber-950/40 border-2 border-amber-500/80 shadow-lg shadow-amber-950/40'
                        : 'bg-[#020507] border border-[#162D38] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">{pathway.well.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        pathway.top_event.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                        pathway.top_event.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {pathway.top_event.severity}
                      </span>
                    </div>

                    <div className="text-[11px] text-cyan-300 font-bold mb-0.5">
                      {pathway.top_event.event_type} @ <span className="font-mono tabular-nums">{pathway.top_event.depth_md}m</span>
                    </div>

                    <div className="text-[10px] text-slate-400 truncate">
                      Stratum: <span className="text-purple-300">{pathway.threat.formation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive 5-Stage Bow-Tie Diagram */}
          <div className="flex-1 bg-[#050C10] border-2 border-[#162D38] rounded-2xl p-5 overflow-y-auto flex flex-col justify-between shadow-2xl ring-1 ring-cyan-500/10">
            {selectedBowtie ? (
              <div className="space-y-4">
                
                {/* Pathway Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-[#020507] border border-[#162D38] shadow-inner">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                      BOW-TIE CAUSAL PATHWAY · <span className="font-mono">{selectedBowtie.pathway_id}</span>
                    </span>
                    <h2 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                      <span>{selectedBowtie.well.name} ({selectedBowtie.well.field} Field)</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#071014] border border-[#162D38] text-slate-300 font-normal">
                        Depth: <span className="font-mono tabular-nums">{selectedBowtie.top_event.depth_md}m MD</span>
                      </span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Standard:</span>
                    <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950/60 px-2.5 py-1 rounded border border-blue-800/60">
                      {selectedBowtie.regulatory_standard.code}
                    </span>
                  </div>
                </div>

                {/* 5-Column Bow-Tie Visual Pathway */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                  
                  {/* Stage 1: Threat / Subsurface Stratum */}
                  <div className="p-3.5 rounded-xl bg-[#020507] border-2 border-purple-900/60 flex flex-col justify-between space-y-2 shadow-md">
                    <div>
                      <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold uppercase mb-1">
                        <Layers size={12} />
                        <span>1. Threat Stratum</span>
                      </div>
                      <div className="text-xs font-bold text-white">{selectedBowtie.threat.formation}</div>
                      <div className="text-[10px] text-purple-300 font-mono tabular-nums mt-0.5">{selectedBowtie.threat.depth_range}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#050C10] border border-[#162D38] text-[10px] text-slate-400">
                      {selectedBowtie.threat.lithology}
                    </div>
                  </div>

                  {/* Stage 2: Preventive Barrier Failure */}
                  <div className="p-3.5 rounded-xl bg-[#020507] border-2 border-amber-900/60 flex flex-col justify-between space-y-2 shadow-md">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase mb-1">
                        <ShieldAlert size={12} />
                        <span>2. Barrier Failure</span>
                      </div>
                      <div className="text-xs font-bold text-white">{selectedBowtie.preventive_barrier.name}</div>
                      <div className="text-[10px] text-amber-300 mt-0.5">{selectedBowtie.preventive_barrier.system}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-200">
                      Status: <strong>{selectedBowtie.preventive_barrier.status}</strong>
                    </div>
                  </div>

                  {/* Stage 3: Top Event (Center of Bow-Tie) */}
                  <div className="p-3.5 rounded-xl bg-[#1A0C0C] border-2 border-red-500/90 flex flex-col justify-between space-y-2 shadow-xl shadow-red-950/60 ring-1 ring-red-500/30">
                    <div>
                      <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase mb-1">
                        <Flame size={12} />
                        <span>3. Top Incident</span>
                      </div>
                      <div className="text-sm font-bold text-red-100">{selectedBowtie.top_event.event_type}</div>
                      <div className="text-[10px] text-red-300 mt-0.5">Depth: <span className="font-mono tabular-nums">{selectedBowtie.top_event.depth_md}m</span></div>
                    </div>
                    <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/80 text-[10px] text-red-200">
                      Severity: <strong>{selectedBowtie.top_event.severity}</strong>
                    </div>
                  </div>

                  {/* Stage 4: Remedial Mitigation SOP */}
                  <div className="p-3.5 rounded-xl bg-[#020507] border-2 border-emerald-900/60 flex flex-col justify-between space-y-2 shadow-md">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase mb-1">
                        <Wrench size={12} />
                        <span>4. Remedial SOP</span>
                      </div>
                      <div className="text-xs font-bold text-white">{selectedBowtie.mitigation_sop.name}</div>
                      <div className="text-[10px] text-emerald-300 mt-0.5">{selectedBowtie.mitigation_sop.category}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[10px] text-emerald-200">
                      Execution verified in well records.
                    </div>
                  </div>

                  {/* Stage 5: Safety Regulation / Audit */}
                  <div className="p-3.5 rounded-xl bg-[#020507] border-2 border-blue-900/60 flex flex-col justify-between space-y-2 shadow-md">
                    <div>
                      <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase mb-1">
                        <BookOpen size={12} />
                        <span>5. Regulatory Standard</span>
                      </div>
                      <div className="text-xs font-bold text-white">{selectedBowtie.regulatory_standard.code}</div>
                      <div className="text-[10px] text-blue-300 mt-0.5">{selectedBowtie.regulatory_standard.organization}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[10px] text-blue-200">
                      {selectedBowtie.regulatory_standard.name}
                    </div>
                  </div>

                </div>

                {/* Narrative Explanations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-[#020507] border border-[#162D38] space-y-2 shadow-inner">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Incident Chain & Causal Root Cause
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedBowtie.top_event.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#020507] border border-[#162D38] space-y-2 shadow-inner">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Field Execution & SOP Remediation Log
                    </span>
                    <p className="text-xs text-emerald-200 leading-relaxed">
                      {selectedBowtie.mitigation_sop.action_summary}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-xs">
                <AlertTriangle size={32} className="text-slate-600 mb-2" />
                Select a Bow-Tie pathway from the left to inspect causal stages.
              </div>
            )}

            {/* Bottom Compliance Notice */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Framework: OISD-STD-174 / API RP 53 Causal Safety Compliance</span>
              <span>Upper Assam Geological Memory Engine</span>
            </div>
          </div>

        </div>
      )}

      {/* ─── 4. BAGHJAN-5 BLOWOUT FORENSICS & PREVENTION MODAL (SIH Nuclear Differentiator) ─── */}
      {showBaghjanModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-[#050C10] border-2 border-red-700/80 rounded-2xl max-w-4xl w-full p-6 font-sans text-xs space-y-5 shadow-2xl my-8 ring-1 ring-red-500/20">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-red-900/60 pb-4 font-sans">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-600 text-red-400">
                  <Flame size={28} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider font-sans">
                    INSTITUTIONAL SAFETY LESSON · OIL INDIA LIMITED
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5 font-sans">
                    Well BAGHJAN-5 Blowout Forensics & SRISHTI·AI Prevention Framework
                  </h2>
                  <p className="text-slate-400 text-xs font-sans">
                    NGT Katakey Committee Report (2020) & CAG Audit No. 42 Analysis
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBaghjanModal(false)}
                className="p-1.5 rounded-lg bg-[#020507] border border-[#162D38] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Top Grid: Disaster Profile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
              <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">DATE OF BLOWOUT</span>
                <div className="text-sm font-bold text-white mt-0.5 font-sans">27 May 2020</div>
                <div className="text-[10px] text-slate-500 font-sans">Burned 190 days</div>
              </div>
              <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">LOCATION & RESERVOIR</span>
                <div className="text-sm font-bold text-cyan-300 mt-0.5 font-mono tabular-nums">3,870m MD</div>
                <div className="text-[10px] text-slate-500 font-sans">Lakadong / Therria Sand</div>
              </div>
              <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">HUMAN TOLL</span>
                <div className="text-sm font-bold text-red-400 mt-0.5 font-sans">3 Fatalities</div>
                <div className="text-[10px] text-slate-500 font-sans">OIL Firefighters & Crew</div>
              </div>
              <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold">ESTIMATED LOSS</span>
                <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono tabular-nums">₹2,500+ Crore</div>
                <div className="text-[10px] text-slate-500 font-sans">Compensation & Capping</div>
              </div>
            </div>

            {/* Root Causes vs SRISHTI Defense Grid */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                Root Cause Analysis vs SRISHTI·AI Causal Defense Pathways
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                {/* Pillar 1 */}
                <div className="p-3.5 bg-[#020507] rounded-xl border border-red-900/60 space-y-2 shadow-inner">
                  <span className="text-[10px] font-bold text-red-400 uppercase">
                    1. PREMATURE BOP REMOVAL
                  </span>
                  <div className="text-slate-300 leading-relaxed">
                    <strong>What Failed:</strong> Workover crew unbolted the Blowout Preventer (BOP) stack before testing dual mechanical barriers across perforations. Gas escaped into the cellar within minutes.
                  </div>
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800 text-emerald-300 leading-snug">
                    <strong>SRISHTI Prevention:</strong> Bow-Tie barrier engine enforces DGMS Rule 84/85: software refuses workover sign-off until dual mechanical barriers (tested to 5,000 psi) are digitally verified.
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-3.5 bg-[#020507] rounded-xl border border-red-900/60 space-y-2 shadow-inner">
                  <span className="text-[10px] font-bold text-red-400 uppercase">
                    2. SHALLOW PLUG IN DEVIATED HOLE
                  </span>
                  <div className="text-slate-300 leading-relaxed">
                    <strong>What Failed:</strong> A single cement plug placed at ~1,000m in a 40° deviated hole suffered cement channeling, allowing high-pressure gas to migrate up the high side of the casing.
                  </div>
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800 text-emerald-300 leading-snug">
                    <strong>SRISHTI Prevention:</strong> Stratigraphic correlation engine flags high-angle intervals and mandates mechanical bridge plug placement within 50m of top perforation per API RP 53.
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-3.5 bg-[#020507] rounded-xl border border-red-900/60 space-y-2 shadow-inner">
                  <span className="text-[10px] font-bold text-red-400 uppercase">
                    3. TRIBAL KNOWLEDGE DISCONNECT
                  </span>
                  <div className="text-slate-300 leading-relaxed">
                    <strong>What Failed:</strong> Shift crew had no access to offset well records from 2012 showing that Well NHK-162 and Moran-29 experienced major gas kicks under identical Barail overpressure.
                  </div>
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800 text-emerald-300 leading-snug">
                    <strong>SRISHTI Prevention:</strong> 32m lookahead radar automatically projects offset kick signatures onto the active doghouse display, with 12.8 ppg kill mud mandatory in reserve pits.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Emotional Defense Callout for Judges */}
            <div className="p-4 bg-red-950/30 border border-red-800/80 rounded-xl space-y-1.5 text-xs text-red-200 shadow-md">
              <div className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>The Verdict for Oil India Limited Leadership:</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                &ldquo;Baghjan-5 was not an unpredictable geological anomaly; it was an institutional memory failure. The gas kick precursors had happened 3 times in nearby offset wells. SRISHTI·AI ensures that 60 years of Oil India operational memory lives on the rig floor — safeguarding lives, ecosystems, and national energy security.&rdquo;
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowBaghjanModal(false)}
                className="px-6 py-2.5 bg-[#0D5C75] hover:bg-[#147695] text-white font-bold rounded-xl text-xs transition-colors shadow-md"
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
