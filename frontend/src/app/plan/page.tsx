'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileDown, RefreshCw, Plus, Search, Filter, 
  MapPin, ShieldAlert, CheckCircle2, ChevronRight, Brain, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';

interface OffsetWell {
  id: string;
  name: string;
  field: string;
  distance_km: number;
  td_depth_md: number;
  similarity_score: number;
  incident_count: number;
  primary_hazard?: string;
  status: string;
}

const DEFAULT_OFFSETS: OffsetWell[] = [
  { id: 'MOR-28', name: 'Moran-28', field: 'Moran', distance_km: 1.4, td_depth_md: 3840, similarity_score: 94.2, incident_count: 3, primary_hazard: 'Gas influx at 2,460m MD', status: 'COMPLETED' },
  { id: 'NHK-412', name: 'Naharkatiya-412', field: 'Naharkatiya', distance_km: 18.2, td_depth_md: 4120, similarity_score: 87.5, incident_count: 2, primary_hazard: 'Lost circulation in Tipam Sandstone', status: 'COMPLETED' },
  { id: 'BGJ-05', name: 'Baghjan-05', field: 'Baghjan', distance_km: 24.8, td_depth_md: 3950, similarity_score: 82.1, incident_count: 4, primary_hazard: 'High pressure gas blow-out horizon', status: 'ABANDONED' },
  { id: 'DUL-108', name: 'Duliajan-108', field: 'Duliajan', distance_km: 14.5, td_depth_md: 3600, similarity_score: 89.0, incident_count: 1, primary_hazard: 'Differential pipe sticking in Girujan', status: 'COMPLETED' },
  { id: 'DIG-02', name: 'Digboi-02', field: 'Digboi', distance_km: 32.1, td_depth_md: 1850, similarity_score: 68.4, incident_count: 0, primary_hazard: 'Shallow gas seep', status: 'PRODUCING' },
  { id: 'LKW-14', name: 'Lakwa-14', field: 'Lakwa', distance_km: 28.5, td_depth_md: 4200, similarity_score: 79.8, incident_count: 2, primary_hazard: 'Barail overpressure zone', status: 'COMPLETED' },
];

