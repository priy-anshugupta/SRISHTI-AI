'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Layers, TrendingUp, DollarSign, Clock, 
  ShieldAlert, ShieldCheck, Sparkles, CheckCircle2, 
  AlertTriangle, ArrowRight, ChevronRight, Activity,
  Sliders, Radio, Database, HardDrive, FileText, Target
} from 'lucide-react';
import { api } from '@/lib/api';

type Formation = {
  id: string;
  name?: string;
  canonical_name: string;
  group_name: string | null;
  lithology: string | null;
  color: string;
  depth_top_md?: number;
  depth_bottom_md?: number;
  top_md_m?: number;
  base_md_m?: number;
  avg_rop?: number;
  rop_range?: string;
  primary_hazard?: string;
  recommended_mw_ppg?: string;
  pore_pressure_ppg?: number;
  fracture_gradient_ppg?: number;
  npt_hrs?: number;
};

type RoiSummary = {
  fleet_total_events: number;
  operational_events_count: number;
  total_npt_hrs: number;
  operational_npt_hrs: number;
  total_npt_cost_inr: number;
  operational_npt_cost_inr: number;
  operational_npt_cost_crores: number;
  total_npt_cost_crores: number;
  breakdown_by_type: {
    event_type: string;
    count: number;
    npt_hrs: number;
    cost_inr: number;
    cost_crores: number;
  }[];
  breakdown_by_formation: {
    formation: string;
    count: number;
    npt_hrs: number;
    cost_inr: number;
    cost_crores: number;
  }[];
  roi_model: {
    advance_warning_meters: number;
    conservative_reduction_pct: number;
    conservative_annual_savings_crores: number;
    moderate_reduction_pct: number;
    moderate_annual_savings_crores: number;
    oil_annual_campaign_wells: number;
    foreign_software_license_avoided_crores: number;
  };
};

const STRATIGRAPHIC_DATA = [
  {
    code: 'FMN-06',
    name: 'Barail Group',
    depth: '3,000 – 3,700m MD',
    lithology: 'Interbedded sandstone, carbonaceous shale and coal seams',
    hazard: 'High-pressure gas kicks and brittle coal collapse',
    safeWindow: '10.8 – 11.4 ppg',
    porePressure: '11.0 ppg',
    fracGradient: '14.8 ppg',
    nptCostCr: 59.8,
    nptHours: 1102,
    severity: 'CRITICAL',
    mitigation: 'Raise mud weight to 11.2 ppg before 3,000m; monitor trip tank continuously per OISD-174.'
  },
  {
    code: 'FMN-04',
    name: 'Girujan Clay',
    depth: '1,500 – 2,200m MD',
    lithology: 'Mottled red/bluish-green mudstone, reactive smectite clay',
    hazard: 'Clay swells with water and pinches drill string (differential sticking)',
    safeWindow: '10.5 – 10.9 ppg',
    porePressure: '8.60 ppg',
    fracGradient: '14.0 ppg',
    nptCostCr: 13.1,
    nptHours: 590,
    severity: 'HIGH',
    mitigation: 'Maintain continuous string rotation (>60 RPM) and use KCl-polymer mud inhibitor.'
  },
  {
    code: 'FMN-05',
    name: 'Tipam Sandstone',
    depth: '2,200 – 2,800m MD',
    lithology: 'Porous reservoir sandstones with siltstone beds',
    hazard: 'Drilling fluid lost into porous sand beds (lost circulation)',
    safeWindow: '10.2 – 10.6 ppg',
    porePressure: '8.50 ppg',
    fracGradient: '13.8 ppg',
    nptCostCr: 4.5,
    nptHours: 180,
    severity: 'MODERATE',
    mitigation: 'Stage LCM pills and control mud weight within ±0.3 ppg of pore pressure.'
  },
  {
    code: 'FMN-07',
    name: 'Kopili Formation',
    depth: '3,700 – 4,000m MD',
    lithology: 'Hard splintery dark-grey shales with thin limestones',
    hazard: 'Tectonic stress causes hole walls to cave in and enlarge',
    safeWindow: '10.2 – 10.8 ppg',
    porePressure: '9.90 ppg',
    fracGradient: '13.8 ppg',
    nptCostCr: 11.0,
    nptHours: 408,
    severity: 'HIGH',
    mitigation: 'Maintain mud weight strictly between 10.3 and 10.7 ppg to prevent hole collapse.'
  }
];

