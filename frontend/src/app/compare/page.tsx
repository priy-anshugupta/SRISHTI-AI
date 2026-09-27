'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitCompareArrows, Check, RefreshCw, Layers, ShieldAlert, 
  Clock, ExternalLink, AlertTriangle, Zap, Compass, ArrowUpDown
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

type WellDetail = {
  id: string;
  name: string;
  field: string;
  block: string;
  status: string;
  rig: string;
  well_type: string;
  current_depth_md_m?: number;
  target_depth_md_m?: number;
  td_depth_md?: number;
  current_formation?: string;
  mud_weight_ppg?: number;
  bit_size?: string;
  casing_shoe_md?: number;
  total_npt_hrs?: number;
  primary_hazard?: string;
  formation_tops?: { formation: string; top_md_m: number }[];
};

// Plain English mapping for complex technical hazards
function getPlainHazard(raw: string | undefined): string {
  if (!raw) return 'No major issues recorded.';
  if (raw.includes('Precursor Horizon')) return 'High-pressure gas kick expected at 2,450m.';
  if (raw.includes('Differential Sticking')) return 'Stuck drill pipe against borehole wall at 1,680m in Girujan Clay.';
  if (raw.includes('Lost Circulation')) return 'Drilling mud leaked into fractured sandstone at 2,540m.';
  if (raw.includes('Borehole Breakout')) return 'Wellbore wall collapse at 3,780m due to high pressure.';
  return raw;
}

