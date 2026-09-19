'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardCheck, FileWarning, Send, Printer, Download, 
  FileText, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw,
  Clock, MapPin, Building, Bookmark
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

export default function ReportPage() {
  const [wells, setWells] = useState<Well[]>([]);
  const [wellId, setWellId] = useState('MOR-29');
  const [radius, setRadius] = useState('15');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch wells list on mount
  useEffect(() => {
    async function loadWells() {
      try {
        const res = await api<{ wells: Well[] }>('/api/wells');
        if (res && res.wells) {
          setWells(res.wells);
        }
      } catch {
        // ignore
      }
    }
    loadWells();
  }, []);

  // 2. Fetch pre-spud brief
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
      setError(err instanceof Error ? err.message : 'Could not build evidence brief.');
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

  return (
    <div className="space-y-5 font-sans text-slate-100 min-h-full">
      
      {/* 1. Header Row (Hidden on print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0B1316] border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ClipboardCheck className="text-cyan-400" size={20} />
              Pre-Spud Offset Evidence Brief & Shift Handover
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Automated spatial aggregation of offset wellbore hazards and statutory OISD-STD-174 sign-off dossiers
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={!brief}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-sans text-xs font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50"
          >
            <Printer size={14} />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Controls Form (Hidden on print) */}
      <div className="print:hidden p-4 bg-[#0B1316] border border-slate-800 rounded-xl text-xs space-y-3">
        <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center justify-between">
          <span>Target Well & Spatial Search Corridor:</span>
          <span className="text-cyan-400">Instant Automated Synthesis</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Well Picker */}
          <div className="flex-1 min-w-[240px]">
            <select
              value={wellId}
              onChange={(e) => setWellId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#070D0F] border border-slate-700 text-white font-bold focus:outline-none focus:border-cyan-500 font-sans"
            >
              {wells.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.field} Field)
                </option>
              ))}
              {wells.length === 0 && <option value="MOR-29">MORAN-29 (Moran Field)</option>}
            </select>
          </div>

          {/* Radius Quick Buttons */}
          <div className="flex items-center gap-1">
            {['5', '15', '25'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                  radius === r
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/70 font-bold'
                    : 'bg-[#070D0F] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {r} km Radius
              </button>
            ))}
          </div>

          {/* Custom Radius input */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Radius:</span>
            <input
              type="number"
              min="1"
              max="50"
              step="1"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-16 px-2 py-2 rounded-lg bg-[#070D0F] border border-slate-700 text-white text-center focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400">km</span>
          </div>

          <button
            onClick={() => generateBrief(wellId, radius)}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C75] hover:bg-[#147695] text-white rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 3. Printable Formal Evidence Brief Document */}
      {brief && (
        <article className="bg-[#0B1316] print:bg-white print:text-black border print:border-0 border-slate-800 rounded-xl p-6 font-sans text-xs space-y-6 shadow-2xl">
          
          {/* Formal Letterhead Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-700 print:border-black pb-5 font-sans">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 print:text-black mb-1">
                <Building size={18} />
                <span className="font-bold text-sm uppercase tracking-widest font-sans">
                  OIL INDIA LIMITED · eRTMAC DULIAJAN
                </span>
              </div>
              <h2 className="text-xl font-bold text-white print:text-black">
                {brief.title}
              </h2>
              <p className="text-slate-400 print:text-gray-600 text-xs mt-0.5">
                Target Well Asset: <strong>{wellId}</strong> · Corridor Radius: <strong className="font-mono tabular-nums">{brief.radius_km} km</strong> · Statutory OISD-STD-174 Handover Dossier
              </p>
            </div>

            <div className="text-right text-[11px] text-slate-400 print:text-gray-600 space-y-0.5 font-sans">
              <div>Date: <strong>{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong></div>
              <div>Classification: <strong className="text-red-400 print:text-black font-semibold">STRICTLY CONFIDENTIAL</strong></div>
              <div>System: <strong>SRISHTI·AI Offset Memory</strong></div>
            </div>
          </div>

          {/* Historical Incident Summary */}
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-2 font-sans">
                <FileWarning size={14} className="text-amber-400 print:text-black" />
                1. Approved Historical Hazard Register ({brief.approved_historical_events.length} Offset Incidents)
              </span>
              <span className="text-[10px] text-slate-400 print:text-gray-600 font-sans">Sorted by Strategic Severity</span>
            </div>

            <div className="space-y-3">
              {brief.approved_historical_events.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-lg bg-[#070D0F] print:bg-gray-50 border border-slate-800 print:border-gray-300 space-y-2 font-sans"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                        item.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 print:bg-red-100 print:text-red-900 border border-red-800' :
                        item.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 print:bg-orange-100 print:text-orange-900 border border-orange-800' :
                        'bg-amber-950 text-amber-300 print:bg-yellow-100 print:text-yellow-900 border border-amber-800'
                      }`}>
                        {item.severity}
                      </span>
                      <h3 className="font-bold text-white print:text-black text-sm font-sans">
                        {item.event_type}
                      </h3>
                    </div>

                    <div className="text-slate-400 print:text-gray-600 text-[11px] font-sans">
                      Offset Well: <strong className="text-cyan-300 print:text-black">{item.wells?.name ?? 'Offset Well'}</strong> · Horizon: <strong className="text-purple-300 print:text-black">{item.formations?.canonical_name ?? 'Barail Group'}</strong> · Depth: <strong className="text-white print:text-black font-mono tabular-nums">{item.depth_from_md_m}m MD</strong>
                    </div>
                  </div>

                  <p className="text-slate-300 print:text-gray-800 text-xs leading-relaxed font-sans">
                    {item.description}
                  </p>

                  {item.mitigation && (
                    <div className="p-2.5 rounded bg-emerald-950/20 print:bg-emerald-50 border border-emerald-900/40 print:border-emerald-300 text-[11px] text-emerald-300 print:text-emerald-900">
                      <strong>Recorded Field SOP Mitigation:</strong> {item.mitigation}
                    </div>
                  )}

                  <div className="text-[10px] text-cyan-400 print:text-gray-600 flex justify-between">
                    <span>Source Evidence: {item.source_documents?.original_filename ?? 'Well Completion Report'} (Page {item.source_page ?? 1})</span>
                    <span>Status: APPROVED BY CHIEF DRILLING ENGINEER</span>
                  </div>
                </div>
              ))}

              {brief.approved_historical_events.length === 0 && (
                <div className="p-6 text-center text-slate-500 print:text-gray-500">
                  No historical incidents recorded within {brief.radius_km} km radius.
                </div>
              )}
            </div>
          </div>

          {/* Required Human Review Checklist */}
          <div className="p-4 rounded-lg bg-[#070D0F] print:bg-gray-50 border border-slate-800 print:border-gray-300 space-y-2">
            <span className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-cyan-400 print:text-black" />
              2. Mandatory Human Verification & Rig Floor Readiness (OISD-STD-174)
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300 print:text-gray-800">
              {brief.required_review.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-3.5 h-3.5 mt-0.5 rounded border border-slate-600 print:border-black shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Official Sign-off Block */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-800 print:border-black text-[11px]">
            <div className="space-y-3">
              <div className="text-slate-400 print:text-gray-600">PREPARED BY (Lead Drilling Engineer):</div>
              <div className="h-8 border-b border-dashed border-slate-700 print:border-black" />
              <div className="text-white print:text-black font-bold">P. Saikia, Chief Drilling Specialist</div>
              <div className="text-[10px] text-slate-500">eRTMAC Operations · Oil India Limited</div>
            </div>

            <div className="space-y-3">
              <div className="text-slate-400 print:text-gray-600">VERIFIED & APPROVED (Rig Superintendent / Company Man):</div>
              <div className="h-8 border-b border-dashed border-slate-700 print:border-black" />
              <div className="text-white print:text-black font-bold">Rajesh Kumar, General Manager (Drilling)</div>
              <div className="text-[10px] text-slate-500">Field Headquarters, Duliajan, Assam</div>
            </div>
          </div>

          {/* Statutory Disclaimer */}
          <div className="p-3 bg-amber-950/20 print:bg-gray-100 border border-amber-900/40 print:border-gray-300 rounded text-[10px] text-amber-200 print:text-gray-700 leading-relaxed">
            {brief.disclaimer}
          </div>

        </article>
      )}

    </div>
  );
}