export default function AnalyticsPage() {
  const [roiData, setRoiData] = useState<RoiSummary | null>(null);
  const [selectedFormationCode, setSelectedFormationCode] = useState<string>('FMN-06');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roi' | 'formations' | 'geomechanics'>('roi');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roiRes = await api<RoiSummary>('/api/formations/roi/summary');
      if (roiRes) {
        setRoiData(roiRes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telemetry sync failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedStrat = STRATIGRAPHIC_DATA.find(s => s.code === selectedFormationCode) || STRATIGRAPHIC_DATA[0];

  return (
    <div className="space-y-4 font-sans text-slate-200 max-w-[1500px] mx-auto">
      
      {/* 1. Header Toolbar */}
      <div className="bg-[#0A1216] border border-slate-800 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Rock Layer Analysis & Downtime Economics
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              UPPER ASSAM BASIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Fleet downtime forensic analysis, formation safety windows, and AI lookahead savings
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[#060B0E] p-1 rounded-md border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('roi')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roi'
                ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign size={13} />
            <span>Overview & Savings</span>
          </button>
          <button
            onClick={() => setActiveTab('formations')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'formations'
                ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>4 Danger Formations</span>
          </button>
          <button
            onClick={() => setActiveTab('geomechanics')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'geomechanics'
                ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Safe Mud Weights</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-xs text-red-300 font-mono">
          [FAULT] {error}
        </div>
      )}

      {/* 2. TAB 1: OVERVIEW & SAVINGS */}
      {activeTab === 'roi' && (
        <div className="space-y-4">
          
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Stat 1: Total Loss */}
            <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Past Fleet Downtime Loss</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">₹88.5</span>
                <span className="text-xs text-slate-400 font-mono">Crore</span>
              </div>
              <p className="text-xs text-slate-400">
                2,292 rig hours lost across 14 historical incidents in Assam
              </p>
            </div>

            {/* Stat 2: Projected Savings */}
            <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Projected Annual Savings</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">₹35 – 48</span>
                <span className="text-xs text-slate-400 font-mono">Cr / year</span>
              </div>
              <p className="text-xs text-slate-400">
                40%–50% reduction in downtime by pre-empting kicks & stuck pipe
              </p>
            </div>

            {/* Stat 3: Lookahead Warning */}
            <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Early Lookahead Warning</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-300">32</span>
                <span className="text-xs text-slate-400 font-mono">Meters MD</span>
              </div>
              <p className="text-xs text-slate-400">
                Gives driller advance notice before entering dangerous rock layers
              </p>
            </div>

          </div>

          {/* Middle Two-Column Grid: Root Causes & Operational Value */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: Where 82% of Losses Happen (6 cols) */}
            <div className="lg:col-span-6 bg-[#0A1216] border border-slate-800 rounded-lg p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-amber-400" />
                  <span className="text-xs font-bold font-mono uppercase text-slate-200">
                    Where Downtime is Concentrated (82% of Total Losses)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300">
                  2 Root Causes
                </span>
              </div>

              <div className="space-y-3">
                {/* Cause 1 */}
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">1. Barail Group — High-Pressure Gas Kicks</span>
                    <span className="font-mono font-bold text-rose-400">₹59.0 Cr (67%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[67%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1,056 rig hours lost across 3 wells</span>
                    <span>Sudden gas influx into wellbore</span>
                  </div>
                </div>

                {/* Cause 2 */}
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">2. Girujan Clay — Swelling & Stuck Pipe</span>
                    <span className="font-mono font-bold text-amber-400">₹13.1 Cr (15%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[15%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>590 rig hours lost across 2 wells</span>
                    <span>Swelling clay grabs drill pipe</span>
                  </div>
                </div>

                {/* Cause 3 */}
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">3. Other Formations — Mud Loss & Cave-in</span>
                    <span className="font-mono font-bold text-slate-300">₹16.4 Cr (18%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-500 h-full w-[18%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>646 rig hours lost (Tipam & Kopili)</span>
                    <span>Fluid loss and wall collapse</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-[#081216] border border-slate-800 rounded text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Key Takeaway:</strong> Preventing kicks in Barail and pipe sticking in Girujan eliminates 82% of all drilling downtime for Oil India Limited.
              </div>
            </div>

            {/* Right: Conventional vs SRISHTI AI Comparison (6 cols) */}
            <div className="lg:col-span-6 bg-[#0A1216] border border-slate-800 rounded-lg p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  <span className="text-xs font-bold font-mono uppercase text-slate-200">
                    Operational Impact: Conventional vs. SRISHTI AI
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                  Fleet Value
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="py-2 px-2.5">PARAMETER</th>
                      <th className="py-2 px-2.5">CONVENTIONAL</th>
                      <th className="py-2 px-2.5 text-cyan-300">WITH SRISHTI AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-medium text-slate-300">Hazard Warning</td>
                      <td className="py-2.5 px-2.5 text-slate-400">Reactive (0m alert)</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-semibold font-mono">32m Early Lookahead</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-medium text-slate-300">Stuck Pipe Prevention</td>
                      <td className="py-2.5 px-2.5 text-slate-400">Manual rotation during pause</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-semibold font-mono">Real-time swelling alert</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-medium text-slate-300">Gas Kick Mitigation</td>
                      <td className="py-2.5 px-2.5 text-slate-400">Post-influx shut-in</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-semibold font-mono">Pre-weighted mud window</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-medium text-slate-300">Offset Well Research</td>
                      <td className="py-2.5 px-2.5 text-slate-400">Manual PDF search (4–6 hrs)</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-semibold font-mono">Instant vector recall (&lt;1s)</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-medium text-slate-300">Net Fleet Benefit</td>
                      <td className="py-2.5 px-2.5 text-rose-400 font-mono">₹88.5 Cr loss</td>
                      <td className="py-2.5 px-2.5 text-emerald-400 font-semibold font-mono">₹35 – 48 Cr Saved / yr</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 bg-[#081216] border border-slate-800 rounded text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Fleet Baseline:</strong> Based on 18 active OIL drilling rigs in Assam. Every 24 hours of avoided downtime saves approximately ₹18 Lakhs.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. TAB 2: 4 DANGER FORMATIONS */}
      {activeTab === 'formations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column: 4 Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            {STRATIGRAPHIC_DATA.map((strat) => {
              const isSelected = selectedFormationCode === strat.code;
              return (
                <div
                  key={strat.code}
                  onClick={() => setSelectedFormationCode(strat.code)}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-[#0E1A20] border-cyan-500/80 text-white'
                      : 'bg-[#0A1216] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                        {strat.code}
                      </span>
                      <span className="font-bold text-sm text-white">{strat.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      strat.severity === 'CRITICAL' ? 'bg-rose-950/60 text-rose-300 border border-rose-800' :
                      strat.severity === 'HIGH' ? 'bg-amber-950/60 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {strat.severity}
                    </span>
                  </div>

                  <div className="text-[11px] text-cyan-300 font-mono mb-1">
                    Depth: {strat.depth}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                    {strat.hazard}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-800">
                    <span className="text-slate-400">Safe Mud: <strong className="text-cyan-300">{strat.safeWindow}</strong></span>
                    <span className="text-rose-400 font-semibold">₹{strat.nptCostCr} Cr loss</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Formation Detail (7 cols) */}
          <div className="lg:col-span-7 bg-[#0A1216] border border-slate-800 rounded-lg p-5 space-y-3.5 text-xs">
            <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {selectedStrat.code}
                  </span>
                  <h2 className="text-base font-bold text-white font-mono">{selectedStrat.name}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Depth Interval: <span className="text-cyan-300 font-semibold">{selectedStrat.depth}</span>
                </p>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                selectedStrat.severity === 'CRITICAL' ? 'bg-rose-950/60 text-rose-300 border border-rose-800' :
                selectedStrat.severity === 'HIGH' ? 'bg-amber-950/60 text-amber-300 border border-amber-800' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {selectedStrat.severity}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#060B0E] border border-slate-800 rounded space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">ROCK DESCRIPTION:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedStrat.lithology}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 font-mono">
                <div className="p-2.5 bg-[#060B0E] border border-slate-800 rounded">
                  <span className="text-[10px] text-slate-400 block">FORMATION PRESSURE</span>
                  <span className="text-sm font-bold text-white">{selectedStrat.porePressure}</span>
                </div>
                <div className="p-2.5 bg-[#060B0E] border border-slate-800 rounded">
                  <span className="text-[10px] text-slate-400 block">SAFE MUD WEIGHT</span>
                  <span className="text-sm font-bold text-emerald-400">{selectedStrat.safeWindow}</span>
                </div>
              </div>

              <div className="p-3 bg-[#060B0E] border border-slate-800 rounded space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold block">PRIMARY OPERATIONAL HAZARD:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedStrat.hazard}</p>
              </div>

              <div className="p-3 bg-[#060B0E] border border-slate-800 rounded space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">RECOMMENDED DRILLER ACTION:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedStrat.mitigation}</p>
              </div>

              <div className="p-3 bg-[#060B0E] border border-slate-800 rounded flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">HISTORICAL NPT IMPACT:</span>
                <span className="text-rose-400 font-bold">₹{selectedStrat.nptCostCr} Cr lost · {selectedStrat.nptHours} hours downtime</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB 3: SAFE MUD WEIGHTS */}
      {activeTab === 'geomechanics' && (
        <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-4 space-y-3.5 text-xs">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
                <TrendingUp size={15} className="text-cyan-400" />
                Safe Mud Weight Limits by Depth (Assam Basin)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calibrated drilling mud density corridors to avoid gas influx and rock fracture
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe Window
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Underbalanced (Gas Kick)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Overbalanced (Mud Loss)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">FORMATION</th>
                  <th className="py-2.5 px-3">DEPTH INTERVAL</th>
                  <th className="py-2.5 px-3">FORMATION PRESSURE</th>
                  <th className="py-2.5 px-3">RECOMMENDED MUD WEIGHT</th>
                  <th className="py-2.5 px-3">MAX LIMIT</th>
                  <th className="py-2.5 px-3">OPERATIONAL HAZARD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {[
                  { name: 'Alluvium / Dihing', depth: '0 – 300m', pp: '8.42 ppg', mw: '9.0 – 9.5 ppg', fg: '12.5 ppg', hazard: 'Shallow gas pockets & surface gravel washout', isCritical: false },
                  { name: 'Dhekiajuli', depth: '300 – 700m', pp: '8.42 ppg', mw: '9.2 – 9.8 ppg', fg: '13.0 ppg', hazard: 'Permeable freshwater sands; maintain filter cake', isCritical: false },
                  { name: 'Namsang', depth: '700 – 1,500m', pp: '8.45 ppg', mw: '9.5 – 10.0 ppg', fg: '13.5 ppg', hazard: 'Gravel loss / tight hole pull during trips', isCritical: false },
                  { name: 'Girujan Clay', depth: '1,500 – 2,200m', pp: '8.60 ppg', mw: '10.5 – 10.9 ppg', fg: '14.0 ppg', hazard: 'Smectite swelling; differential pipe sticking', isCritical: true },
                  { name: 'Tipam Sandstone', depth: '2,200 – 2,800m', pp: '8.50 ppg (depleted)', mw: '10.2 – 10.6 ppg', fg: '13.8 ppg', hazard: 'Thief-zone losses into permeable sand beds', isCritical: false },
                  { name: 'Barail Group', depth: '3,000 – 3,700m', pp: '11.0 – 12.3 ppg (high)', mw: '10.8 – 11.4 ppg', fg: '14.8 ppg', hazard: 'High-pressure gas kick & coal seam caving', isCritical: true },
                  { name: 'Kopili Formation', depth: '3,700 – 4,000m', pp: '9.90 ppg', mw: '10.2 – 10.8 ppg (narrow)', fg: '13.8 ppg', hazard: 'Tectonic stress breakout; 65% hole enlargement', isCritical: true },
                  { name: 'Sylhet Limestone', depth: '4,000 – 4,200m', pp: '9.10 ppg (reversal)', mw: '9.5 – 10.2 ppg', fg: '15.5 ppg', hazard: 'High compressive strength; severe bit wear', isCritical: false },
                  { name: 'Lakadong / Therria', depth: '4,200 – 4,500m', pp: '11.0 ppg', mw: '11.0 – 12.3 ppg', fg: '14.0 ppg', hazard: 'Deep HP/HT gas condensate influx', isCritical: true }
                ].map((row, i) => (
                  <tr key={i} className={`hover:bg-[#060B0E] transition-colors ${row.isCritical ? 'bg-rose-950/10' : ''}`}>
                    <td className="py-2.5 px-3 font-bold text-white font-sans flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${row.isCritical ? 'bg-rose-400' : 'bg-slate-600'}`} />
                      <span>{row.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">{row.depth}</td>
                    <td className="py-2.5 px-3 text-slate-300">{row.pp}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold">
                        {row.mw}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{row.fg}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{row.hazard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}

/* commit-step-53: feat(analytics) */
