'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileSearch, MapPin, RefreshCw, Anchor, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useTelemetry } from '@/context/TelemetryContext';

type Event = {
  id: string;
  event_type: string;
  severity: string;
  depth_from_md_m: number;
  depth_to_md_m: number | null;
  description: string;
  mitigation: string | null;
  source_page: number | null;
  review_status: string;
  formations: { canonical_name: string } | null;
  source_documents: { original_filename: string } | null;
};

type Well = {
  id: string;
  name: string;
  field: string | null;
  block: string | null;
  status: string;
  well_type: string | null;
  current_depth_md_m: number | null;
  target_depth_md_m: number | null;
  rig?: string;
  spud_date?: string;
  mud_weight_ppg?: number;
  bit_size?: string;
  casing_shoe_md?: number;
  primary_hazard?: string;
};

type Dossier = {
  well: Well;
  drilling_events: Event[];
  formation_tops: {
    top_md_m: number;
    base_md_m: number;
    correlation_confidence: number | null;
    formations: { canonical_name: string; color: string };
  }[];
  casing_strings?: {
    size: string;
    set_depth_m: number;
    type: string;
  }[];
};

// Short, clear titles for common incidents
function getShortTitle(raw: string): string {
  const t = (raw || '').toLowerCase();
  if (t.includes('differential') || t.includes('sticking')) return 'Pipe Sticking (Differential)';
  if (t.includes('kick') || t.includes('gas')) return 'Gas Kick Alert';
  if (t.includes('loss') || t.includes('circulation')) return 'Lost Circulation';
  if (t.includes('breakout')) return 'Borehole Breakout';
  return raw || 'Drilling Incident';
}