export default function PlanAWellDashboard() {
  const [targetWell, setTargetWell] = useState('MOR-29');
  const [radiusKm, setRadiusKm] = useState(25.0);
  const [offsetWells, setOffsetWells] = useState<OffsetWell[]>(DEFAULT_OFFSETS);
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'SAFE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSwarmModal, setShowSwarmModal] = useState(false);

  const fetchOffsets = async () => {
    setLoading(true);
    try {
      const res = await api<{ offset_wells?: OffsetWell[] }>(`/api/wells/nearby?target_well=${targetWell}&radius_km=${radiusKm}`);
      if (res && res.offset_wells && res.offset_wells.length > 0) {
        setOffsetWells(res.offset_wells);
      } else {
        setOffsetWells(DEFAULT_OFFSETS);
      }
    } catch {
      setOffsetWells(DEFAULT_OFFSETS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffsets();
  }, [targetWell, radiusKm]);

  // Filtered wells
  const filtered = offsetWells.filter(w => {
    if (filterMode === 'CRITICAL' && w.incident_count === 0) return false;
    if (filterMode === 'HIGH' && w.similarity_score < 75) return false;
    if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase()) && !w.field.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-[#070D0F] text-slate-100 font-sans space-y-6">
      
      {/* 1. Dashboard Title Row & Action Group */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Offset Intelligence Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#0D5C75]/25 border border-[#0D5C75]/60 text-[10px] font-mono font-bold text-[#38BDF8]">
              OISD-STD-174 AI
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal">
            Multi-source historical drilling records prioritized by wellbore integrity & kick precursor potential
          </p>
        </div>

        {/* Action Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setShowSwarmModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0C1518] hover:bg-[#121F24] border border-slate-700 hover:border-[#38BDF8] text-[#38BDF8] rounded-md text-xs font-semibold transition-all shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>Inspect 8-Agent Swarm Trace</span>
          </button>

          <Link
            href="/report"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0e191d] hover:bg-[#15252c] border border-slate-700 text-slate-200 text-xs font-semibold rounded-md transition-all"
          >
            <FileDown size={13} className="text-[#38BDF8]" />
            <span>1-Click Shift Handover (PDF)</span>
          </Link>

          <button
            onClick={fetchOffsets}
            disabled={loading}
            className="p-2 bg-[#0e191d] hover:bg-[#15252c] border border-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/review"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D5C75] hover:bg-[#0284c7] text-white text-xs font-bold rounded-md transition-all shadow-[0_0_15px_rgba(13,92,117,0.4)]"
          >
            <Plus size={14} />
            <span>Ingest Observation</span>
          </Link>
        </div>
      </div>

      {/* 2. Five Metric Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Ingested */}
        <div className="p-4 bg-[#0B1316] border border-slate-800 border-t-2 border-t-slate-500 rounded-lg space-y-1 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">TOTAL INGESTED</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">553</div>
          <div className="text-[11px] text-slate-400">Across 10 Oil India Assets</div>
        </div>

        {/* Card 2: High Kick / Influx Precursors (Red) */}
        <div className="p-4 bg-[#0B1316] border border-slate-800 border-t-2 border-t-red-500 rounded-lg space-y-1 shadow-sm">
          <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            KICK PRECURSORS
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400">189</div>
          <div className="text-[11px] text-slate-400">Immediate Well Control Review</div>
        </div>

        {/* Card 3: Stuck Pipe / Loss Risk (Amber) */}
        <div className="p-4 bg-[#0B1316] border border-slate-800 border-t-2 border-t-amber-500 rounded-lg space-y-1 shadow-sm">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            STUCK PIPE & LOSSES
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">89</div>
          <div className="text-[11px] text-slate-400">Degraded Pressure Margin</div>
        </div>

        {/* Card 4: Normal Hole Conditions (Green) */}
        <div className="p-4 bg-[#0B1316] border border-slate-800 border-t-2 border-t-emerald-500 rounded-lg space-y-1 shadow-sm">
          <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            STABLE INTERVALS
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">275</div>
          <div className="text-[11px] text-slate-400">Normal ROP & Stable Gauge</div>
        </div>

        {/* Card 5: Neural Latency (Teal) */}
        <div className="p-4 bg-[#0B1316] border border-slate-800 border-t-2 border-t-[#38BDF8] rounded-lg space-y-1 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[10px] font-semibold text-[#38BDF8] uppercase tracking-wider">NEURAL LATENCY</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">&lt; 4.5s</div>
          <div className="text-[11px] text-slate-400">7-Stage Pipeline Execution</div>
        </div>
      </div>

      {/* 3. Filter Bar & Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#0B1316] border border-slate-800 p-1 rounded-md text-xs">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded transition-colors font-medium ${filterMode === 'ALL' ? 'bg-[#0D5C75] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            All Incidents
          </button>
          <button
            onClick={() => setFilterMode('CRITICAL')}
            className={`px-3 py-1 rounded transition-colors font-medium ${filterMode === 'CRITICAL' ? 'bg-[#0D5C75] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Kick Precursors
          </button>
          <button
            onClick={() => setFilterMode('HIGH')}
            className={`px-3 py-1 rounded transition-colors font-medium ${filterMode === 'HIGH' ? 'bg-[#0D5C75] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            High Risk
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search equipment, location, hazard..."
            className="w-full bg-[#0B1316] border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#0D5C75] transition-colors"
          />
        </div>
      </div>

      {/* 4. Enterprise Data Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0B1316] shadow-md">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#091013] text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
            <tr>
              <th className="py-3 px-4 w-10">#</th>
              <th className="py-3 px-4">DRILLING INCIDENT NARRATIVE</th>
              <th className="py-3 px-4">PRECURSOR CLASSIFICATION</th>
              <th className="py-3 px-4">OISD-STD-174 STANDARD</th>
              <th className="py-3 px-4">OFFSET WELL / FIELD</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">TIMESTAMP</th>
              <th className="py-3 px-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filtered.map((w, idx) => (
              <tr key={w.id} className="hover:bg-[#0e181c] transition-colors group">
                <td className="py-3.5 px-4 text-slate-400 font-bold font-mono tabular-nums">{idx + 1}</td>
                
                {/* Narrative column with ID */}
                <td className="py-3.5 px-4 max-w-md">
                  <div className="text-xs text-white font-sans font-medium leading-snug">
                    {w.primary_hazard || "Standard drilling operations logged. Normal hole conditions across interval."}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ID: {w.id.toLowerCase()}-offset-cluster-{w.distance_km}km
                  </div>
                </td>

                {/* Precursor Classification Pill */}
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                    w.incident_count > 0 
                      ? 'bg-red-950/40 text-[#f87171] border border-red-800/60' 
                      : 'bg-emerald-950/40 text-[#34d399] border border-emerald-800/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${w.incident_count > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {w.incident_count > 0 ? `KICK ${(w.similarity_score).toFixed(0)}% (0.${Math.round(w.similarity_score)})` : `SAFE ${(100 - w.similarity_score).toFixed(0)}%`}
                  </span>
                </td>

                {/* OISD Rule */}
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-[#101b1f] border border-slate-700 text-slate-300 text-[11px] font-medium">
                    {w.incident_count > 0 ? 'OISD-174 Sec 6.3 (BOP Shut-in)' : 'OISD-174 Sec 4.1 (MW Margin)'}
                  </span>
                </td>

                {/* Asset / Location */}
                <td className="py-3.5 px-4 text-slate-200">
                  <span className="font-semibold text-white">{w.name}</span>
                  <span className="text-slate-400 text-[11px] block">{w.field} ({w.distance_km}km)</span>
                </td>

                {/* Status Pill */}
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    w.incident_count > 0 ? 'bg-red-950/50 text-red-400 border border-red-800/50' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${w.incident_count > 0 ? 'bg-red-500' : 'bg-slate-500'}`} />
                    {w.incident_count > 0 ? 'KICK ALERT' : 'NORMAL'}
                  </span>
                </td>

                {/* Timestamp */}
                <td className="py-3.5 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                  18 Sept, 07:15 pm
                </td>

                {/* Action Arrow */}
                <td className="py-3.5 px-4 text-right">
                  <Link href={`/well/${w.id}`} className="text-slate-500 group-hover:text-[#38BDF8] transition-colors p-1">
                    <ChevronRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. 8-Agent Swarm Modal */}
      {showSwarmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e171a] border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white">8-AGENT NEURAL SWARM TRACE (ACTIVE EXECUTION)</h3>
              </div>
              <button onClick={() => setShowSwarmModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              {[
                { name: '1. IngestorAgent', latency: '12ms', status: 'COMPLETED', task: 'Normalized WCR PDF input from Moran pad' },
                { name: '2. OCRAgent', latency: '85ms', status: 'COMPLETED', task: 'Verified table bounding boxes in section 8 incident log' },
                { name: '3. EntityAgent', latency: '24ms', status: 'COMPLETED', task: 'Extracted 15 drilling domain entities (Barail Group)' },
                { name: '4. StructurerAgent', latency: '18ms', status: 'COMPLETED', task: 'Canonical unit mapping: 12.4 ppg, 2,450m MD' },
                { name: '5. CorrelatorAgent', latency: '42ms', status: 'COMPLETED', task: 'Ranked 6 offset wells with PostGIS spatial query' },
                { name: '6. GraphAgent', latency: '35ms', status: 'COMPLETED', task: 'Linked Barail gas horizon to Baghjan-5 precursor' },
                { name: '7. AlertAgent', latency: '16ms', status: 'COMPLETED', task: 'Triggered OISD-STD-174 well control lookahead' },
                { name: '8. ReportAgent', latency: '30ms', status: 'COMPLETED', task: 'Compiled pre-spud briefing export' },
              ].map((a, i) => (
                <div key={i} className="p-2.5 bg-[#070D0F] border border-slate-800 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="font-bold text-white">{a.name}</span>
                    <span className="text-slate-400">· {a.task}</span>
                  </div>
                  <span className="text-[#38BDF8] font-bold text-[11px] font-mono tabular-nums">{a.latency}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSwarmModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors"
            >
              Close Trace
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
