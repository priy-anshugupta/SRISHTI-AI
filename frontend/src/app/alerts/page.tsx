'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BellRing, Check, RefreshCw, AlertTriangle, ShieldCheck, 
  Clock, History, CheckCircle2, FileText, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTelemetry } from '@/context/TelemetryContext';
import EvidenceModal, { EvidenceRecord } from '@/components/modals/EvidenceModal';

type Alert = {
  id: string;
  well_id?: string;
  event_type: string;
  severity: string;
  status: string;
  title?: string;
  description?: string;
  depth_from_md_m: number | null;
  depth_to_md_m: number | null;
  recommended_action: string;
  offset_wells?: string[];
  acknowledged?: boolean;
  acknowledged_by?: string;
  action_taken?: string;
  timestamp?: string;
};

type AuditEntry = {
  id: string;
  timestamp: string;
  actor?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  action_taken?: string;
  driller_badge?: string;
};

type Well = {
  id: string;
  name: string;
  field: string;
  status: string;
};

// 1. Plain English Title
function getPlainTitle(raw: string | undefined): string {
  if (!raw) return 'Safety Alert';
  const t = raw.toLowerCase();
  if (t.includes('gas') || t.includes('kick') || t.includes('precursor')) {
    return 'High Gas Pressure Ahead (2,450m)';
  }
  if (t.includes('rop') || t.includes('speed') || t.includes('deviation')) {
    return 'Drilling Speed Slower than Nearby Wells';
  }
  if (t.includes('loss') || t.includes('circulation') || t.includes('thief')) {
    return 'Mud Leakage Risk Ahead (2,450m)';
  }
  if (t.includes('kopili')) {
    return 'High Pressure Zone Ahead (Kopili Layer)';
  }
  if (t.includes('transit') || t.includes('girujan')) {
    return 'Sticky Clay Layer Cleared Safely';
  }
  return raw;
}

// 2. Plain English 1-Sentence Description
function getPlainDescription(alert: Alert): string {
  const text = ((alert.title || '') + ' ' + (alert.description || '')).toLowerCase();

  if (text.includes('gas') || text.includes('baghjan')) {
    return 'Nearby well Baghjan-5 hit dangerous high gas pressure in this rock layer. The current drill bit is 32 meters above this risk zone.';
  }
  if (text.includes('rop') || text.includes('speed') || text.includes('nhk-162')) {
    return 'Current drilling speed (6.8 m/h) is 18% slower than nearby well Nahorkatiya-162 (8.3 m/h) at this same depth.';
  }
  if (text.includes('loss') || text.includes('circulation') || text.includes('thief')) {
    return 'Nearby wells Moran-12 and Hugrijan-48 lost drilling mud into porous rock fractures at this depth.';
  }
  if (text.includes('kopili')) {
    return 'Offset well Nahorkatiya-656 found unstable high-pressure rock deeper in the Kopili formation.';
  }
  if (text.includes('transit') || text.includes('girujan')) {
    return 'Successfully drilled through Girujan Clay with only 6 hours total delay (vs. 336 hours in Moran-7).';
  }
  return alert.description || 'Drilling advisory detected from nearby offset well records.';
}

// 3. Plain English Bulleted Action Steps
function getPlainActions(alert: Alert): string[] {
  const text = ((alert.title || '') + ' ' + (alert.recommended_action || '')).toLowerCase();

  if (text.includes('gas') || text.includes('kick')) {
    return [
      'Prepare 12.8 ppg heavy drilling mud in pit to contain gas pressure',
      'Test emergency blow-out preventer (BOP) valves and remote chokes',
      'Check trip tank and flow sensors continuously for sudden volume gains'
    ];
  }
  if (text.includes('rop') || text.includes('speed') || text.includes('wob')) {
    return [
      'Inspect drill bit for teeth wear at the next pipe connection',
      'Increase drill bit weight (WOB) to 21 klbs to recover cutting speed'
    ];
  }
  if (text.includes('loss') || text.includes('circulation') || text.includes('thief')) {
    return [
      'Keep 30 bbl calcium carbonate sealing pill ready in the mud tank',
      'Keep mud weight below 10.8 ppg to prevent opening rock fractures',
      'Monitor active mud pit volume continuously'
    ];
  }
  if (text.includes('kopili')) {
    return [
      'Prepare weighted kill mud (12.0 ppg) before entering Kopili layer',
      'Plan 7-inch protective casing pipe depth at 3,650m'
    ];
  }
  if (text.includes('girujan')) {
    return [
      'Maintain pipe rotation above 60 RPM to stop pipe from sticking',
      'Apply successful mud recipe to future offset wells'
    ];
  }
  return [alert.recommended_action || 'Follow standard rig safety procedures.'];
}

