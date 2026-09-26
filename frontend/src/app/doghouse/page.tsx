'use client';

import React, { useState } from 'react';
import { 
  Monitor, AlertTriangle, ShieldAlert, CheckCircle2, 
  Droplet, Gauge, Radio, ShieldCheck, ChevronRight, X,
  Activity, Zap, Compass, Flame, Shield
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTelemetry } from '@/context/TelemetryContext';

export default function DoghouseTerminal() {
  const [selectedSop, setSelectedSop] = useState<string | null>(null);
  const [confirmedAction, setConfirmedAction] = useState<string | null>(null);
  const [drillerId, setDrillerId] = useState('DR-8429');

  const {
    depthMd,
    tvdMd,
    rop,
    wob,
    rpm,
    spp,
    torque,
    pitGain,
    hazardDistance,
    formation,
    physics,
    isConnected,
    refreshAlerts
  } = useTelemetry();

  const sops = {
    kick: {
      title: 'OISD-STD-174 EMERGENCY WELL CONTROL PROCEDURE',
      steps: [
        '1. Space out drill string so tool joint clears rotary table and BOP rams.',
        '2. Stop rotary table and pick up kelly/top drive until off-bottom (1–2m).',
        '3. Stop mud pumps and perform flow check through drill pipe and annulus.',
        '4. If flowing: Open remote hydraulic choke line valve.',
        '5. Close Annular Blowout Preventer (BOP) slowly to avoid pressure surge.',
        '6. Record Initial Shut-In Drill Pipe Pressure (SIDPP) and Casing Pressure (SICP).',
        '7. Immediately notify Toolpusher. Prepare Wait & Weight kill calculation.'
      ]
    },
    loss: {
      title: 'SEVERE LOST CIRCULATION MITIGATION (TIPAM SANDSTONE)',
      steps: [
        '1. Immediately pick off-bottom 5m to avoid packing off around BHA.',
        '2. Reduce pump rate to minimum circulating speed (30 SPM).',
        '3. Line up mud pits and determine exact loss rate (bbl/hr).',
        '4. Prepare 30 bbl coarse calcium carbonate (CaCO3) + mica pill in slug pit.',
        '5. Spot LCM pill across permeable sand and pull into intermediate casing shoe.'
      ]
    },
    stuck: {
      title: 'DIFFERENTIAL PIPE STICKING SOP (GIRUJAN CLAY)',
      steps: [
        '1. Immediately work downward with maximum allowable set-down weight (80 klbs).',
        '2. Maintain continuous torque (<80% makeup limit) to break stationary wall cake seal.',
        '3. Spot 50 bbl oil-based mud (OBM) lubricant soak pill with surfactant.',
        '4. Apply hydraulic jar action opposite to stuck direction.'
      ]
    }
  };

  const handleConfirmSop = async (sopKey: string, actionName: string) => {
    try {
      await api('/api/alerts/acknowledge', {
        method: 'POST',
        body: JSON.stringify({
          alert_id: 'ALT-101',
          driller_badge: drillerId,
          action_taken: `Executed ${actionName} on OIL-RIG-04 (Moran-29) at depth ${depthMd.toFixed(1)}m MD`
        })
      });
      await refreshAlerts();
    } catch {
      // fallback
    }

    setConfirmedAction(`Mitigation recorded by Driller ${drillerId} at ${new Date().toLocaleTimeString()} · OISD-174 audit committed.`);
    setSelectedSop(null);
  };

  return (
    <div className="space-y-3 font-sans text-slate-200 max-w-[1500px] mx-auto pb-12 select-none">
      
      {/* 1. Industrial SCADA Header Toolbar */}
      <div className="bg-[#0A1216] border border-slate-800 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0D2430] border border-[#1B4254] flex items-center justify-center text-cyan-400">
            <Monitor size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Rig Floor Touch Terminal · OIL-RIG-04
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                OISD-STD-174 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              WELL: <strong className="text-white">MORAN-29</strong> · BLOCK: <strong className="text-white">MOR-III</strong> · ELEVATION: <strong className="text-white">+112m RT</strong>
            </p>
          </div>
        </div>

        {/* Telemetry Stream Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            isConnected 
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' 
              : 'bg-amber-950/70 border-amber-800 text-amber-300'
          }`}>
            <Radio size={13} className={isConnected ? 'animate-pulse text-emerald-400' : ''} />
            <span>{isConnected ? 'eRTMAC LIVE STREAM' : 'OFFLINE BUFFER'}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#060B0E] border border-slate-800 text-slate-400">
            Driller: <strong className="text-white">{drillerId}</strong>
          </div>
        </div>
      </div>

      {/* 2. Main Depth Readout & Tactical Telemetry Gauges */}
      <div className="grid grid-cols-12 gap-3">
        
        {/* Left Column: Measured Depth & Precursor Hazard Banner (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-[#0A1216] border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">
              MEASURED HOLE DEPTH (MD)
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#060B0E] border border-slate-800 text-cyan-300 font-semibold">
              FORMATION: {formation.toUpperCase()}
            </span>
          </div>

          <div className="flex items-baseline gap-6 my-2">
            <div className="text-5xl sm:text-6xl font-bold font-mono tabular-nums text-white tracking-tight">
              {depthMd.toFixed(1)} <span className="text-xl text-slate-400 font-normal font-sans">m</span>
            </div>
            <div className="text-base font-mono text-slate-400">
              TVD: <span className="text-white font-bold">{tvdMd.toFixed(1)}m</span>
            </div>
          </div>

          {/* Precursor Lookahead Hazard Banner */}
          <div className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
            hazardDistance <= 15 
              ? 'bg-rose-950/40 border-rose-600/70' 
              : 'bg-[#060B0E] border-amber-600/50'
          }`}>
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={20} className={hazardDistance <= 15 ? 'text-rose-400 shrink-0' : 'text-amber-400 shrink-0'} />
              <div>
                <div className="text-xs font-bold text-amber-200 font-mono uppercase">
                  HAZARD HORIZON IN <span className="text-white">{hazardDistance.toFixed(1)}m</span> (AT 2,450.0m MD)
                </div>
                <div className="text-xs text-slate-300 mt-0.5 font-sans">
                  Precursor Gas Kick observed in Offset Well BAGHJAN-5 (+22 bbl pit volume gain).
                </div>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
              hazardDistance <= 15 
                ? 'bg-rose-950/80 border border-rose-600 text-rose-200' 
                : 'bg-amber-950/80 border border-amber-600 text-amber-200'
            }`}>
              {hazardDistance <= 15 ? 'CRITICAL TRIGGER' : 'CAUTION LEVEL 2'}
            </span>
          </div>
        </div>

        {/* Right Column: 6 Tactical Telemetry Gauges (4 cols) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-2 font-mono">
          {[
            { label: 'ROP', value: rop.toFixed(1), unit: 'm/hr', status: 'NORMAL' },
            { label: 'WOB', value: wob.toFixed(1), unit: 'klbs', status: 'NORMAL' },
            { label: 'RPM', value: rpm.toString(), unit: 'RPM', status: 'NORMAL' },
            { label: 'SPP', value: spp.toLocaleString(), unit: 'PSI', status: spp > 2800 ? 'HIGH' : 'NORMAL' },
            { label: 'TORQUE', value: torque.toFixed(1), unit: 'k ft-lb', status: 'NORMAL' },
            { label: 'PIT GAIN', value: (pitGain >= 0 ? '+' : '') + pitGain.toFixed(1), unit: 'bbl', status: pitGain > 5.0 ? 'KICK WARNING' : 'NORMAL' },
          ].map((g, i) => {
            const isAlert = g.status !== 'NORMAL';
            return (
              <div 
                key={i} 
                className={`p-3 bg-[#0A1216] border rounded-lg flex flex-col justify-between ${
                  isAlert ? 'border-rose-600/70 bg-rose-950/15' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                  <span>{g.label}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
                </div>
                
                <div className="my-1 text-xl font-bold text-white tabular-nums">
                  {g.value} <span className="text-xs text-slate-400 font-normal">{g.unit}</span>
                </div>

                <div className={`text-[10px] font-bold ${isAlert ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {g.status}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. Real-Time Wellbore Pressure & Drilling Mechanics Strip */}
      <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase text-slate-200">
              Real-Time Wellbore Mechanics & Pore Pressure Diagnostics
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            EATON / D-EXPONENT CALIBRATION
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
          {/* Corrected d-Exponent */}
          <div className="p-2.5 bg-[#060B0E] border border-slate-800 rounded space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">D-EXPONENT (d_cs)</span>
            <div className="text-base font-bold text-amber-300">
              {physics.d_exponent_corrected.toFixed(3)}
              <span className="text-[10px] text-slate-500 font-normal ml-2">Trend: {physics.d_normal_trend}</span>
            </div>
            <div className="text-[10px] text-amber-300 font-sans">
              {physics.d_exponent_corrected < physics.d_normal_trend ? '⚠️ Overpressure Ramp Detected' : 'Normal Compaction'}
            </div>
          </div>

          {/* Mechanical Specific Energy (MSE) */}
          <div className="p-2.5 bg-[#060B0E] border border-slate-800 rounded space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">DRILLING ENERGY (MSE)</span>
            <div className="text-base font-bold text-white">
              {physics.mse_psi.toLocaleString()} <span className="text-xs text-slate-400 font-normal">PSI</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-sans">
              Efficiency: {physics.drilling_efficiency_pct}% · {physics.mse_status}
            </div>
          </div>

          {/* Equivalent Circulating Density (ECD) */}
          <div className="p-2.5 bg-[#060B0E] border border-slate-800 rounded space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">EQUIVALENT DENSITY (ECD)</span>
            <div className="text-base font-bold text-cyan-300">
              {physics.ecd_ppg.toFixed(2)} <span className="text-xs text-slate-400 font-normal">ppg</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans">
              Annular Loss: +{physics.annular_pressure_loss_psi} PSI
            </div>
          </div>

          {/* Eaton Predicted Pore Pressure */}
          <div className="p-2.5 bg-[#060B0E] border border-slate-800 rounded space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">PORE PRESSURE PREDICTED</span>
            <div className="text-base font-bold text-rose-400">
              {physics.pore_pressure_pred_ppg.toFixed(2)} <span className="text-xs text-slate-400 font-normal">ppg</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans">
              Safe Mud Window: 10.4–11.0 ppg
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation feedback if action taken */}
      {confirmedAction && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-700/80 rounded-lg flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>{confirmedAction}</span>
          </div>
          <button onClick={() => setConfirmedAction(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 4. Glove-Friendly Emergency SOP Buttons (OISD-STD-174) */}
      <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
          <span className="font-bold text-slate-300 uppercase">
            Emergency Driller Mitigation Protocols (OISD-STD-174)
          </span>
          <span className="text-[10px] text-slate-500">2-Step Confirmation Required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-xs">
          <button
            onClick={() => setSelectedSop('kick')}
            className="py-2.5 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-200 font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <AlertTriangle size={15} className="text-rose-400" />
            <span>1. WELL KICK / INFLUX SOP</span>
          </button>

          <button
            onClick={() => setSelectedSop('loss')}
            className="py-2.5 px-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 text-amber-200 font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Droplet size={15} className="text-amber-400" />
            <span>2. MUD LOSS SOP (TIPAM)</span>
          </button>

          <button
            onClick={() => setSelectedSop('stuck')}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldAlert size={15} className="text-cyan-400" />
            <span>3. STUCK PIPE SOP (GIRUJAN)</span>
          </button>
        </div>
      </div>

      {/* Confirmation & SOP Instruction Modal */}
      {selectedSop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1216] border border-slate-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                {sops[selectedSop as keyof typeof sops].title}
              </h3>
              <button onClick={() => setSelectedSop(null)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-1.5 text-xs text-slate-200 bg-[#060B0E] p-3 rounded border border-slate-800 max-h-60 overflow-y-auto font-sans leading-relaxed">
              {sops[selectedSop as keyof typeof sops].steps.map((step, idx) => (
                <div key={idx} className="p-1.5 border-b border-slate-800/60 last:border-0">
                  {step}
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-amber-950/30 border border-amber-800/60 rounded text-xs text-amber-200 font-mono">
              Action will log driller badge (<strong className="text-white">{drillerId}</strong>) and depth ({depthMd.toFixed(1)}m) to OIL audit trail.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1 font-mono text-xs">
              <button
                onClick={() => setSelectedSop(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleConfirmSop(selectedSop, sops[selectedSop as keyof typeof sops].title)}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-white font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>CONFIRM & EXECUTE</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* commit-step-31: feat(doghouse) */
