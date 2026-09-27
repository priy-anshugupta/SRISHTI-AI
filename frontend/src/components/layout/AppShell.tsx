'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TelemetryProvider } from '@/context/TelemetryContext';
import { ShieldCheck, RefreshCw, Lock, Unlock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { PRESET_PERSONAS } from '@/context/AuthContext';

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  // Public standalone pages (Homepage & Login)
  if (isPublicPage) {
    return <main className="w-full min-h-screen bg-[#080E11]">{children}</main>;
  }

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#080E11] flex flex-col items-center justify-center text-xs text-slate-400 space-y-3">
        <RefreshCw size={26} className="animate-spin text-cyan-400" />
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Verifying Oil India Security Clearance…</span>
        </div>
      </div>
    );
  }

  // If not authenticated on protected route, show redirecting state
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#080E11] flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
        <p>Restricted Subsurface Asset. Redirecting to Sovereign Gateway…</p>
      </div>
    );
  }

  // Authenticated Protected App Shell
  return (
    <div className="flex h-screen w-full bg-[#080E11] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full overflow-hidden bg-[#080E11] relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 md:p-5 text-slate-200 relative">
          <div className="mx-auto max-w-[1600px] h-full">
            {showRigFloorLock ? (
              <div className="h-full min-h-[500px] flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-[#0D1419] border border-amber-600/70 rounded-xl p-6 sm:p-8 space-y-5 shadow-sm text-center">
                  <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                    <Lock size={32} />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300 text-xs font-mono font-bold">
                      <ShieldAlert size={14} />
                      <span>OISD-STD-174 RIG LOCK ACTIVE</span>
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      Dashboard Restricted on Rig Floor
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      You are logged in as <strong className="text-amber-300">{user?.name} ({user?.role})</strong> on <strong className="text-white">OIL-RIG-04</strong>.
                      This screen (<span className="font-mono text-cyan-300">{pathname}</span>) is restricted to Headquarters Planning and Subsurface Analysis teams.
                    </p>
                  </div>

                  <div className="bg-[#0A1115] border border-[#1C2C35] rounded-xl p-3.5 text-left text-xs text-slate-400 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Rig Floor Safety Directives:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                      <li>Maintain 100% continuous monitoring of pit levels &amp; SPP telemetry.</li>
                      <li>Office analytics &amp; file uploads are locked to eliminate wellsite distraction.</li>
                      <li>Only Rig Floor Touch SCADA, live alerts, and well dossiers are unlocked.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => router.push('/doghouse')}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Rig Floor Terminal</span>
                    </button>
                    <button
                      onClick={() => login(PRESET_PERSONAS[0], pathname)}
                      className="flex-1 py-2.5 px-4 bg-[#0D5C75] hover:bg-[#0F6D8A] border border-cyan-500/40 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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
