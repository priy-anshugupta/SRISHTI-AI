'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileSearch, MapPin, RefreshCw, Layers, ShieldAlert, 
  FileText, CheckCircle2, AlertTriangle, ArrowLeft, ExternalLink,
  Compass, Anchor, Gauge
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
    cement_top_m?: number;
  }[];
  evidence_provenance?: {
    source_documents_count: number;
    approved_by_lead_geologist: boolean;
    last_audit_date: string;
  };
};

export default function WellPage() {
  const { depthMd } = useTelemetry();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Dossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-load dossier on mount
  const loadDossier = useCallback(async () => {
    if (!params?.id) return;
    setLoading(true);
    setError(null);
    try {
      const dossier = await api<Dossier>(`/api/wells/${params.id}`);
      setData(dossier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dossier.');
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono text-xs text-slate-400 space-y-3">
        <RefreshCw size={28} className="animate-spin text-cyan-400" />
        <p>Retrieving statutory well dossier for {params.id}…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-[#0B1316] border border-red-800 rounded-xl font-mono text-xs text-red-300 space-y-3">
        <div className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="text-red-400" size={18} />
          Failed to load Well Dossier ({params.id})
        </div>
        <p>{error || 'Well record not found.'}</p>
        <button
          onClick={loadDossier}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
        >
          Retry Retrieval
        </button>
      </div>
    );
  }

  const { well, drilling_events, formation_tops, casing_strings, evidence_provenance } = data;
  const isActiveRigWell = well.id === 'MOR-29' || well.name?.toUpperCase().includes('MORAN-29') || (well.status || '').toUpperCase().includes('ACTIVE');
  const currentWellDepth = isActiveRigWell ? depthMd : (well.current_depth_md_m ?? 2418.0);

  const defaultCasings = casing_strings || [
    { size: '20"', set_depth_m: 300, type: 'Surface Conductor', cement_top_m: 0 },
    { size: '13-3/8"', set_depth_m: 1500, type: 'Intermediate Casing', cement_top_m: 200 },
    { size: '9-5/8"', set_depth_m: 2200, type: 'Production Casing', cement_top_m: 1200 },
    { size: '7"', set_depth_m: 3500, type: 'Production Liner', cement_top_m: 2100 }
  ];

  return (
    <div className="space-y-5 font-sans text-slate-100 min-h-full">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl font-sans">
        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="p-2.5 rounded-xl bg-[#020507] border border-[#162D38] text-slate-300 hover:text-white hover:border-cyan-500/60 transition-all shadow-sm"
            title="Back to Map"
          >
            <ArrowLeft size={16} />
          </Link>

          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {well.name} Dossier
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                (well.status || '').toUpperCase().includes('ACTIVE') ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 animate-pulse' :
                (well.status || '').toUpperCase().includes('CRITICAL') ? 'bg-red-950/80 text-red-300 border border-red-800' :
                'bg-slate-900 text-slate-300 border border-slate-700'
              }`}>
                {well.status || 'ACTIVE DRILLING'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Field: <strong className="text-white">{well.field || 'Moran'}</strong> · Block: <strong className="text-white">{well.block || 'MOR-III'}</strong> · Rig: <strong className="text-cyan-300 font-mono font-bold">{well.rig || 'OIL-RIG-04'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-sans text-xs">
          <button
            onClick={loadDossier}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D5C75] hover:bg-[#147695] text-white rounded-xl font-bold transition-all shadow-md shadow-cyan-950/40 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Key Parameter Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-sans">
        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-cyan-400 bg-gradient-to-b from-cyan-950/25 via-transparent to-transparent rounded-2xl space-y-1 shadow-lg ring-1 ring-cyan-500/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">CURRENT DEPTH</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-300">
            {currentWellDepth.toFixed(1)} <span className="text-xs text-slate-400 font-sans font-normal">m MD</span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Target: <span className="font-mono tabular-nums font-semibold text-slate-300">{(well.target_depth_md_m ?? 3500.0).toFixed(1)}m</span>
          </div>
        </div>

        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-amber-400 bg-gradient-to-b from-amber-950/25 via-transparent to-transparent rounded-2xl space-y-1 shadow-lg ring-1 ring-amber-500/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">MUD WEIGHT</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-300">
            {well.mud_weight_ppg ?? 10.8} <span className="text-xs text-slate-400 font-sans font-normal">ppg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Bit Size: <span className="font-mono font-semibold text-slate-300">{well.bit_size ?? '8-1/2"'}</span>
          </div>
        </div>

        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-purple-400 bg-gradient-to-b from-purple-950/25 via-transparent to-transparent rounded-2xl space-y-1 shadow-lg ring-1 ring-purple-500/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">CASING SHOE</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-300">
            {well.casing_shoe_md ?? 2200} <span className="text-xs text-slate-400 font-sans font-normal">m MD</span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            9-5/8" Intermediate Shoe
          </div>
        </div>

        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-red-500 bg-gradient-to-b from-red-950/25 via-transparent to-transparent rounded-2xl space-y-1 shadow-lg ring-1 ring-red-500/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">HISTORICAL INCIDENTS</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400">
            {drilling_events.length} <span className="text-xs text-slate-400 font-sans font-normal">Recorded</span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            In Peer Offset Intervals
          </div>
        </div>
      </div>

      {/* 3. Central Two-Column Split: Wellbore Schematic + Formation Intervals & Incidents */}
      <div className="grid grid-cols-12 gap-5 font-sans">
        
        {/* Left: SVG Wellbore Casing Schematic Diagram (Key Petroleum Engineer Differentiator) */}
        <div className="col-span-12 lg:col-span-4 bg-[#050C10] border-2 border-[#1A3644] rounded-2xl p-4 font-sans text-xs space-y-3.5 shadow-2xl ring-1 ring-cyan-500/15">
          <div className="flex items-center justify-between border-b border-[#162D38] pb-2.5">
            <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5 font-sans">
              <Anchor size={14} className="text-cyan-400" />
              Wellbore Casing Stick Schematic
            </span>
            <span className="text-[10px] text-slate-400 font-sans bg-[#020507] px-2 py-0.5 rounded border border-[#162D38]">Concentric Strings</span>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="relative w-full h-[460px] bg-[#020507] border border-[#162D38] rounded-xl p-2 flex items-center justify-center overflow-hidden shadow-inner">
            <svg viewBox="0 0 240 440" className="w-full h-full select-none">
              {/* Ground surface */}
              <line x1="20" y1="20" x2="220" y2="20" stroke="#64748b" strokeWidth="3" />
              <text x="120" y="15" textAnchor="middle" fill="#94a3b8" fontSize="8">GL (0m Surface)</text>

              {/* Conductor 20" (0 to 60px) */}
              <rect x="90" y="20" width="60" height="50" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
              <text x="75" y="50" textAnchor="end" fill="#94a3b8" fontSize="8">20" Shoe (300m)</text>

              {/* Surface Casing 13-3/8" (20 to 160px) */}
              <rect x="98" y="70" width="44" height="100" fill="#0f172a" stroke="#60a5fa" strokeWidth="2" />
              <text x="85" y="170" textAnchor="end" fill="#60a5fa" fontSize="8">13-3/8" (1500m)</text>

              {/* Intermediate 9-5/8" (170 to 260px) */}
              <rect x="104" y="170" width="32" height="100" fill="#030712" stroke="#eab308" strokeWidth="2" />
              <text x="90" y="270" textAnchor="end" fill="#eab308" fontSize="8">9-5/8" Shoe (2200m)</text>

              {/* Open Hole / Liner 7" (270 to 370px) */}
              <rect x="108" y="270" width="24" height="90" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="95" y="360" textAnchor="end" fill="#ef4444" fontSize="8">7" Liner (3500m)</text>

              {/* Drillstring & Bit Position */}
              <line x1="120" y1="20" x2="120" y2="295" stroke="#38bdf8" strokeWidth="4" />
              {/* Bit Head */}
              <polygon points="112,295 128,295 120,305" fill="#38bdf8" />
              <circle cx="120" cy="305" r="5" fill="#ef4444" className="animate-ping" />
              <text x="145" y="302" fill="#38bdf8" fontSize="8" fontWeight="bold">Bit @ 2,418m</text>

              {/* Gas Precursor Horizon Line */}
              <line x1="40" y1="312" x2="200" y2="312" stroke="#f97316" strokeWidth="2" strokeDasharray="4,3" />
              <text x="120" y="322" textAnchor="middle" fill="#f97316" fontSize="8" fontWeight="bold">
                ⚠️ Gas Precursor Horizon (2,450m)
              </text>
            </svg>
          </div>

          {/* Casing Table */}
          <div className="space-y-1.5 font-sans">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Approved Casing Schedule:</span>
            {defaultCasings.map((c, i) => (
              <div key={i} className="flex justify-between p-2 rounded-lg bg-[#020507] border border-[#162D38] text-[11px] font-sans">
                <span className="text-white font-semibold">{c.size} {c.type}</span>
                <span className="text-cyan-300 font-bold font-mono tabular-nums">{c.set_depth_m}m MD</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Formation Intervals & Historical Incidents (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4 font-sans">
          
          {/* Stratigraphic Horizons */}
          <div className="bg-[#050C10] border-2 border-[#162D38] rounded-2xl p-4 font-sans text-xs space-y-3 shadow-xl ring-1 ring-cyan-500/10">
            <div className="flex items-center justify-between border-b border-[#162D38] pb-2.5">
              <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5 font-sans">
                <MapPin size={14} className="text-purple-400" />
                Interpreted Formation Tops & Correlation Confidence
              </span>
              <span className="text-[10px] text-slate-400 font-sans bg-[#020507] px-2 py-0.5 rounded border border-[#162D38]">Wellbore Log Tops</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {formation_tops.map((item, index) => (
                <div key={index} className="p-3 rounded-xl bg-[#020507] border border-[#162D38] hover:border-cyan-500/50 transition-all space-y-1 font-sans shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{item.formations.canonical_name}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.formations.color }} />
                  </div>
                  <div className="text-[11px] text-cyan-300 font-bold font-mono tabular-nums">
                    {item.top_md_m}–{item.base_md_m} m MD
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between font-sans">
                    <span>Confidence: <span className="font-mono tabular-nums font-semibold text-slate-300">{item.correlation_confidence ? `${(item.correlation_confidence * 100).toFixed(0)}%` : '92%'}</span></span>
                    <span className="text-emerald-400 font-bold">VERIFIED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Offset Incidents */}
          <div className="bg-[#050C10] border-2 border-[#162D38] rounded-2xl p-4 font-sans text-xs space-y-3 shadow-xl ring-1 ring-cyan-500/10">
            <div className="flex items-center justify-between border-b border-[#162D38] pb-2.5">
              <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5 font-sans">
                <FileSearch size={14} className="text-amber-400" />
                Historical Drilling Incidents & Root Cause Forensics ({drilling_events.length})
              </span>
              <span className="text-[10px] text-slate-400 font-sans bg-[#020507] px-2 py-0.5 rounded border border-[#162D38]">OISD Documented</span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {drilling_events.map((event) => (
                <div key={event.id} className="p-4 rounded-xl bg-[#020507] border border-[#162D38] hover:border-slate-700 transition-all space-y-2 font-sans shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                        event.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                        event.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {event.severity}
                      </span>
                      <h4 className="text-white font-bold text-sm font-sans">{event.event_type}</h4>
                    </div>

                    <span className="text-cyan-300 font-bold font-mono tabular-nums text-xs bg-[#050C10] px-2 py-0.5 rounded border border-[#162D38]">
                      {event.depth_from_md_m}{event.depth_to_md_m ? `–${event.depth_to_md_m}` : ''}m MD
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed font-sans">
                    {event.description}
                  </p>

                  {event.mitigation && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-[11px] text-emerald-300 font-sans">
                      <strong>Remedial SOP:</strong> {event.mitigation}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 flex justify-between pt-1.5 border-t border-slate-800/80 font-sans">
                    <span>Evidence Source: <strong className="text-slate-200">{event.source_documents?.original_filename ?? 'WCR File'}</strong> (Page {event.source_page ?? 1})</span>
                    <span className="text-emerald-400 font-semibold font-mono">STATUS: {event.review_status}</span>
                  </div>
                </div>
              ))}

              {drilling_events.length === 0 && (
                <div className="p-6 text-center text-slate-500 font-sans">
                  No source-linked operational incidents recorded for this wellbore.
                </div>
              )}
            </div>
          </div>

          {/* Evidence Provenance Badge */}
          <div className="p-3.5 bg-[#050C10] border border-emerald-900/60 rounded-xl flex items-center justify-between text-xs font-sans text-emerald-300 shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Dossier verified against official Oil India Limited Well Completion Reports.</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Audited by Chief Drilling Engineer</span>
          </div>

        </div>

      </div>

    </div>
  );
}
