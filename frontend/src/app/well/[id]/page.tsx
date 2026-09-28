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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-xs text-muted space-y-3">
        <RefreshCw size={24} className="animate-spin text-accent" />
        <p className="text-secondary">Loading well details ({params.id})…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 bg-surface border border-danger/25 rounded-lg text-xs text-danger space-y-3 max-w-lg mx-auto my-8">
        <div className="text-sm font-bold text-ink flex items-center gap-2">
          <AlertTriangle className="text-danger" size={16} />
          Could not load well details
        </div>
        <p className="text-muted">{error || 'Well record not found.'}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDossier}
            className="px-3 py-1.5 bg-surface-muted hover:bg-surface-muted text-ink rounded-lg font-bold"
          >
            Retry
          </button>
          <Link
            href="/map"
            className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-ink rounded-lg font-bold"
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
    <div className="space-y-3 font-sans text-secondary min-h-full pb-8">

      {/* 1. Header Toolbar (Clean, Uncluttered) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-surface border border-line rounded-lg shadow-md">
        <div className="flex items-center gap-2.5">
          <Link
            href="/map"
            className="px-2.5 py-1.5 rounded-lg bg-surface-muted border border-line text-secondary hover:text-ink transition-all flex items-center gap-1 text-xs font-semibold"
            title="Back to Nearby Well Map"
          >
            <ArrowLeft size={13} />
            <span>Map</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActiveRigWell ? 'bg-accent ' : 'bg-success'}`} />
              <h1 className=" font-bold text-ink  page-title">
                {well.name}
              </h1>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                isActiveRigWell
                  ? 'bg-accent-soft text-accent border border-accent/25'
                  : well.status === 'CRITICAL INCIDENT'
                  ? 'bg-danger-soft text-danger border border-danger/25'
                  : 'bg-success-soft text-success border border-success/25'
              }`}>
                {isActiveRigWell ? 'Active Drilling' : 'Completed Well'}
              </span>
            </div>

            <p className="text-xs text-muted mt-0.5">
              {well.field || 'Upper Assam'} Field · {isActiveRigWell ? `Target: ${targetDepth}m` : `Total Depth: ${targetDepth}m`} · {getConstructionYear(well.spud_date)}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 text-xs">
          {isActiveRigWell ? (
            <Link
              href="/doghouse"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-success-soft hover:bg-success-soft text-success border border-success/25 rounded-lg text-xs font-semibold transition-all shadow-sm"
              title="Open Live Rig Floor Gauges & Doghouse"
            >
              <Monitor size={12} className="text-success " />
              <span>Rig Floor (Live)</span>
            </Link>
          ) : (
            <Link
              href="/well/MOR-29"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-muted hover:bg-surface-muted text-accent border border-accent/25 rounded-lg text-xs font-semibold transition-all shadow-sm"
              title="View Active Rig (MORAN-29)"
            >
              <Activity size={12} className="text-accent " />
              <span>View Active Rig (MOR-29)</span>
            </Link>
          )}

          <select
            value={params.id}
            onChange={(e) => router.push(`/well/${e.target.value}`)}
            className="bg-surface-muted text-ink text-xs font-medium border border-line rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {allWells.map((w) => (
              <option key={w.id} value={w.id} className="bg-surface text-ink">
                {w.name} {w.id === 'MOR-29' ? ' (Active Rig)' : `· ${w.field}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Key Parameter Cards (Clean & Simple) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 font-sans">

        {/* Card 1: Depth */}
        <div className={`p-3 bg-surface border border-line rounded-lg space-y-1 shadow-sm ${
          isActiveRigWell ? 'border-t-2 border-t-accent' : 'border-t-2 border-t-success'
        }`}>
          <div className="flex justify-between items-center text-xs font-bold text-muted uppercase">
            <span>{isActiveRigWell ? 'CURRENT DEPTH' : 'FINAL DRILLED DEPTH'}</span>
            <span className={`font-mono ${isActiveRigWell ? 'text-accent' : 'text-success'}`}>
              {isActiveRigWell ? `${progressPct}%` : ' 100%'}
            </span>
          </div>
          <div className={`text-xl font-bold font-mono ${isActiveRigWell ? 'text-accent' : 'text-success'}`}>
            {currentWellDepth.toFixed(0)} <span className="text-xs text-muted font-sans font-normal">meters</span>
          </div>
          <div className="text-xs text-muted">
            {isActiveRigWell ? `Target: ${targetDepth}m` : 'Completed to target'}
          </div>
        </div>

        {/* Card 2: Delays / Downtime */}
        <div className="p-3 bg-surface border border-line border-t-2 border-t-warning rounded-lg space-y-1 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-muted uppercase">
            <span>TIME DELAYED</span>
            {totalFinancialCost > 0 && (
              <span className="text-warning font-bold font-mono text-xs">
                {formatCostInr(totalFinancialCost)}
              </span>
            )}
          </div>
          <div className="text-xl font-bold font-mono text-warning">
            {totalNptHours > 24 ? `${Math.round(totalNptHours / 24)} days lost` : `${totalNptHours} hours`}
          </div>
          <div className="text-xs text-muted">
            {drilling_events.length > 0 ? `${drilling_events.length} incident logged` : 'No major delays'}
          </div>
        </div>

        {/* Card 3: Mud Weight */}
        <div className="p-3 bg-surface border border-line border-t-2 border-t-accent rounded-lg space-y-1 shadow-sm">
          <div className="text-xs font-bold text-muted uppercase">DRILLING MUD</div>
          <div className="text-xl font-bold font-mono text-accent">
            {well.mud_weight_ppg ?? 10.8} <span className="text-xs text-muted font-sans font-normal">ppg</span>
          </div>
          <div className="text-xs text-muted">
            Casing shoe at {intermediateShoe}m
          </div>
        </div>

        {/* Card 4: Safety / Hazard Summary */}
        <div className="p-3 bg-surface border border-line border-t-2 border-t-danger rounded-lg space-y-1 shadow-sm">
          <div className="text-xs font-bold text-muted uppercase">PAST INCIDENT</div>
          <div className="text-xl font-bold font-mono text-danger">
            {drilling_events.length || (well.primary_hazard ? 1 : 0)} <span className="text-xs text-muted font-sans font-normal">recorded</span>
          </div>
          <div className="text-xs text-muted truncate">
            {drilling_events[0] ? getSimpleTitle(drilling_events[0].event_type) : (well.primary_hazard ? well.primary_hazard.split('(')[0] : 'Normal drilling')}
          </div>
        </div>
      </div>

      {/* 3. Simple Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-line pb-1.5 text-xs">
        <button
          onClick={() => setActiveTab('schematic')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'schematic'
              ? 'bg-brand/15 text-accent border border-accent/40 font-semibold'
              : 'text-muted hover:text-secondary border border-transparent'
          }`}
        >
          Well Schematic
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-brand/15 text-accent border border-accent/40 font-semibold'
              : 'text-muted hover:text-secondary border border-transparent'
          }`}
        >
          Timeline History
        </button>

        <button
          onClick={() => setActiveTab('formations')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'formations'
              ? 'bg-brand/15 text-accent border border-accent/40 font-semibold'
              : 'text-muted hover:text-secondary border border-transparent'
          }`}
        >
          Rock Layers ({formation_tops.length})
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeTab === 'lessons'
              ? 'bg-brand/15 text-accent border border-accent/40 font-semibold'
              : 'text-muted hover:text-secondary border border-transparent'
          }`}
        >
          Lessons for Live Rig
        </button>
      </div>

      {/* 4. Tab 1: Simplified Historical Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-surface border border-line rounded-lg p-4 shadow-sm space-y-3.5">
          <div className="border-b border-line pb-2">
            <h3 className="text-sm font-bold text-ink">
              Drilling Chronicle: What Happened at {well.name}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Step-by-step summary from initial drilling to completion.
            </p>
          </div>

          {/* Clean Vertical Timeline */}
          <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-line">

            {/* Step 1: Start */}
            <div className="relative">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-surface-muted border border-accent/25" />
              <div className="bg-surface-muted border border-line rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-accent font-bold">1. DRILLING BEGAN</span>
                  <span className="font-mono text-muted">Surface (0m)</span>
                </div>
                <p className="text-secondary">
                  Rig mobilized in {well.field || 'Moran'} field and started drilling the surface hole.
                </p>
              </div>
            </div>

            {/* Step 2: Surface Pipe */}
            <div className="relative">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-surface-muted border border-accent/25" />
              <div className="bg-surface-muted border border-line rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-accent font-bold">2. SURFACE PIPE INSTALLED</span>
                  <span className="font-mono text-muted">{surfaceShoe}m depth</span>
                </div>
                <p className="text-secondary">
                  Installed steel pipe down to {surfaceShoe}m to protect groundwater and secure the wellhead.
                </p>
              </div>
            </div>

            {/* Step 3: Historical Incidents (Clean & Plain English) */}
            {drilling_events.map((event) => {
              const { problem, solution } = simplifyIncident(event.event_type, event.description, event.mitigation);
              return (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-surface-muted border border-warning/25" />
                  <div className="bg-surface-muted border border-warning/25 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-warning-soft text-warning border border-warning/25 font-bold">
                           {getSimpleTitle(event.event_type)}
                        </span>
                        <span className="font-mono text-accent font-semibold">{event.depth_from_md_m}m depth</span>
                      </div>
                      {event.duration_hrs ? (
                        <span className="text-warning font-semibold">
                          {Math.round(event.duration_hrs / 24)} days delayed {event.npt_cost_inr ? `(${formatCostInr(event.npt_cost_inr)})` : ''}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-warning font-semibold">What happened: </span>
                        <span className="text-secondary">{problem}</span>
                      </div>

                      <div className="p-2 rounded bg-success-soft border border-success/25 text-xs text-success">
                        <strong className="text-success">How engineers solved it: </strong>
                        <span>{solution}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Fallback if no event array items */}
            {drilling_events.length === 0 && well.primary_hazard && (
              <div className="relative">
                <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-surface-muted border border-warning/25" />
                <div className="bg-surface-muted border border-warning/25 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-warning-soft text-warning border border-warning/25 font-bold">
                       RECORDED HAZARD
                    </span>
                    <span className="font-mono text-accent">{intermediateShoe}m depth</span>
                  </div>
                  <div>
                    <span className="text-warning font-semibold">Issue: </span>
                    <span className="text-secondary">{well.primary_hazard}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Intermediate Pipe */}
            <div className="relative">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-surface-muted border border-warning/25" />
              <div className="bg-surface-muted border border-line rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-warning font-bold">4. INTERMEDIATE PIPE SET</span>
                  <span className="font-mono text-muted">{intermediateShoe}m depth</span>
                </div>
                <p className="text-secondary">
                  Sealed upper clay and porous sandstone layers before drilling deeper into the reservoir.
                </p>
              </div>
            </div>

            {/* Step 5: Finished */}
            <div className="relative">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-surface-muted border border-success/25" />
              <div className="bg-surface-muted border border-line rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-success font-bold">5. TOTAL DEPTH REACHED</span>
                  <span className="font-mono text-success">{targetDepth}m depth</span>
                </div>
                <p className="text-secondary">
                  {isActiveRigWell
                    ? 'Currently rotating at 2,418m approaching the 2,450m gas zone. Target is 3,500m.'
                    : `Reached final target depth of ${targetDepth}m. Well completed and safely preserved in records.`}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. Tab 2: Wellbore Schematic (Crisp & Simple) */}
      {activeTab === 'schematic' && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-5 bg-surface border border-line rounded-lg p-3 shadow-md flex flex-col">
            <div className="flex items-center justify-between border-b border-line pb-1.5 mb-2">
              <span className="font-bold text-ink text-xs flex items-center gap-1.5">
                <Anchor size={13} className="text-accent" />
                Well Cross-Section
              </span>
              <span className="text-xs text-muted font-mono">0 – {Math.round(targetDepth)}m</span>
            </div>

            <div className="relative w-full flex-1 min-h-[460px] bg-surface-muted border border-line rounded-lg p-2 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 280 480" className="w-full h-full select-none max-h-[500px]">


                {/* Ground */}
                <line x1="20" y1="30" x2="260" y2="30" stroke="#475569" strokeWidth="2" />
                <text x="140" y="20" textAnchor="middle" fill="var(--ui-secondary)" fontSize="9" fontWeight="bold">Ground Surface (0m)</text>

                {/* Conductor */}
                <rect x="110" y="30" width="60" height={Math.max(18, conductorY - 30)} fill="#63778b" stroke="#94a3b8" strokeWidth="1.5" />
                <text x="95" y={Math.min(conductorY, 55)} textAnchor="end" fill="var(--ui-secondary)" fontSize="8">Conductor ({conductorShoe}m)</text>

                {/* Surface */}
                <rect x="118" y={conductorY} width="44" height={Math.max(25, surfaceY - conductorY)} fill="#497ba4" stroke="#60a5fa" strokeWidth="1.5" />
                <text x="95" y={surfaceY - 4} textAnchor="end" fill="var(--ui-secondary)" fontSize="8">Surface Pipe ({surfaceShoe}m)</text>

                {/* Intermediate */}
                <rect x="124" y={surfaceY} width="32" height={Math.max(35, interY - surfaceY)} fill="#a77d40" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="95" y={interY - 4} textAnchor="end" fill="var(--ui-secondary)" fontSize="8">Intermediate Pipe ({intermediateShoe}m)</text>

                {/* Open Hole to TD */}
                <rect x="128" y={interY} width="24" height={Math.max(35, targetY - interY)} fill="#0f172a" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
                <text x="95" y={targetY - 4} textAnchor="end" fill="var(--ui-secondary)" fontSize="8">Target ({Math.round(targetDepth)}m)</text>

                {/* Hazard Line */}
                {hazardY !== null && (
                  <>
                    <line x1="120" y1={hazardY} x2="160" y2={hazardY} stroke="#f97316" strokeWidth="2" strokeDasharray="3,3" />
                    <line x1="98" y1={hazardY} x2="120" y2={hazardY} stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="6" y={hazardY - 9} width="92" height="18" rx="3" fill="#451a03" stroke="#f97316" strokeWidth="1" />
                    <text x="52" y={hazardY + 4} textAnchor="middle" fill="#fed7aa" fontSize="7" fontWeight="bold">
                       {hazardLabel}
                    </text>
                  </>
                )}

                {/* Drillstring */}
                <line x1="140" y1="30" x2="140" y2={bitY + 2} stroke={isActiveRigWell ? '#38bdf8' : '#10b981'} strokeWidth="3" />

                {/* Bit */}
                {isActiveRigWell ? (
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
                ) : (
                  <g>
                    <polygon points={`134,${bitY} 146,${bitY} 140,${bitY + 8}`} fill="#10b981" />
                    <circle cx="140" cy={bitY + 8} r="2.5" fill="#10b981" />
                  </g>
                )}

                {/* Bit Tag */}
                <line x1="146" y1={bitY + 4} x2="162" y2={bitY + 4} stroke={isActiveRigWell ? '#38bdf8' : '#10b981'} strokeWidth="1" strokeDasharray="2,2" />
                <rect x="162" y={bitY - 9} width="102" height="18" rx="4" fill="#020617" stroke={isActiveRigWell ? '#38bdf8' : '#10b981'} strokeWidth="1.2" />
                <text x="213" y={bitY + 4} textAnchor="middle" fill={isActiveRigWell ? '#38bdf8' : '#10b981'} fontSize="8" fontWeight="bold">
                  {isActiveRigWell ? ` Bit: ${Math.round(currentWellDepth)}m (Live)` : ` Total Depth: ${Math.round(currentWellDepth)}m`}
                </text>
              </svg>
            </div>
          </div>

          {/* Simple Pipe List */}
          <div className="col-span-12 lg:col-span-7 bg-surface border border-line rounded-lg p-4 shadow-md space-y-2.5">
            <h3 className="text-xs font-bold text-ink border-b border-line pb-1.5">
              Steel Casing Installed in this Well
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-muted border border-line flex justify-between items-center">
                <div>
                  <div className="font-bold text-secondary">20" Conductor Pipe</div>
                  <div className="text-xs text-muted">Protects surface ground from washouts</div>
                </div>
                <span className="text-accent font-mono font-bold">0 – {conductorShoe}m</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-muted border border-line flex justify-between items-center">
                <div>
                  <div className="font-bold text-secondary">13-3/8" Surface Pipe</div>
                  <div className="text-xs text-muted">Protects drinking water aquifers</div>
                </div>
                <span className="text-accent font-mono font-bold">0 – {surfaceShoe}m</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-muted border border-line flex justify-between items-center">
                <div>
                  <div className="font-bold text-secondary">9-5/8" Intermediate Pipe</div>
                  <div className="text-xs text-muted">Seals sticky clay and leak zones</div>
                </div>
                <span className="text-warning font-mono font-bold">0 – {intermediateShoe}m</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-muted border border-line flex justify-between items-center">
                <div>
                  <div className="font-bold text-secondary">7" Production Liner</div>
                  <div className="text-xs text-muted">Protects deep target oil and gas zone</div>
                </div>
                <span className="text-success font-mono font-bold">{intermediateShoe} – {targetDepth}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Rock Layers (Simple & Compact) */}
      {activeTab === 'formations' && (
        <div className="bg-surface border border-line rounded-lg p-4 shadow-md space-y-3">
          <div className="border-b border-line pb-1.5 flex justify-between items-center">
            <h3 className="text-xs font-bold text-ink">
              Underground Rock Layers at {well.name}
            </h3>
            <span className="text-xs text-muted font-mono">{formation_tops.length} Layers</span>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {formation_tops.map((item, index) => {
              const isCurrent = isActiveRigWell && currentWellDepth >= item.top_md_m && currentWellDepth < item.base_md_m;
              const isPenetrated = !isActiveRigWell || currentWellDepth >= item.base_md_m;

              return (
                <div
                  key={index}
                  className={`p-2.5 rounded-lg border text-xs flex justify-between items-center transition-all ${
                    isCurrent
                      ? 'bg-accent-soft border-accent/25 shadow-sm'
                      : isPenetrated
                      ? 'bg-surface-muted border-line'
                      : 'bg-surface-muted/40 border-line opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.formations.color }} />
                    <span className={`font-semibold ${isCurrent ? 'text-ink font-bold' : 'text-secondary'}`}>
                      {item.formations.canonical_name}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded bg-accent text-black text-xs font-bold">
                        Drilling Now
                      </span>
                    )}
                  </div>

                  <span className="text-muted font-mono text-xs">
                    {item.top_md_m} – {item.base_md_m}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Direct Lessons / Active Rig Safeguards */}
      {activeTab === 'lessons' && (
        <div className="bg-surface border border-line rounded-lg p-4 shadow-md space-y-3">
          <div className="border-b border-line pb-1.5 flex justify-between items-center">
            <h3 className="text-xs font-bold text-ink">
              {isActiveRigWell
                ? 'Active Drilling Safeguards & Advisory (MORAN-29)'
                : `Lessons from ${well.name} for Active Rig (MORAN-29)`}
            </h3>
            {isActiveRigWell ? (
              <Link
                href="/doghouse"
                className="flex items-center gap-1.5 text-xs text-success hover:text-success font-semibold px-2 py-1 rounded bg-success-soft border border-success/25"
              >
                <Monitor size={11} className="" />
                <span>Open Rig Floor View</span>
                <ExternalLink size={11} />
              </Link>
            ) : (
              <Link
                href="/well/MOR-29"
                className="flex items-center gap-1 text-xs text-accent hover:text-accent font-semibold px-2 py-1 rounded bg-surface-muted border border-accent/25"
              >
                <span>Switch to Active Rig (MOR-29)</span>
                <ExternalLink size={11} />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-surface-muted border border-line space-y-1">
              <div className="font-bold text-warning">
                1. Gas Pressure Warning
              </div>
              <p className="text-secondary text-xs leading-relaxed">
                When penetrating deep rock layers, sudden high pressure can occur. Keep heavy kill mud ready in reserve pits before drilling below 2,450m.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-muted border border-line space-y-1">
              <div className="font-bold text-accent">
                2. Avoid Pipe Sticking
              </div>
              <p className="text-secondary text-xs leading-relaxed">
                Sticky clay layers can trap the drill pipe. Keep drill pipe continuously rotating and never leave it resting stationary for more than 5 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
