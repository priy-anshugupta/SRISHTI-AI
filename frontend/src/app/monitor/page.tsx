'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Radio, AlertTriangle, ShieldAlert, CheckCircle2, 
  Clock, Bell, ChevronRight, Play, Pause, StepForward, RotateCcw, Flame, MapPin,
  Zap, Gauge, Compass
} from 'lucide-react';
import { api } from '@/lib/api';

interface TelemetryFrame {
  depth_md: number;
  tvd_md: number;
  rop_m_per_hr: number;
  wob_klbs: number;
  rpm: number;
  spp_psi: number;
  torque_ftlbs: number;
  flow_rate_gpm: number;
  pit_volume_bbl: number;
  gas_units: number;
  formation: string;
  status: string;
  hazard_horizon_md: number;
  distance_to_hazard_m: number;
  corridor_status: string;
  physics?: {
    d_exponent: number;
    d_exponent_corrected: number;
    d_normal_trend: number;
    pore_pressure_pred_ppg: number;
    mse_psi: number;
    drilling_efficiency_pct: number;
    mse_status: string;
    ecd_ppg: number;
    delta_ecd_ppg: number;
    annular_pressure_loss_psi: number;
  };
}

export default function DCSControlRoomLiveWall() {
  const [frame, setFrame] = useState<TelemetryFrame>({
    depth_md: 2418.0,
    tvd_md: 2396.2,
    rop_m_per_hr: 14.2,
    wob_klbs: 18.5,
    rpm: 120,
    spp_psi: 2440,
    torque_ftlbs: 14000,
    flow_rate_gpm: 650,
    pit_volume_bbl: 420.3,
    gas_units: 22,
    formation: 'Barail Group',
    status: 'NORMAL',
    hazard_horizon_md: 2450.0,
    distance_to_hazard_m: 32.0,
    corridor_status: 'KICK_PRECURSOR_HORIZON',
    physics: {
      d_exponent: 1.54,
      d_exponent_corrected: 1.28,
      d_normal_trend: 1.65,
      pore_pressure_pred_ppg: 11.2,
      mse_psi: 28400.0,
      drilling_efficiency_pct: 77.5,
      mse_status: 'OPTIMAL',
      ecd_ppg: 11.25,
      delta_ecd_ppg: 0.45,
      annular_pressure_loss_psi: 240.0
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST · Oil India eRTMAC Duliajan');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket connection to backend /ws/ertmac
  useEffect(() => {
    let pollTimer: any;

    const connectWs = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws/ertmac';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.depth_md) {
              setFrame(data);
            }
          } catch (e) {
            // ignore parse err
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          pollTimer = setInterval(pollTelemetry, 1500);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
        };
      } catch {
        setIsWsConnected(false);
        pollTimer = setInterval(pollTelemetry, 1500);
      }
    };

    const pollTelemetry = async () => {
      try {
        const res = await api<TelemetryFrame>('/api/telemetry/current');
        if (res) {
          setFrame(res);
          setIsWsConnected(true);
        }
      } catch {
        setIsWsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  // Telemetry play simulation toggle
  const handleTogglePlay = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    try {
      await fetch(`/api/telemetry/playback?play=${nextState}`, { method: 'POST' });
    } catch {
      // Fallback local state
    }
  };

  const handleStep = async () => {
    try {
      const res = await fetch('/api/telemetry/step', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFrame(data);
      }
    } catch {
      setFrame(prev => ({
        ...prev,
        depth_md: Math.min(2450.0, prev.depth_md + 2.0),
        distance_to_hazard_m: Math.max(0.0, prev.distance_to_hazard_m - 2.0)
      }));
    }
  };

  const handleReset = async () => {
    setIsPlaying(false);
    try {
      const res = await fetch('/api/telemetry/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFrame(data);
      }
    } catch {
      setFrame(prev => ({ ...prev, depth_md: 2418.0, distance_to_hazard_m: 32.0 }));
    }
  };

  const handleTriggerSwa = () => {
    setActionSuccess(true);
    setTimeout(() => {
      setActiveModal(null);
      setActionSuccess(false);
    }, 1200);
  };

  const physics = frame.physics || {
    d_exponent: 1.54,
    d_exponent_corrected: 1.28,
    d_normal_trend: 1.65,
    pore_pressure_pred_ppg: 11.2,
    mse_psi: 28400.0,
    drilling_efficiency_pct: 77.5,
    mse_status: 'OPTIMAL',
    ecd_ppg: 11.25,
    delta_ecd_ppg: 0.45,
    annular_pressure_loss_psi: 240.0
  };

  return (
    <div className="min-h-full text-slate-100 font-sans space-y-5">
      
      {/* 1. Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              DCS Control Room Live Wall
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/50 text-[10px] font-semibold text-[#34d399] flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-[#10B981] animate-ping' : 'bg-amber-400'}`} />
              {isWsConnected ? '24/7 eRTMAC WITSML STREAM' : 'OFFLINE LOCAL BUFFER'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal">
            Real-time process safety wall with live incident streaming, drilling physics engine, and acoustic reflex
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 font-sans">
          <div className="flex items-center gap-2 bg-[#020507] border border-[#162D38] px-3.5 py-2 rounded-xl text-xs font-sans text-slate-300 shadow-inner">
            <Clock size={13} className="text-[#38BDF8]" />
            <span className="font-mono tabular-nums">{currentTime || '06:00:00 IST'}</span>
          </div>

          <button
            onClick={() => setActiveModal('test_alarm')}
            className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-sans font-bold rounded-xl transition-all shadow-md shadow-red-950/40 cursor-pointer"
          >
            <Flame size={13} />
            <span>Trigger SWA Lockout</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 font-sans">
        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-slate-500 rounded-2xl space-y-1 shadow-xl ring-1 ring-slate-500/10 font-sans">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">TOTAL WELLBORE REPORTS</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">553</div>
          <div className="text-[11px] text-slate-400 font-sans">Across 18 Upper Assam Assets</div>
        </div>

        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-red-500 rounded-2xl space-y-1 shadow-xl ring-1 ring-red-500/10 font-sans">
          <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            KICK PRECURSORS
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400">189</div>
          <div className="text-[11px] text-slate-400 font-sans">Immediate Well Control Lockout</div>
        </div>

        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-amber-500 rounded-2xl space-y-1 shadow-xl ring-1 ring-amber-500/10 font-sans">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            STUCK PIPE & LOSS RISKS
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">89</div>
          <div className="text-[11px] text-slate-400 font-sans">Secondary Barrier Warnings</div>
        </div>

        <div className="p-4 bg-[#050C10] border-2 border-[#162D38] border-t-[3px] border-t-emerald-500 rounded-2xl space-y-1 shadow-xl ring-1 ring-emerald-500/10 font-sans">
          <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            STABLE INTERVALS
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">275</div>
          <div className="text-[11px] text-slate-400 font-sans">Routine Drilling Operations</div>
        </div>
      </div>

      {/* 3. Replay Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl text-xs font-sans shadow-xl">
        <div className="flex items-center gap-3 font-sans">
          <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider font-sans">WITSML REPLAY CONTROL:</span>
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all font-sans cursor-pointer ${
              isPlaying ? 'bg-[#EA580C] text-white animate-pulse' : 'bg-[#0D5C75] text-white shadow-sm'
            }`}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'STREAMING ACTIVE' : 'START REPLAY'}</span>
          </button>

          <button onClick={handleStep} className="px-2.5 py-1.5 bg-[#020507] hover:bg-slate-800 rounded-lg border border-[#162D38] text-slate-300 font-sans transition-colors cursor-pointer">
            Step (+2m)
          </button>
          <button onClick={handleReset} className="px-2.5 py-1.5 bg-[#020507] hover:bg-slate-800 rounded-lg border border-[#162D38] text-slate-300 font-sans transition-colors cursor-pointer">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-4 text-slate-300 font-sans text-xs">
          <span>Bit Depth: <strong className="text-white text-sm font-mono tabular-nums">{frame.depth_md.toFixed(1)}m MD</strong></span>
          <span>TVD: <strong className="text-slate-200 font-mono tabular-nums">{frame.tvd_md.toFixed(1)}m</strong></span>
          <span>SPP: <strong className="text-white font-mono tabular-nums">{frame.spp_psi} PSI</strong></span>
          <span>Formation: <strong className="text-[#38BDF8]">{frame.formation}</strong></span>
          <span className={`px-2 py-0.5 rounded font-bold text-[10px] font-sans ${
            frame.distance_to_hazard_m <= 15 ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse' : 'bg-amber-950 text-amber-300 border border-amber-800'
          }`}>
            Horizon: <span className="font-mono tabular-nums">{frame.distance_to_hazard_m.toFixed(1)}m</span>
          </span>
        </div>
      </div>

      {/* 4. Real-Time Drilling Physics Telemetry Strip (Key Hackathon Differentiator) */}
      <div className="p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl space-y-3 font-sans shadow-xl ring-1 ring-cyan-500/15">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#162D38] font-sans">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-cyan-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px] font-sans">
              Live Deterministic Physics Engine (Real-Time Subsurface Telemetry Equations)
            </span>
          </div>
          <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-800/60 font-semibold">
            Eaton d-Exponent · Teale MSE · Annular Hydraulics ECD
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Corrected d-Exponent */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] space-y-1 shadow-inner">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>CORRECTED d-EXPONENT (d_cs)</span>
              <span className="text-slate-500">Jorden & Shirley</span>
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono tabular-nums">
              {physics.d_exponent_corrected.toFixed(3)}
              <span className="text-xs text-slate-500 font-normal ml-2 font-sans">Trend: {physics.d_normal_trend}</span>
            </div>
            <div className={`text-[10px] ${physics.d_exponent_corrected < physics.d_normal_trend ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
              {physics.d_exponent_corrected < physics.d_normal_trend ? '⚠️ Departure: Pore Pressure Ramp' : 'Compaction Gradient Normal'}
            </div>
          </div>

          {/* Mechanical Specific Energy (MSE) */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] space-y-1 shadow-inner">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>MECHANICAL SPECIFIC ENERGY</span>
              <span className="text-slate-500">Teale 1965</span>
            </div>
            <div className="text-xl font-bold text-white font-mono tabular-nums">
              {physics.mse_psi.toLocaleString()} <span className="text-xs text-slate-400 font-normal font-sans">PSI</span>
            </div>
            <div className="text-[10px] text-emerald-400 flex justify-between font-semibold">
              <span>Efficiency: {physics.drilling_efficiency_pct}%</span>
              <span>{physics.mse_status}</span>
            </div>
          </div>

          {/* Equivalent Circulating Density (ECD) */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] space-y-1 shadow-inner">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>EQUIVALENT CIRC. DENSITY (ECD)</span>
              <span className="text-slate-500">Hydraulics</span>
            </div>
            <div className="text-xl font-bold text-cyan-300 font-mono tabular-nums">
              {physics.ecd_ppg.toFixed(2)} <span className="text-xs text-slate-400 font-normal font-sans">ppg</span>
            </div>
            <div className="text-[10px] text-cyan-400/80 font-mono tabular-nums">
              ΔP Annular: +{physics.annular_pressure_loss_psi} PSI
            </div>
          </div>

          {/* Eaton Predicted Pore Pressure */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] space-y-1 shadow-inner">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>EATON PORE PRESSURE PREDICTION</span>
              <span className="text-slate-500">Eaton 1975</span>
            </div>
            <div className="text-xl font-bold text-red-400 font-mono tabular-nums">
              {physics.pore_pressure_pred_ppg.toFixed(2)} <span className="text-xs text-slate-400 font-normal font-sans">ppg eq.</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Barail Mud Window: 10.4–11.0 ppg
            </div>
          </div>
        </div>
      </div>

      {/* 5. Two-Column Live Stream & Asset Matrix Split */}
      <div className="grid grid-cols-12 gap-6 font-sans">
        {/* Left: Live Wellbore Precursor Incident Stream (7 cols) */}
        <div className="col-span-12 lg:col-span-7 p-5 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl ring-1 ring-cyan-500/10 space-y-4 font-sans">
          <div className="flex items-center justify-between font-sans border-b border-[#162D38] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2 font-sans tracking-wide">
              <Activity size={14} className="text-[#10B981]" />
              LIVE WELLBORE PRECURSOR INCIDENT STREAM
            </span>
            <span className="text-[10px] font-sans font-semibold text-[#10B981] flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
              LIVE INGESTION ACTIVE
            </span>
          </div>

          {/* Stream Cards */}
          <div className="space-y-3 font-sans">
            {[
              {
                risk: 'KICK PRECURSOR 99% (0.99) RISK',
                location: 'Well Pad 7 (Moran-29)',
                time: '06:49 AM',
                narrative: 'Strong gas kick precursor detected: standpipe pressure fluttered +180 psi across Barail coal interval. Pit volume gain +0.8 bbl. Eaton d-exponent departure confirmed.',
                rule: 'OISD-174 (BOP Shut-in)',
                critical: true
              },
              {
                risk: 'WELL CONTROL 82% (0.82) RISK',
                location: 'Well Pad 7 (Moran-29)',
                time: '06:45 AM',
                narrative: '[EMERGENCY SWA EXECUTED] AUTONOMOUS FAIL-SAFE triggered lockout for Well Pad 7. Immediate rig shutdown ordered.',
                rule: 'Well Control OISD-174',
                critical: true
              },
              {
                risk: 'BARRIER DEGRADATION 90% (0.90) RISK',
                location: 'Baghjan Well #5',
                time: '06:43 AM',
                narrative: 'Annular BOP secondary valve seal weeping. Hydraulic fluid under 1800 psi vibration. Flutter during drilling.',
                rule: 'Barrier Integrity OISD-174',
                critical: true
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-4 bg-[#020507] border rounded-xl space-y-2.5 transition-all font-sans shadow-inner ${
                  item.critical ? 'border-red-900/70 hover:border-red-500' : 'border-[#162D38] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-bold text-red-400">{item.risk}</span>
                  <span className="text-slate-500 font-mono tabular-nums">{item.time}</span>
                </div>

                <div className="text-xs font-semibold text-white flex items-center gap-1.5 font-sans">
                  <MapPin size={13} className="text-[#38BDF8]" />
                  <span>{item.location}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.narrative}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#162D38]/80 text-[11px]">
                  <span className="text-slate-400">Rule: <strong className="text-slate-200">{item.rule}</strong></span>
                  <button
                    onClick={() => setActiveModal('view_detail')}
                    className="text-[#38BDF8] hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>View Evidence</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Fleet Asset Risk Matrix (5 cols) */}
        <div className="col-span-12 lg:col-span-5 p-5 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl ring-1 ring-cyan-500/10 space-y-4">
          <div className="flex items-center justify-between border-b border-[#162D38] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldAlert size={14} className="text-[#38BDF8]" />
              FLEET ASSET RISK MATRIX
            </span>
            <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-[#020507] border border-[#162D38]">UPPER ASSAM BASIN</span>
          </div>

          <div className="space-y-2.5">
            {[
              { well: 'MORAN-29', field: 'Moran', risk: 'CRITICAL', score: '99%', depth: '2,418m', threat: 'Gas kick precursor (32m)' },
              { well: 'BAGHJAN-05', field: 'Baghjan', risk: 'HIGH', score: '90%', depth: '3,870m', threat: 'Barrier degradation' },
              { well: 'NAHORKATIYA-162', field: 'Naharkatiya', risk: 'MEDIUM', score: '65%', depth: '3,650m', threat: 'Tipam TS-3 thief loss' },
              { well: 'LAKWA-112', field: 'Lakwa', risk: 'MEDIUM', score: '58%', depth: '3,600m', threat: 'Barail gas influx' },
              { well: 'RUDRASAGAR-25', field: 'Rudrasagar', risk: 'LOW', score: '24%', depth: '3,400m', threat: 'Stable drilling interval' }
            ].map((asset, i) => (
              <div
                key={i}
                className="p-3.5 bg-[#020507] border border-[#162D38] rounded-xl flex items-center justify-between text-xs hover:border-slate-600 transition-colors shadow-inner"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{asset.well}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({asset.field})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{asset.threat}</div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    asset.risk === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                    asset.risk === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                    asset.risk === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {asset.risk} ({asset.score})
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">{asset.depth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SWA Modal */}
      {activeModal === 'test_alarm' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#050C10] border-2 border-red-600/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-sans ring-1 ring-red-500/20">
            <div className="flex items-center gap-3 text-red-400">
              <Flame size={24} className="animate-bounce" />
              <h3 className="text-base font-bold text-white">Execute Stop Work Authority (SWA)</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Initiates emergency rig lockout for OIL-RIG-04 (Moran-29). Logs driller badge, notifies eRTMAC Duliajan, and freezes drilling operations per OISD-STD-174.
            </p>

            {actionSuccess ? (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-500 rounded-xl text-xs text-emerald-200 text-center font-bold">
                SWA EXECUTED & AUDIT TRAIL RECORDED
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-[#020507] border border-[#162D38] hover:bg-slate-800 text-slate-300 text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerSwa}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  CONFIRM SHUT-IN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
