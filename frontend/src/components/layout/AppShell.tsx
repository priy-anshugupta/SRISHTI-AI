'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TelemetryProvider } from '@/context/TelemetryContext';
import { ShieldCheck, RefreshCw, Lock, Unlock, ArrowLeft, ShieldAlert, Menu, X } from 'lucide-react';
import { PRESET_PERSONAS } from '@/context/AuthContext';

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const { isAuthenticated, isLoading, user, login } = useAuth();

  const isPublicPage = pathname === '/' || pathname === '/login';

  const isRigFloorPersona = user?.badge === 'Rig Floor' || user?.clearanceLevel === 'Rig Floor View';
  const isAllowedRigRoute = ['/doghouse', '/alerts', '/well/MOR-29'].includes(pathname) || pathname.startsWith('/well/');
  const showRigFloorLock = isRigFloorPersona && !isAllowedRigRoute;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isPublicPage, pathname, router]);

  useEffect(() => {
    if (!navigationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavigationOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [navigationOpen]);

  // Public standalone pages (Homepage & Login)
  if (isPublicPage) {
    return <main className="w-full min-h-screen bg-canvas">{children}</main>;
  }

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-canvas flex flex-col items-center justify-center text-xs text-muted space-y-3">
        <RefreshCw size={26} className="animate-spin text-accent" />
        <div className="flex items-center gap-2 text-secondary">
          <ShieldCheck size={14} className="text-success" />
          <span>Verifying Oil India Security Clearance…</span>
        </div>
      </div>
    );
  }

  // If not authenticated on protected route, show redirecting state
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-canvas flex flex-col items-center justify-center text-xs text-muted space-y-2">
        <p>Restricted Subsurface Asset. Redirecting to Sovereign Gateway…</p>
      </div>
    );
  }

  // Authenticated Protected App Shell
  return (
    <div className="dashboard-shell flex h-dvh w-full bg-canvas overflow-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <button aria-label={navigationOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={navigationOpen} aria-controls="primary-navigation" onClick={() => setNavigationOpen(!navigationOpen)} className={`md:hidden fixed top-4 ${navigationOpen ? "left-60" : "left-3"} z-50 p-2 bg-surface border border-line rounded-lg text-ink`}>
        {navigationOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      {navigationOpen && <button aria-label="Close navigation" className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setNavigationOpen(false)} />}
      <div id="primary-navigation" className={`${navigationOpen ? 'flex' : 'hidden'} md:flex fixed md:static inset-y-0 left-0 z-40`}>
        <Sidebar onNavigate={() => setNavigationOpen(false)} />
      </div>
      <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden bg-canvas relative">
        <Topbar />
        <main id="main-content" tabIndex={-1} className="workspace flex-1 min-h-0 overflow-y-auto overflow-x-hidden text-secondary relative">
          <div className="workspace-content">
            {showRigFloorLock ? (
              <div className="h-full min-h-[500px] flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-surface border border-warning/25 rounded-lg p-6 sm:p-8 space-y-5 shadow-sm text-center">
                  <div className="w-16 h-16 rounded-lg bg-warning-soft border border-warning/25 flex items-center justify-center text-warning mx-auto">
                    <Lock size={32} />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-soft border border-warning/25 text-warning text-xs font-mono font-bold">
                      <ShieldAlert size={14} />
                      <span>OISD-STD-174 RIG LOCK ACTIVE</span>
                    </div>
                    <h2 className="text-lg font-bold text-ink tracking-wide">
                      Dashboard Restricted on Rig Floor
                    </h2>
                    <p className="text-xs text-secondary leading-relaxed">
                      You are logged in as <strong className="text-warning">{user?.name} ({user?.role})</strong> on <strong className="text-ink">OIL-RIG-04</strong>.
                      This screen (<span className="font-mono text-accent">{pathname}</span>) is restricted to Headquarters Planning and Subsurface Analysis teams.
                    </p>
                  </div>

                  <div className="bg-surface-muted border border-line rounded-lg p-3.5 text-left text-xs text-muted space-y-1.5">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider font-mono">
                      Rig Floor Safety Directives:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted">
                      <li>Maintain 100% continuous monitoring of pit levels &amp; SPP telemetry.</li>
                      <li>Office analytics &amp; file uploads are locked to eliminate wellsite distraction.</li>
                      <li>Only Rig Floor Touch SCADA, live alerts, and well dossiers are unlocked.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => router.push('/doghouse')}
                      className="flex-1 py-2.5 px-4 bg-surface-muted hover:bg-surface-muted border border-line text-ink text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Rig Floor Terminal</span>
                    </button>
                    <button
                      onClick={() => login(PRESET_PERSONAS[0], pathname)}
                      className="flex-1 py-2.5 px-4 bg-brand hover:bg-brand-hover border border-accent/25 text-ink text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Unlock size={14} />
                      <span>Switch to HQ View (Unlock)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

import { NetworkModeProvider } from '@/context/NetworkModeContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TelemetryProvider>
          <NetworkModeProvider>
            <ShellContent>{children}</ShellContent>
          </NetworkModeProvider>
        </TelemetryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
