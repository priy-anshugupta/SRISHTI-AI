'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Cpu, LogOut } from 'lucide-react';
import SwarmTraceModal from '@/components/modals/SwarmTraceModal';
import { useAuth } from '@/context/AuthContext';
import { useTelemetry } from '@/context/TelemetryContext';

const routeLabels: Record<string, string> = {
  '/map': 'Geospatial Well Map',
  '/ask': 'Ask SRISHTI (AI Chat)',
  '/compare': 'Offset Comparison',
  '/knowledge': 'Drilling Knowledge Graph',
  '/alerts': 'Proactive Hazard Alerts',
  '/analytics': 'Formation Analytics',
  '/ingest': 'Document Ingestion',
  '/report': 'Well Program Generator',
  '/doghouse': 'Doghouse Touch Cockpit',
  '/monitor': 'DCS Control Room',
  '/plan': 'Offset Intelligence',
  '/review': 'Review & Verification',
};

export default function Topbar() {
  const [showSwarmModal, setShowSwarmModal] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    depthMd,
    rop,
    formation,
    wellName,
    rig,
    unreadAlertsCount,
    isConnected
  } = useTelemetry();

  const baseRoute = '/' + (pathname?.split('/')[1] || '');
  const currentLabel = routeLabels[baseRoute] || 'Operations';

  return (
    <>
    <header className="h-14 shrink-0 bg-[#04090C]/95 backdrop-blur-md border-b-2 border-[#162D38] shadow-[0_4px_25px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-4 lg:px-6 z-20 w-full font-sans select-none relative">
      {/* Luminous bottom accent hairline */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none" />

      {/* 1. Left Breadcrumb Capsule */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071014] border border-[#162D38] shadow-inner text-xs whitespace-nowrap shrink-0">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Operations</span>
        </Link>
        <span className="text-slate-600 font-normal">/</span>
        <span className="text-white font-semibold tracking-wide">{currentLabel}</span>
      </div>

      {/* 2. Center Active Rig Live Telemetry Ticker (Exact specification with live sync) */}
      <div className="flex items-center justify-center flex-1 min-w-0 px-2 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#071014] border border-[#162D38] shadow-inner text-xs text-slate-300 whitespace-nowrap max-w-full overflow-x-auto no-scrollbar shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
            title={isConnected ? 'Real-Time Telemetry Connected' : 'Polling Backend Telemetry'}
          />
          <span className="text-[11px] font-mono text-[#38BDF8] font-bold">{rig || 'OIL-RIG-04'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400 font-medium">Well:</span>
          <span className="text-[11px] font-bold text-white">{wellName || 'MORAN-29'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400 font-medium">Depth:</span>
          <span className="text-[11px] font-mono tabular-nums text-emerald-400 font-bold">
            {Number(depthMd || 2418.0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}m MD
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400 font-medium">Stratum:</span>
          <span className="text-[11px] font-semibold text-[#38BDF8]">{formation || 'Barail Group'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400 font-medium">ROP:</span>
          <span className="text-[11px] font-mono tabular-nums text-white font-bold">
            {Number(rop || 14.2).toFixed(1)} m/hr
          </span>
        </div>
      </div>

      {/* 3. Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
        {/* 10-Agent Swarm Trace Button */}
        <button
          onClick={() => setShowSwarmModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0A1A22] hover:bg-[#0D2633] border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-semibold rounded-lg transition-all shadow-md shadow-cyan-950/30"
          title="Inspect 10-Agent LangGraph Swarm Execution Trace"
        >
          <Cpu size={13} className="text-cyan-400 shrink-0" />
          <span>Swarm Trace</span>
        </button>

        {/* Proactive Notification Bell with Badge */}
        <Link
          href="/alerts"
          className="relative p-2 bg-[#071014] hover:bg-[#0C1B22] border border-[#162D38] hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-white transition-colors shadow-sm"
          title="Active Drilling Advisory Alerts"
        >
          <Bell size={15} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-[#04090C] animate-pulse">
              {unreadAlertsCount}
            </span>
          )}
        </Link>

        {/* User Identity & Quick Log Out Button */}
        {user && (
          <div className="flex items-center gap-2 bg-[#071014] border border-[#162D38] px-2 sm:px-2.5 py-1 rounded-lg shadow-sm">
            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="text-white font-semibold text-[11px] leading-tight truncate max-w-[120px]">{user.name}</span>
              <span className="text-[9px] text-slate-400 font-mono leading-tight">{user.badge}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 bg-[#0A151A] hover:bg-red-950/50 border border-slate-700/80 hover:border-red-600 rounded-md text-slate-400 hover:text-red-300 transition-colors"
              title="Sign Out / Lock Session"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>

    <SwarmTraceModal 
      isOpen={showSwarmModal} 
      onClose={() => setShowSwarmModal(false)} 
    />
    </>
  );
}
