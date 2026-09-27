'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNetworkMode } from '@/context/NetworkModeContext';
import { Bell, Cpu, LogOut, Wifi, WifiOff, ShieldCheck, Sun, Moon } from 'lucide-react';
import SwarmTraceModal from '@/components/modals/SwarmTraceModal';
import { useAuth } from '@/context/AuthContext';
import { useTelemetry } from '@/context/TelemetryContext';
import { useTheme } from '@/context/ThemeContext';

const routeLabels: Record<string, string> = {
  '/map': 'Nearby Well Map',
  '/ask': 'Ask SRISHTI (AI Copilot)',
  '/well': 'Well Profile & Dossier',
  '/compare': 'Compare Nearby Wells',
  '/knowledge': 'Past Incident Memory',
  '/alerts': 'Early Safety Alerts',
  '/analytics': 'Rock Layer Analysis',
  '/ingest': 'Upload & Read Reports',
  '/report': 'Pre-Drill Safety Brief',
  '/doghouse': 'Rig Floor View',
  '/plan': 'Well Planning',
  '/review': 'Review & Verification',
};

export default function Topbar() {
  const [showSwarmModal, setShowSwarmModal] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isAirGapped, toggleNetworkMode } = useNetworkMode();
  const { theme, toggleTheme } = useTheme();
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
  let currentLabel = routeLabels[baseRoute] || 'Well Operations';
  if (baseRoute === '/well') {
    const wellId = pathname?.split('/')[2];
    if (wellId === 'MOR-29') {
      currentLabel = 'Well Profile: MORAN-29 (Active Rig)';
    } else if (wellId) {
      currentLabel = `Well Dossier: ${wellId} (Archive)`;
    } else {
      currentLabel = 'Well Profile & Dossier';
    }
  }

  return (
    <>
    <header className="print:hidden h-14 shrink-0 bg-[#0A0F12]/95 backdrop-blur-md border-b border-[#1C2C35] shadow-sm flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 z-20 w-full font-sans select-none relative">
      {/* Subtle bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#1C2C35] pointer-events-none" />

      {/* 1. Left Breadcrumb Capsule */}
      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0D1419] border border-[#1C2C35] shadow-sm text-xs whitespace-nowrap shrink-0">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          <span>Operations</span>
        </Link>
        <span className="text-slate-600 font-normal">/</span>
        <span className="text-white font-semibold tracking-wide">{currentLabel}</span>
      </div>

      {/* 2. Center Active Rig Live Telemetry Ticker */}
      <div className="flex items-center justify-center flex-1 min-w-0 px-1 overflow-visible">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0D1419] border border-[#1C2C35] shadow-sm text-xs text-slate-300 whitespace-nowrap shrink-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
            title={isConnected ? 'Real-Time Telemetry Connected' : 'Polling Backend Telemetry'}
          />
          <span className="text-[11px] text-[#38BDF8] font-semibold shrink-0">{rig || 'OIL-RIG-04'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] font-bold text-white shrink-0">{wellName || 'MORAN-29'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] tabular-nums text-emerald-400 font-semibold shrink-0">
            {Number(depthMd || 2418.0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}m
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] font-semibold text-[#38BDF8] shrink-0 whitespace-nowrap">
            {formation || 'Barail Group'}
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-[11px] tabular-nums text-white font-semibold shrink-0 hidden sm:inline">
            {Number(rop || 14.2).toFixed(1)} m/h
          </span>
        </div>
      </div>

      {/* 3. Right Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
        {/* Day / Night Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0D1419] hover:bg-[#111B21] border border-[#1C2C35] hover:border-slate-500 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
          title={theme === 'dark' ? 'Switch to Government Daylight Mode' : 'Switch to Industrial SCADA Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} className="text-amber-400 shrink-0" />
              <span className="hidden md:inline text-[11px] font-medium text-slate-200">Day View</span>
            </>
          ) : (
            <>
              <Moon size={14} className="text-blue-500 shrink-0" />
              <span className="hidden md:inline text-[11px] font-medium text-slate-800">Night View</span>
            </>
          )}
        </button>

        {/* Rig Air-Gap / Edge Server vs Cloud Mode Toggle */}
        <button
          onClick={toggleNetworkMode}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-sm ${
            isAirGapped
              ? 'bg-[#0D1419] hover:bg-[#111B21] border-amber-500/40 text-amber-300'
              : 'bg-[#0D1419] hover:bg-[#111B21] border-[#1C2C35] hover:border-slate-500 text-slate-300'
          }`}
          title={
            isAirGapped
              ? 'Rig Edge Mode: Local Ollama (Runs offline without internet). Click to switch to Cloud.'
              : 'Cloud AI Mode: High-speed cloud processing. Click to switch to Rig Edge.'
          }
        >
          {isAirGapped ? (
            <>
              <WifiOff size={13} className="text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium text-amber-300">Local AI (Offline)</span>
            </>
          ) : (
            <>
              <Wifi size={13} className="text-[#38BDF8] shrink-0" />
              <span className="text-[11px] font-medium text-slate-200">Cloud AI</span>
            </>
          )}
        </button>

        {/* AI Agent Trace Button */}
        <button
          onClick={() => setShowSwarmModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0D1419] hover:bg-[#111B21] border border-[#1C2C35] hover:border-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          title="Inspect Multi-Agent AI Decision Trace"
        >
          <Cpu size={13} className="text-slate-400 shrink-0" />
          <span>AI Agent Trace</span>
        </button>

        {/* Proactive Notification Bell with Badge */}
        <Link
          href="/alerts"
          className="relative p-2 bg-[#0D1419] hover:bg-[#111B21] border border-[#1C2C35] hover:border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors shrink-0"
          title="Active Drilling Advisory Alerts"
        >
          <Bell size={15} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-[#0A0F12]">
              {unreadAlertsCount}
            </span>
          )}
        </Link>

        {/* User Identity & Quick Log Out Button */}
        {user && (
          <div className="flex items-center gap-2 bg-[#0D1419] border border-[#1C2C35] px-2 sm:px-2 py-1 rounded-lg shadow-sm shrink-0">
            <div className="hidden xl:flex flex-col text-right text-xs">
              <span className="text-white font-semibold text-[11px] leading-tight truncate max-w-[120px]">{user.name}</span>
              <span className="text-[9px] text-slate-400 font-mono leading-tight">{user.badge}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 bg-[#111B21] hover:bg-red-950/50 border border-slate-700/80 hover:border-red-600 rounded-md text-slate-400 hover:text-red-300 transition-colors"
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
