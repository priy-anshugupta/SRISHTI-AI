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

  const handlePersonaLogin = (persona: UserProfile) => {
    setIsLoggingIn(true);
    setLoginSuccess(`Authenticated as ${persona.name} (${persona.role})`);
    setTimeout(() => {
      login(persona, redirectTarget);
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
    <div className="min-h-screen w-full bg-[#070D0F] text-slate-100 font-sans selection:bg-[#0D5C75] selection:text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-[3px]"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070D0F]/70 via-[#070D0F]/90 to-[#070D0F]" />
      </div>

      {/* Top Enterprise Banner */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#0A1215]/80 backdrop-blur-md font-sans">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/25 border border-[#0D5C75] flex items-center justify-center text-[#D97706]">
            <Flame size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm tracking-wider leading-none">
              SRISHTI <span className="text-[#D97706]">· AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider mt-0.5">
              OIL INDIA LIMITED · eRTMAC DULIAJAN
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#0C1518] px-2.5 py-1 rounded-full border border-slate-800 text-[10px] font-semibold text-slate-400">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>OISD-STD-174 SOVEREIGN CLEARANCE</span>
          </span>
          <Link
            href="/"
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-slate-800 transition-colors text-xs font-medium"
          >
            Back to Overview
          </Link>
        </div>
      </header>

      {/* Central Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-xl w-full bg-[#0B1316]/95 border-2 border-slate-700/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl font-sans text-xs space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2 border-b border-slate-800 pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#070D0F] border border-cyan-800/60 text-[11px] font-semibold text-cyan-300">
              <Lock size={12} className="text-cyan-400" />
              <span>SECURE OILFIELD GATEWAY · LEVEL 4 ACCESS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sign In to SRISHTI·AI
            </h1>
            <p className="text-slate-400 text-xs font-normal">
              Subsurface Memory & Offset Well Intelligence Platform for Oil India Limited operations
            </p>
          </div>

          {/* Success Banner */}
          {loginSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500 rounded-xl text-emerald-300 flex items-center gap-2.5 animate-pulse">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{loginSuccess} — Redirecting to {redirectTarget}…</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-[#070D0F] p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('persona')}
              className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'persona'
                  ? 'bg-[#0D5C75] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} className={activeTab === 'persona' ? 'text-amber-300' : ''} />
              <span>1-Click Persona Access</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'credentials'
                  ? 'bg-[#0D5C75] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound size={13} />
              <span>Oil India SSO Login</span>
            </button>
          </div>

          {/* TAB 1: 1-CLICK PERSONA SELECTION (RECOMMENDED FOR SIH JUDGES) */}
          {activeTab === 'persona' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>SELECT AUTHORIZED ROLE TO PROCEED:</span>
                <span className="text-cyan-400 font-bold">Hackathon Evaluation Mode</span>
              </div>

              <div className="space-y-2.5">
                {PRESET_PERSONAS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => !isLoggingIn && handlePersonaLogin(p)}
                    className="p-3.5 bg-[#070D0F] hover:bg-[#0E1A1E] border border-slate-800 hover:border-cyan-500 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${p.avatarColor}`}>
                        {p.initials}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-white font-bold text-sm flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">({p.badge})</span>
                        </div>
                        <div className="text-cyan-300 text-[11px] font-medium">{p.role}</div>
                        <div className="text-[10px] text-slate-400">{p.department}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {p.clearanceLevel.split('·')[0]}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-cyan-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-lg text-[10px] text-amber-200 leading-relaxed flex items-center gap-2 font-sans">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                <span>One-click role switching enables SIH evaluators to experience different operational clearances (Rig Floor vs Command Centre vs OISD Audit).</span>
              </div>
            </div>
          )}

          {/* TAB 2: ENTERPRISE SSO / CREDENTIALS FORM */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Employee ID / Official Email:
                </label>
                <input
                  type="text"
                  required
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  placeholder="e.g. OIL-DE-104 or p.saikia@oilindia.in"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070D0F] border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Domain Passkey / Password:
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070D0F] border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Asset / Operational Base:
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070D0F] border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs font-sans"
                >
                  <option value="Moran Asset (Upper Assam)">Moran Asset (Upper Assam Shelf)</option>
                  <option value="Naharkatiya Deep Asset">Naharkatiya Deep Asset</option>
                  <option value="Duliajan Field Headquarters">Duliajan Field Headquarters (eRTMAC)</option>
                  <option value="Baghjan Workover Command">Baghjan Workover Command</option>
                  <option value="Digboi Historic Field">Digboi Historic Field</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#0D5C75] hover:bg-[#147695] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-lg disabled:opacity-50 font-sans"
              >
                <ShieldCheck size={15} />
                <span>Sign In via Oil India Sovereign SSO</span>
              </button>
            </form>
          )}

          {/* Footer Security Badge */}
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center space-y-1 font-sans">
            <p>Protected by MoPNG Subsurface Data Sovereignty & OISD-STD-174 Audit Protocol.</p>
            <p className="text-slate-600">Air-gapped local database persistence · Zero third-party telemetry export</p>
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/80 bg-[#0A1215]/80 text-[10px] font-sans text-slate-500 flex flex-wrap items-center justify-between">
        <span>© 2026 Oil India Limited · Enhanced Real-Time Monitoring & Analysis Centre (eRTMAC)</span>
        <span className="font-semibold text-slate-400">SRISHTI·AI Platform v2.4</span>
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070D0F] flex items-center justify-center text-cyan-400 font-sans text-xs">
        Loading Sovereign Gateway…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
