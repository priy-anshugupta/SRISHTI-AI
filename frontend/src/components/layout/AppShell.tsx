'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TelemetryProvider } from '@/context/TelemetryContext';
import { ShieldCheck, RefreshCw } from 'lucide-react';

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isPublicPage = pathname === '/' || pathname === '/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isPublicPage, pathname, router]);

  // Public standalone pages (Homepage & Login)
  if (isPublicPage) {
    return <main className="w-full min-h-screen bg-[#070D0F]">{children}</main>;
  }

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#070D0F] flex flex-col items-center justify-center text-xs text-slate-400 space-y-3">
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
      <div className="h-screen w-full bg-[#070D0F] flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
        <p>Restricted Subsurface Asset. Redirecting to Sovereign Gateway…</p>
      </div>
    );
  }

  // Authenticated Protected App Shell
  return (
    <div className="flex h-screen w-full bg-[#020608] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full overflow-hidden bg-[#070E12] relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 md:p-5 text-slate-200 relative">
          <div className="mx-auto max-w-[1600px] h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TelemetryProvider>
        <ShellContent>{children}</ShellContent>
      </TelemetryProvider>
    </AuthProvider>
  );
}
