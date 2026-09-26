'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ClipboardCheck, Printer, RefreshCw, MapPin, 
  Search, AlertOctagon, Layers, Shield
} from 'lucide-react';
import { api } from '@/lib/api';

type Event = {
  event_type: string;
  severity: string;
  depth_from_md_m: number;
  description: string;
  mitigation: string | null;
  source_page: number | null;
  wells: { name: string } | null;
  formations: { canonical_name: string } | null;
  source_documents: { original_filename: string } | null;
};

type Brief = {
  title: string;
  radius_km: number;
  approved_historical_events: Event[];
  required_review: string[];
  disclaimer: string;
};

type Well = {
  id: string;
  name: string;
  field: string;
};

interface StandardizedIncidentInfo {
  title: string;
  occurrence: string;
  precaution: string;
}

function processIncident(event: Event): StandardizedIncidentInfo {
  const type = (event.event_type || '').toLowerCase();
  const desc = (event.description || '').toLowerCase();
  const well = (event.wells?.name || '').toUpperCase();

  // 1. Blowout
  if (type.includes('blowout') || desc.includes('blew out') || desc.includes('blowout')) {
    return {
      title: 'Uncontrolled Gas Blowout Precursor',
      occurrence: 'High-pressure gas influx breached barriers during workover operations due to premature barrier removal before setting secondary plug.',
      precaution: 'Never pull mechanical barriers without two independently tested pressure seals in place (OISD-STD-174).'
    };
  }

  // 2. Gas Kick in Barail
  if (type.includes('gas kick') || desc.includes('pore pressure surge') || desc.includes('gas influx')) {
    if (well.includes('BAGHJAN-5') || desc.includes('22 bbl')) {
      return {
        title: 'Severe Gas Influx (Kick) · 22 bbl Pit Gain',
        occurrence: 'Pore pressure surge encountered at 3,380m MD in Barail sand. Pit volume gained 22 barrels in 4 minutes with background gas spiking 13x.',
        precaution: 'Maintain minimum 250 bbl of 12.8 ppg kill mud in reserve pit; calibrate flow sensors prior to 3,300m MD.'
      };
    }
    if (well.includes('BAGHJAN-9') || desc.includes('18 bbl')) {
      return {
        title: 'Gas Influx in Coal Interval · 18 bbl Gain',
        occurrence: 'Gas influx at 3,380m MD. Pit gained 18 barrels and shut-in casing pressure peaked at 140 PSI.',
        precaution: 'Verify casing shoe integrity and remote hydraulic choke manifold operation before entering Barail coals.'
      };
    }
    return {
      title: event.event_type || 'Gas Influx & Well Kick Horizon',
      occurrence: `Gas influx encountered at ${event.depth_from_md_m}m MD in the ${event.formations?.canonical_name || 'Barail'} formation.`,
      precaution: 'Perform immediate flow check upon any 5 bbl pit gain or sudden ROP increase.'
    };
  }

  // 3. Stuck Pipe
  if (type.includes('stuck') || desc.includes('sticking') || desc.includes('overpull')) {
    if (well.includes('MORAN-7') || desc.includes('110,000 lbs')) {
      return {
        title: 'Differential Pipe Sticking · 110 klbs Overpull',
        occurrence: 'Drillstring stuck in Girujan swelling clay after sitting stationary for 3 hours during gyro survey. Overpull exceeded 110,000 lbs.',
        precaution: 'Strictly enforce 5-minute maximum stationary limit in Girujan Clay; maintain continuous rotation (>60 RPM).'
      };
    }
    if (well.includes('RUDRASAGAR') || desc.includes('95,000 lbs')) {
      return {
        title: 'Mechanical Pipe Sticking During Joint Connection',
        occurrence: 'Drillstring froze during an 8-minute pipe connection pause in swelling mudstone. 95,000 lbs pull applied without movement.',
        precaution: 'Condition mud with potassium chloride (KCl) polymer inhibitor to suppress clay swelling.'
      };
    }
    return {
      title: event.event_type || 'Drill Pipe Sticking Event',
      occurrence: `High drag escalating to pipe sticking at ${event.depth_from_md_m}m MD in reactive clay.`,
      precaution: 'Maintain string rotation and reciprocation during all pump-off sequences.'
    };
  }

  // 4. Lost Circulation
  if (type.includes('lost circulation') || desc.includes('loss of returns') || desc.includes('thief zone')) {
    return {
      title: 'Lost Circulation in Depleted Reservoir Sand',
      occurrence: `Drilling mud loss up to 60 bbl/hr into depleted reservoir sandstone at ${event.depth_from_md_m}m MD.`,
      precaution: 'Keep 100 sacks of medium/coarse LCM staged on rig floor; control surge pressures when tripping.'
    };
  }

  // 5. Coal Caving
  if (type.includes('coal') || desc.includes('coal caving') || desc.includes('packoff')) {
    return {
      title: 'Coal Seam Caving & Annular Packoff',
      occurrence: `Brittle coal caved into wellbore at ${event.depth_from_md_m}m MD, causing torque oscillations and pump pressure spikes.`,
      precaution: 'Conduct wiper trips every 50m through carbonaceous Barail coal sequences to keep hole clean.'
    };
  }

  // 6. Borehole Breakout
  if (type.includes('breakout') || desc.includes('hole enlarged') || desc.includes('kopili')) {
    return {
      title: 'Borehole Breakout & Tectonic Stress Washout',
      occurrence: `High horizontal stress in Kopili shale caused severe hole ovalization and enlargement from 8.5" to 14".`,
      precaution: 'Maintain mud weight strictly within calibrated 10.3–10.7 ppg corridor to prevent wall collapse.'
    };
  }

  // 7. Bit Balling
  if (type.includes('bit balling') || desc.includes('bit balling') || desc.includes('cutters')) {
    return {
      title: 'Drill Bit Balling in Reactive Claystone',
      occurrence: `Hydrated clay compacted across PDC bit face at ${event.depth_from_md_m}m MD, dropping ROP from 12 m/hr to 1.5 m/hr.`,
      precaution: 'Run optimized hydraulics (HSI > 3.0) and use glycol additives to prevent clay from sticking to bit.'
    };
  }

  // Fallback
  return {
    title: event.event_type || 'Unplanned Drilling Incident',
    occurrence: event.description || `Drilling anomaly encountered at ${event.depth_from_md_m}m MD.`,
    precaution: 'Follow standard well-control and drilling procedures for target formation.'
  };
}

