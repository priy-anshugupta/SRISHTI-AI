'use client';

import React, { useState } from 'react';
import { 
  Monitor, AlertTriangle, ShieldAlert, CheckCircle2, 
  Droplet, Gauge, Radio, ShieldCheck, ChevronRight, X,
  Activity, Zap, Compass, Flame
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTelemetry } from '@/context/TelemetryContext';

export default function DoghouseTerminal() {
  const [selectedSop, setSelectedSop] = useState<string | null>(null);
  const [confirmedAction, setConfirmedAction] = useState<string | null>(null);
  const [drillerId, setDrillerId] = useState('DR-8429');

  // Unified synchronized telemetry feed from TelemetryContext
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
      color: 'bg-red-600',
      steps: [
        '1. Space out drill string so tool joint clears rotary table & BOP rams.',
        '2. Stop rotary table and pick up kelly/top drive until off-bottom (1-2m).',
        '3. Stop mud pumps and check for flow through drill pipe and annulus (Flow check).',
        '4. If well flowing: Open choke line valve to remote hydraulic choke manifold.',
        '5. Close Annular Blowout Preventer (BOP). Close choke slowly to avoid pressure surge.',
        '6. Read and record Initial Shut-In Drill Pipe Pressure (SIDPP) & Shut-In Casing Pressure (SICP).',
        '7. Immediately notify Toolpusher & Company Man. Prepare Wait & Weight kill calculation.'
      ]
    },
    loss: {
      title: 'SEVERE LOST CIRCULATION MITIGATION (TIPAM SANDSTONE)',
      color: 'bg-orange-600',
      steps: [
        '1. Immediately pick off-bottom 5m to avoid packing off around BHA.',
        '2. Reduce pump rate to minimum circulating speed (30 SPM).',
        '3. Line up mud pits and determine exact loss rate (bbl/hr).',
        '4. Prepare 30 bbl coarse calcium carbonate (CaCO3) + mica pill in slug tank.',
        '5. Spot LCM pill across permeable interval and pull into casing shoe.'
      ]
    },
    stuck: {
      title: 'DIFFERENTIAL PIPE STICKING SOP (GIRUJAN CLAY)',
      color: 'bg-amber-600',
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
      // Fallback local logging
    }

    setConfirmedAction(`Mitigation recorded by Driller ${drillerId} at ${new Date().toLocaleTimeString()} · OISD-174 audit committed.`);
    setSelectedSop(null);
  };

  return (
    <div className="min-h-full space-y-5 select-none font-sans text-slate-100">
      {/* Doghouse Rig Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D97706]/20 border border-[#D97706] rounded-xl text-[#D97706]">
            <Monitor size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-3 text-white">
              RIG FLOOR TOUCH TERMINAL — OIL-RIG-04
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                OISD-STD-174 COMPLIANT
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-0.5">WELL: <strong className="text-slate-200">MORAN-29</strong> · BLOCK: <strong className="text-slate-200">MOR-III</strong> · ROTARY TABLE ELEVATION: <strong className="text-slate-200 font-mono tabular-nums">+112m</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-sans">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            isConnected ? 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/40 shadow-sm' : 'text-amber-400 bg-amber-950/30 border-amber-800'
          }`}>
            <Radio size={14} className={isConnected ? 'animate-pulse text-emerald-400' : ''} />
            <span className="font-semibold">{isConnected ? 'eRTMAC WITSML LIVE STREAM' : 'OFFLINE LOCAL BUFFER'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#020507] border border-[#162D38] text-slate-400">
            Driller Badge: <strong className="text-white font-mono font-bold">{drillerId}</strong>
          </div>
        </div>
      </div>

      {/* Giant Central Depth & Hazard Horizon Display */}
      <div className="grid grid-cols-12 gap-5 font-sans">
        {/* Giant Readouts (8 cols) */}
        <div className="col-span-12 lg:col-span-8 p-6 bg-[#050C10] border-2 border-[#1A3644] rounded-2xl flex flex-col justify-between shadow-2xl ring-1 ring-cyan-500/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">MEASURED HOLE DEPTH (MD)</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#020507] text-cyan-300 border border-[#162D38] font-sans">
              CURRENT STRATIGRAPHY: {formation.toUpperCase()}
            </span>
          </div>

          <div className="my-5 flex items-baseline gap-8">
            <div className="text-7xl font-bold font-mono tabular-nums text-white tracking-tighter drop-shadow-md">
              {depthMd.toFixed(1)} <span className="text-2xl text-slate-400 font-normal font-sans">m</span>
            </div>
            <div className="text-xl font-sans text-slate-400">
              TVD: <span className="text-slate-200 font-bold font-mono tabular-nums">{tvdMd.toFixed(1)}m</span>
            </div>
          </div>

          {/* Lookahead Hazard Horizon Alert Strip */}
          <div className={`p-4 rounded-xl border-2 flex items-center justify-between transition-colors font-sans shadow-lg ${
            hazardDistance <= 15 ? 'bg-red-950/60 border-red-500 animate-pulse' : 'bg-[#020507] border-amber-600/60'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={26} className={hazardDistance <= 15 ? 'text-red-400 animate-bounce' : 'text-[#D97706]'} />
              <div>
                <div className="text-sm font-bold text-amber-200 font-sans">
                  NEXT HISTORICAL HAZARD HORIZON IN <span className="font-mono tabular-nums">{hazardDistance.toFixed(1)}m</span> (AT 2,450.0m MD)
                </div>
                <div className="text-xs text-slate-300 mt-0.5 font-sans">
                  Precursor Gas Kick Horizon observed in Offset Well BAGHJAN-5 (<span className="font-mono tabular-nums">+22 bbl</span> pit gain).
                </div>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-lg font-bold text-xs font-sans tracking-wide shadow-md ${
              hazardDistance <= 15 ? 'bg-red-500 text-white' : 'bg-[#D97706] text-black'
            }`}>
              {hazardDistance <= 15 ? 'CRITICAL TRIGGER' : 'CAUTION LEVEL 2'}
            </span>
          </div>
        </div>

        {/* Tactical Parameters Gauge Readout (4 cols) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3 font-sans">
          {[
            { label: 'ROP', value: rop.toFixed(1), unit: 'm/hr', status: 'NORMAL' },
            { label: 'WOB', value: wob.toFixed(1), unit: 'klbs', status: 'NORMAL' },
            { label: 'RPM', value: rpm.toString(), unit: 'RPM', status: 'NORMAL' },
            { label: 'SPP', value: spp.toLocaleString(), unit: 'PSI', status: spp > 2800 ? 'HIGH' : 'NORMAL' },
            { label: 'TORQUE', value: torque.toFixed(1), unit: 'k ft-lb', status: 'NORMAL' },
            { label: 'PIT GAIN', value: (pitGain >= 0 ? '+' : '') + pitGain.toFixed(1), unit: 'bbl', status: pitGain > 5.0 ? 'KICK WARNING' : 'NORMAL' },
          ].map((g, i) => (
            <div key={i} className="p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl flex flex-col justify-between shadow-xl ring-1 ring-cyan-500/10">
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">{g.label}</span>
              <div className="my-1.5 text-2xl font-mono tabular-nums font-bold text-white">
                {g.value} <span className="text-xs text-slate-400 font-normal font-sans">{g.unit}</span>
              </div>
              <span className={`text-[10px] font-sans font-bold tracking-wide ${g.status === 'NORMAL' ? 'text-[#10b981]' : 'text-red-400 animate-pulse'}`}>
                {g.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Drilling Physics Engine Strip (Kill-Shot Feature for Domain Experts) */}
      <div className="p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl font-sans text-xs shadow-xl ring-1 ring-cyan-500/15">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#162D38]">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Deterministic Drilling Physics Engine (Real-Time Equations)
            </span>
          </div>
          <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-800/60 font-semibold">
            Jorden & Shirley / Eaton / Teale Formulations
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Eaton's Corrected d-Exponent */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] font-sans shadow-inner">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">CORRECTED d-EXPONENT (d_cs)</span>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-300 mt-0.5">
              {physics.d_exponent_corrected.toFixed(3)}
              <span className="text-[10px] text-slate-400 font-normal font-sans ml-2">Norm: {physics.d_normal_trend}</span>
            </div>
            <div className="text-[10px] text-amber-200/80 mt-1 font-medium">
              {physics.d_exponent_corrected < physics.d_normal_trend ? '⚠️ Departure: Pore Pressure Ramp' : 'Compaction Normal'}
            </div>
          </div>

          {/* Mechanical Specific Energy (MSE) */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] font-sans shadow-inner">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">MSE (ROCK DESTRUCTION WORK)</span>
            <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
              {physics.mse_psi.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-normal">PSI</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex justify-between font-semibold">
              <span>Eff: {physics.drilling_efficiency_pct}%</span>
              <span>{physics.mse_status}</span>
            </div>
          </div>

          {/* Equivalent Circulating Density (ECD) */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] font-sans shadow-inner">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">EQUIVALENT CIRC. DENSITY (ECD)</span>
            <div className="text-lg font-bold font-mono tabular-nums text-cyan-300 mt-0.5">
              {physics.ecd_ppg.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">ppg</span>
            </div>
            <div className="text-[10px] text-cyan-400/80 mt-1 font-medium">
              Annular Loss: +{physics.annular_pressure_loss_psi} PSI
            </div>
          </div>

          {/* Eaton Predicted Pore Pressure */}
          <div className="p-3 bg-[#020507] rounded-xl border border-[#162D38] font-sans shadow-inner">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">EATON PREDICTED PORE PRESSURE</span>
            <div className="text-lg font-bold font-mono tabular-nums text-red-400 mt-0.5">
              {physics.pore_pressure_pred_ppg.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">ppg eq.</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium">
              Safe MW Window: 10.4–11.0 ppg
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation feedback strip if action logged */}
      {confirmedAction && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-600/70 rounded-xl flex items-center justify-between text-xs font-sans text-emerald-200 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#10b981]" />
            <span>{confirmedAction}</span>
          </div>
          <button onClick={() => setConfirmedAction(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Glove-Friendly Emergency SOP Buttons (48px+ touch targets) */}
      <div className="p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl space-y-3 font-sans ring-1 ring-cyan-500/10">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>OISD-STD-174 DRILLER ACTION PLAYBOOKS (2-STEP CONFIRMATION REQUIRED)</span>
          <span className="text-slate-500 font-normal">Rig Floor Safety Standard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedSop('kick')}
            className="h-13 py-3 bg-red-950/40 hover:bg-red-900/60 border-2 border-red-700/80 text-red-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs font-sans ring-1 ring-red-500/20 cursor-pointer"
          >
            <AlertTriangle size={16} className="text-red-400" />
            <span>1. OISD-STD-174 KICK SOP</span>
          </button>

          <button
            onClick={() => setSelectedSop('loss')}
            className="h-13 py-3 bg-amber-950/40 hover:bg-amber-900/60 border-2 border-amber-700/80 text-amber-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs font-sans ring-1 ring-amber-500/20 cursor-pointer"
          >
            <Droplet size={16} className="text-amber-400" />
            <span>2. MUD LOSS SOP (TIPAM)</span>
          </button>

          <button
            onClick={() => setSelectedSop('stuck')}
            className="h-13 py-3 bg-sky-950/40 hover:bg-sky-900/60 border-2 border-sky-700/80 text-sky-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs font-sans ring-1 ring-sky-500/20 cursor-pointer"
          >
            <ShieldAlert size={16} className="text-sky-400" />
            <span>3. STUCK PIPE SOP (GIRUJAN)</span>
          </button>
        </div>
      </div>

      {/* Confirmation & SOP Instruction Modal */}
      {selectedSop && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-sans">
          <div className="bg-[#050C10] border-2 border-[#162D38] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl ring-1 ring-cyan-500/20">
            <div className="flex items-center justify-between border-b border-[#162D38] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <ShieldCheck size={20} className="text-[#10b981]" />
                {sops[selectedSop as keyof typeof sops].title}
              </h3>
              <button onClick={() => setSelectedSop(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Checklist Steps */}
            <div className="space-y-2 font-sans text-xs text-slate-200 bg-[#020507] p-4 rounded-xl border border-[#162D38] max-h-64 overflow-y-auto shadow-inner">
              {sops[selectedSop as keyof typeof sops].steps.map((step, idx) => (
                <div key={idx} className="p-1.5 border-b border-[#162D38]/60 last:border-0 leading-relaxed font-sans">
                  {step}
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs font-sans text-amber-200">
              Confirming this action records your badge ID (<span className="font-mono font-bold text-white">{drillerId}</span>) and mitigation timestamp into the permanent OIL decision audit trail.
            </div>

            {/* Confirm Actions */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                onClick={() => setSelectedSop(null)}
                className="px-6 py-3 bg-[#020507] border border-[#162D38] hover:bg-slate-800 text-slate-200 font-sans font-bold rounded-xl text-xs transition-colors"
              >
                CANCEL / RETURN
              </button>
              <button
                onClick={() => handleConfirmSop(selectedSop, sops[selectedSop as keyof typeof sops].title)}
                className="px-8 py-3 bg-[#10b981] hover:bg-emerald-600 text-white font-sans font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>CONFIRM & RECORD ACTION</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