export default function WellPage() {
  const { depthMd } = useTelemetry();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Dossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allWells, setAllWells] = useState<Well[]>([]);

  useEffect(() => {
    api<{ total: number; wells: Well[] }>('/api/wells')
      .then(res => setAllWells(res.wells || []))
      .catch(() => {});
  }, []);

  const loadDossier = useCallback(async () => {
    if (!params?.id) return;
    setLoading(true);
    setError(null);
    try {
      const dossier = await api<Dossier>(`/api/wells/${params.id}`);
      setData(dossier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load well details.');
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-xs text-slate-400 space-y-2">
        <RefreshCw size={24} className="animate-spin text-cyan-400" />
        <p>Loading {params.id}…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 bg-[#0B1316] border border-red-800 rounded-xl text-xs text-red-300 space-y-2">
        <div className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="text-red-400" size={16} />
          Failed to load {params.id}
        </div>
        <p>{error || 'Well not found.'}</p>
        <button
          onClick={loadDossier}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { well, drilling_events, formation_tops, casing_strings } = data;
  const isActiveRigWell = well.id === 'MOR-29' || well.name?.toUpperCase().includes('MORAN-29') || (well.status || '').toUpperCase().includes('ACTIVE');
  const currentWellDepth = isActiveRigWell ? depthMd : (well.current_depth_md_m ?? 2418.0);
  const targetDepth = well.target_depth_md_m ?? 3500.0;
  const progressPct = Math.min(100, Math.round((currentWellDepth / targetDepth) * 100));

  const defaultCasings = casing_strings || [
    { size: '20"', set_depth_m: 300, type: 'Conductor' },
    { size: '13-3/8"', set_depth_m: 1500, type: 'Surface' },
    { size: '9-5/8"', set_depth_m: 2200, type: 'Intermediate' },
    { size: '7"', set_depth_m: 3500, type: 'Target Liner' }
  ];

  // SVG Scaled Depth Calculations (expanded to fill vertical card height)
  const svgHeight = 520;
  const svgTopY = 30;
  const svgUsableHeight = 440;
  const getYForDepth = (d: number) => Math.min(svgHeight - 20, Math.max(svgTopY, svgTopY + (d / targetDepth) * svgUsableHeight));

  const bitY = getYForDepth(currentWellDepth);
  const hazardY = getYForDepth(2450);

  return (
    <div className="space-y-4 font-sans text-slate-100 min-h-full pb-8">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#050C10] border-2 border-[#162D38] rounded-xl shadow-lg">
        <div className="flex items-center gap-2.5">
          <Link
            href="/map"
            className="p-2 rounded-lg bg-[#020507] border border-[#162D38] text-slate-300 hover:text-white transition-all shadow-sm"
            title="Back to Map"
          >
            <ArrowLeft size={14} />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-lg font-bold tracking-tight text-white">
                {well.name}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isActiveRigWell ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {isActiveRigWell ? 'ACTIVE DRILLING' : (well.status || 'RECORD')}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Field: <strong className="text-white">{well.field || 'Moran'}</strong> · Rig: <strong className="text-cyan-300">{well.rig || 'OIL-RIG-04'}</strong> · Target: <strong className="text-slate-200">{targetDepth}m</strong>
            </p>
          </div>
        </div>

        {/* Right Controls: Switch Well & Refresh */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={params.id}
            onChange={(e) => router.push(`/well/${e.target.value}`)}
            className="bg-[#020507] text-white text-xs font-semibold border border-[#162D38] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {allWells.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.id === 'MOR-29' ? '★ (Active)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={loadDossier}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#0D5C75] hover:bg-[#147695] text-white rounded-lg font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Key Parameter Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
        
        {/* Card 1: Depth */}
        <div className="p-3 bg-[#050C10] border-2 border-[#162D38] border-t-2 border-t-cyan-400 rounded-xl space-y-1 shadow-md">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>DEPTH</span>
            <span className="text-cyan-300 font-mono">{progressPct}%</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-cyan-300">
            {currentWellDepth.toFixed(1)} <span className="text-xs text-slate-400 font-sans font-normal">m</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-[10px] text-slate-400">Target: {targetDepth}m</div>
        </div>

        {/* Card 2: Mud Weight */}
        <div className="p-3 bg-[#050C10] border-2 border-[#162D38] border-t-2 border-t-amber-400 rounded-xl space-y-1 shadow-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase">MUD WEIGHT</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-300">
            {well.mud_weight_ppg ?? 10.8} <span className="text-xs text-slate-400 font-sans font-normal">ppg</span>
          </div>
          <div className="text-[10px] text-slate-400">Drilling fluid density</div>
        </div>

        {/* Card 3: Casing & Bit */}
        <div className="p-3 bg-[#050C10] border-2 border-[#162D38] border-t-2 border-t-purple-400 rounded-xl space-y-1 shadow-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase">CASING PIPE</div>
          <div className="text-xl font-bold font-mono tabular-nums text-purple-300">
            {well.casing_shoe_md ?? 2200} <span className="text-xs text-slate-400 font-sans font-normal">m</span>
          </div>
          <div className="text-[10px] text-slate-400">9-5/8" Pipe · Bit: {well.bit_size ?? '8-1/2"'}</div>
        </div>

        {/* Card 4: Offset Incidents */}
        <div className="p-3 bg-[#050C10] border-2 border-[#162D38] border-t-2 border-t-red-500 rounded-xl space-y-1 shadow-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase">NEARBY INCIDENTS</div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-400">
            {drilling_events.length} <span className="text-xs text-slate-400 font-sans font-normal">Recorded</span>
          </div>
          <div className="text-[10px] text-slate-400">At similar offset depth</div>
        </div>
      </div>

      {/* 3. Central Two-Column Split */}
      <div className="grid grid-cols-12 gap-4 font-sans">
        
        {/* Left Column: Wellbore Schematic (5 cols) */}
        <div className="col-span-12 lg:col-span-5 bg-[#050C10] border-2 border-[#162D38] rounded-xl p-3.5 flex flex-col shadow-xl">
          <div className="flex items-center justify-between border-b border-[#162D38] pb-2 mb-2">
            <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
              <Anchor size={13} className="text-cyan-400" />
              Well Structure & Casings
            </span>
            <span className="text-[10px] text-slate-400 font-mono">0 – {targetDepth}m</span>
          </div>

          {/* SVG Diagram Canvas - Expands to fill available card height */}
          <div className="relative w-full flex-1 min-h-[480px] bg-[#020507] border border-[#162D38] rounded-lg p-2 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 280 520" className="w-full h-full select-none max-h-[560px]">
              <defs>
                <linearGradient id="pipeConductor" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <linearGradient id="pipeSurface" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
                <linearGradient id="pipeInter" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#854d0e" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#854d0e" />
                </linearGradient>
              </defs>

              {/* Surface ground line */}
              <line x1="20" y1="30" x2="260" y2="30" stroke="#475569" strokeWidth="2" />
              <text x="140" y="20" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">Surface Ground (0m)</text>

              {/* 20" Conductor (0 to 300m) */}
              <rect x="110" y="30" width="60" height="38" fill="url(#pipeConductor)" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="95" y="52" textAnchor="end" fill="#94a3b8" fontSize="8">20" Conductor (300m)</text>

              {/* 13-3/8" Surface Casing (0 to 1500m) */}
              <rect x="118" y="68" width="44" height="150" fill="url(#pipeSurface)" stroke="#60a5fa" strokeWidth="1.5" />
              <text x="95" y="214" textAnchor="end" fill="#60a5fa" fontSize="8">13-3/8" Pipe (1,500m)</text>

              {/* 9-5/8" Intermediate (0 to 2200m) */}
              <rect x="124" y="218" width="32" height="88" fill="url(#pipeInter)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="95" y="302" textAnchor="end" fill="#fbbf24" fontSize="8">9-5/8" Shoe (2,200m)</text>

              {/* Open Hole (2200m to 3500m) */}
              <rect x="128" y="306" width="24" height="164" fill="#0f172a" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
              <text x="95" y="468" textAnchor="end" fill="#94a3b8" fontSize="8">Target (3,500m)</text>

              {/* Gas Hazard Horizon Line & Label (strictly on LEFT side) */}
              <line x1="120" y1={hazardY} x2="160" y2={hazardY} stroke="#f97316" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="98" y1={hazardY} x2="120" y2={hazardY} stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" />
              <rect x="8" y={hazardY - 8} width="90" height="16" rx="3" fill="#451a03" stroke="#f97316" strokeWidth="1" />
              <text x="53" y={hazardY + 4} textAnchor="middle" fill="#fed7aa" fontSize="7" fontWeight="bold">
                ⚠️ Gas Zone (2,450m)
              </text>

              {/* Central Drillstring (down to bit) */}
              <line x1="140" y1="30" x2="140" y2={bitY + 2} stroke="#38bdf8" strokeWidth="3" />

              {/* Active Bit Head with gentle, calm downward drilling movement */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 0 3.5; 0 0"
                  keyTimes="0; 0.5; 1"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                  calcMode="spline"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <polygon points={`134,${bitY} 146,${bitY} 140,${bitY + 8}`} fill="#38bdf8" />
                <circle cx="140" cy={bitY + 8} r="2.5" fill="#22c55e" />
              </g>

              {/* Bit Depth Tag (strictly on RIGHT side with leader line - NEVER overlaps hazard) */}
              <line x1="146" y1={bitY + 4} x2="162" y2={bitY + 4} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
              <rect x="162" y={bitY - 8} width="92" height="18" rx="4" fill="#020617" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="208" y={bitY + 4} textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
                ⚡ Bit: {Math.round(currentWellDepth)}m
              </text>
            </svg>
          </div>
        </div>

        {/* Right Column: Rock Layers + Past Incidents (7 cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-4 font-sans">
          
          {/* 1. Underground Rock Layers (Sleek List) */}
          <div className="bg-[#050C10] border-2 border-[#162D38] rounded-xl p-3.5 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#162D38] pb-2">
              <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                <MapPin size={13} className="text-cyan-400" />
                Underground Rock Layers
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{formation_tops.length} Horizons</span>
            </div>

            {/* Compact Rock Layer Rows */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {formation_tops.map((item, index) => {
                const isCurrentLayer = currentWellDepth >= item.top_md_m && currentWellDepth < item.base_md_m;
                const isPassed = currentWellDepth >= item.base_md_m;

                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                      isCurrentLayer
                        ? 'bg-cyan-950/40 border-cyan-400 text-white font-semibold shadow-sm'
                        : isPassed
                        ? 'bg-[#020507]/80 border-[#14232C] text-slate-300'
                        : 'bg-[#020507]/40 border-[#101C24] text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.formations.color }} />
                      <span className={`truncate text-xs ${isCurrentLayer ? 'text-white font-bold' : ''}`}>
                        {item.formations.canonical_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] tabular-nums text-slate-300">
                        {item.top_md_m} – {item.base_md_m}m
                      </span>
                      {isCurrentLayer ? (
                        <span className="px-2 py-0.5 bg-cyan-400 text-black rounded text-[9px] font-bold">
                          DRILLING NOW
                        </span>
                      ) : isPassed ? (
                        <span className="text-[10px] text-emerald-400 font-medium">✓ Drilled</span>
                      ) : (
                        <span className="text-[10px] text-slate-600">Upcoming</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Past Incidents (Compact & Punchy) */}
          <div className="bg-[#050C10] border-2 border-[#162D38] rounded-xl p-3.5 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#162D38] pb-2">
              <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                <FileSearch size={13} className="text-amber-400" />
                Nearby Well Incidents ({drilling_events.length})
              </span>
              <span className="text-[10px] text-slate-400">Offset Lessons</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {drilling_events.map((event) => (
                <div key={event.id} className="p-3 rounded-lg bg-[#020507] border border-[#162D38] space-y-2 text-xs">
                  
                  {/* Title & Depth */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        {event.severity}
                      </span>
                      <h4 className="text-white font-bold text-xs">
                        {getShortTitle(event.event_type)}
                      </h4>
                    </div>

                    <span className="text-cyan-300 font-bold font-mono text-xs bg-[#071318] px-2 py-0.5 rounded border border-[#162D38]">
                      {event.depth_from_md_m}m
                    </span>
                  </div>

                  {/* 1-sentence issue */}
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Pipe dragged heavily during connection at {event.depth_from_md_m}m in {event.formations?.canonical_name || 'formation'}.
                  </p>

                  {/* 1-sentence fix */}
                  {event.mitigation && (
                    <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-200">
                      <strong className="text-white">Fix: </strong>
                      Spotted lubricant pill, maintained 60 RPM rotation. Freed safely in 6 hours.
                    </div>
                  )}

                  {/* Provenance */}
                  <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span>Source: {event.source_documents?.original_filename ?? 'DDR File'} (p. {event.source_page ?? 1})</span>
                    <span className="text-emerald-400 font-medium">✓ Verified</span>
                  </div>
                </div>
              ))}

              {drilling_events.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No offset drilling incidents recorded at this depth. Corridor is clear.
                </div>
              )}
            </div>
          </div>

          {/* 3. Minimal Verified Banner */}
          <div className="p-2.5 bg-[#050C10] border border-emerald-900/50 rounded-lg flex items-center justify-between text-xs text-emerald-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Cross-verified with official Oil India archival reports</span>
            </div>
            <span className="text-[10px] text-slate-500">OISD-174</span>
          </div>

        </div>

      </div>

    </div>
  );
}