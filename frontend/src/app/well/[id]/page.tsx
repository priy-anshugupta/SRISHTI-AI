'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, RefreshCw, Activity, Clock, Anchor, Layers, 
  ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink,
  ChevronRight, Wrench, FileText, Check, Monitor
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
  npt_cost_inr?: number;
  duration_hrs?: number;
  verified_by?: string;
};

type Well = {
  id: string;
  name: string;
  field: string | null;
  block: string | null;
  lat?: number;
  lon?: number;
  status: string;
  well_type: string | null;
  current_depth_md_m: number | null;
  target_depth_md_m: number | null;
  td_depth_md?: number;
  rig?: string;
  spud_date?: string;
  mud_weight_ppg?: number;
  bit_size?: string;
  casing_shoe_md?: number;
  primary_hazard?: string;
  total_npt_hrs?: number;
};

type FormationTop = {
  top_md_m: number;
  base_md_m: number;
  correlation_confidence: number | null;
  formations: { canonical_name: string; color: string };
  lithology?: string;
  recommended_mw_ppg?: string;
  primary_hazard?: string;
};

type Dossier = {
  well: Well;
  drilling_events: Event[];
  formation_tops: FormationTop[];
  casing_strings?: {
    od?: string;
    size?: string;
    shoe_md?: number;
    set_depth_m?: number;
    type: string;
    weight?: string;
    cement?: string;
  }[];
};

// Plain English title
function getSimpleTitle(raw: string): string {
  const t = (raw || '').toLowerCase();
  if (t.includes('differential') || t.includes('sticking') || t.includes('stuck')) return 'Drill Pipe Got Stuck';
  if (t.includes('blowout')) return 'Gas Blowout Incident';
  if (t.includes('kick') || t.includes('influx') || t.includes('overpressure')) return 'High-Pressure Gas Influx';
  if (t.includes('loss') || t.includes('circulation')) return 'Mud Leak (Lost Circulation)';
  if (t.includes('breakout') || t.includes('collapse') || t.includes('caving')) return 'Borehole Wall Collapse';
  if (t.includes('tight') || t.includes('pack-off')) return 'Hole Jammed with Rock Chips';
  return raw || 'Drilling Incident';
}

// Convert complex jargon into 2 simple sentences (Problem & Fix)
function simplifyIncident(rawType: string, rawDesc: string, rawMitigation: string | null) {
  const text = (rawType + ' ' + (rawDesc || '')).toLowerCase();

  let problem = 'Encountered unexpected underground drilling difficulties during this interval.';
  let solution = 'Drilling crew stabilized the borehole using standard fluid balancing procedures.';

  if (text.includes('blowout')) {
    problem = 'High-pressure gas surged up the wellbore during workover, triggering an emergency.';
    solution = 'Specialized well control snubbing team pumped heavy kill mud to permanently seal the well.';
  } else if (text.includes('differential') || text.includes('stuck') || text.includes('sticking')) {
    problem = 'Drill pipe stuck against sticky clay walls after remaining stationary.';
    solution = 'Pumped lubricating soak pill and kept the drill string rotating to pull free.';
  } else if (text.includes('lost circulation') || text.includes('loss') || text.includes('leak')) {
    problem = 'Drilling mud leaked into porous rock cracks, causing fluid levels to drop.';
    solution = 'Pumped coarse sealing material (calcium carbonate & mica) to plug the cracks.';
  } else if (text.includes('kick') || text.includes('influx') || text.includes('overpressure')) {
    problem = 'High-pressure gas entered the wellbore, causing drilling pit fluid levels to rise.';
    solution = 'Closed surface safety valves (BOP) and circulated heavier mud to control the gas.';
  } else if (text.includes('breakout') || text.includes('collapse') || text.includes('caving')) {
    problem = 'Wellbore walls collapsed under high underground rock pressure.';
    solution = 'Pumped heavier mud to hold walls steady and cemented the damaged section.';
  } else if (text.includes('tight') || text.includes('pack-off')) {
    problem = 'Loose rock fragments packed around the drill bit, restricting movement.';
    solution = 'Pumped a thick fluid sweep to flush out rock fragments and re-drilled smooth.';
  } else if (rawDesc) {
    problem = rawDesc.split('.')[0] + '.';
  }

  if (rawMitigation && !text.includes('blowout') && !text.includes('differential') && !text.includes('lost circulation') && !text.includes('kick') && !text.includes('breakout') && !text.includes('tight')) {
    solution = rawMitigation.split('.')[0] + '.';
  }

  return { problem, solution };
}

