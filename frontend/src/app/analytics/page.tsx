'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, TrendingUp, DollarSign, 
  ShieldAlert, ShieldCheck, 
  AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import { api } from '@/lib/api';

type RoiSummary = {
  fleet_total_events: number;
  operational_events_count: number;
  total_npt_hrs: number;
  operational_npt_hrs: number;
  total_npt_cost_inr: number;
  operational_npt_cost_inr: number;
  operational_npt_cost_crores: number;
  total_npt_cost_crores: number;
};

const STRATIGRAPHIC_DATA = [
  {
    code: 'FMN-06',
    name: 'Barail Group',
    depth: '3,000 – 3,700m',
    description: 'Deep rock formation with trapped gas pockets and loose coal seams.',
    hazard: 'High-pressure gas kicks into the well and brittle coal caves in.',
    safeWindow: '10.8 – 11.4 PPG',
    porePressure: '11.0 PPG',
    maxLimit: '14.8 PPG',
    nptCostCr: 59.8,
    nptHours: 1102,
    severity: 'CRITICAL',
    action: 'Increase mud weight to 11.2 PPG before reaching 3,000m; watch tank levels constantly.'
  },
  {
    code: 'FMN-04',
    name: 'Girujan Clay',
    depth: '1,500 – 2,200m',
    description: 'Thick underground clay layer that absorbs water and swells like a sponge.',
    hazard: 'Clay swells up and grips the drill pipe tight, causing stuck pipe.',
    safeWindow: '10.5 – 10.9 PPG',
    porePressure: '8.60 PPG',
    maxLimit: '14.0 PPG',
    nptCostCr: 13.1,
    nptHours: 590,
    severity: 'HIGH',
    action: 'Keep drill pipe rotating continuously and add clay inhibitor to drilling mud.'
  },
  {
    code: 'FMN-05',
    name: 'Tipam Sandstone',
    depth: '2,200 – 2,800m',
    description: 'Porous sandstone reservoir that easily absorbs liquid.',
    hazard: 'Drilling fluid drains away into the porous rock (mud loss).',
    safeWindow: '10.2 – 10.6 PPG',
    porePressure: '8.50 PPG',
    maxLimit: '13.8 PPG',
    nptCostCr: 4.5,
    nptHours: 180,
    severity: 'MODERATE',
    action: 'Keep mud weight light (under 10.6 PPG) and pump sealing material if fluid drops.'
  },
  {
    code: 'FMN-07',
    name: 'Kopili Formation',
    depth: '3,700 – 4,000m',
    description: 'Brittle, highly stressed deep rock layer under immense tectonic pressure.',
    hazard: 'Deep ground pressure crushes the wellbore walls, causing cave-ins.',
    safeWindow: '10.2 – 10.8 PPG',
    porePressure: '9.90 PPG',
    maxLimit: '13.8 PPG',
    nptCostCr: 11.0,
    nptHours: 408,
    severity: 'HIGH',
    action: 'Maintain mud weight strictly between 10.3 and 10.7 PPG to hold hole walls steady.'
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
    <div className="space-y-4 font-sans text-slate-200 max-w-[1500px] mx-auto pb-8">
      
      {/* 1. Header Toolbar */}
      <div className="bg-[#0A1216] border border-slate-800 rounded-xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-wide uppercase">
              Rock Layer Analysis & Cost Savings
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
              UPPER ASSAM BASIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            How predicting underground rock hazards saves time and money for Oil India Limited
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-[#060B0E] p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('roi')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roi'
                ? 'bg-[#0D5C75] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign size={14} />
            <span>Overview & Savings</span>
          </button>

          <button
            onClick={() => setActiveTab('formations')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'formations'
                ? 'bg-[#0D5C75] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>4 Danger Rock Layers</span>
          </button>

          <button
            onClick={() => setActiveTab('geomechanics')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'geomechanics'
                ? 'bg-[#0D5C75] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Safe Mud Weights (PPG)</span>
          </button>
        </div>
      </div>

      {/* Helpful PPG Definition Banner */}
      <div className="bg-[#060B0E] border border-cyan-800/40 rounded-lg px-3.5 py-2 flex items-center gap-2 text-xs text-slate-300">
        <Info size={15} className="text-cyan-400 shrink-0" />
        <span>
          <strong className="text-cyan-300">PPG = Pounds Per Gallon:</strong> The unit measuring how heavy/dense the drilling fluid (mud) is. Correct mud weight holds back underground gas without cracking the rock.
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & SAVINGS */}
      {activeTab === 'roi' && (
        <div className="space-y-4">
          
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Stat 1: Total Past Loss */}
            <div className="bg-[#0A1216] border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
                <span>Past Money Lost in Assam</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white">₹88.5</span>
                <span className="text-xs text-slate-400 font-medium">Crore Lost</span>
              </div>
              <p className="text-xs text-slate-400">
                Over 2,292 hours of stopped drilling across 14 historical incidents
              </p>
            </div>

            {/* Stat 2: Projected Yearly Savings */}
            <div className="bg-[#0A1216] border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
                <span>Estimated Yearly Savings</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-emerald-400">₹35 – 48</span>
                <span className="text-xs text-emerald-300 font-medium">Crore / Year</span>
              </div>
              <p className="text-xs text-slate-400">
                Reduces rig stoppage time by 40%–50% by stopping kicks and stuck pipe early
              </p>
            </div>

            {/* Stat 3: Advance Warning Distance */}
            <div className="bg-[#0A1216] border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
                <span>Advance Warning Distance</span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-cyan-300">32</span>
                <span className="text-xs text-cyan-300 font-medium">Meters Ahead</span>
              </div>
              <p className="text-xs text-slate-400">
                Alerts the crew before entering dangerous rock zones so they can prepare
              </p>
            </div>

          </div>

          {/* Middle Two-Column Grid: Root Causes & Operational Value */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: Where 82% of Losses Happen (6 cols) */}
            <div className="lg:col-span-6 bg-[#0A1216] border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase text-white">
                    Where 82% of Losses Happen
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 font-semibold">
                  2 Main Causes
                </span>
              </div>

              <div className="space-y-3">
                {/* Cause 1 */}
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">1. Barail Rock — High-Pressure Gas Kicks</span>
                    <span className="font-mono font-bold text-rose-400">₹59.0 Cr (67%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[67%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1,056 rig hours lost</span>
                    <span>Sudden gas burst into well</span>
                  </div>
                </div>

                {/* Cause 2 */}
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">2. Girujan Clay — Swelling & Stuck Pipe</span>
                    <span className="font-mono font-bold text-amber-400">₹13.1 Cr (15%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[15%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>590 rig hours lost</span>
                    <span>Wet clay expands and grips pipe</span>
                  </div>
                </div>

                {/* Cause 3 */}
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">3. Other Layers — Fluid Loss & Cave-ins</span>
                    <span className="font-mono font-bold text-slate-400">₹16.4 Cr (18%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full w-[18%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>646 rig hours lost</span>
                    <span>Minor fluid loss & wall chipping</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#081216] border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
                <strong className="text-cyan-300">💡 Key Takeaway:</strong> Preventing gas kicks in Barail rock and stuck pipes in Girujan clay stops <strong>82% of all drilling downtime</strong> for Oil India Limited.
              </div>
            </div>

            {/* Right: Conventional vs SRISHTI AI Comparison (6 cols) */}
            <div className="lg:col-span-6 bg-[#0A1216] border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase text-white">
                    Traditional Drilling vs. SRISHTI AI
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-semibold">
                  Proven Value
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="py-2 px-2.5">FEATURE</th>
                      <th className="py-2 px-2.5">WITHOUT AI (CONVENTIONAL)</th>
                      <th className="py-2 px-2.5 text-cyan-300">WITH SRISHTI AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">Hazard Warning</td>
                      <td className="py-2.5 px-2.5 text-slate-400">Late (alert only after incident hits)</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-bold">32 Meters Early Lookahead</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">Stuck Pipe Alert</td>
                      <td className="py-2.5 px-2.5 text-slate-400">Manual guess after pipe is trapped</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-bold">Real-time swelling clay alert</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">Gas Kick Prevention</td>
                      <td className="py-2.5 px-2.5 text-slate-400">React only after gas enters well</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-bold">Pre-calculated safe mud weight</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">Old Well Research</td>
                      <td className="py-2.5 px-2.5 text-slate-400">4 to 6 hours searching paper PDFs</td>
                      <td className="py-2.5 px-2.5 text-cyan-300 font-bold">Instant AI recall (&lt;1 second)</td>
                    </tr>
                    <tr className="hover:bg-[#060B0E] transition-colors">
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">Financial Impact</td>
                      <td className="py-2.5 px-2.5 text-rose-400 font-bold font-mono">₹88.5 Crore Lost</td>
                      <td className="py-2.5 px-2.5 text-emerald-400 font-bold font-mono">₹35 – 48 Crore Saved / yr</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-[#081216] border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Fleet Baseline:</strong> Based on 18 active OIL drilling rigs in Assam. Every single day of avoided downtime saves approximately <strong>₹18 Lakhs</strong>.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: 4 DANGER ROCK LAYERS */}
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
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-[#0D2430] border-cyan-400 text-white shadow-md'
                      : 'bg-[#0A1216] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {strat.code}
                      </span>
                      <span className="font-bold text-sm text-white">{strat.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      strat.severity === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                      strat.severity === 'HIGH' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {strat.severity} RISK
                    </span>
                  </div>

                  <div className="text-xs text-cyan-300 font-semibold mb-1">
                    Depth: {strat.depth}
                  </div>

                  <p className="text-xs text-slate-300 mb-2">
                    {strat.hazard}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/80">
                    <span className="text-slate-400">Safe Mud: <strong className="text-emerald-400">{strat.safeWindow}</strong></span>
                    <span className="text-rose-400 font-bold font-mono">₹{strat.nptCostCr} Cr loss</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Formation Detail (7 cols) */}
          <div className="lg:col-span-7 bg-[#0A1216] border border-slate-800 rounded-xl p-5 space-y-3.5 text-xs shadow-md">
            <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {selectedStrat.code}
                  </span>
                  <h2 className="text-base font-bold text-white">{selectedStrat.name}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Depth Interval: <span className="text-cyan-300 font-bold">{selectedStrat.depth}</span>
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                selectedStrat.severity === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                selectedStrat.severity === 'HIGH' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {selectedStrat.severity} RISK
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#060B0E] border border-slate-800 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">WHAT THIS ROCK LAYER IS:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedStrat.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">UNDERGROUND GAS PRESSURE</span>
                  <span className="text-base font-bold text-white font-mono">{selectedStrat.porePressure}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Pounds Per Gallon</span>
                </div>
                <div className="p-3 bg-[#060B0E] border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold block">RECOMMENDED SAFE MUD WEIGHT</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{selectedStrat.safeWindow}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Safe Operating Corridor</span>
                </div>
              </div>

              <div className="p-3 bg-[#060B0E] border border-amber-900/40 rounded-lg space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">PRIMARY DANGER:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedStrat.hazard}</p>
              </div>

              <div className="p-3 bg-[#060B0E] border border-emerald-900/40 rounded-lg space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">WHAT THE DRILLER MUST DO:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedStrat.action}</p>
              </div>

              <div className="p-3 bg-[#060B0E] border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-400">HISTORICAL ACCIDENT DAMAGE:</span>
                <span className="text-rose-400 font-bold font-mono">₹{selectedStrat.nptCostCr} Crore lost · {selectedStrat.nptHours} hours downtime</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: SAFE MUD WEIGHTS */}
      {activeTab === 'geomechanics' && (
        <div className="bg-[#0A1216] border border-slate-800 rounded-xl p-4 space-y-3.5 text-xs shadow-md">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" />
                Safe Drilling Fluid (Mud) Guide by Depth
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact fluid density needed at each depth to stop gas leaks without cracking the rock
              </p>
            </div>
            
            {/* Color Legend */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe Window
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Too Light (Gas Kick Risk)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Too Heavy (Mud Loss Risk)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="py-2.5 px-3">ROCK LAYER</th>
                  <th className="py-2.5 px-3">DEPTH</th>
                  <th className="py-2.5 px-3">UNDERGROUND PRESSURE</th>
                  <th className="py-2.5 px-3 text-emerald-400">RECOMMENDED SAFE MUD</th>
                  <th className="py-2.5 px-3">MAXIMUM LIMIT</th>
                  <th className="py-2.5 px-3">WHAT CAN GO WRONG (IF WRONG WEIGHT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  { name: 'Alluvium / Dihing', depth: '0 – 300m', pp: '8.42 PPG', mw: '9.0 – 9.5 PPG', fg: '12.5 PPG', hazard: 'Shallow gas pockets & soft gravel washout', isCritical: false },
                  { name: 'Dhekiajuli', depth: '300 – 700m', pp: '8.42 PPG', mw: '9.2 – 9.8 PPG', fg: '13.0 PPG', hazard: 'Water sands; keep mud filter cake intact', isCritical: false },
                  { name: 'Namsang', depth: '700 – 1,500m', pp: '8.45 PPG', mw: '9.5 – 10.0 PPG', fg: '13.5 PPG', hazard: 'Loose gravel; pipe drags when pulling out', isCritical: false },
                  { name: 'Girujan Clay', depth: '1,500 – 2,200m', pp: '8.60 PPG', mw: '10.5 – 10.9 PPG', fg: '14.0 PPG', hazard: 'Sticky clay swells and jams the drill pipe tight', isCritical: true },
                  { name: 'Tipam Sandstone', depth: '2,200 – 2,800m', pp: '8.50 PPG', mw: '10.2 – 10.6 PPG', fg: '13.8 PPG', hazard: 'Porous sand drinks and loses drilling fluid', isCritical: false },
                  { name: 'Barail Group', depth: '3,000 – 3,700m', pp: '11.0 – 12.3 PPG', mw: '10.8 – 11.4 PPG', fg: '14.8 PPG', hazard: 'Dangerous high-pressure gas kicks & loose coal', isCritical: true },
                  { name: 'Kopili Formation', depth: '3,700 – 4,000m', pp: '9.90 PPG', mw: '10.2 – 10.8 PPG', fg: '13.8 PPG', hazard: 'Deep ground pressure crushes hole walls', isCritical: true },
                  { name: 'Sylhet Limestone', depth: '4,000 – 4,200m', pp: '9.10 PPG', mw: '9.5 – 10.2 PPG', fg: '15.5 PPG', hazard: 'Hard rock that rapidly wears out drill bits', isCritical: false },
                  { name: 'Lakadong / Therria', depth: '4,200 – 4,500m', pp: '11.0 PPG', mw: '11.0 – 12.3 PPG', fg: '14.0 PPG', hazard: 'Deep extreme-pressure gas influx', isCritical: true }
                ].map((row, i) => (
                  <tr key={i} className={`hover:bg-[#060B0E] transition-colors ${row.isCritical ? 'bg-rose-950/15' : ''}`}>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${row.isCritical ? 'bg-rose-400' : 'bg-slate-500'}`} />
                      <span>{row.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-mono">{row.depth}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{row.pp}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-bold font-mono">
                        {row.mw}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{row.fg}</td>
                    <td className="py-2.5 px-3 text-slate-300">{row.hazard}</td>
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
