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
    <div className="space-y-4 font-sans text-secondary min-h-full pb-8">

      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border border-line rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-accent " />
            <h1 className=" font-bold tracking-tight text-ink flex items-center gap-2 page-title">
              <GitCompareArrows className="text-accent" size={20} />
              Compare Nearby Wells
            </h1>
          </div>
          <p className="text-xs text-muted">
            Side-by-side look at well depths, rock layers, drilling mud, and past issues
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">Comparing:</span>
          <span className="px-3 py-1.5 rounded-lg bg-surface-muted border border-line text-accent font-bold font-mono tabular-nums shadow-inner">
            {selectedIds.length} of 3 Wells
          </span>
        </div>
      </div>

      {/* 2. Clean Dropdown Selectors (Zero Button Clutter) */}
      <div className="p-3.5 bg-surface border border-line rounded-lg text-xs shadow-md">
        <div className="compare-selectors flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-secondary shrink-0">
            Select Wells to Compare:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-3xl">
            {/* Slot 1 (Target Well) */}
            <div className="flex items-center gap-2 bg-surface-muted border border-accent/25 rounded-lg px-3 py-2 shadow-inner">
              <span className="text-xs font-bold text-accent shrink-0">Well 1:</span>
              <select
                aria-label="Target well"
                value={selectedIds[0] || 'MOR-29'}
                onChange={(e) => {
                  const newIds = [...selectedIds];
                  newIds[0] = e.target.value;
                  setSelectedIds(newIds);
                }}
                className="bg-transparent text-ink text-xs font-semibold outline-none cursor-pointer w-full"
              >
                {wellsList.map(w => (
                  <option key={w.id} value={w.id} className="bg-surface text-ink">
                    {w.name} {w.id === 'MOR-29' ? ' (Active Rig)' : `(${w.field})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 2 (Offset Well) */}
            <div className="flex items-center gap-2 bg-surface-muted border border-line hover:border-line rounded-lg px-3 py-2 shadow-inner transition-colors">
              <span className="text-xs font-bold text-muted shrink-0">Well 2:</span>
              <select
                aria-label="First reference well"
                value={selectedIds[1] || 'MOR-07'}
                onChange={(e) => {
                  const newIds = [...selectedIds];
                  newIds[1] = e.target.value;
                  setSelectedIds(newIds);
                }}
                className="bg-transparent text-ink text-xs font-semibold outline-none cursor-pointer w-full"
              >
                {wellsList.map(w => (
                  <option key={w.id} value={w.id} className="bg-surface text-ink">
                    {w.name} ({w.field})
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 3 (Offset Well) */}
            <div className="flex items-center gap-2 bg-surface-muted border border-line hover:border-line rounded-lg px-3 py-2 shadow-inner transition-colors">
              <span className="text-xs font-bold text-muted shrink-0">Well 3:</span>
              <select
                aria-label="Second reference well"
                value={selectedIds[2] || 'NHK-162'}
                onChange={(e) => {
                  const newIds = [...selectedIds];
                  newIds[2] = e.target.value;
                  setSelectedIds(newIds);
                }}
                className="bg-transparent text-ink text-xs font-semibold outline-none cursor-pointer w-full"
              >
                {wellsList.map(w => (
                  <option key={w.id} value={w.id} className="bg-surface text-ink">
                    {w.name} ({w.field})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-danger-soft border border-danger/25 rounded-lg text-xs text-danger">
          {error}
        </div>
      )}

      {/* 2.5 Dynamic Time Warping (DTW) Stratigraphic Alignment Panel */}
      {dtwData && dtwData.dtw_metrics && (
        <div className="bg-surface border border-line rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2.5">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-accent" />
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                Dynamic Time Warping (DTW) Cross-Well Stratigraphic Alignment
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-brand/20 text-accent border border-accent/40 font-semibold">
                PRD §16.2
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-muted text-xs block">ALIGNMENT CONFIDENCE</span>
                <span className="text-success font-bold text-sm">
                  {dtwData.dtw_metrics.correlation_confidence_pct}%
                </span>
              </div>
              <div className="border-l border-line pl-3">
                <span className="text-muted text-xs block">AVERAGE STRUCTURAL DIP</span>
                <span className="text-accent font-bold text-sm">
                  {dtwData.dtw_metrics.average_depth_shift_m > 0 ? `+${dtwData.dtw_metrics.average_depth_shift_m}m` : `${dtwData.dtw_metrics.average_depth_shift_m}m`}
                </span>
              </div>
              <div className="border-l border-line pl-3 hidden sm:block">
                <span className="text-muted text-xs block">REGIME</span>
                <span className="text-warning font-bold text-xs">
                  {dtwData.dtw_metrics.structural_regime}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-secondary leading-relaxed bg-surface-muted p-2.5 rounded-lg border border-line">
            {dtwData.geological_interpretation}
          </p>

          {/* Horizon Table */}
          {dtwData.correlated_horizons && dtwData.correlated_horizons.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-xs text-muted uppercase font-semibold border-b border-line">
                    <th className="py-1.5 px-2">Formation Horizon</th>
                    <th className="py-1.5 px-2 font-mono">{dtwData.well_a?.name} Top</th>
                    <th className="py-1.5 px-2 font-mono">{dtwData.well_b?.name} Top</th>
                    <th className="py-1.5 px-2 font-mono">Dip Delta</th>
                    <th className="py-1.5 px-2">Direction</th>
                    <th className="py-1.5 px-2">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs">
                  {dtwData.correlated_horizons.slice(0, 5).map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-surface-muted">
                      <td className="py-1.5 px-2 font-medium text-secondary">{h.formation}</td>
                      <td className="py-1.5 px-2 font-mono text-accent">{h.well_a_top_md_m}m</td>
                      <td className="py-1.5 px-2 font-mono text-secondary">{h.well_b_top_md_m}m</td>
                      <td className="py-1.5 px-2 font-mono font-bold text-warning">
                        {h.depth_delta_m > 0 ? `+${h.depth_delta_m}m` : `${h.depth_delta_m}m`}
                      </td>
                      <td className="py-1.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          h.structural_direction === 'DOWNDIP' ? 'bg-accent-soft text-accent border border-accent/25' : 'bg-warning-soft text-warning border border-warning/25'
                        }`}>
                          {h.structural_direction}
                        </span>
                      </td>
                      <td className="py-1.5 px-2">
                        <span className="text-success font-bold text-xs">{h.correlation_grade}</span>
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
      <div className={`grid grid-cols-1 ${comparedWells.length > 2 ? 'md:grid-cols-2 xl:grid-cols-3' : comparedWells.length === 2 ? 'md:grid-cols-2' : ''} gap-5`}>
        {comparedWells.map((well) => {
          const isTargetWell = well.id === 'MOR-29';
          return (
            <div
              key={well.id}
              className={`bg-surface border rounded-lg p-4 font-sans text-xs space-y-3.5 shadow-sm transition-all ${
                isTargetWell ? 'border-accent ring-1 ring-[#0D5C75]/40' : 'border-line'
              }`}
            >
              {/* Card Header */}
              <div className="compare-card-header flex items-start justify-between border-b border-line pb-2.5">
                <div>
                  <span className={`text-xs uppercase font-bold tracking-wider ${
                    isTargetWell ? 'text-accent' : 'text-muted'
                  }`}>
                    {isTargetWell ? ' Current Active Rig' : 'Reference Well'}
                  </span>
                  <h2 className="text-lg font-bold text-ink mt-0.5">{well.name}</h2>
                  <p className="text-muted text-xs mt-0.5">{well.field} Field · {well.block || 'MOR-III'}</p>
                </div>

                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                  (well.status || '').toUpperCase().includes('ACTIVE') ? 'bg-brand/20 text-accent border border-accent/40' :
                  'bg-surface-muted text-secondary border border-line'
                }`}>
                  {isTargetWell ? 'ACTIVE' : 'COMPLETED'}
                </span>
              </div>

              {/* Operating Parameters List */}
              <div className="space-y-1.5 font-sans">
                <div className="p-2.5 bg-surface-muted rounded-lg border border-line flex justify-between items-center shadow-inner">
                  <span className="text-muted text-xs">Drilling Rig:</span>
                  <span className="text-ink font-mono font-bold text-xs">{well.rig || 'OIL-RIG-01'}</span>
                </div>

                <div className="p-2.5 bg-surface-muted rounded-lg border border-line flex justify-between items-center shadow-inner">
                  <span className="text-muted text-xs">Current Depth:</span>
                  <span className="text-accent font-bold font-mono tabular-nums text-xs">
                    {(well.current_depth_md_m ?? well.td_depth_md ?? 0).toFixed(0)} meters
                  </span>
                </div>

                <div className="p-2.5 bg-surface-muted rounded-lg border border-line flex justify-between items-center shadow-inner">
                  <span className="text-muted text-xs">Target Bottom:</span>
                  <span className="text-secondary font-mono tabular-nums text-xs">
                    {(well.target_depth_md_m ?? 3500.0).toFixed(0)} meters
                  </span>
                </div>

                <div className="p-2.5 bg-surface-muted rounded-lg border border-line flex justify-between items-center shadow-inner">
                  <span className="text-muted text-xs">Mud Weight:</span>
                  <span className="text-warning font-bold font-mono tabular-nums text-xs">
                    {well.mud_weight_ppg ?? 10.8} ppg
                  </span>
                </div>

                <div className="p-2.5 bg-surface-muted rounded-lg border border-line flex justify-between items-center shadow-inner">
                  <span className="text-muted text-xs">Bit & Casing Pipe:</span>
                  <span className="text-secondary text-xs">
                    <strong className="font-mono text-accent">{well.bit_size ?? '8-1/2"'}</strong> in <strong className="font-mono text-ink">{well.casing_shoe_md ?? 2200}m</strong>
                  </span>
                </div>

                <div className="p-2.5 bg-surface-muted rounded-lg border border-line flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-muted text-xs">Past Downtime (Delays):</span>
                    <div className="text-xs text-muted">Lost rig operating hours</div>
                  </div>
                  <span className={`font-bold font-mono tabular-nums text-xs ${
                    (well.total_npt_hrs ?? 0) > 100 ? 'text-danger' :
                    (well.total_npt_hrs ?? 0) > 20 ? 'text-warning' : 'text-success'
                  }`}>
                    {well.total_npt_hrs ?? 0} hours
                  </span>
                </div>
              </div>

              {/* Primary Hazard */}
              <div className="p-3 bg-surface-muted rounded-lg border border-line space-y-1 shadow-inner">
                <span className="text-xs text-warning font-bold flex items-center gap-1.5 uppercase">
                  <AlertTriangle size={12} className="text-warning" />
                  Main Recorded Issue / Hazard:
                </span>
                <p className="text-xs text-secondary leading-snug">
                  {getPlainHazard(well.primary_hazard)}
                </p>
              </div>

              {/* Underground Rock Layers */}
              <div className="space-y-1.5">
                <span className="text-xs text-muted uppercase font-bold tracking-wider">
                  Underground Rock Layers:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {(well.formation_tops || [
                    { formation: 'Alluvium / Dihing', top_md_m: 0 },
                    { formation: 'Girujan Clay', top_md_m: 1500 },
                    { formation: 'Tipam Sandstone', top_md_m: 2200 },
                    { formation: 'Barail Group', top_md_m: 3000 }
                  ]).map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-surface-muted border border-line text-xs">
                      <span className="text-secondary">{t.formation}</span>
                      <span className="text-accent font-bold font-mono tabular-nums">{t.top_md_m}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-line">
                <Link
                  href={`/well/${well.id}`}
                  className={`flex items-center justify-center gap-1.5 w-full py-2.5 font-semibold rounded-lg transition-colors text-xs shadow-sm ${
                    well.id === 'MOR-29'
                      ? 'bg-brand hover:bg-brand-hover text-ink border border-accent/40'
                      : 'bg-surface-muted hover:bg-surface-muted text-secondary border border-line'
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
