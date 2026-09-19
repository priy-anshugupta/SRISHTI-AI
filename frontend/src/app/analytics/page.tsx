'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, DatabaseZap, RefreshCw, Layers, TrendingUp, 
  DollarSign, Clock, ShieldAlert, AlertTriangle, ArrowRight,
  Sparkles, CheckCircle2, ChevronRight
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

type FormationAnalytics = {
  formation: Formation;
  approved_event_count: number;
  event_counts: Record<string, number>;
  total_npt_hrs?: number;
  total_npt_cost_inr?: number;
  notice: string;
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

export default function AnalyticsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [formationAnalytics, setFormationAnalytics] = useState<FormationAnalytics | null>(null);
  const [roiData, setRoiData] = useState<RoiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetricTab, setActiveMetricTab] = useState<'roi' | 'formations' | 'geomechanics'>('roi');

  // 1. Fetch formations and ROI data on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [formData, roiRes] = await Promise.all([
        api<{ formations: Formation[] }>('/api/formations'),
        api<RoiSummary>('/api/formations/roi/summary')
      ]);

      if (formData && formData.formations) {
        setFormations(formData.formations);
        if (formData.formations.length > 0) {
          const girujan = formData.formations.find(f => f.canonical_name.includes('Girujan')) || formData.formations[3] || formData.formations[0];
          setSelectedFormation(girujan);
          loadFormationAnalytics(girujan.id);
        }
      }

      if (roiRes) {
        setRoiData(roiRes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load formation analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFormationAnalytics = async (formationId: string) => {
    try {
      const res = await api<FormationAnalytics>(`/api/formations/${formationId}/analytics`);
      setFormationAnalytics(res);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectFormation = (fmn: Formation) => {
    setSelectedFormation(fmn);
    loadFormationAnalytics(fmn.id);
  };

  return (
    <div className="space-y-5 font-sans text-slate-100 min-h-full">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="text-cyan-400" size={20} />
              Formation Subsurface Analytics & NPT ROI Model
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Calibrated geomechanical windows, non-productive time forensic costs, and verifiable economic savings
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-[#020507] p-1 rounded-xl border border-[#162D38] text-xs font-sans shadow-inner">
          <button
            onClick={() => setActiveMetricTab('roi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors font-sans cursor-pointer ${
              activeMetricTab === 'roi'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign size={13} />
            <span>Economic ROI & NPT</span>
          </button>
          <button
            onClick={() => setActiveMetricTab('formations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors font-sans cursor-pointer ${
              activeMetricTab === 'formations'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Stratigraphic Horizons</span>
          </button>
          <button
            onClick={() => setActiveMetricTab('geomechanics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors font-sans cursor-pointer ${
              activeMetricTab === 'geomechanics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Safe Mud Weight Windows</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300 font-sans">
          {error}
        </div>
      )}

      {/* 2. TAB 1: QUANTIFIED ROI & NPT COST IMPACT DASHBOARD (Key SIH Differentiator) */}
      {activeMetricTab === 'roi' && roiData && (
        <div className="space-y-5 font-sans">
          {/* Top 4 KPI Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 font-sans">
            <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-red-500 rounded-2xl space-y-1 font-sans shadow-xl ring-1 ring-red-500/10">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">HISTORICAL NPT COST</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-red-400">
                ₹{roiData.operational_npt_cost_crores} <span className="text-xs text-slate-400 font-sans font-normal">Crore</span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                <span className="font-mono tabular-nums">{roiData.operational_npt_hrs.toLocaleString()}</span> Rig Hours Lost (14 Events)
              </div>
            </div>

            <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-emerald-500 rounded-2xl space-y-1 font-sans shadow-xl ring-1 ring-emerald-500/10">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-sans">
                <Sparkles size={11} />
                SRISHTI ANNUAL SAVINGS
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-300">
                ₹{roiData.roi_model.conservative_annual_savings_crores}–{roiData.roi_model.moderate_annual_savings_crores} <span className="text-xs text-slate-400 font-sans font-normal">Cr</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-sans">
                40%–55% NPT Reduction Model
              </div>
            </div>

            <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-cyan-500 rounded-2xl space-y-1 font-sans shadow-xl ring-1 ring-cyan-500/10">
              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider font-sans">PROACTIVE LOOKAHEAD</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-cyan-300">
                {roiData.roi_model.advance_warning_meters} <span className="text-xs text-slate-400 font-sans font-normal">Meters</span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Historical Precursor Horizon Warning
              </div>
            </div>

            <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-blue-500 rounded-2xl space-y-1 font-sans shadow-xl ring-1 ring-blue-500/10">
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider font-sans">ATMANIRBHAR IMPACT</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-blue-300">
                ₹{roiData.roi_model.foreign_software_license_avoided_crores} <span className="text-xs text-slate-400 font-sans font-normal">Cr/yr</span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Schlumberger / Halliburton Replaced
              </div>
            </div>
          </div>

          {/* Two Detailed Breakdown Tables & Bar Visualizers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            
            {/* Left: NPT Cost by Drilling Incident Type */}
            <div className="p-5 bg-[#050C10] border-2 border-[#162D38] rounded-2xl space-y-3 font-sans text-xs shadow-xl ring-1 ring-cyan-500/10">
              <div className="flex items-center justify-between border-b border-[#162D38] pb-2.5">
                <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px] font-sans">
                  <ShieldAlert size={14} className="text-amber-400" />
                  NPT Cost by Incident Class (Upper Assam)
                </span>
                <span className="text-slate-400 text-[10px] font-sans">14 Historical Incidents</span>
              </div>

              <div className="space-y-3 font-sans">
                {roiData.breakdown_by_type.map((item, idx) => {
                  const maxCost = 85.0; // Barail kick / stuck pipe scale
                  const barWidth = Math.min(100, Math.max(8, (item.cost_crores / maxCost) * 100));
                  return (
                    <div key={idx} className="space-y-1.5 font-sans">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white font-bold">{item.event_type} ({item.count})</span>
                        <span className="text-red-400 font-bold font-mono tabular-nums">₹{item.cost_crores} Cr ({item.npt_hrs} hrs)</span>
                      </div>
                      <div className="w-full bg-[#020507] h-2.5 rounded-full overflow-hidden border border-[#162D38] shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-[#020507] border border-[#162D38] rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans shadow-inner">
                *Note: Excludes the singular catastrophic Baghjan-5 blowout (₹2,500 Cr) to represent baseline drilling operations.
              </div>
            </div>

            {/* Right: NPT Cost by Geological Formation */}
            <div className="p-5 bg-[#050C10] border-2 border-[#162D38] rounded-2xl space-y-3 font-sans text-xs shadow-xl ring-1 ring-cyan-500/10">
              <div className="flex items-center justify-between border-b border-[#162D38] pb-2.5">
                <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px] font-sans">
                  <Layers size={14} className="text-purple-400" />
                  NPT Vulnerability by Formation Stratum
                </span>
                <span className="text-slate-400 text-[10px] font-sans">Hours Lost</span>
              </div>

              <div className="space-y-3 font-sans">
                {roiData.breakdown_by_formation.map((item, idx) => {
                  const maxHrs = 600.0;
                  const barWidth = Math.min(100, Math.max(8, (item.npt_hrs / maxHrs) * 100));
                  return (
                    <div key={idx} className="space-y-1.5 font-sans">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white font-bold">{item.formation}</span>
                        <span className="text-purple-300 font-bold font-mono tabular-nums">{item.npt_hrs} hrs (₹{item.cost_crores} Cr)</span>
                      </div>
                      <div className="w-full bg-[#020507] h-2.5 rounded-full overflow-hidden border border-[#162D38] shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-[10px] text-emerald-300 leading-relaxed flex items-center gap-2 font-sans shadow-inner">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Girujan Clay differential sticking & Barail overpressured gas kicks account for 82% of all regional NPT.</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. TAB 2: FORMATIONS DEEP DIVE & LITHOLOGY */}
      {activeMetricTab === 'formations' && (
        <div className="grid grid-cols-12 gap-5 font-sans">
          {/* Formations Grid (7 cols) */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {formations.map((fmn) => {
              const isSelected = selectedFormation?.id === fmn.id;
              return (
                <div
                  key={fmn.id}
                  onClick={() => handleSelectFormation(fmn)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all font-sans text-xs ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/90 shadow-xl shadow-purple-950/40 ring-1 ring-purple-500/30'
                      : 'bg-[#050C10] border-[#162D38] hover:border-slate-600 text-slate-300 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ background: fmn.color }} />
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums px-2 py-0.5 rounded bg-[#020507] border border-[#162D38]">
                      {fmn.top_md_m ?? fmn.depth_top_md ?? 0}–{fmn.base_md_m ?? fmn.depth_bottom_md ?? 0}m MD
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1 font-sans">{fmn.canonical_name}</h3>
                  <p className="text-[10px] text-purple-300 mb-2 font-sans font-semibold">{fmn.group_name || 'Upper Assam Tertiary'}</p>
                  
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {fmn.lithology || 'Interbedded clastics, shales and sandstones.'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formation Inspection Card (5 cols) */}
          <div className="col-span-12 lg:col-span-5 bg-[#050C10] border-2 border-[#162D38] rounded-2xl p-5 font-sans text-xs space-y-4 shadow-2xl ring-1 ring-cyan-500/10">
            {selectedFormation ? (
              <>
                <div className="flex items-start justify-between border-b border-[#162D38] pb-3 font-sans">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 font-sans">
                      STRATIGRAPHIC DOSSIER · {selectedFormation.id}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5 font-sans">{selectedFormation.canonical_name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans">{selectedFormation.group_name}</p>
                  </div>
                  <span className="w-4 h-4 rounded-full shadow-md" style={{ background: selectedFormation.color }} />
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#020507] rounded-xl border border-[#162D38] space-y-1.5 shadow-inner">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Lithological Profile:</div>
                    <p className="text-slate-200 text-xs leading-relaxed">{selectedFormation.lithology}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                      <span className="text-[10px] text-slate-400">AVG ROP</span>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5 font-mono tabular-nums">{selectedFormation.rop_range || '8–18 m/hr'}</div>
                    </div>
                    <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] shadow-inner">
                      <span className="text-[10px] text-slate-400">SAFE MW WINDOW</span>
                      <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono tabular-nums">{selectedFormation.recommended_mw_ppg || '10.5–10.9 ppg'}</div>
                    </div>
                  </div>

                  {formationAnalytics && (
                    <div className="p-3.5 bg-[#020507] rounded-xl border border-[#162D38] space-y-2 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase text-slate-400 font-bold">Approved Historical Incidents:</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-300 font-bold text-xs">
                          {formationAnalytics.approved_event_count} Events
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(formationAnalytics.event_counts || {}).map(([name, count]) => (
                          <span key={name} className="px-2.5 py-1 rounded-lg bg-[#050C10] border border-[#162D38] text-slate-200 text-[11px]">
                            {name}: <strong className="text-cyan-400 font-mono tabular-nums">{count}</strong>
                          </span>
                        ))}
                      </div>

                      {formationAnalytics.total_npt_hrs && (
                        <div className="pt-2 border-t border-[#162D38]/80 text-[11px] flex justify-between text-slate-400">
                          <span>Total Formation NPT:</span>
                          <span className="text-red-400 font-bold font-mono tabular-nums">{formationAnalytics.total_npt_hrs} hrs (₹{((formationAnalytics.total_npt_cost_inr || 0)/10000000).toFixed(1)} Cr)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Select a formation from the left to view detailed geomechanical metrics.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 3: GEOMECHANICAL SAFE MUD WEIGHT WINDOWS */}
      {activeMetricTab === 'geomechanics' && (
        <div className="p-5 bg-[#050C10] border-2 border-[#162D38] rounded-2xl space-y-4 font-sans text-xs shadow-2xl ring-1 ring-cyan-500/10">
          <div className="flex items-center justify-between border-b border-[#162D38] pb-3 font-sans">
            <span className="font-bold text-white uppercase text-xs flex items-center gap-2 font-sans">
              <TrendingUp size={15} className="text-cyan-400" />
              Upper Assam Calibrated Pore Pressure & Fracture Gradient Corridor (PPFG)
            </span>
            <span className="text-[10px] text-slate-400 font-sans px-2.5 py-0.5 rounded bg-[#020507] border border-[#162D38]">Kumar & Talreja (2018) / Alam et al. (2019)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#162D38] text-slate-400 text-[10px] uppercase">
                  <th className="p-3">Formation Stratum</th>
                  <th className="p-3">Depth Interval</th>
                  <th className="p-3">Pore Pressure (PP)</th>
                  <th className="p-3">Safe Drilling MW Window</th>
                  <th className="p-3">Fracture Gradient (FG)</th>
                  <th className="p-3">Primary Wellbore Hazard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162D38]/60 text-[11px]">
                {[
                  { name: 'Alluvium / Dihing', depth: '0–300m', pp: '8.42 ppg', window: '9.0–9.5 ppg', fg: '12.5 ppg', hazard: 'Shallow gas pocket / washout' },
                  { name: 'Dhekiajuli', depth: '300–700m', pp: '8.42 ppg', window: '9.2–9.8 ppg', fg: '13.0 ppg', hazard: 'Porous freshwater sands' },
                  { name: 'Namsang', depth: '700–1,500m', pp: '8.45 ppg', window: '9.5–10.0 ppg', fg: '13.5 ppg', hazard: 'Gravel loss / tight hole' },
                  { name: 'Girujan Clay', depth: '1,500–2,200m', pp: '8.60 ppg', window: '10.5–10.9 ppg', fg: '14.0 ppg', hazard: 'Smectite swelling / Stuck pipe' },
                  { name: 'Tipam Sandstone', depth: '2,200–2,800m', pp: '8.50 ppg (depleted)', window: '10.2–10.6 ppg', fg: '13.8 ppg', hazard: 'Thief zone losses (TS-3)' },
                  { name: 'Barail Group', depth: '3,000–3,700m', pp: '11.0–12.3 ppg (overpressure)', window: '10.8–11.4 ppg', fg: '14.8 ppg', hazard: 'Gas kick / Coal caving' },
                  { name: 'Kopili Formation', depth: '3,700–4,000m', pp: '9.90 ppg', window: '10.15–10.8 ppg (NARROW)', fg: '13.8 ppg', hazard: 'Severe breakout (65% enlargement)' },
                  { name: 'Sylhet Limestone', depth: '4,000–4,200m', pp: '9.10 ppg (reversal)', window: '9.5–10.2 ppg', fg: '15.5 ppg', hazard: 'Hard abrasive drill bit wear' },
                  { name: 'Lakadong / Therria', depth: '4,200–4,500m', pp: '11.0 ppg', window: '11.0–12.3 ppg', fg: '14.0 ppg', hazard: 'Deep HP condensate kick' }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#020507] transition-colors">
                    <td className="p-3 font-bold text-white">{row.name}</td>
                    <td className="p-3 text-cyan-300 font-mono tabular-nums">{row.depth}</td>
                    <td className="p-3 text-red-300 font-bold font-mono tabular-nums">{row.pp}</td>
                    <td className="p-3 text-amber-300 font-bold font-mono tabular-nums">{row.window}</td>
                    <td className="p-3 text-slate-300 font-mono tabular-nums">{row.fg}</td>
                    <td className="p-3 text-slate-400">{row.hazard}</td>
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