export default function ComparePage() {
  const [wellsList, setWellsList] = useState<{ id: string; name: string; field: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(['MOR-29', 'MOR-07', 'NHK-162']);
  const [comparedWells, setComparedWells] = useState<WellDetail[]>([]);
  const [dtwData, setDtwData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch fleet list on mount
  useEffect(() => {
    async function init() {
      try {
        const res = await api<{ wells: { id: string; name: string; field: string }[] }>('/api/wells');
        if (res && res.wells) {
          setWellsList(res.wells);
        }
      } catch (err) {
        // ignore
      }
    }
    init();
  }, []);

  // 2. Fetch full details for selected wells
  const loadComparison = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const promises = ids.map(id => api<any>(`/api/wells/${id}`));
      const results = await Promise.all(promises);
      const normalized: WellDetail[] = results
        .filter(Boolean)
        .map(res => {
          const w = res.well || res;
          const rawTops = res.formation_tops || w.formation_tops || [];
          const formationTops = rawTops.map((ft: any) => ({
            formation: ft.formations?.canonical_name || ft.formation || 'Unknown',
            top_md_m: ft.top_md_m ?? ft.depth_top_md ?? 0,
          }));

          return {
            id: w.id || res.id || '',
            name: w.name || res.name || 'Unknown Well',
            field: w.field || res.field || 'Upper Assam',
            block: w.block || res.block || '',
            status: w.status || res.status || 'ACTIVE DRILLING',
            rig: w.rig || res.rig || 'OIL-RIG-01',
            well_type: w.well_type || res.well_type || 'Development',
            current_depth_md_m: w.current_depth_md_m ?? w.td_depth_md ?? res.current_depth_md_m ?? 0,
            target_depth_md_m: w.target_depth_md_m ?? w.target_depth_md ?? res.target_depth_md_m ?? 3500,
            td_depth_md: w.td_depth_md ?? res.td_depth_md ?? 0,
            mud_weight_ppg: w.mud_weight_ppg ?? res.mud_weight_ppg ?? 10.8,
            bit_size: w.bit_size ?? res.bit_size ?? '8-1/2"',
            casing_shoe_md: w.casing_shoe_md ?? res.casing_shoe_md ?? 2200,
            total_npt_hrs: w.total_npt_hrs ?? res.total_npt_hrs ?? 0,
            primary_hazard: w.primary_hazard ?? res.primary_hazard ?? 'None recorded during active interval.',
            formation_tops: formationTops.length > 0 ? formationTops : undefined,
          };
        });
      setComparedWells(normalized);

      // Fetch DTW Stratigraphic alignment between first two wells
      if (ids.length >= 2) {
        api<any>(`/api/formations/dtw/${ids[0]}/${ids[1]}`)
          .then(dtwRes => setDtwData(dtwRes))
          .catch(() => setDtwData(null));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComparison(selectedIds);
  }, [selectedIds, loadComparison]);

  const toggleSelectWell = (wellId: string) => {
    if (selectedIds.includes(wellId)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(id => id !== wellId));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, wellId]);
      } else {
        // replace the last one
        setSelectedIds([selectedIds[0], selectedIds[1], wellId]);
      }
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-100 min-h-full pb-8">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0D1419] border border-[#1C2C35] rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 " />
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <GitCompareArrows className="text-[#38BDF8]" size={20} />
              Compare Nearby Wells
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Side-by-side look at well depths, rock layers, drilling mud, and past issues
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Comparing:</span>
          <span className="px-3 py-1.5 rounded-xl bg-[#0A1115] border border-[#1C2C35] text-[#38BDF8] font-bold font-mono tabular-nums shadow-inner">
            {selectedIds.length} of 3 Wells
          </span>
        </div>
      </div>

      {/* 2. Clean Dropdown Selectors (Zero Button Clutter) */}
      <div className="p-3.5 bg-[#0D1419] border border-[#1C2C35] rounded-xl text-xs shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-300 shrink-0">
            Select Wells to Compare:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-3xl">
            {/* Slot 1 (Target Well) */}
            <div className="flex items-center gap-2 bg-[#0A1115] border border-cyan-500/60 rounded-xl px-3 py-2 shadow-inner">
              <span className="text-xs font-bold text-[#38BDF8] shrink-0">Well 1:</span>
              <select
                value={selectedIds[0] || 'MOR-29'}
                onChange={(e) => {
                  const newIds = [...selectedIds];
                  newIds[0] = e.target.value;
                  setSelectedIds(newIds);
                }}
                className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer w-full"
              >
                {wellsList.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#0D1419] text-white">
                    {w.name} {w.id === 'MOR-29' ? '★ (Active Rig)' : `(${w.field})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 2 (Offset Well) */}
            <div className="flex items-center gap-2 bg-[#0A1115] border border-[#1C2C35] hover:border-slate-500 rounded-xl px-3 py-2 shadow-inner transition-colors">
              <span className="text-xs font-bold text-slate-400 shrink-0">Well 2:</span>
              <select
                value={selectedIds[1] || 'MOR-07'}
                onChange={(e) => {
                  const newIds = [...selectedIds];
                  newIds[1] = e.target.value;
                  setSelectedIds(newIds);
                }}
                className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer w-full"
              >
                {wellsList.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#0D1419] text-white">
                    {w.name} ({w.field})
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 3 (Offset Well) */}
            <div className="flex items-center gap-2 bg-[#0A1115] border border-[#1C2C35] hover:border-slate-500 rounded-xl px-3 py-2 shadow-inner transition-colors">
              <span className="text-xs font-bold text-slate-400 shrink-0">Well 3:</span>
              <select
                value={selectedIds[2] || 'NHK-162'}
                onChange={(e) => {
                  const newIds = [...selectedIds];
                  newIds[2] = e.target.value;
                  setSelectedIds(newIds);
                }}
                className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer w-full"
              >
                {wellsList.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#0D1419] text-white">
                    {w.name} ({w.field})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 2.5 Dynamic Time Warping (DTW) Stratigraphic Alignment Panel */}
      {dtwData && dtwData.dtw_metrics && (
        <div className="bg-[#0D1419] border border-[#1C2C35] rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2C35] pb-2.5">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#38BDF8]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Dynamic Time Warping (DTW) Cross-Well Stratigraphic Alignment
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#0D5C75]/20 text-[#38BDF8] border border-[#0D5C75]/40 font-semibold">
                PRD §16.2
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-xs block">ALIGNMENT CONFIDENCE</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {dtwData.dtw_metrics.correlation_confidence_pct}%
                </span>
              </div>
              <div className="border-l border-[#1C2C35] pl-3">
                <span className="text-slate-400 text-xs block">AVERAGE STRUCTURAL DIP</span>
                <span className="text-[#38BDF8] font-bold text-sm">
                  {dtwData.dtw_metrics.average_depth_shift_m > 0 ? `+${dtwData.dtw_metrics.average_depth_shift_m}m` : `${dtwData.dtw_metrics.average_depth_shift_m}m`}
                </span>
              </div>
              <div className="border-l border-[#1C2C35] pl-3 hidden sm:block">
                <span className="text-slate-400 text-xs block">REGIME</span>
                <span className="text-amber-300 font-bold text-xs">
                  {dtwData.dtw_metrics.structural_regime}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#0A1115] p-2.5 rounded-xl border border-[#1C2C35]">
            {dtwData.geological_interpretation}
          </p>

          {/* Horizon Table */}
          {dtwData.correlated_horizons && dtwData.correlated_horizons.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase font-semibold border-b border-[#1C2C35]">
                    <th className="py-1.5 px-2">Formation Horizon</th>
                    <th className="py-1.5 px-2 font-mono">{dtwData.well_a?.name} Top</th>
                    <th className="py-1.5 px-2 font-mono">{dtwData.well_b?.name} Top</th>
                    <th className="py-1.5 px-2 font-mono">Dip Delta</th>
                    <th className="py-1.5 px-2">Direction</th>
                    <th className="py-1.5 px-2">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2C35] text-xs">
                  {dtwData.correlated_horizons.slice(0, 5).map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-[#111B21]">
                      <td className="py-1.5 px-2 font-medium text-slate-200">{h.formation}</td>
                      <td className="py-1.5 px-2 font-mono text-[#38BDF8]">{h.well_a_top_md_m}m</td>
                      <td className="py-1.5 px-2 font-mono text-slate-300">{h.well_b_top_md_m}m</td>
                      <td className="py-1.5 px-2 font-mono font-bold text-amber-300">
                        {h.depth_delta_m > 0 ? `+${h.depth_delta_m}m` : `${h.depth_delta_m}m`}
                      </td>
                      <td className="py-1.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          h.structural_direction === 'DOWNDIP' ? 'bg-cyan-500/10 text-[#38BDF8] border border-cyan-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}>
                          {h.structural_direction}
                        </span>
                      </td>
                      <td className="py-1.5 px-2">
                        <span className="text-emerald-400 font-bold text-xs">{h.correlation_grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Side-by-Side Comparison Columns */}
      <div className={`grid grid-cols-1 md:grid-cols-${comparedWells.length} gap-4`}>
        {comparedWells.map((well) => {
          const isTargetWell = well.id === 'MOR-29';
          return (
            <div
              key={well.id}
              className={`bg-[#0D1419] border rounded-xl p-4 font-sans text-xs space-y-3.5 shadow-sm transition-all ${
                isTargetWell ? 'border-[#0D5C75] ring-1 ring-[#0D5C75]/40' : 'border-[#1C2C35]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-[#1C2C35] pb-2.5">
                <div>
                  <span className={`text-xs uppercase font-bold tracking-wider ${
                    isTargetWell ? 'text-[#38BDF8]' : 'text-slate-400'
                  }`}>
                    {isTargetWell ? '★ Current Active Rig' : 'Reference Well'}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{well.name}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{well.field} Field · {well.block || 'MOR-III'}</p>
                </div>

                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                  (well.status || '').toUpperCase().includes('ACTIVE') ? 'bg-[#0D5C75]/20 text-[#38BDF8] border border-[#0D5C75]/40' :
                  'bg-[#0A1115] text-slate-300 border border-[#1C2C35]'
                }`}>
                  {isTargetWell ? 'ACTIVE' : 'COMPLETED'}
                </span>
              </div>

              {/* Operating Parameters List */}
              <div className="space-y-1.5 font-sans">
                <div className="p-2.5 bg-[#0A1115] rounded-xl border border-[#1C2C35] flex justify-between items-center shadow-inner">
                  <span className="text-slate-400 text-xs">Drilling Rig:</span>
                  <span className="text-white font-mono font-bold text-xs">{well.rig || 'OIL-RIG-01'}</span>
                </div>

                <div className="p-2.5 bg-[#0A1115] rounded-xl border border-[#1C2C35] flex justify-between items-center shadow-inner">
                  <span className="text-slate-400 text-xs">Current Depth:</span>
                  <span className="text-[#38BDF8] font-bold font-mono tabular-nums text-xs">
                    {(well.current_depth_md_m ?? well.td_depth_md ?? 0).toFixed(0)} meters
                  </span>
                </div>

                <div className="p-2.5 bg-[#0A1115] rounded-xl border border-[#1C2C35] flex justify-between items-center shadow-inner">
                  <span className="text-slate-400 text-xs">Target Bottom:</span>
                  <span className="text-slate-200 font-mono tabular-nums text-xs">
                    {(well.target_depth_md_m ?? 3500.0).toFixed(0)} meters
                  </span>
                </div>

                <div className="p-2.5 bg-[#0A1115] rounded-xl border border-[#1C2C35] flex justify-between items-center shadow-inner">
                  <span className="text-slate-400 text-xs">Mud Weight:</span>
                  <span className="text-amber-300 font-bold font-mono tabular-nums text-xs">
                    {well.mud_weight_ppg ?? 10.8} ppg
                  </span>
                </div>

                <div className="p-2.5 bg-[#0A1115] rounded-xl border border-[#1C2C35] flex justify-between items-center shadow-inner">
                  <span className="text-slate-400 text-xs">Bit & Casing Pipe:</span>
                  <span className="text-slate-200 text-xs">
                    <strong className="font-mono text-[#38BDF8]">{well.bit_size ?? '8-1/2"'}</strong> in <strong className="font-mono text-white">{well.casing_shoe_md ?? 2200}m</strong>
                  </span>
                </div>

                <div className="p-2.5 bg-[#0A1115] rounded-xl border border-[#1C2C35] flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-slate-400 text-xs">Past Downtime (Delays):</span>
                    <div className="text-xs text-slate-500">Lost rig operating hours</div>
                  </div>
                  <span className={`font-bold font-mono tabular-nums text-xs ${
                    (well.total_npt_hrs ?? 0) > 100 ? 'text-red-400' :
                    (well.total_npt_hrs ?? 0) > 20 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {well.total_npt_hrs ?? 0} hours
                  </span>
                </div>
              </div>

              {/* Primary Hazard */}
              <div className="p-3 bg-[#0A1115] rounded-xl border border-[#1C2C35] space-y-1 shadow-inner">
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5 uppercase">
                  <AlertTriangle size={12} className="text-amber-400" />
                  Main Recorded Issue / Hazard:
                </span>
                <p className="text-xs text-slate-200 leading-snug">
                  {getPlainHazard(well.primary_hazard)}
                </p>
              </div>

              {/* Underground Rock Layers */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Underground Rock Layers:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {(well.formation_tops || [
                    { formation: 'Alluvium / Dihing', top_md_m: 0 },
                    { formation: 'Girujan Clay', top_md_m: 1500 },
                    { formation: 'Tipam Sandstone', top_md_m: 2200 },
                    { formation: 'Barail Group', top_md_m: 3000 }
                  ]).map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-[#0A1115] border border-[#1C2C35] text-xs">
                      <span className="text-slate-300">{t.formation}</span>
                      <span className="text-[#38BDF8] font-bold font-mono tabular-nums">{t.top_md_m}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[#1C2C35]">
                <Link
                  href={`/well/${well.id}`}
                  className={`flex items-center justify-center gap-1.5 w-full py-2.5 font-semibold rounded-xl transition-colors text-xs shadow-sm ${
                    well.id === 'MOR-29'
                      ? 'bg-[#0D5C75] hover:bg-[#0F6D8A] text-white border border-[#0D5C75]/40'
                      : 'bg-[#111B21] hover:bg-[#1A2732] text-slate-200 border border-[#1C2C35]'
                  }`}
                >
                  <span>{well.id === 'MOR-29' ? 'View Active Rig (MOR-29)' : `View Dossier (${well.name})`}</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