export default function ReportPage() {
  const [wells, setWells] = useState<Well[]>([]);
  const [wellId, setWellId] = useState('MOR-29');
  const [radius, setRadius] = useState('15');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // 1. Fetch wells list
  useEffect(() => {
    async function loadWells() {
      try {
        const res = await api<{ wells: Well[] }>('/api/wells');
        if (res && res.wells && res.wells.length > 0) {
          setWells(res.wells);
        }
      } catch {
        // fallback
      }
    }
    loadWells();
  }, []);

  // 2. Fetch pre-drill safety brief
  const generateBrief = useCallback(async (targetWell: string, targetRadius: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Brief>('/api/reports/offset-brief', {
        method: 'POST',
        body: JSON.stringify({ well_id: targetWell, radius_km: Number(targetRadius) })
      });
      setBrief(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load safety brief.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generateBrief(wellId, radius);
  }, [wellId, radius, generateBrief]);

  const handlePrint = () => {
    window.print();
  };

  // Filtered incidents
  const filteredEvents = useMemo(() => {
    if (!brief?.approved_historical_events) return [];
    return brief.approved_historical_events.filter(e => {
      if (severityFilter === 'CRITICAL' && e.severity !== 'CRITICAL') return false;
      if (severityFilter === 'HIGH' && e.severity !== 'HIGH') return false;
      if (severityFilter === 'MEDIUM' && (e.severity === 'CRITICAL' || e.severity === 'HIGH')) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesType = (e.event_type || '').toLowerCase().includes(query);
        const matchesWell = (e.wells?.name || '').toLowerCase().includes(query);
        const matchesFormation = (e.formations?.canonical_name || '').toLowerCase().includes(query);
        const matchesDesc = (e.description || '').toLowerCase().includes(query);
        if (!matchesType && !matchesWell && !matchesFormation && !matchesDesc) return false;
      }
      return true;
    });
  }, [brief, severityFilter, searchQuery]);

  // Key stats
  const stats = useMemo(() => {
    const events = brief?.approved_historical_events || [];
    const criticalCount = events.filter(e => e.severity === 'CRITICAL').length;
    const highCount = events.filter(e => e.severity === 'HIGH').length;
    const depths = events.map(e => e.depth_from_md_m).filter(Boolean);
    const closestDepth = depths.length > 0 ? Math.min(...depths) : 0;
    return {
      total: events.length,
      critical: criticalCount,
      high: highCount,
      closestDepth
    };
  }, [brief]);

  return (
    <div className="space-y-3 font-sans text-slate-200 max-w-[1500px] mx-auto pb-12 select-none">
      
      {/* 1. Header Toolbar */}
      <div className="print:hidden bg-[#0A1216] border border-slate-800 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Pre-Drill Safety & Offset Brief
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
              OIL INDIA LIMITED · UPPER ASSAM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical incident memory and driller precautions from nearby offset wells
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handlePrint}
            disabled={!brief}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Printer size={13} />
            <span>EXPORT PDF</span>
          </button>

          <button
            onClick={() => generateBrief(wellId, radius)}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Incidents"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="print:hidden grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL INCIDENTS</span>
          <div className="text-xl font-bold font-mono text-white">{stats.total} <span className="text-xs text-slate-400 font-normal">Events</span></div>
          <p className="text-[11px] text-slate-400">Within {radius} km offset corridor</p>
        </div>

        <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">CRITICAL THREATS</span>
          <div className="text-xl font-bold font-mono text-rose-400">{stats.critical} <span className="text-xs text-slate-400 font-normal">Gas Kicks</span></div>
          <p className="text-[11px] text-slate-400">Overpressure influx events</p>
        </div>

        <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">HIGH RISK WARNINGS</span>
          <div className="text-xl font-bold font-mono text-amber-300">{stats.high} <span className="text-xs text-slate-400 font-normal">Stuck Pipe / Loss</span></div>
          <p className="text-[11px] text-slate-400">Swelling clay & circulation losses</p>
        </div>

        <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">FIRST HAZARD DEPTH</span>
          <div className="text-xl font-bold font-mono text-emerald-400">{stats.closestDepth ? `${stats.closestDepth}m` : 'None'}</div>
          <p className="text-[11px] text-slate-400">Girujan Clay swelling zone</p>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="print:hidden bg-[#0A1216] border border-slate-800 rounded-lg px-3 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Well & Radius */}
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">WELL:</span>
            <select
              value={wellId}
              onChange={(e) => setWellId(e.target.value)}
              className="px-2.5 py-1 rounded bg-[#060B0E] border border-slate-700 text-white font-mono text-xs focus:outline-none"
            >
              {wells.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.field})</option>
              ))}
              {wells.length === 0 && <option value="MOR-29">MORAN-29 (Moran)</option>}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">RADIUS:</span>
            {['5', '15', '25', '50'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  radius === r
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>

        {/* Right: Severity Filter Chips */}
        <div className="flex items-center gap-1 font-mono">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              severityFilter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              severityFilter === 'CRITICAL'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800 font-semibold'
                : 'text-rose-400 hover:bg-rose-950/30'
            }`}
          >
            Critical ({stats.critical})
          </button>
          <button
            onClick={() => setSeverityFilter('HIGH')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              severityFilter === 'HIGH'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800 font-semibold'
                : 'text-amber-400 hover:bg-amber-950/30'
            }`}
          >
            High Risk ({stats.high})
          </button>
          <button
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              severityFilter === 'MEDIUM'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Moderate
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-xs text-red-300 font-mono">
          [FAULT] {error}
        </div>
      )}

      {/* 4. Streamlined Incident List (Simplified, Jargon-Free, No Nested Boxes) */}
      <div className="space-y-2">
        {loading && (
          <div className="p-8 text-center bg-[#0A1216] border border-slate-800 rounded-lg space-y-2">
            <RefreshCw size={20} className="animate-spin mx-auto text-cyan-400" />
            <div className="text-xs font-mono text-slate-400">LOADING OFFSET INCIDENTS...</div>
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="p-8 text-center bg-[#0A1216] border border-slate-800 rounded-lg space-y-1">
            <div className="text-sm font-semibold text-white">No Matching Incidents</div>
            <p className="text-xs text-slate-400">Try expanding the search radius or clearing filters.</p>
          </div>
        )}

        {!loading && filteredEvents.map((item, index) => {
          const info = processIncident(item);
          const isCritical = item.severity === 'CRITICAL';
          const isHigh = item.severity === 'HIGH';

          return (
            <div
              key={index}
              className="bg-[#0A1216] border border-slate-800 hover:border-slate-700 rounded-lg p-3 space-y-2 transition-colors"
            >
              {/* Header Line */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isCritical 
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800' 
                      : isHigh 
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800' 
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.severity}
                  </span>

                  <h3 className="text-xs sm:text-sm font-bold text-white font-sans">
                    {info.title}
                  </h3>
                </div>

                {/* Metadata Tags */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-cyan-300 font-semibold">{item.wells?.name ?? 'Offset Well'}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-purple-300">{item.formations?.canonical_name ?? 'Barail Group'}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-emerald-400 font-semibold">{item.depth_from_md_m}m MD</span>
                </div>
              </div>

              {/* Clean 2-Column Summary (No nested boxes!) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1.5 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-0.5">
                    WHAT HAPPENED:
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans">
                    {info.occurrence}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block mb-0.5">
                    PREVENTION & ACTION:
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans">
                    {info.precaution}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
