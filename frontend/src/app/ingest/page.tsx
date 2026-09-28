'use client';

import React, { ChangeEvent, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2, FileUp, LoaderCircle, ShieldAlert, FileText,
  RefreshCw, ExternalLink, Activity, ArrowRight, Upload, Layers,
  Search, Check, Filter
} from 'lucide-react';
import { api, uploadDocument } from '@/lib/api';
import Link from 'next/link';

type Document = {
  id: string;
  original_filename: string;
  processing_status: string;
  page_count: number | null;
  created_at: string;
  processing_error: string | null;
};

type LasLogData = {
  well_name: string;
  field: string;
  company: string;
  start_depth: number;
  stop_depth: number;
  step: string;
  curves: { mnemonic: string; unit: string; description: string }[];
  data_count: number;
  records: Record<string, any>[];
};

function formatDocTitle(filename: string): { title: string; type: string; well: string } {
  const name = filename.replace(/\.pdf$/i, '');
  if (name.includes('Moran_7') || name.includes('MOR7')) {
    return { title: 'Moran-7 Completion Report', type: 'WCR', well: 'MOR-07' };
  }
  if (name.includes('Naharkatiya_162') || name.includes('NHK162')) {
    return { title: 'Naharkatiya-162 Completion Report', type: 'WCR', well: 'NHK-162' };
  }
  if (name.includes('MOR29_Day14')) {
    return { title: 'Moran-29 Daily Drilling Log (Day 14)', type: 'DDR', well: 'MOR-29' };
  }
  if (name.includes('IncidentReport_BGH5')) {
    return { title: 'Baghjan-5 Incident Investigation Report', type: 'INCIDENT', well: 'BGH-05' };
  }
  if (name.includes('NGT_Katakey')) {
    return { title: 'NGT Inquiry Committee Report on Baghjan-5', type: 'INQUIRY', well: 'BGH-05' };
  }
  if (name.includes('Baghjan_9')) {
    return { title: 'Baghjan-9 Completion Report', type: 'WCR', well: 'BGH-09' };
  }
  if (name.includes('Naharkatiya_656')) {
    return { title: 'Naharkatiya-656 Completion Report', type: 'WCR', well: 'NHK-656' };
  }
  if (name.includes('GeomechStudy_Baghjan')) {
    return { title: 'Baghjan Overpressure Geomechanics Study', type: 'STUDY', well: 'BGH-05' };
  }
  if (name.includes('Rudrasagar_25')) {
    return { title: 'Rudrasagar-25 Completion Report', type: 'WCR', well: 'RDS-25' };
  }
  if (name.includes('Lakwa_112')) {
    return { title: 'Lakwa-112 Completion Report', type: 'WCR', well: 'LKW-112' };
  }
  if (name.includes('Baghjan_21')) {
    return { title: 'Baghjan-21 Completion Report', type: 'WCR', well: 'BGH-21' };
  }
  return { title: name.replace(/_/g, ' '), type: 'REPORT', well: 'OIL WELL' };
}

