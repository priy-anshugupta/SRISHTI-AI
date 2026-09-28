'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNetworkMode } from '@/context/NetworkModeContext';
import { Bell, Cpu, LogOut, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
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
    <header className="app-topbar print:hidden shrink-0 bg-surface border-b border-line z-20 w-full font-sans select-none relative">
      {/* 1. Left Breadcrumb Capsule */}
      <div className="topbar-breadcrumb flex items-center gap-2 text-sm">
        <Link href="/" className="text-muted hover:text-ink transition-colors font-medium flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>Operations</span>
        </Link>
        <span className="text-muted font-normal">/</span>
        <span className="topbar-page-label text-ink font-semibold" title={currentLabel}>{currentLabel}</span>
      </div>

      {/* 2. Center Active Rig Live Telemetry Ticker */}
      <div className="topbar-telemetry flex items-center min-w-0" aria-label="Active well telemetry">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface border border-line shadow-sm text-xs text-secondary whitespace-nowrap shrink-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected ? 'bg-success ' : 'bg-warning'
            }`}
            title={isConnected ? 'Real-Time Telemetry Connected' : 'Polling Backend Telemetry'}
          />
          <span className="text-xs text-accent font-semibold shrink-0">{rig || 'OIL-RIG-04'}</span>
          <span className="text-muted">·</span>
          <span className="text-xs font-bold text-ink shrink-0">{wellName || 'MORAN-29'}</span>
          <span className="text-muted">·</span>
          <span className="text-xs tabular-nums text-success font-semibold shrink-0">
            {Number(depthMd || 2418.0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}m
          </span>
          <span className="text-muted">·</span>
          <span className="text-xs font-semibold text-accent shrink-0 whitespace-nowrap">
            {formation || 'Barail Group'}
          </span>
          <span className="text-muted hidden sm:inline">·</span>
          <span className="text-xs tabular-nums text-ink font-semibold shrink-0 hidden sm:inline">
            {Number(rop || 14.2).toFixed(1)} m/h
          </span>
        </div>
      </div>

      {/* 3. Right Action Controls */}
      <div className="topbar-actions flex items-center gap-2 shrink-0">
        {/* Day / Night Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-surface hover:bg-surface-muted border border-line hover:border-line text-secondary text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
          title={theme === 'dark' ? 'Switch to day view' : 'Switch to night view'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} className="text-warning shrink-0" />
              <span className="hidden md:inline text-xs font-medium text-secondary">Day View</span>
            </>
          ) : (
            <>
              <Moon size={14} className="text-accent shrink-0" />
              <span className="hidden md:inline text-xs font-medium text-secondary">Night View</span>
            </>
          )}
        </button>

        {/* Rig Air-Gap / Edge Server vs Cloud Mode Toggle */}
        <button
          onClick={toggleNetworkMode}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-sm ${
            isAirGapped
              ? 'bg-surface hover:bg-surface-muted border-warning/25 text-warning'
              : 'bg-surface hover:bg-surface-muted border-line hover:border-line text-secondary'
          }`}
          title={
            isAirGapped
              ? 'Rig Edge Mode: Local Ollama (Runs offline without internet). Click to switch to Cloud.'
              : 'Cloud AI Mode: High-speed cloud processing. Click to switch to Rig Edge.'
          }
        >
          {isAirGapped ? (
            <>
              <WifiOff size={13} className="text-warning shrink-0" />
              <span className="text-xs font-medium text-warning">Local AI (Offline)</span>
            </>
          ) : (
            <>
              <Wifi size={13} className="text-accent shrink-0" />
              <span className="text-xs font-medium text-secondary">Cloud AI</span>
            </>
          )}
        </button>

        {/* AI Agent Trace Button */}
        <button
          onClick={() => setShowSwarmModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-surface hover:bg-surface-muted border border-line hover:border-line text-secondary text-xs font-medium rounded-lg transition-colors cursor-pointer"
          title="Inspect Multi-Agent AI Decision Trace"
        >
          <Cpu size={13} className="text-muted shrink-0" />
          <span className="hidden sm:inline">AI Agent Trace</span>
        </button>

        {/* Proactive Notification Bell with Badge */}
        <Link
          href="/alerts"
          className="relative p-2 bg-surface hover:bg-surface-muted border border-line hover:border-line rounded-lg text-secondary hover:text-ink transition-colors shrink-0"
          title="Active Drilling Advisory Alerts"
        >
          <Bell size={15} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-ink rounded-full text-xs font-bold flex items-center justify-center border border-line">
              {unreadAlertsCount}
            </span>
          )}
        </Link>

        {/* User Identity & Quick Log Out Button */}
        {user && (
          <div className="flex items-center gap-2 bg-surface border border-line px-2 sm:px-2 py-1 rounded-lg shadow-sm shrink-0">
            <div className="hidden xl:flex flex-col text-right text-xs">
              <span className="text-ink font-semibold text-xs leading-tight truncate max-w-[120px]">{user.name}</span>
              <span className="text-xs text-muted font-mono leading-tight">{user.badge}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 bg-surface-muted hover:bg-danger-soft border border-line hover:border-danger/25 rounded-md text-muted hover:text-danger transition-colors"
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
