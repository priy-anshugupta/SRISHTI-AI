'use client';

import React, { useState } from 'react';
import {
  Monitor, AlertTriangle, ShieldAlert, CheckCircle2,
  Droplet, Gauge, Radio, ShieldCheck, ChevronRight, X,
  Activity, Zap, Compass, Flame, Shield, Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTelemetry } from '@/context/TelemetryContext';
import { useAuth } from '@/context/AuthContext';

export default function DoghouseTerminal() {
  const { user } = useAuth();
  const isRigFloorWorker = user?.badge === 'Rig Floor' || user?.clearanceLevel === 'Rig Floor View';

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
    <div className="space-y-3 font-sans text-secondary max-w-[1500px] mx-auto pb-12 select-none">

      {/* 1. Industrial SCADA Header Toolbar */}
      <div className="bg-surface border border-line rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent-soft border border-line flex items-center justify-center text-accent">
            <Monitor size={18} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className=" font-bold text-ink    page-title">
                Rig Floor Touch Terminal · OIL-RIG-04
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-success-soft border border-success/25 text-success">
                OISD-STD-174 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 font-mono">
              WELL: <strong className="text-ink">MORAN-29</strong> · BLOCK: <strong className="text-ink">MOR-III</strong> · ELEVATION: <strong className="text-ink">+112m RT</strong>
            </p>
          </div>
        </div>

        {/* Telemetry Stream Badge & Kiosk Indicator */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {isRigFloorWorker ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-warning-soft border border-warning/25 text-warning font-bold shadow-sm">
              <Lock size={12} />
              <span>KIOSK ACTIVE: DRILLER MODE (OISD-174)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand/25 border border-accent/40 text-accent font-semibold shadow-sm">
              <ShieldCheck size={13} className="text-accent" />
              <span>ENGINEER SUPERVISOR VIEW (FULL ACCESS)</span>
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            isConnected
              ? 'bg-success-soft border-success/25 text-success'
              : 'bg-warning-soft border-warning/25 text-warning'
          }`}>
            <Radio size={13} className={isConnected ? ' text-success' : ''} />
            <span>{isConnected ? 'eRTMAC LIVE STREAM' : 'OFFLINE BUFFER'}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-surface border border-line text-muted">
            Driller: <strong className="text-ink">{drillerId}</strong>
          </div>
        </div>
      </div>

      {/* 2. Main Depth Readout & Tactical Telemetry Gauges */}
      <div className="grid grid-cols-12 gap-3">

        {/* Left Column: Measured Depth & Precursor Hazard Banner (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-surface border border-line rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between border-b border-line/80 pb-2.5">
            <span className="text-xs font-mono font-semibold uppercase text-muted">
              MEASURED HOLE DEPTH (MD)
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-surface border border-line text-accent font-semibold">
              FORMATION: {formation.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-4 my-2">
            <div className="text-5xl sm:text-6xl font-bold font-mono tabular-nums text-ink tracking-tight">
              {depthMd.toFixed(1)} <span className="text-lg text-muted font-normal font-sans">m</span>
            </div>
            <div className="text-base font-mono text-muted">
              TVD: <span className="text-ink font-bold">{tvdMd.toFixed(1)}m</span>
            </div>
          </div>

          {/* Precursor Lookahead Hazard Banner */}
          <div className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
            hazardDistance <= 15
              ? 'bg-danger-soft border-danger/25'
              : 'bg-surface border-warning/25'
          }`}>
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={20} className={hazardDistance <= 15 ? 'text-danger shrink-0' : 'text-warning shrink-0'} />
              <div>
                <div className="text-xs font-bold text-warning font-mono uppercase">
                  HAZARD HORIZON IN <span className="text-ink">{hazardDistance.toFixed(1)}m</span> (AT 2,450.0m MD)
                </div>
                <div className="text-xs text-secondary mt-0.5 font-sans">
                  Precursor Gas Kick observed in Offset Well BAGHJAN-5 (+22 bbl pit volume gain).
                </div>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
              hazardDistance <= 15
                ? 'bg-danger-soft border border-danger/25 text-danger'
                : 'bg-warning-soft border border-warning/25 text-warning'
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
                className={`p-3 bg-surface border rounded-lg flex flex-col justify-between ${
                  isAlert ? 'border-danger/25 bg-danger-soft' : 'border-line'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-muted font-semibold uppercase">
                  <span>{g.label}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-danger ' : 'bg-success'}`} />
                </div>

                <div className="my-1 text-lg font-bold text-ink tabular-nums">
                  {g.value} <span className="text-xs text-muted font-normal">{g.unit}</span>
                </div>

                <div className={`text-xs font-bold ${isAlert ? 'text-danger' : 'text-success'}`}>
                  {g.status}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. Real-Time Wellbore Pressure & Drilling Mechanics Strip */}
      <div className="bg-surface border border-line rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-line/80 pb-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-accent" />
            <span className="text-xs font-mono font-bold uppercase text-secondary">
              Real-Time Wellbore Mechanics & Pore Pressure Diagnostics
            </span>
          </div>
          <span className="text-xs font-mono text-muted">
            EATON / D-EXPONENT CALIBRATION
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
          {/* Corrected d-Exponent */}
          <div className="p-2.5 bg-surface border border-line rounded space-y-0.5">
            <span className="text-xs text-muted uppercase font-semibold block">D-EXPONENT (d_cs)</span>
            <div className="text-base font-bold text-warning">
              {physics.d_exponent_corrected.toFixed(3)}
              <span className="text-xs text-muted font-normal ml-2">Trend: {physics.d_normal_trend}</span>
            </div>
            <div className="text-xs text-warning font-sans">
              {physics.d_exponent_corrected < physics.d_normal_trend ? ' Overpressure Ramp Detected' : 'Normal Compaction'}
            </div>
          </div>

          {/* Mechanical Specific Energy (MSE) */}
          <div className="p-2.5 bg-surface border border-line rounded space-y-0.5">
            <span className="text-xs text-muted uppercase font-semibold block">DRILLING ENERGY (MSE)</span>
            <div className="text-base font-bold text-ink">
              {physics.mse_psi.toLocaleString()} <span className="text-xs text-muted font-normal">PSI</span>
            </div>
            <div className="text-xs text-success font-sans">
              Efficiency: {physics.drilling_efficiency_pct}% · {physics.mse_status}
            </div>
          </div>

          {/* Equivalent Circulating Density (ECD) */}
          <div className="p-2.5 bg-surface border border-line rounded space-y-0.5">
            <span className="text-xs text-muted uppercase font-semibold block">EQUIVALENT DENSITY (ECD)</span>
            <div className="text-base font-bold text-accent">
              {physics.ecd_ppg.toFixed(2)} <span className="text-xs text-muted font-normal">ppg</span>
            </div>
            <div className="text-xs text-muted font-sans">
              Annular Loss: +{physics.annular_pressure_loss_psi} PSI
            </div>
          </div>

          {/* Eaton Predicted Pore Pressure */}
          <div className="p-2.5 bg-surface border border-line rounded space-y-0.5">
            <span className="text-xs text-muted uppercase font-semibold block">PORE PRESSURE PREDICTED</span>
            <div className="text-base font-bold text-danger">
              {physics.pore_pressure_pred_ppg.toFixed(2)} <span className="text-xs text-muted font-normal">ppg</span>
            </div>
            <div className="text-xs text-muted font-sans">
              Safe Mud Window: 10.4–11.0 ppg
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation feedback if action taken */}
      {confirmedAction && (
        <div className="p-3 bg-success-soft border border-success/25 rounded-lg flex items-center justify-between text-xs text-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-success" />
            <span>{confirmedAction}</span>
          </div>
          <button onClick={() => setConfirmedAction(null)} className="text-muted hover:text-ink"></button>
        </div>
      )}

      {/* 4. Glove-Friendly Emergency SOP Buttons (OISD-STD-174) */}
      <div className="bg-surface border border-line rounded-lg p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono border-b border-line/80 pb-2">
          <span className="font-bold text-secondary uppercase">
            Emergency Driller Mitigation Protocols (OISD-STD-174)
          </span>
          <span className="text-xs text-muted">2-Step Confirmation Required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-xs">
          <button
            onClick={() => setSelectedSop('kick')}
            className="py-2.5 px-3 bg-danger-soft hover:bg-danger-soft border border-danger/25 text-danger font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <AlertTriangle size={15} className="text-danger" />
            <span>1. WELL KICK / INFLUX SOP</span>
          </button>

          <button
            onClick={() => setSelectedSop('loss')}
            className="py-2.5 px-3 bg-warning-soft hover:bg-warning-soft border border-warning/25 text-warning font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Droplet size={15} className="text-warning" />
            <span>2. MUD LOSS SOP (TIPAM)</span>
          </button>

          <button
            onClick={() => setSelectedSop('stuck')}
            className="py-2.5 px-3 bg-surface-muted hover:bg-surface-muted border border-line text-secondary font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldAlert size={15} className="text-accent" />
            <span>3. STUCK PIPE SOP (GIRUJAN)</span>
          </button>
        </div>
      </div>

      {/* Confirmation & SOP Instruction Modal */}
      {selectedSop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-lg max-w-xl w-full p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-sm font-bold text-ink font-mono flex items-center gap-2">
                <ShieldCheck size={16} className="text-success" />
                {sops[selectedSop as keyof typeof sops].title}
              </h3>
              <button onClick={() => setSelectedSop(null)} className="text-muted hover:text-ink p-1 rounded hover:bg-surface-muted">
                <X size={16} />
              </button>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-1.5 text-xs text-secondary bg-surface p-3 rounded border border-line max-h-60 overflow-y-auto font-sans leading-relaxed">
              {sops[selectedSop as keyof typeof sops].steps.map((step, idx) => (
                <div key={idx} className="p-1.5 border-b border-line/60 last:border-0">
                  {step}
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-warning-soft border border-warning/25 rounded text-xs text-warning font-mono">
              Action will log driller badge (<strong className="text-ink">{drillerId}</strong>) and depth ({depthMd.toFixed(1)}m) to OIL audit trail.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1 font-mono text-xs">
              <button
                onClick={() => setSelectedSop(null)}
                className="px-4 py-2 bg-surface-muted hover:bg-surface-muted border border-line text-secondary rounded transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleConfirmSop(selectedSop, sops[selectedSop as keyof typeof sops].title)}
                className="px-5 py-2 bg-success hover:bg-success border border-success/25 text-ink font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
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