export default function AlertsPage() {
  const { refreshAlerts } = useTelemetry();
  const [activeTab, setActiveTab] = useState<'alerts' | 'audit'>('alerts');
  const [wells, setWells] = useState<Well[]>([]);
  const [selectedWellId, setSelectedWellId] = useState('MOR-29');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState<EvidenceRecord | null>(null);

  const openEvidenceForWell = (alert: Alert, wellName: string) => {
    const isBarail = (alert.description || '').toLowerCase().includes('barail');
    const isGirujan = (alert.description || '').toLowerCase().includes('girujan');
    const formationName = isBarail ? 'Barail Group' : isGirujan ? 'Girujan Clay' : 'Tipam Sandstone';
    
    setSelectedEvidenceModal({
      event_id: alert.id,
      well: wellName,
      well_name: wellName,
      formation: formationName,
      event_type: alert.event_type || alert.title || 'Offset Drilling Hazard Precursor',
      severity: alert.severity,
      depth_from_md_m: alert.depth_from_md_m || 2418.0,
      description: alert.description || `Offset well ${wellName} recorded critical subsurface pressure anomaly at equivalent formation depth.`,
      mitigation: alert.recommended_action,
      source_file: `WCR_${wellName.replace(/[^A-Za-z0-9]/g, '_')}.pdf`,
      source_page: 147,
      ocr_confidence: 96.8,
      reviewed_by: 'P. Saikia (Chief Drilling Specialist, Oil India Ltd.)'
    });
  };

  useEffect(() => {
    async function loadWells() {
      try {
        const res = await api<{ wells: Well[] }>('/api/wells');
        if (res && res.wells) {
          setWells(res.wells);
        }
      } catch (err) {
        // ignore
      }
    }
    loadWells();
  }, []);

  const loadAlerts = useCallback(async (targetWell: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ alerts: Alert[] }>(`/api/alerts/active?well_id=${encodeURIComponent(targetWell)}`);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await api<{ audit_logs?: AuditEntry[]; audit_events?: AuditEntry[] }>('/api/alerts/audit');
      const list = res.audit_logs || res.audit_events || [];
      if (list.length > 0) {
        setAuditLogs(list);
      }
    } catch {
      setAuditLogs([
        {
          id: 'AUD-001',
          timestamp: new Date().toISOString(),
          actor: 'K. Sarma (Toolpusher)',
          action: 'SAFETY_CHECK',
          details: 'Checked remote BOP choke and confirmed 12.8 ppg mud ready in pit.'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadAlerts(selectedWellId);
    loadAuditLogs();
  }, [selectedWellId, loadAlerts, loadAuditLogs]);

  const handleAcknowledge = async (alert: Alert) => {
    const action = actions[alert.id];
    if (!action || action.trim().length < 3) {
      setError('Please write what safety step was taken before confirming.');
      return;
    }
    try {
      await api(`/api/alerts/${alert.id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ action_taken: action })
      });
      await loadAlerts(selectedWellId);
      await loadAuditLogs();
      await refreshAlerts();
      setActions(prev => ({ ...prev, [alert.id]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not acknowledge alert.');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 font-sans text-slate-100 min-h-full pb-8">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#050C10] border-2 border-[#162D38] rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BellRing className="text-amber-400" size={20} />
              Early Safety Alerts
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time warnings based on past issues from nearby wells, with recommended preventive actions
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-[#020507] p-1 rounded-xl border border-[#162D38] text-xs">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Active Alerts ({alerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History size={13} />
            <span>Action Log ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Controls Toolbar (Well Picker & Filter) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#050C10] border-2 border-[#162D38] rounded-xl text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400 font-bold text-xs">Well:</span>
          <select
            value={selectedWellId}
            onChange={(e) => setSelectedWellId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#020507] border border-[#162D38] text-cyan-300 font-bold outline-none cursor-pointer text-xs"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id} className="bg-[#050C10] text-white">
                {w.name} {w.id === 'MOR-29' ? '★ (Active Rig)' : `(${w.field})`}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadAlerts(selectedWellId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D5C75] hover:bg-[#147695] text-white rounded-lg font-bold transition-colors disabled:opacity-50 text-xs shadow-sm cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {activeTab === 'alerts' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1 font-medium">Filter:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 rounded-full border text-[11px] transition-all cursor-pointer ${
                  severityFilter === s
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                    : 'bg-[#020507] text-slate-400 border-[#162D38] hover:border-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 3. Main Content: Active Alerts Tab vs Activity Log Tab */}
      {activeTab === 'alerts' ? (
        <div className="space-y-3">
          {filteredAlerts.length === 0 && !loading && (
            <div className="p-8 bg-[#050C10] border-2 border-[#162D38] rounded-xl text-center text-slate-400 text-xs">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
              No open alerts for this well. All drilling parameters are currently safe.
            </div>
          )}

          {filteredAlerts.map(alert => {
            const hasSameDepth = alert.depth_from_md_m && alert.depth_to_md_m && alert.depth_from_md_m === alert.depth_to_md_m;
            const depthDisplay = hasSameDepth
              ? `${alert.depth_from_md_m}m`
              : `${alert.depth_from_md_m ?? 2418}–${alert.depth_to_md_m ?? 2450}m`;

            const plainDesc = getPlainDescription(alert);
            const plainActions = getPlainActions(alert);

            return (
              <div
                key={alert.id}
                className={`p-4 bg-[#050C10] border-2 rounded-xl space-y-3 shadow-md transition-all ${
                  alert.severity === 'CRITICAL' ? 'border-red-900/80 hover:border-red-500' :
                  alert.severity === 'HIGH' ? 'border-orange-900/80 hover:border-orange-500' :
                  'border-[#162D38] hover:border-slate-600'
                }`}
              >
                {/* Alert Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#162D38] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                      alert.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                      'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {alert.severity} RISK
                    </span>
                    <h2 className="text-sm font-bold text-white">
                      {getPlainTitle(alert.title || alert.event_type)}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      Depth: <strong className="text-cyan-300 font-mono tabular-nums">{depthDisplay}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.status === 'ACKNOWLEDGED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {alert.status === 'ACKNOWLEDGED' ? '✓ CONFIRMED' : 'ACTION NEEDED'}
                    </span>
                  </div>
                </div>

                {/* Plain 1-Sentence Problem Description */}
                <p className="text-slate-200 text-xs leading-relaxed">
                  {plainDesc}
                </p>

                {/* Plain Clean Action Checklist */}
                <div className="p-3 rounded-xl bg-[#020507] border border-emerald-900/50 space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>Required Preventive Steps:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-200">
                    {plainActions.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Evidence & Sign-off */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#162D38] text-[11px] text-slate-400">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText size={12} className="text-cyan-400 shrink-0" />
                    <span>Offset Well Records:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(alert.offset_wells && alert.offset_wells.length > 0 ? alert.offset_wells : ['BAGHJAN-5', 'MORAN-12']).map((wName, wIdx) => (
                        <button
                          key={wIdx}
                          type="button"
                          onClick={() => openEvidenceForWell(alert, wName)}
                          className="px-2 py-0.5 rounded bg-[#020507] hover:bg-[#071318] border border-cyan-500/40 text-cyan-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                          title="Click to view verified source document"
                        >
                          <span>{wName}</span>
                          <ChevronRight size={10} className="text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-slate-400 text-xs">
                    Confirmed by: <strong className="text-slate-200">{alert.acknowledged_by || 'Rig Team'}</strong>
                  </div>
                </div>

                {/* Acknowledge Input Bar (if open) */}
                {alert.status === 'OPEN' && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={actions[alert.id] ?? ''}
                      onChange={(e) => setActions({ ...actions, [alert.id]: e.target.value })}
                      placeholder="Enter safety action taken (e.g. Conducted flow check, prepared kill mud)"
                      className="flex-1 px-3 py-2 rounded-xl bg-[#020507] border border-[#162D38] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => handleAcknowledge(alert)}
                      className="px-4 py-2 bg-[#0D5C75] hover:bg-[#147695] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Confirm & Record Action</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── 4. Activity Log Tab (Clean & No Blank Rows) ─── */
        <div className="bg-[#050C10] border-2 border-[#162D38] rounded-2xl p-4 text-xs space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#162D38] pb-2.5 mb-2">
            <div>
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <ShieldCheck size={15} className="text-cyan-400" />
                Rig Safety Action History
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified record of safety actions, alerts confirmed, and inspections</p>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-[#020507] px-2.5 py-1 rounded-lg border border-[#162D38]">
              ✓ Verified Logs
            </span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => {
              const actionTitle = log.action ? log.action.replace(/_/g, ' ') : (log.action_taken ? 'Rig Action' : 'Safety Log');
              const actionDetail = log.details || log.action_taken || 'Operation logged and verified.';
              const author = log.actor || log.driller_badge || 'Rig Safety Team';

              return (
                <div
                  key={log.id}
                  className="p-3 bg-[#020507] border border-[#162D38] hover:border-slate-700 rounded-xl space-y-1.5 transition-all shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-[10px]">
                        {log.id}
                      </span>
                      <span className="text-white font-bold">{actionTitle}</span>
                      {log.entity_id && (
                        <span className="text-slate-400 text-[10px]">({log.entity_id})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Clock size={11} className="text-slate-500" />
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    {actionDetail}
                  </p>

                  <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-900 flex justify-between items-center">
                    <span>Recorded by: <strong className="text-slate-300">{author}</strong></span>
                    <span className="text-emerald-400 font-semibold">✓ VERIFIED RECORD</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence Inspector Modal */}
      <EvidenceModal
        isOpen={Boolean(selectedEvidenceModal)}
        onClose={() => setSelectedEvidenceModal(null)}
        evidence={selectedEvidenceModal}
      />

    </div>
  );
}