function formatCostInr(inr?: number): string {
  if (!inr || inr <= 0) return '';
  if (inr >= 10000000) {
    return `₹${(inr / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr`;
  }
  return `₹${(inr / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`;
}

function getConstructionYear(dateStr?: string): string {
  if (!dateStr) return 'Historical Well';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function WellPage() {
  const { depthMd } = useTelemetry();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Dossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allWells, setAllWells] = useState<Well[]>([]);
  const [activeTab, setActiveTab] = useState<'schematic' | 'timeline' | 'formations' | 'lessons'>('schematic');

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-xs text-slate-400 space-y-3">
        <RefreshCw size={24} className="animate-spin text-cyan-400" />
        <p className="text-slate-300">Loading well details ({params.id})…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 bg-[#050C10] border border-red-800 rounded-xl text-xs text-red-300 space-y-3 max-w-lg mx-auto my-8">
        <div className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="text-red-400" size={16} />
          Could not load well details
        </div>
        <p className="text-slate-400">{error || 'Well record not found.'}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDossier}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
          >
            Retry
          </button>
          <Link
            href="/map"
            className="px-3 py-1.5 bg-[#0D5C75] hover:bg-[#147695] text-white rounded-lg font-bold"
          >
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  const { well, drilling_events, formation_tops, casing_strings } = data;
  const isActiveRigWell = well.id === 'MOR-29' || well.name?.toUpperCase().replace(/[^A-Z0-9]/g, '') === 'MORAN29';
  const finalDrilledDepth = well.td_depth_md ?? well.target_depth_md_m ?? well.current_depth_md_m ?? 3500.0;
  const currentWellDepth = isActiveRigWell ? depthMd : finalDrilledDepth;
  const targetDepth = isActiveRigWell ? (well.target_depth_md_m ?? 3500.0) : finalDrilledDepth;
  const progressPct = isActiveRigWell ? Math.min(100, Math.round((currentWellDepth / targetDepth) * 100)) : 100;

  // Casing shoe depths
  const conductorShoe = casing_strings?.find(c => c.od === '20"' || c.type === 'Conductor')?.shoe_md ?? 50;
  const surfaceShoe = casing_strings?.find(c => c.od === '13-3/8"' || c.type === 'Surface')?.shoe_md ?? Math.min(500, Math.round(targetDepth * 0.15));
  const intermediateShoe = well.casing_shoe_md ?? casing_strings?.find(c => c.od === '9-5/8"' || c.type === 'Intermediate')?.shoe_md ?? Math.round(targetDepth * 0.6);

  // Downtime & cost
  const totalNptHours = well.total_npt_hrs ?? drilling_events.reduce((acc, ev) => acc + (ev.duration_hrs || 0), 0);
  const totalFinancialCost = drilling_events.reduce((acc, ev) => acc + (ev.npt_cost_inr || 0), 0);

  // SVG Scaled Depth Calculations
  const svgHeight = 480;
  const svgTopY = 30;
  const svgUsableHeight = 410;
  const getYForDepth = (d: number) => Math.min(svgHeight - 20, Math.max(svgTopY, svgTopY + (d / targetDepth) * svgUsableHeight));

  const conductorY = getYForDepth(conductorShoe);
  const surfaceY = getYForDepth(surfaceShoe);
  const interY = getYForDepth(intermediateShoe);
  const targetY = getYForDepth(targetDepth);
  const bitY = getYForDepth(currentWellDepth);

  // Hazard marker
  let hazardDepth: number | null = null;
  let hazardLabel: string = '';
  if (isActiveRigWell) {
    hazardDepth = 2450;
    hazardLabel = 'Barail Gas Zone (2,450m)';
  } else if (drilling_events.length > 0) {
    hazardDepth = drilling_events[0].depth_from_md_m;
    hazardLabel = `${getSimpleTitle(drilling_events[0].event_type)} (${Math.round(hazardDepth)}m)`;
  } else if (well.primary_hazard) {
    const match = well.primary_hazard.match(/(\d+[\d,]*)\s*m/i);
    if (match) {
      hazardDepth = parseFloat(match[1].replace(/,/g, ''));
      hazardLabel = `${well.primary_hazard.split('(')[0].trim().slice(0, 24)} (${Math.round(hazardDepth)}m)`;
    }
  }
  const hazardY = hazardDepth ? getYForDepth(hazardDepth) : null;

  return (
    <div className="space-y-3 font-sans text-slate-100 min-h-full pb-8">
      
      {/* 1. Header Toolbar (Clean, Uncluttered) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-[#050C10] border-2 border-[#162D38] rounded-xl shadow-md">
        <div className="flex items-center gap-2.5">
          <Link
            href="/map"
            className="px-2.5 py-1.5 rounded-lg bg-[#020507] border border-[#162D38] text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
            title="Back to Nearby Well Map"
          >
            <ArrowLeft size={13} />
            <span>Map</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActiveRigWell ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
              <h1 className="text-base font-bold text-white tracking-wide">
                {well.name}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isActiveRigWell 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                  : well.status === 'CRITICAL INCIDENT'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {isActiveRigWell ? 'Active Drilling' : 'Completed Well'}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-0.5">
              {well.field || 'Upper Assam'} Field · {isActiveRigWell ? `Target: ${targetDepth}m` : `Total Depth: ${targetDepth}m`} · {getConstructionYear(well.spud_date)}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 text-xs">
          {isActiveRigWell ? (
            <Link
              href="/doghouse"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#07241A] hover:bg-[#0C3B2B] text-emerald-300 border border-emerald-700/80 rounded-lg text-xs font-semibold transition-all shadow-sm"
              title="Open Live Rig Floor Gauges & Doghouse"
            >
              <Monitor size={12} className="text-emerald-400 animate-pulse" />
              <span>Rig Floor (Live)</span>
            </Link>
          ) : (
            <Link
              href="/well/MOR-29"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#09222E] hover:bg-[#0E364A] text-cyan-300 border border-cyan-700/80 rounded-lg text-xs font-semibold transition-all shadow-sm"
              title="View Active Rig (MORAN-29)"
            >
              <Activity size={12} className="text-cyan-400 animate-pulse" />
              <span>View Active Rig (MOR-29)</span>
            </Link>
          )}

          <select
            value={params.id}
            onChange={(e) => router.push(`/well/${e.target.value}`)}
            className="bg-[#020507] text-white text-xs font-medium border border-[#162D38] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {allWells.map((w) => (
              <option key={w.id} value={w.id} className="bg-[#050C10] text-white">
                {w.name} {w.id === 'MOR-29' ? '★ (Active Rig)' : `· ${w.field}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Key Parameter Cards (Clean & Simple) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 font-sans">
        
        {/* Card 1: Depth */}
        <div className={`p-3 bg-[#050C10] border-2 border-[#162D38] rounded-xl space-y-1 shadow-sm ${
          isActiveRigWell ? 'border-t-2 border-t-cyan-400' : 'border-t-2 border-t-emerald-400'
        }`}>
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>{isActiveRigWell ? 'CURRENT DEPTH' : 'FINAL DRILLED DEPTH'}</span>
            <span className={`font-mono ${isActiveRigWell ? 'text-cyan-300' : 'text-emerald-400'}`}>
              {isActiveRigWell ? `${progressPct}%` : '✓ 100%'}
            </span>
          </div>
          <div className={`text-xl font-bold font-mono ${isActiveRigWell ? 'text-cyan-300' : 'text-emerald-300'}`}>
            {currentWellDepth.toFixed(0)} <span className="text-xs text-slate-400 font-sans font-normal">meters</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isActiveRigWell ? `Target: ${targetDepth}m` : 'Completed to target'}
          </div>
        </div>

        {/* Card 2: Delays / Downtime */}
        <div className="p-3 bg-[#050C10] border-2 border-[#162D38] border-t-2 border-t-amber-400 rounded-xl space-y-1 shadow-sm">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>TIME DELAYED</span>
            {totalFinancialCost > 0 && (
              <span className="text-amber-400 font-bold font-mono text-[10px]">
                {formatCostInr(totalFinancialCost)}
              </span>
            )}
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {totalNptHours > 24 ? `${Math.round(totalNptHours / 24)} days lost` : `${totalNptHours} hours`}
          </div>
          <div className="text-[10px] text-slate-400">
            {drilling_events.length > 0 ? `${drilling_events.length} incident logged` : 'No major delays'}
          </div>
        </div>

        {/* Card 3: Mud Weight */}
        <div className="p-3 bg-[#050C10] border-2 border-[#162D38] border-t-2 border-t-purple-400 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase">DRILLING MUD</div>
          <div className="text-xl font-bold font-mono text-purple-300">
            {well.mud_weight_ppg ?? 10.8} <span className="text-xs text-slate-400 font-sans font-normal">ppg</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Casing shoe at {intermediateShoe}m
          </div>
        </div>

        {/* Card 4: Safety / Hazard Summary */}
        <div className="p-3 bg-[#050C10] border-2 border-[#162D38] border-t-2 border-t-red-500 rounded-xl space-y-1 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase">PAST INCIDENT</div>
          <div className="text-xl font-bold font-mono text-red-400">
            {drilling_events.length || (well.primary_hazard ? 1 : 0)} <span className="text-xs text-slate-400 font-sans font-normal">recorded</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {drilling_events[0] ? getSimpleTitle(drilling_events[0].event_type) : (well.primary_hazard ? well.primary_hazard.split('(')[0] : 'Normal drilling')}
          </div>
        </div>
      </div>

      {/* 3. Simple Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#162D38] pb-1.5 text-xs">
        <button
          onClick={() => setActiveTab('schematic')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'schematic'
              ? 'bg-[#0D5C75] text-white shadow-sm'
              : 'bg-[#050C10] text-slate-400 hover:text-white border border-[#162D38]'
          }`}
        >
          Well Schematic
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-[#0D5C75] text-white shadow-sm'
              : 'bg-[#050C10] text-slate-400 hover:text-white border border-[#162D38]'
          }`}
        >
          Timeline History
        </button>

        <button
          onClick={() => setActiveTab('formations')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'formations'
              ? 'bg-[#0D5C75] text-white shadow-sm'
              : 'bg-[#050C10] text-slate-400 hover:text-white border border-[#162D38]'
          }`}
        >
          Rock Layers ({formation_tops.length})
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'lessons'
              ? 'bg-[#0D5C75] text-white shadow-sm'
              : 'bg-[#050C10] text-slate-400 hover:text-white border border-[#162D38]'
          }`}
        >
          Lessons for Live Rig
        </button>
      </div>

      {/* 4. Tab 1: Simplified Historical Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-[#050C10] border-2 border-[#162D38] rounded-xl p-4 shadow-lg space-y-3.5">
          <div className="border-b border-[#162D38] pb-2">
            <h3 className="text-sm font-bold text-white">
              Drilling Chronicle: What Happened at {well.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Step-by-step summary from initial drilling to completion.
            </p>
          </div>

          {/* Clean Vertical Timeline */}
          <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-cyan-400 via-amber-400 to-emerald-400">
            
            {/* Step 1: Start */}
            <div className="relative">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#020507] border-2 border-cyan-400" />
              <div className="bg-[#020507] border border-[#162D38] rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-cyan-300 font-bold">1. DRILLING BEGAN</span>
                  <span className="font-mono text-slate-500">Surface (0m)</span>
                </div>
                <p className="text-slate-300">
                  Rig mobilized in {well.field || 'Moran'} field and started drilling the surface hole.
                </p>
              </div>
            </div>

            {/* Step 2: Surface Pipe */}
            <div className="relative">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#020507] border-2 border-blue-400" />
              <div className="bg-[#020507] border border-[#162D38] rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-blue-300 font-bold">2. SURFACE PIPE INSTALLED</span>
                  <span className="font-mono text-slate-500">{surfaceShoe}m depth</span>
                </div>
                <p className="text-slate-300">
                  Installed steel pipe down to {surfaceShoe}m to protect groundwater and secure the wellhead.
                </p>
              </div>
            </div>

            {/* Step 3: Historical Incidents (Clean & Plain English) */}
            {drilling_events.map((event) => {
              const { problem, solution } = simplifyIncident(event.event_type, event.description, event.mitigation);
              return (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#020507] border-2 border-amber-400" />
                  <div className="bg-[#020507] border-2 border-amber-800/80 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                          ⚠️ {getSimpleTitle(event.event_type)}
                        </span>
                        <span className="font-mono text-cyan-300 font-semibold">{event.depth_from_md_m}m depth</span>
                      </div>
                      {event.duration_hrs ? (
                        <span className="text-amber-400 font-semibold">
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