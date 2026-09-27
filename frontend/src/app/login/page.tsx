'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Flame, ShieldCheck, Lock, UserCheck, KeyRound, Building2, 
  ChevronRight, ArrowRight, Radio, AlertTriangle, CheckCircle2,
  Sparkles, Layers, FileText, Monitor
} from 'lucide-react';
import { useAuth, PRESET_PERSONAS, UserProfile } from '@/context/AuthContext';
import Link from 'next/link';

function LoginForm() {
  const { login, isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTarget = searchParams.get('redirect') || '/map';

  const [activeTab, setActiveTab] = useState<'persona' | 'credentials'>('persona');
  const [badgeInput, setBadgeInput] = useState('OIL-DE-104');
  const [passwordInput, setPasswordInput] = useState('srishti@2026');
  const [selectedField, setSelectedField] = useState('Moran Asset (Upper Assam)');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  const handlePersonaLogin = (persona: UserProfile, target?: string) => {
    setIsLoggingIn(true);
    const destination = target || redirectTarget;
    setLoginSuccess(`Signed in as ${persona.name} (${persona.role})`);
    setTimeout(() => {
      login(persona, destination);
    }, 450);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    // Find matching persona or default to Saikia
    const matched = PRESET_PERSONAS.find(p => 
      p.badge.toLowerCase() === badgeInput.trim().toLowerCase() ||
      p.email.toLowerCase() === badgeInput.trim().toLowerCase()
    ) || PRESET_PERSONAS[0];

    setLoginSuccess(`Credentials Verified: ${matched.name} (${selectedField})`);
    setTimeout(() => {
      login(matched, redirectTarget);
    }, 450);
  };

  return (
    <div className="min-h-screen w-full bg-[#080E11] text-slate-100 font-sans selection:bg-[#0D5C75] selection:text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-[3px]"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070D0F]/70 via-[#070D0F]/90 to-[#070D0F]" />
      </div>

      {/* Top Enterprise Banner */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-[#1C2C35]/80 bg-[#0A1215]/80 backdrop-blur-md font-sans">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/25 border border-[#0D5C75] flex items-center justify-center text-[#D97706]">
            <Flame size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm tracking-wider leading-none">
              SRISHTI <span className="text-[#D97706]">· AI</span>
            </span>
            <span className="text-xs text-slate-400 font-medium tracking-wider mt-0.5">
              OIL INDIA LIMITED · eRTMAC DULIAJAN
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#0D1419] px-2.5 py-1 rounded-full border border-[#1C2C35] text-xs font-semibold text-slate-400">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Safety Compliant</span>
          </span>
          <Link
            href="/"
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-[#111B21] transition-colors text-xs font-medium"
          >
            Back to Overview
          </Link>
        </div>
      </header>

      {/* Central Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-xl w-full bg-[#0D1419]/95 border border-[#1C2C35]/90 rounded-xl p-6 sm:p-8 shadow-sm backdrop-blur-xl font-sans text-xs space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2 border-b border-[#1C2C35] pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#080E11] border border-[#1C2C35]/60 text-[11px] font-medium text-slate-300">
              <Lock size={12} className="text-emerald-400" />
              <span>Authorized Access</span>
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Sign In to SRISHTI·AI
            </h1>
            <p className="text-slate-400 text-xs font-normal">
              AI Drilling Copilot &amp; Historical Well Memory for Oil India Limited
            </p>
          </div>

          {/* Success Banner */}
          {loginSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500 rounded-xl text-emerald-300 flex items-center gap-2.5 ">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{loginSuccess} — Redirecting to {redirectTarget}…</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-[#080E11] p-1.5 rounded-xl border border-[#1C2C35]">
            <button
              type="button"
              onClick={() => setActiveTab('persona')}
              className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'persona'
                  ? 'bg-[#0D5C75]/15 text-[#38BDF8] border border-[#0D5C75]/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={13} className={activeTab === 'persona' ? 'text-amber-300' : ''} />
              <span>Demo Profiles (1-Click)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'credentials'
                  ? 'bg-[#0D5C75]/15 text-[#38BDF8] border border-[#0D5C75]/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound size={13} />
              <span>Employee Login</span>
            </button>
          </div>

          {/* TAB 1: 1-CLICK ROLE SELECTION (HEADQUARTERS VS RIG FLOOR) */}
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>CHOOSE YOUR VIEW:</span>
                <span className="text-[#38BDF8] font-medium">Instant Access</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Headquarters View */}
                <div
                  onClick={() => !isLoggingIn && handlePersonaLogin(PRESET_PERSONAS[0], '/map')}
                  className="p-4 bg-[#080E11] hover:bg-[#0E1A1E] border border-[#1C2C35] hover:border-[#38BDF8]/60 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#0D5C75]/25 border border-[#38BDF8]/40 flex items-center justify-center text-xl">
                      🏢
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#111B21]/80 border border-[#1C2C35]/60 text-slate-300">
                      Office / HQ
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-white font-bold text-sm group-hover:text-[#38BDF8] transition-colors">
                      Headquarters View
                    </div>
                    <div className="text-slate-400 text-xs leading-relaxed">
                      Full analytics, offset well map, past incident memory &amp; well program planning.
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1C2C35]/80 flex items-center justify-between text-xs text-[#38BDF8] font-medium">
                    <span>Enter Headquarters</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Rig Floor View */}
                <div
                  onClick={() => !isLoggingIn && handlePersonaLogin(PRESET_PERSONAS[2], '/doghouse')}
                  className="p-4 bg-[#080E11] hover:bg-[#0E1A1E] border border-[#1C2C35] hover:border-amber-500/60 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/30 border border-amber-600/40 flex items-center justify-center text-xl">
                      🛢️
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#111B21]/80 border border-[#1C2C35]/60 text-amber-300">
                      Rig Floor
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-white font-bold text-sm group-hover:text-amber-300 transition-colors">
                      Rig Floor View
                    </div>
                    <div className="text-slate-400 text-xs leading-relaxed">
                      Active bit depth, lookahead safety radar &amp; high-contrast screen for the driller.
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1C2C35]/80 flex items-center justify-between text-xs text-amber-400 font-medium">
                    <span>Open Rig Terminal</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/60 border border-[#1C2C35] rounded-lg text-[11px] text-slate-400 text-center">
                <span>You can seamlessly switch between Headquarters and Rig Floor views at any time inside the app.</span>
              </div>
            </div>
          )}

          {/* TAB 2: ENTERPRISE SSO / CREDENTIALS FORM */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                  Employee ID or Email:
                </label>
                <input
                  type="text"
                  required
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  placeholder="e.g. p.saikia@oilindia.in"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080E11] border border-[#1C2C35] text-white focus:outline-none focus:border-cyan-500 text-xs font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                  Password:
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080E11] border border-[#1C2C35] text-white focus:outline-none focus:border-cyan-500 text-xs font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                  Field / Operational Base:
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080E11] border border-[#1C2C35] text-white focus:outline-none focus:border-cyan-500 text-xs font-sans"
                >
                  <option value="Moran Asset (Upper Assam)">Moran Field (Upper Assam)</option>
                  <option value="Naharkatiya Deep Asset">Naharkatiya Field</option>
                  <option value="Duliajan Field Headquarters">Duliajan Headquarters</option>
                  <option value="Baghjan Workover Command">Baghjan Field</option>
                  <option value="Digboi Historic Field">Digboi Field</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-[#0D5C75] hover:bg-[#0F6D8A] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50 font-sans cursor-pointer"
              >
                <ShieldCheck size={15} />
                <span>Sign In to Platform</span>
              </button>
            </form>
          )}

          {/* Footer Security Badge */}
          <div className="pt-3 border-t border-[#1C2C35] text-xs text-slate-400 text-center space-y-0.5 font-sans">
            <p>Protected by Oil India Internal Security Protocols</p>
            <p className="text-slate-500">100% Private Network · Subsurface data stays securely on premises</p>
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-[#1C2C35]/80 bg-[#0A1215]/80 text-xs font-sans text-slate-500 flex flex-wrap items-center justify-between">
        <span>© 2026 Oil India Limited · Operations Control Centre</span>
        <span className="font-medium text-slate-400">SRISHTI·AI Platform</span>
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080E11] flex items-center justify-center text-[#38BDF8] font-sans text-xs">
        Loading Sovereign Gateway…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
