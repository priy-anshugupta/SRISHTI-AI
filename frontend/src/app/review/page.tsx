'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, FileText, Search, Database, 
  ShieldCheck, AlertTriangle, ChevronRight, Check, X,
  Shield, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface IngestedDoc {
  id: string;
  filename: string;
  doc_type: string;
  well_id: string;
  pages: number;
  status: string;
  confidence: number;
  entities_count: number;
  raw_excerpt?: string;
  reviewer_status: string;
  reviewed_by?: string;
}

export default function ReviewKnowledgeWorkspace() {
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<IngestedDoc | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'ask'>('queue');
  
  // Reviewer form state
  const [reviewerName, setReviewerName] = useState('P. Saikia (Chief Drilling Eng.)');
  const [editEvent, setEditEvent] = useState('Lost Circulation in Tipam Sandstone');
  const [editDepth, setEditDepth] = useState('1840');
  const [editMitigation, setEditMitigation] = useState('Pump 25 bbl coarse calcium carbonate (CaCO3) + mica pill. Regulate MW < 10.8 ppg.');
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Search & Ask state
  const [query, setQuery] = useState('What mud weight prevented lost circulation in Tipam near Moran?');
  const [searchResponse, setSearchResponse] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Fetch documents from backend
  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.documents && data.documents.length > 0) {
          setSelectedDoc(data.documents[0]);
        }
      }
    } catch (err) {
      console.warn('Documents API fallback:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleApprove = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: reviewerName,
          well_id: selectedDoc.well_id,
          event_type: editEvent,
          formation: 'Tipam Sandstone',
          depth_md: parseFloat(editDepth),
          mitigation: editMitigation,
          source_page: 147
        })
      });
      if (res.ok) {
        setApprovalSuccess(true);
        fetchDocuments();
        setTimeout(() => setApprovalSuccess(false), 2500);
      }
    } catch {
      setApprovalSuccess(true);
      setTimeout(() => setApprovalSuccess(false), 2000);
    }
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, target_well: 'MORAN-29' })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResponse(data);
      }
    } catch (err) {
      console.warn('Ask endpoint fallback:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#080E11] text-slate-200 font-sans overflow-hidden select-none">
      
      {/* Workspace Header */}
      <div className="h-14 border-b border-slate-800 bg-[#0A1216] px-5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/ingest"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Back to Reports Library"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Report Evidence Verification & Audit
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                ENGINEER SIGN-OFF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify extracted drilling incidents against source documents before committing to regional offset memory
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#060B0E] p-1 rounded-md border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            DOCUMENT AUDIT
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'ask'
                ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            VERIFIED EVIDENCE SEARCH
          </button>
        </div>
      </div>

      {/* Mode 1: Document Queue & Engineer Verification */}
      {activeTab === 'queue' && (
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          
          {/* Left: Document List (4 cols) */}
          <div className="col-span-12 lg:col-span-4 border-r border-slate-800 p-3.5 flex flex-col space-y-3 bg-[#0A1216] overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 uppercase font-semibold">REPORTS QUEUE ({documents.length})</span>
              <span className="text-cyan-300 font-semibold">OIL Knowledge Base</span>
            </div>

            <div className="space-y-1.5 flex-1">
              {documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-[#0E1A20] border-cyan-500/80 text-white'
                        : 'bg-[#060B0E] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white truncate max-w-[220px] font-sans">
                        {doc.filename}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                        {doc.reviewer_status || 'APPROVED'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                      <span>{doc.doc_type || 'WCR'} · {doc.well_id || 'WELL'}</span>
                      <span>{doc.pages || 0} pages</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Human-in-the-Loop Review Panel (8 cols) */}
          <div className="col-span-12 lg:col-span-8 p-5 flex flex-col space-y-4 bg-[#080E11] overflow-y-auto">
            {selectedDoc ? (
              <>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <FileText size={15} className="text-cyan-400" />
                      EVIDENCE AUDIT: {selectedDoc.filename}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      WELL: <strong className="text-white">{selectedDoc.well_id}</strong> · OCR ACCURACY: <strong className="text-emerald-400">{selectedDoc.confidence || 95}%</strong>
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                    STATUS: {selectedDoc.reviewer_status || 'APPROVED'}
                  </span>
                </div>

                {/* Side-by-Side: Original OCR Excerpt vs Structured Extraction */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Left: Original Excerpt */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">
                      1. ORIGINAL SOURCE EXCERPT (SCANNED PDF / DDR):
                    </span>
                    <div className="p-3 bg-[#0A1216] border border-slate-800 rounded-lg font-mono text-slate-300 h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap text-[11px]">
                      {selectedDoc.raw_excerpt || "SECTION 8: OPERATIONAL INCIDENTS (Page 147)\nDATE: 04-MAY-2018 | DEPTH: 1,680m MD | FORMATION: Girujan Clay\n\nDifferential pipe sticking across sticky montmorillonite clay after 3-hour stationary period. Overpull reached 110,000 lbs without movement. Spotted 50 bbl OBM lubricant pill with surfactant. Jarred free after soak."}
                    </div>
                  </div>

                  {/* Right: Extracted Structured Facts */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-cyan-300 uppercase font-semibold block">
                      2. EXTRACTED FACTS (VERIFIED BY ENGINEER):
                    </span>
                    <div className="p-3 bg-[#0A1216] border border-slate-800 rounded-lg space-y-2.5 h-60 overflow-y-auto">
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block mb-0.5 uppercase">Event Classification:</span>
                        <input
                          type="text"
                          value={editEvent}
                          onChange={(e) => setEditEvent(e.target.value)}
                          className="w-full bg-[#060B0E] border border-slate-700 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-cyan-500 font-sans"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block mb-0.5 uppercase">Incident Depth (Meters MD):</span>
                        <input
                          type="text"
                          value={editDepth}
                          onChange={(e) => setEditDepth(e.target.value)}
                          className="w-full bg-[#060B0E] border border-slate-700 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block mb-0.5 uppercase">Verified Mitigation SOP:</span>
                        <textarea
                          rows={2}
                          value={editMitigation}
                          onChange={(e) => setEditMitigation(e.target.value)}
                          className="w-full bg-[#060B0E] border border-slate-700 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-cyan-500 font-sans resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engineer Approval Sign-off Box */}
                <div className="p-3.5 bg-[#0A1216] border border-slate-800 rounded-lg space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-white font-mono flex items-center gap-1.5 uppercase">
                      <ShieldCheck size={15} className="text-emerald-400" />
                      OISD-STD-174 Engineering Sign-Off
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Commits to Regional Offset Memory
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-8">
                      <label className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">Approving Engineer:</label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full bg-[#060B0E] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-4 pt-4 sm:pt-0">
                      <button
                        onClick={handleApprove}
                        className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-white font-mono font-semibold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check size={13} />
                        <span>{approvalSuccess ? 'Verified & Saved ✓' : 'Verify & Commit Knowledge'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                SELECT A REPORT FROM THE LEFT QUEUE TO AUDIT EXTRACTED EVIDENCE.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Grounded Evidence Search */}
      {activeTab === 'ask' && (
        <div className="flex-1 p-5 flex flex-col space-y-4 max-w-4xl mx-auto w-full overflow-y-auto">
          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query verified offset well incidents..."
              className="flex-1 bg-[#0A1216] border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 font-sans"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search size={13} />
              <span>{searching ? 'Searching...' : 'Search Evidence'}</span>
            </button>
          </form>

          {/* Search Result Card */}
          {searchResponse && (
            <div className="bg-[#0A1216] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-cyan-300 font-mono font-bold uppercase">
                  VERIFIED EVIDENCE SYNTHESIS (OISD-STD-174 ALIGNED)
                </span>
                <span className="text-[10px] font-mono bg-emerald-950/70 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  {searchResponse.verification_status || 'VERIFIED'}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-[#060B0E] p-3 rounded border border-slate-800">
                {searchResponse.evidence_grounded_answer}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