export default function IngestPage() {
  const [activeTab, setActiveTab] = useState<'pdf' | 'las'>('pdf');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // LAS state
  const [lasData, setLasData] = useState<LasLogData | null>(null);
  const [loadingLas, setLoadingLas] = useState(false);

  // Auto-load document list
  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ documents: Document[] }>('/api/documents');
      setDocuments(data.documents || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Load sample LAS on tab switch
  const loadSampleLas = async () => {
    setLoadingLas(true);
    try {
      const res = await api<{ raw_las: string; parsed_log: LasLogData }>('/api/documents/sample-las');
      if (res && res.parsed_log) {
        setLasData(res.parsed_log);
      }
    } catch {
      setError('Could not load sample LAS log.');
    } finally {
      setLoadingLas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'las' && !lasData) {
      loadSampleLas();
    }
  }, [activeTab, lasData]);

  // Handle PDF upload
  async function onSelectPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const result = await uploadDocument(file);
      setMessage(`Uploaded "${result.document.original_filename}". Drilling facts extracted successfully.`);
      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  // Preset sample loader
  const loadPresetSample = async (sampleKey: string, sampleLabel: string) => {
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      await api<{ message: string; document: Document }>(`/api/documents/load-sample?sample_name=${encodeURIComponent(sampleKey)}`, {
        method: 'POST'
      });
      setMessage(`Loaded sample: ${sampleLabel}. Extracted incidents and verified depth horizons.`);
      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load preset sample.');
    } finally {
      setUploading(false);
    }
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(d =>
      d.original_filename.toLowerCase().includes(q) ||
      formatDocTitle(d.original_filename).title.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  return (
    <div className="space-y-4 font-sans text-secondary max-w-[1500px] mx-auto pb-12 select-none">

      {/* 1. Header Toolbar */}
      <div className="bg-surface border border-line rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className=" font-bold text-ink    page-title">
              Well Reports & Wireline Log Ingestion
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-muted border border-line text-accent">
              EVIDENCE LIBRARY
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Automated extraction of drilling incidents from PDFs and LAS 2.0 wireline curve visualization
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-md border border-line text-xs font-mono">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pdf'
                ? 'bg-surface-muted text-accent font-semibold border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            <FileText size={13} />
            <span>PDF Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('las')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'las'
                ? 'bg-surface-muted text-accent font-semibold border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Activity size={13} />
            <span>LAS 2.0 Log Viewer</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-success-soft border border-success/25 rounded-lg flex items-center justify-between text-xs text-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-success shrink-0" />
            <span>{message}</span>
          </div>
          <Link
            href="/review"
            className="flex items-center gap-1 px-2.5 py-1 bg-success hover:bg-success text-ink font-mono text-xs rounded transition-colors"
          >
            <span>Review Extracted Facts →</span>
          </Link>
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-soft border border-danger/25 rounded-lg flex items-center gap-2 text-xs text-danger font-mono">
          <ShieldAlert size={15} className="shrink-0" />
          <span>[ALERT] {error}</span>
        </div>
      )}

      {/* 2. TAB 1: PDF REPORTS INGESTION */}
      {activeTab === 'pdf' && (
        <div className="space-y-3.5">

          {/* Quick Benchmark Datasets Bar */}
          <div className="p-3.5 bg-surface border border-line rounded-lg space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                Quick Load Benchmark Datasets:
              </span>
              <div className="flex items-center gap-3 text-xs font-mono text-accent">
                <a href="/demo-files/Sample_WCR_Moran_7.pdf" download className="hover:underline flex items-center gap-1">
                  <span>Sample WCR.pdf</span>
                </a>
                <span className="text-muted">·</span>
                <a href="/demo-files/Sample_DDR_Moran_29.pdf" download className="hover:underline flex items-center gap-1">
                  <span>Sample DDR.pdf</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => loadPresetSample('wcr_moran_7', 'WCR MORAN-7')}
                disabled={uploading}
                className="p-2.5 rounded bg-surface hover:bg-surface-muted border border-line hover:border-accent/25 text-left transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-ink group-hover:text-accent font-sans">
                  <span>Moran-7 (WCR)</span>
                  <span className="text-xs font-mono text-accent">147 pgs</span>
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">
                  Girujan stuck pipe (1,680m) & Tipam loss (1,840m)
                </p>
              </button>

              <button
                type="button"
                onClick={() => loadPresetSample('ddr_moran_29', 'DDR MORAN-29')}
                disabled={uploading}
                className="p-2.5 rounded bg-surface hover:bg-surface-muted border border-line hover:border-warning/25 text-left transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-ink group-hover:text-warning font-sans">
                  <span>Moran-29 (DDR)</span>
                  <span className="text-xs font-mono text-warning">Day 28</span>
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">
                  Barail gas kick precursor horizon at 2,418m MD
                </p>
              </button>

              <button
                type="button"
                onClick={() => loadPresetSample('geomech_baghjan', 'Geomech Study Baghjan')}
                disabled={uploading}
                className="p-2.5 rounded bg-surface hover:bg-surface-muted border border-line hover:border-accent/25 text-left transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-ink group-hover:text-accent font-sans">
                  <span>Baghjan-5 (Study)</span>
                  <span className="text-xs font-mono text-accent">42 pgs</span>
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">
                  Overpressured gas kick pore pressure calibration
                </p>
              </button>
            </div>
          </div>

          {/* Compact Dropzone */}
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface hover:border-accent/25 px-4 py-6 text-center transition-colors">
            <input
              className="sr-only"
              type="file"
              accept="application/pdf"
              onChange={onSelectPdf}
              disabled={uploading}
            />
            {uploading ? (
              <LoaderCircle className="animate-spin text-accent" size={28} />
            ) : (
              <Upload className="text-muted hover:text-accent transition-colors" size={28} />
            )}
            <span className="mt-2 font-bold text-ink text-xs font-sans">
              {uploading ? 'Processing and extracting drilling incidents…' : 'Drop Well Completion Report (WCR) or Daily Drilling Report (DDR) here'}
            </span>
            <span className="mt-0.5 text-xs text-muted">
              PDF format · Up to 50 MB · Automated fact extraction and depth tagging
            </span>
          </label>

          {/* Document Register Table */}
          <div className="bg-surface border border-line rounded-lg overflow-hidden text-xs">

            {/* Table Header & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-line/80 bg-surface">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink uppercase text-xs font-mono">
                  Indexed Reports ({filteredDocs.length} Files)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by well or filename..."
                    className="w-full bg-surface border border-line rounded pl-8 pr-3 py-1 text-xs text-ink placeholder-slate-500 focus:outline-none focus:border-line font-sans"
                  />
                </div>

                <button
                  onClick={refreshDocuments}
                  disabled={loading}
                  className="p-1.5 bg-surface-muted hover:bg-surface-muted border border-line text-secondary hover:text-ink rounded transition-colors cursor-pointer"
                  title="Refresh library"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Table Rows */}
            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="border-b border-line text-xs text-muted uppercase font-mono bg-surface-muted sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">REPORT TITLE</th>
                    <th className="py-2.5 px-3">WELL</th>
                    <th className="py-2.5 px-3">TYPE</th>
                    <th className="py-2.5 px-3">PAGES</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-sans">
                  {filteredDocs.map((doc) => {
                    const meta = formatDocTitle(doc.original_filename);
                    return (
                      <tr key={doc.id} className="hover:bg-surface transition-colors">
                        <td className="py-2.5 px-3 text-ink font-medium">
                          {meta.title}
                          <span className="block text-xs text-muted font-mono mt-0.5 truncate max-w-sm">
                            {doc.original_filename}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-accent font-semibold">
                          {meta.well}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            meta.type === 'WCR' ? 'bg-accent-soft text-accent border border-accent/25' :
                            meta.type === 'DDR' ? 'bg-warning-soft text-warning border border-warning/25' :
                            meta.type === 'INCIDENT' ? 'bg-danger-soft text-danger border border-danger/25' :
                            'bg-accent-soft text-accent border border-accent/25'
                          }`}>
                            {meta.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-secondary">
                          {doc.page_count ?? '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-success-soft text-success border border-success/25">
                            {doc.processing_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/review?doc=${doc.id}`}
                            className="px-2.5 py-1 rounded bg-surface-muted hover:bg-surface-muted border border-line text-accent hover:text-ink font-mono text-xs transition-colors"
                          >
                            Review Facts →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* 3. TAB 2: LAS 2.0 WIRELINE LOG VIEWER */}
      {activeTab === 'las' && (
        <div className="bg-surface border border-line rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-sm font-bold text-ink font-mono uppercase">
                LAS 2.0 Digital Well Log Track Viewer
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Standard wireline curve visualization: GR (Gamma Ray), RES (Resistivity), RHOB (Bulk Density)
              </p>
            </div>
            {lasData && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-surface-muted border border-line text-accent font-semibold">
                {lasData.well_name} · {lasData.start_depth}m – {lasData.stop_depth}m MD
              </span>
            )}
          </div>

          {loadingLas && (
            <div className="p-8 text-center text-xs font-mono text-muted space-y-2">
              <RefreshCw size={20} className="animate-spin mx-auto text-accent" />
              <div>PARSING LAS 2.0 WIRELINE TRACKS...</div>
            </div>
          )}

          {lasData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-surface border border-line rounded">
                  <span className="text-xs text-muted block">WELL</span>
                  <span className="font-bold text-ink">{lasData.well_name}</span>
                </div>
                <div className="p-2.5 bg-surface border border-line rounded">
                  <span className="text-xs text-muted block">DEPTH INTERVAL</span>
                  <span className="font-bold text-accent">{lasData.start_depth}m – {lasData.stop_depth}m</span>
                </div>
                <div className="p-2.5 bg-surface border border-line rounded">
                  <span className="text-xs text-muted block">CURVES PARSED</span>
                  <span className="font-bold text-ink">{lasData.curves.length} Channels</span>
                </div>
                <div className="p-2.5 bg-surface border border-line rounded">
                  <span className="text-xs text-muted block">DATA POINTS</span>
                  <span className="font-bold text-success">{lasData.data_count.toLocaleString()}</span>
                </div>
              </div>

              {/* Curve List */}
              <div className="p-3 bg-surface border border-line rounded space-y-2">
                <span className="text-xs font-mono text-muted uppercase font-semibold block">
                  CALIBRATED CURVES RECORDED IN LOG:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {lasData.curves.map(c => (
                    <span key={c.mnemonic} className="px-2 py-0.5 rounded bg-surface-muted border border-line text-xs font-mono text-secondary">
                      <strong className="text-accent">{c.mnemonic}</strong> ({c.unit}): {c.description}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
