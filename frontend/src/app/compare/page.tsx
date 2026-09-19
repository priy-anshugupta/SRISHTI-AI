'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitCompareArrows, Check, RefreshCw, Layers, ShieldAlert, 
  Clock, DollarSign, ExternalLink, ArrowRight, AlertTriangle
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
  casing_strings?: { size: string; set_depth_m: number; type: string }[];
  formation_tops?: { formation: string; top_md_m: number }[];
};

export default function ComparePage() {
  const [wellsList, setWellsList] = useState<{ id: string; name: string; field: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(['MOR-29', 'MOR-07', 'NHK-162']);
  const [comparedWells, setComparedWells] = useState<WellDetail[]>([]);
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
            casing_strings: res.casing_strings || w.casing_strings,
          };
        });
      setComparedWells(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load well comparison data.');
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
    <div className="space-y-5 font-sans text-slate-100 min-h-full">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <GitCompareArrows className="text-cyan-400" size={20} />
              Cross-Well Offset Comparison Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Side-by-side casing programs, formation tops, mud windows, and historical NPT benchmarking
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Comparing:</span>
          <span className="px-3 py-1.5 rounded-xl bg-[#020507] border border-[#162D38] text-cyan-300 font-bold font-mono tabular-nums shadow-inner">
            {selectedIds.length} of 3 Wells
          </span>
        </div>
      </div>

      {/* 2. Well Selection Pills */}
      <div className="p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl text-xs space-y-2.5 shadow-md">
        <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center justify-between">
          <span>Select 2 or 3 Wells to Benchmark:</span>
          <span className="text-slate-500">Click to toggle</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {wellsList.map(w => {
            const isSelected = selectedIds.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggleSelectWell(w.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/70 font-bold shadow-md'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-600'
                }`}
              >
                {isSelected && <Check size={12} className="text-cyan-400" />}
                <span>{w.name}</span>
                <span className="text-[10px] text-slate-500">({w.field})</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 3. Side-by-Side Comparison Columns */}
      <div className={`grid grid-cols-1 md:grid-cols-${comparedWells.length} gap-4`}>
        {comparedWells.map((well) => {
          const isTargetWell = well.id === 'MOR-29';
          return (
            <div
              key={well.id}
              className={`bg-[#050C10] border-2 rounded-2xl p-5 font-sans text-xs space-y-4 shadow-xl transition-all ${
                isTargetWell ? 'border-cyan-500/80 shadow-cyan-950/40 ring-1 ring-cyan-500/20' : 'border-[#162D38]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#162D38] pb-3 font-sans">
                <div>
                  {isTargetWell && (
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-sans">
                      ★ Active Monitoring Target
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-white mt-0.5 font-sans">{well.name}</h2>
                  <p className="text-slate-400 text-xs mt-0.5 font-sans">{well.field} Field · {well.block || 'Block I'}</p>
                </div>

                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                  (well.status || '').toUpperCase().includes('ACTIVE') ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800 animate-pulse' :
                  (well.status || '').toUpperCase().includes('CRITICAL') ? 'bg-red-950/70 text-red-300 border border-red-800' :
                  'bg-[#020507] text-slate-300 border border-[#162D38]'
                }`}>
                  {well.status || 'ACTIVE DRILLING'}
                </span>
              </div>

              {/* Operating Parameters Grid */}
              <div className="space-y-2 font-sans">
                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] flex justify-between shadow-inner">
                  <span className="text-slate-400">OPERATING RIG:</span>
                  <span className="text-white font-mono font-bold">{well.rig || 'OIL-RIG-01'}</span>
                </div>

                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] flex justify-between shadow-inner">
                  <span className="text-slate-400">CURRENT DEPTH (MD):</span>
                  <span className="text-cyan-300 font-bold font-mono tabular-nums">
                    {(well.current_depth_md_m ?? well.td_depth_md ?? 0).toFixed(1)}m MD
                  </span>
                </div>

                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] flex justify-between shadow-inner">
                  <span className="text-slate-400">TARGET DEPTH:</span>
                  <span className="text-slate-200 font-mono tabular-nums">{(well.target_depth_md_m ?? 3500.0).toFixed(1)}m MD</span>
                </div>

                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] flex justify-between shadow-inner">
                  <span className="text-slate-400">MUD WEIGHT:</span>
                  <span className="text-amber-300 font-bold font-mono tabular-nums">{well.mud_weight_ppg ?? 10.8} ppg</span>
                </div>

                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] flex justify-between shadow-inner">
                  <span className="text-slate-400">BIT SIZE / SHOE:</span>
                  <span className="text-slate-200"><span className="font-mono">{well.bit_size ?? '8-1/2"'}</span> @ <span className="font-mono tabular-nums">{well.casing_shoe_md ?? 2200}m</span></span>
                </div>

                <div className="p-2.5 bg-[#020507] rounded-xl border border-[#162D38] flex justify-between shadow-inner">
                  <span className="text-slate-400">HISTORICAL NPT:</span>
                  <span className={`font-bold font-mono tabular-nums ${
                    (well.total_npt_hrs ?? 0) > 100 ? 'text-red-400' :
                    (well.total_npt_hrs ?? 0) > 20 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {well.total_npt_hrs ?? 0} hrs
                  </span>
                </div>
              </div>

              {/* Primary Hazard Narrative */}
              <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] space-y-1 font-sans shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 font-sans">
                  <AlertTriangle size={12} className="text-amber-400" />
                  Primary Recorded Hazard:
                </span>
                <p className="text-[11px] text-slate-300 leading-snug font-sans">
                  {well.primary_hazard || 'None recorded during active interval.'}
                </p>
              </div>

              {/* Formation Tops Sequence Preview */}
              <div className="space-y-1.5 font-sans">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Formation Tops Column:</span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-sans">
                  {(well.formation_tops || [
                    { formation: 'Alluvium / Dihing', top_md_m: 0 },
                    { formation: 'Girujan Clay', top_md_m: 1500 },
                    { formation: 'Tipam Sandstone', top_md_m: 2200 },
                    { formation: 'Barail Group', top_md_m: 3000 }
                  ]).map((t, i) => (
                    <div key={i} className="flex justify-between p-2 rounded-lg bg-[#020507] border border-[#162D38] text-[11px] font-sans">
                      <span className="text-slate-300">{t.formation}</span>
                      <span className="text-cyan-300 font-bold font-mono tabular-nums">{t.top_md_m}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-[#162D38] font-sans">
                <Link
                  href={`/well/${well.id}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#0D5C75] hover:bg-[#147695] text-white font-semibold rounded-xl transition-colors text-xs font-sans shadow-md"
                >
                  <span>Open Full Well Dossier</span>
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
