'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Compass, Activity, FileText, Share2, AlertTriangle, 
  CheckCircle2, Database, ShieldCheck, Layers, Search, 
  ArrowRight, ChevronRight, Monitor, Radio, FileDown, 
  Flame, Sparkles, Cpu, BookOpen, Gauge, MapPin, Sliders,
  Check, Network, EyeOff, FileSearch, Unlink, BellOff,
  Building2, Globe, ShieldAlert, MessageSquare, LogIn, LogOut, Lock
} from 'lucide-react';

export default function Homepage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleProtectedAction = (e: React.MouseEvent, targetPath: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
    } else {
      router.push(targetPath);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#070D0F] text-slate-100 font-sans selection:bg-[#0D5C75] selection:text-white relative">
      
      {/* Global Fixed Panoramic Background with atmospheric bokeh blur and balanced opacity */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center md:bg-[center_right] bg-no-repeat opacity-30 scale-105 filter blur-[2.5px]"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        {/* Soft dark wash so content cards and text remain razor-sharp while background atmosphere is clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070D0F]/35 via-[#070D0F]/65 to-[#070D0F]/85" />
      </div>

      {/* 1. Floating Transparent Navigation Bar */}
      <header className="absolute top-0 inset-x-0 z-50 h-16 bg-transparent pl-6 lg:pl-12 pr-4 lg:pr-6 flex items-center justify-between">
        {/* Brand & Emblem */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#0D5C75]/25 border border-[#0D5C75] flex items-center justify-center text-[#D97706] shadow-[0_0_15px_rgba(13,92,117,0.3)]">
            <Flame size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-base tracking-wider leading-none">
              SRISHTI <span className="text-[#D97706]">· AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider mt-1">
              OIL INDIA LIMITED · eRTMAC
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-slate-300">
          <a href="#capabilities" className="hover:text-[#38BDF8] transition-colors">Capabilities</a>
          <a href="#preview" className="hover:text-[#38BDF8] transition-colors">Offset Radar</a>
          <a href="#stratigraphy" className="hover:text-[#38BDF8] transition-colors">Assam Stratigraphy</a>
          <a href="#compliance" className="hover:text-[#38BDF8] transition-colors">Standards</a>
        </nav>

        {/* Right Status Pills & Actions (Sleek, Compact, Placed Far Right) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0C1518]/70 backdrop-blur-sm border border-slate-800 rounded-full px-2 py-0.5 text-[10px] font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>AIR-GAPPED · 0 KB/s</span>
          </div>

          {isAuthenticated && user ? (
            <>
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0C1518]/80 border border-slate-700 rounded-md text-[11px] font-medium text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{user.name} ({user.badge})</span>
              </span>

              <button
                onClick={(e) => handleProtectedAction(e, '/doghouse')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-[#0C1518]/70 backdrop-blur-sm hover:bg-[#142227] border border-slate-700/80 text-slate-200 hover:text-white rounded-md text-[11px] font-medium transition-all whitespace-nowrap"
              >
                <Radio size={11} className="text-[#D97706]" />
                <span>Doghouse Terminal</span>
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#0D5C75] hover:bg-[#0284c7] text-white text-[11px] font-semibold rounded-md transition-all shadow-[0_0_10px_rgba(13,92,117,0.3)] whitespace-nowrap"
              >
                <span>Launch Mission Control</span>
                <ChevronRight size={12} />
              </button>

              <button
                onClick={logout}
                className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 rounded-md text-red-300 hover:text-white transition-colors"
                title="Log Out"
              >
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1 bg-[#0C1518]/80 hover:bg-[#142227] border border-slate-700 text-slate-200 hover:text-white rounded-md text-[11px] font-semibold transition-all whitespace-nowrap"
              >
                <LogIn size={12} className="text-cyan-400" />
                <span>Sign In</span>
              </Link>

              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="flex items-center gap-1 px-3 py-1 bg-[#0D5C75] hover:bg-[#0284c7] text-white text-[11px] font-semibold rounded-md transition-all shadow-[0_0_10px_rgba(13,92,117,0.3)] whitespace-nowrap"
              >
                <span>Enter Platform</span>
                <ChevronRight size={12} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section: Cinematic Rig Sunset Background with Left-Aligned Content */}
      <section className="relative z-10 w-full min-h-screen flex flex-col justify-between pt-24 pb-8 lg:pt-28 border-b border-slate-800/80">
        {/* Full-bleed Panoramic Drilling Rig at Sunset */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-right md:bg-[center_right] bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        
        {/* Balanced cinematic gradient: subtle soft backing on left (low opacity), 100% crystal clear across center & right */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none" 
          style={{ 
            background: "linear-gradient(to right, rgba(7,13,15,0.45) 0%, rgba(7,13,15,0.18) 42%, transparent 70%), linear-gradient(to top, rgba(7,13,15,0.85) 0%, transparent 15%)" 
          }} 
        />

        <div className="w-full px-6 lg:px-12 relative z-20">
          <div className="max-w-2xl space-y-5">
            
            {/* Enterprise Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#070D0F]/80 border border-[#0D5C75] text-xs font-semibold text-[#38BDF8] shadow-md backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-semibold tracking-wide">OIL INDIA LIMITED · SUBSURFACE DRILLING INTELLIGENCE</span>
            </div>

            {/* Tagline & Headline (Crisp executive size, perfectly left-aligned) */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-white tracking-tight leading-[1.18] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
                Drill with 60 years of memory. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#22D3EE] to-[#FBBF24]">
                  Never repeat a hazard.
                </span>
              </h1>
            </div>

            {/* Executive Hook with subtle frosted glass card for effortless reading over the mountain ridges */}
            <div className="bg-[#070D0F]/65 backdrop-blur-md p-3.5 rounded-lg border border-slate-800/70 max-w-xl shadow-lg">
              <p className="text-xs sm:text-[13.5px] text-slate-100 leading-relaxed font-normal">
                SRISHTI fuses 60 years of historical Well Completion Reports, mud logs, and eRTMAC telemetry into an instant offset well intelligence engine — delivering formation risk corridors and depth-triggered lookahead hazard radar across Upper Assam.
              </p>
            </div>

            {/* 4 Feature Badges (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-w-xl">
              <div className="p-3 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800/80 rounded-lg flex items-start gap-2.5 hover:border-slate-700 transition-colors shadow-lg">
                <div className="p-1.5 rounded bg-[#0D5C75]/25 text-[#38BDF8] shrink-0 mt-0.5">
                  <FileSearch size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Intelligent Document Extraction</div>
                  <div className="text-[11px] text-slate-300">VLM + Layout-Aware OCR for WCRs/DDRs</div>
                </div>
              </div>

              <div className="p-3 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800/80 rounded-lg flex items-start gap-2.5 hover:border-slate-700 transition-colors shadow-lg">
                <div className="p-1.5 rounded bg-[#D97706]/25 text-[#D97706] shrink-0 mt-0.5">
                  <Globe size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">3D Offset Geospatial Radar</div>
                  <div className="text-[11px] text-slate-300">Tactical 1km–25km multi-factor ranking</div>
                </div>
              </div>

              <div className="p-3 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800/80 rounded-lg flex items-start gap-2.5 hover:border-slate-700 transition-colors shadow-lg">
                <div className="p-1.5 rounded bg-sky-950/50 text-[#38BDF8] shrink-0 mt-0.5">
                  <Network size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Drilling Knowledge Graph (DKG)</div>
                  <div className="text-[11px] text-slate-300">Causal Graph RAG for recurring hazards</div>
                </div>
              </div>

              <div className="p-3 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800/80 rounded-lg flex items-start gap-2.5 hover:border-slate-700 transition-colors shadow-lg">
                <div className="p-1.5 rounded bg-emerald-950/50 text-[#34d399] shrink-0 mt-0.5">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">OISD-STD-174 Proactive Alerts</div>
                  <div className="text-[11px] text-slate-300">Depth-triggered lookahead warning radar</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="px-5 py-2.5 bg-[#0D5C75] hover:bg-[#0284c7] text-white text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-[0_0_20px_rgba(13,92,117,0.5)] flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Mission Control</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/ask')}
                className="px-4 py-2.5 bg-[#0C1518] hover:bg-[#142227] border border-slate-700 text-slate-200 text-xs font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} className="text-[#38BDF8]" />
                <span>Ask SRISHTI (AI Chat)</span>
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/doghouse')}
                className="px-4 py-2.5 bg-[#0C1518] hover:bg-[#142227] border border-slate-700 text-slate-200 text-xs font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Radio size={14} className="text-[#D97706]" />
                <span>Field Terminal</span>
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Stat Strip (100% Left-Aligned, Transparent) */}
        <div className="mt-10 pt-6 border-t border-slate-800/30 bg-transparent px-6 lg:px-12 w-full">
          <div className="max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-white">5,000+</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Historical Wells</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-[#38BDF8]">50+</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Assam Fields</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-[#D97706]">60 Years</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Memory</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-[#10B981]">&lt; 3.8s</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Live Offset Intelligence Preview */}
      <section id="preview" className="relative z-10 py-16 lg:py-24 bg-transparent border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span>LIVE SYSTEM RADAR PREVIEW</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                Active Offset Well Intelligence Radar
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                Real-time projection showing how SRISHTI matches active rig bit depth against 60 years of offset well records in the Barail Group.
              </p>
            </div>

            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#38BDF8] hover:underline"
            >
              <span>Explore Complete Geospatial Map</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Active Rig Status Box */}
            <div className="lg:col-span-5 bg-[#0B1316] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">ACTIVE RIG PARAMETERS</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D5C75]/20 text-[#38BDF8] border border-[#0D5C75]/40 font-semibold">
                    OIL-RIG-04
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-[#070D0F] border border-slate-800/60">
                    <span className="text-slate-400 font-medium">Target Well:</span>
                    <span className="text-white font-bold font-mono">MORAN-29</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#070D0F] border border-slate-800/60">
                    <span className="text-slate-400 font-medium">Bit Depth:</span>
                    <span className="text-white font-bold text-sm font-mono tabular-nums">2,418.0 m MD</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#070D0F] border border-slate-800/60">
                    <span className="text-slate-400 font-medium">Active Stratigraphy:</span>
                    <span className="text-[#38BDF8] font-semibold">Barail Group (2,350m–3,200m)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-red-950/20 border border-red-800/40">
                    <span className="text-red-300 font-medium">Lookahead Warning:</span>
                    <span className="text-red-400 font-bold">Overpressured Gas Sand at 2,450m</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#070D0F] border border-emerald-900/40 rounded-lg text-xs space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>OISD-STD-174 PRE-SPUD ADVISORY</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Pre-mix 12.4 ppg kill mud before penetrating 2,440m. Conduct 15-minute flow check upon drilling break in Barail Group.
                </p>
              </div>
            </div>

            {/* Right: Top 3 Correlated Offset Wells */}
            <div className="lg:col-span-7 bg-[#0B1316] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">CORRELATED OFFSET WELLS (15 KM TACTICAL RADIUS)</span>
                <span className="text-[10px] text-slate-400 font-semibold">3 MATCHES FOUND</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-[#070D0F] border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#D97706]" />
                      <span className="font-bold text-white text-sm">Moran-7</span>
                      <span className="text-[11px] text-slate-400 font-normal">0.8 km distance · TD 3,420m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#0D5C75]/25 text-[#38BDF8] border border-[#0D5C75]/50 font-bold text-[10px] font-mono">
                      94% SIMILARITY
                    </span>
                  </div>
                  <div className="text-red-400 text-[11px]">
                    Gas Kick precursor logged at 2,448m in Barail Group. Required 12.2 ppg kill mud circulation and secondary barrier verification.
                  </div>
                </div>

                <div className="p-3 bg-[#070D0F] border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#D97706]" />
                      <span className="font-bold text-white text-sm">Moran-12</span>
                      <span className="text-[11px] text-slate-400 font-normal">2.4 km distance · TD 3,210m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#0D5C75]/25 text-[#38BDF8] border border-[#0D5C75]/50 font-bold text-[10px] font-mono">
                      89% SIMILARITY
                    </span>
                  </div>
                  <div className="text-amber-400 text-[11px]">
                    Differential pipe sticking recorded at 2,390m. Mitigated by spotting 50 bbl OBM lubricant pill with continuous string rotation.
                  </div>
                </div>

                <div className="p-3 bg-[#070D0F] border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#D97706]" />
                      <span className="font-bold text-white text-sm">Naharkatiya-512</span>
                      <span className="text-[11px] text-slate-400 font-normal">11.2 km distance · TD 3,650m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#0D5C75]/25 text-[#38BDF8] border border-[#0D5C75]/50 font-bold text-[10px] font-mono">
                      82% SIMILARITY
                    </span>
                  </div>
                  <div className="text-emerald-400 text-[11px]">
                    Optimal ROP (14.2 m/hr) recorded across Barail sand interval using low-solids non-dispersed polymer mud.
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Section: The ₹50-200 Crore Problem — The 4 Fatal Flaws */}
      <section id="problem" className="relative z-10 py-20 lg:py-28 bg-transparent border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-red-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <AlertTriangle size={14} />
              <span>THE ₹50–200 CRORE DRILLING KNOWLEDGE CRISIS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              Why Drilling Lessons Get Forgotten in Indian Oilfields
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Every well drilled generates thousands of pages of critical drilling intelligence. Yet today, 80%+ remains locked in paper files and unindexed PDFs. When senior engineers retire, decades of hard-won tribal knowledge disappears.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Flaw 1 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-red-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 flex items-center justify-center">
                <EyeOff size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">1. No Unified Offset View</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                When planning Well X, drilling engineers cannot instantly see all wells drilled within 5–25 km and what subsurface hazards occurred at each formation.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                RESULT: Blind spudding in faulted blocks
              </div>
            </div>

            {/* Flaw 2 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-amber-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-400 flex items-center justify-center">
                <FileSearch size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">2. Manual Report Mining (3–7 Days)</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Engineers spend 3–7 days manually reading through 50–100 PDF completion reports to prepare a single well program. Critical lessons are missed under time pressure.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                RESULT: Well program planning delayed by weeks
              </div>
            </div>

            {/* Flaw 3 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-purple-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-purple-950/40 border border-purple-800/50 text-purple-400 flex items-center justify-center">
                <Unlink size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">3. Zero Cross-Well Correlation</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                A mud loss at 2,100m in Well A (2018) and a kick at 2,150m in Well B (2020) in the same formation are never linked because they sit in isolated files on disconnected drives.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                RESULT: Repeated stuck pipe & NPT events
              </div>
            </div>

            {/* Flaw 4 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-sky-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-sky-950/40 border border-sky-800/50 text-[#38BDF8] flex items-center justify-center">
                <BellOff size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">4. No Proactive Alerts</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                When the active well&apos;s drill bit approaches a depth where nearby offset wells had kicks or severe mud losses, nobody warns the driller in real-time until the incident repeats.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                RESULT: ₹10–50 Crore avoidable fishing & well control costs
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Section: The 7 Breakthrough Capabilities of SRISHTI·AI */}
      <section id="capabilities" className="relative z-10 py-20 lg:py-28 bg-transparent border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-[#D97706] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Sparkles size={14} />
              <span>THE SRISHTI·AI ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              7 Breakthrough Capabilities for Oil India
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Engineered to turn OIL&apos;s 60-year archive into a living, queryable, and predictive institutional memory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Cap 1 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-[#0D5C75] transition-all group">
              <div className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider">CAPABILITY 01</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSearch size={18} className="text-[#38BDF8]" />
                <span>Intelligent Document Processing</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Vision-Language Models (VLMs) and layout-aware OCR automatically parse unstructured WCRs, DDRs, and mud logs, extracting casing sizes, bit records, mud weights, and drilling events.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Eliminates 3–7 days of manual PDF mining
              </div>
            </div>

            {/* Cap 2 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-[#0D5C75] transition-all group">
              <div className="text-[11px] font-semibold text-[#D97706] uppercase tracking-wider">CAPABILITY 02</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe size={18} className="text-[#D97706]" />
                <span>Interactive Geospatial Intelligence</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Visualizes offset wells on a high-precision GIS map with tactical radius controls (1km to 25km). Correlates wells across Upper Assam using multi-factor similarity: proximity, depth, and fault block.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Instant 360° offset well view
              </div>
            </div>

            {/* Cap 3 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-[#0D5C75] transition-all group">
              <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">CAPABILITY 03</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network size={18} className="text-purple-400" />
                <span>Drilling Knowledge Graph (DKG)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Graph RAG engine capturing causal relationships: <code className="font-mono text-[11px] bg-black/40 px-1 py-0.5 rounded">Formation → Hazard → Mitigation → Outcome</code>. Prevents recurring issues by preserving solutions verified by senior OIL engineers.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Institutional memory survives retirements
              </div>
            </div>

            {/* Cap 4 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-[#0D5C75] transition-all group">
              <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">CAPABILITY 04</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-sky-400" />
                <span>Formation-Level Risk Corridors</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Aggregates historical drilling parameters by depth and geological formation (Tipam, Barail, Girujan) to build predictive risk envelopes for mud weight, ROP, torque, and pore pressure.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Dynamic Time Warping (DTW) log correlation
              </div>
            </div>

            {/* Cap 5 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-[#0D5C75] transition-all group">
              <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">CAPABILITY 05</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-400" />
                <span>Real-Time Proactive Alerts</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                As the active rig drills, SRISHTI syncs with eRTMAC WITSML depth feeds to project a 30m–50m lookahead radar, triggering proactive warnings before penetrating overpressured or loss zones.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Warns before incidents occur, not after
              </div>
            </div>

            {/* Cap 6 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-[#0D5C75] transition-all group">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">CAPABILITY 06</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-amber-400" />
                <span>Natural Language Query (Hindi + English)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Ask field questions in plain English or Hindi: <em>&ldquo;Moran ke paas Tipam mein kya problem aaya tha?&rdquo;</em> Receive instant, grounded answers with exact WCR document citations and page references.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ 100% grounded answers, zero hallucinations
              </div>
            </div>

            {/* Cap 7 (Spans Full Width on lg) */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-[#0D5C75] transition-all md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">CAPABILITY 07 · DIGITAL PRE-SPUD ADVISORY</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileDown size={18} className="text-emerald-400" />
                  <span>1-Click Auto-Generated Well Programs & Shift Handover</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Synthesizes best practices from the top-performing offset wells into an OISD-STD-174 compliant pre-spud briefing and PDF handover report, complete with casing programs, mud plans, and hazard mitigation checklists.
                </p>
              </div>
              <Link
                href="/plan"
                className="px-5 py-2.5 bg-[#0D5C75] hover:bg-[#0284c7] text-white text-xs font-semibold rounded-md transition-all shrink-0 flex items-center gap-2"
              >
                <span>Generate Sample Brief</span>
                <ChevronRight size={14} />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 6. Section: Upper Assam Stratigraphy Matrix */}
      <section id="stratigraphy" className="relative z-10 py-20 lg:py-28 bg-transparent border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-[#38BDF8] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Layers size={14} />
              <span>GEOLOGICAL EVIDENCE MATRIX</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              Upper Assam Basin Stratigraphic Horizons
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Calibrated for Oil India&apos;s primary drilling corridor across Moran, Naharkatiya, Duliajan, and Digboi fields.
            </p>
          </div>

          {/* Stratigraphic Cards Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Horizon 1 */}
            <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wide">ALLUVIUM</span>
                <span className="text-slate-400 font-mono tabular-nums">0 – 200 m MD</span>
              </div>
              <div className="text-[11px] text-[#38BDF8] font-medium">Unconsolidated Surface Sands</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Prone to shallow gas pockets and surface washouts. Requires low pump rates and quick surface casing setting.
              </p>
              <div className="text-[10px] font-medium text-emerald-400 pt-1 border-t border-slate-800/80">
                Safe MW: <span className="font-mono tabular-nums">8.9 – 9.2 ppg</span> · Low Risk
              </div>
            </div>

            {/* Horizon 2 */}
            <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wide">DHEKIAJULI / NAMSANG</span>
                <span className="text-slate-400 font-mono tabular-nums">200 – 800 m MD</span>
              </div>
              <div className="text-[11px] text-amber-400 font-medium">Loose, Permeable Sandstones</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                High permeability leads to lost circulation and hole enlargement. Controlled viscosity drilling mud required.
              </p>
              <div className="text-[10px] font-medium text-amber-400 pt-1 border-t border-slate-800/80">
                Primary Hazard: Severe Seepage Losses
              </div>
            </div>

            {/* Horizon 3 */}
            <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wide">GIRUJAN CLAY</span>
                <span className="text-slate-400 font-mono tabular-nums">800 – 1,500 m MD</span>
              </div>
              <div className="text-[11px] text-red-400 font-medium">Thick Reactive Montmorillonite</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Severe swelling and sloughing shale cause differential pipe sticking. Requires continuous string rotation (&gt;60 RPM) and potassium chloride (KCl) polymer mud.
              </p>
              <div className="text-[10px] font-medium text-red-400 pt-1 border-t border-slate-800/80">
                Primary Hazard: Differential Sticking
              </div>
            </div>

            {/* Horizon 4 */}
            <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wide">TIPAM SANDSTONE</span>
                <span className="text-slate-400 font-mono tabular-nums">1,500 – 2,500 m MD</span>
              </div>
              <div className="text-[11px] text-amber-400 font-medium">Braided-River Hydrocarbon Reservoir</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Sensitive to clay swelling and pore throat clogging. Calcium carbonate (CaCO3) + mica pill spotting mitigates circulation losses without reservoir damage.
              </p>
              <div className="text-[10px] font-medium text-amber-400 pt-1 border-t border-slate-800/80">
                Primary Hazard: Lost Circulation & Swelling
              </div>
            </div>

            {/* Horizon 5 */}
            <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 border-t-2 border-t-red-500 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wide">BARAIL GROUP</span>
                <span className="text-red-400 font-bold font-mono tabular-nums">2,500 – 3,500 m MD</span>
              </div>
              <div className="text-[11px] text-red-400 font-medium">Carbonaceous Shale & Gas Sands</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Highly overpressured sub-strata with severe gas kick potential. Mandatory OISD-STD-174 flow checks and weighted kill mud (11.8–12.5 ppg) required before penetration.
              </p>
              <div className="text-[10px] font-medium text-red-400 pt-1 border-t border-slate-800/80">
                Active Horizon: MORAN-29 at 2,418m MD
              </div>
            </div>

            {/* Horizon 6 */}
            <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wide">BASEMENT</span>
                <span className="text-slate-400 font-mono tabular-nums">&gt; 3,500 m MD</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Precambrian Crystalline Rock</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Extremely abrasive formation causing rapid PDC cutter failure and low ROP (&lt;2 m/hr). Heavy drill collars and premium roller-cone bits recommended.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-800/80">
                Primary Hazard: Bit Wear & Slow ROP
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. Section: 10-Agent Multi-Agent Intelligence Swarm */}
      <section id="agents" className="relative z-10 py-20 lg:py-28 bg-transparent border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Cpu size={14} />
              <span>DISTRIBUTED AGENTIC ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              10-Agent Multi-Agent Orchestration Swarm
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Instead of an opaque single-prompt LLM, SRISHTI deploys 10 autonomous, specialized agents operating on an evidence-verified LangGraph state machine.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-xs">
            {[
              { num: '01', name: 'Document Ingestion Agent', task: 'VLM OCR + Layout Parsing' },
              { num: '02', name: 'Geospatial Agent', task: 'Spatial 3D Distance Ranking' },
              { num: '03', name: 'Graph RAG Agent', task: 'Causal Neo4j/PostgreSQL Linkage' },
              { num: '04', name: 'Correlation Agent', task: 'DTW Formation Log Matching' },
              { num: '05', name: 'Risk Forecaster Agent', task: 'Pore Pressure & Window Modeling' },
              { num: '06', name: 'Proactive Alert Agent', task: 'eRTMAC Depth-Triggered Radar' },
              { num: '07', name: 'Multilingual Q&A Agent', task: 'Hindi/Assamese Evidence Retrieval' },
              { num: '08', name: 'Well Program Agent', task: 'Pre-Spud Synthesis & Export' },
              { num: '09', name: 'Compliance Agent', task: 'OISD-STD-174 & DGMS Verification' },
              { num: '10', name: 'Frontline Rig Agent', task: 'Doghouse Terminal PTT Dispatch' },
            ].map((agent, i) => (
              <div key={i} className="p-3.5 bg-[#0B1316] border border-slate-800 rounded-lg space-y-1.5 hover:border-[#0D5C75] transition-colors shadow-xl">
                <div className="text-[10px] text-[#38BDF8] font-bold font-mono">AGENT {agent.num}</div>
                <div className="font-bold text-white font-sans text-xs leading-tight">{agent.name}</div>
                <div className="text-[10px] text-slate-300 leading-snug">{agent.task}</div>
                <div className="pt-1 text-[9px] text-[#10B981] flex items-center gap-1 font-medium">
                  <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                  Active
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. Section: Compliance, Statutory Standards & eRTMAC Synergy */}
      <section id="compliance" className="relative z-10 py-20 lg:py-28 bg-transparent border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-[#D97706] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <ShieldCheck size={14} />
              <span>STATUTORY & REGULATORY ALIGNMENT</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              How SRISHTI Complements Oil India&apos;s eRTMAC
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              SRISHTI does not compete with or replace eRTMAC. It provides the historical memory that eRTMAC currently lacks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Standard 1 */}
            <div className="p-6 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck size={20} className="text-[#10B981]" />
                <span>OISD-STD-174</span>
              </div>
              <div className="text-[11px] font-semibold text-[#10B981]">Well Control Operations Standard</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Enforces mandatory flow check intervals, shut-in procedures, and casing seat integrity rules in compliance with Indian petroleum safety statutes.
              </p>
            </div>

            {/* Standard 2 */}
            <div className="p-6 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database size={20} className="text-[#38BDF8]" />
                <span>WITSML 1.4 / 2.0</span>
              </div>
              <div className="text-[11px] font-semibold text-[#38BDF8]">Real-Time Telemetry Exchange</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Native compatibility with Energistics rig telemetry protocols, ingesting bit depth, hookload, standpipe pressure, and pit gain directly from active rigs.
              </p>
            </div>

            {/* Standard 3 */}
            <div className="p-6 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Building2 size={20} className="text-[#D97706]" />
                <span>Sovereign Air-Gap Architecture</span>
              </div>
              <div className="text-[11px] font-semibold text-[#D97706]">100% Zero-Cloud Data Sovereignty</div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Runs entirely on on-premise infrastructure inside Oil India&apos;s secured network at Duliajan Corporate HQ. Zero sensitive subsurface data leaves the country.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 9. Call to Action Banner */}
      <section className="relative z-10 py-20 bg-transparent border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D5C75]/25 border border-[#0D5C75]/60 text-xs font-semibold text-[#38BDF8]">
            <span>READY FOR PRODUCTION DEPLOYMENT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            Ready to Explore 60 Years of Drilling Intelligence?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            Access the Offset Intelligence Dashboard, monitor the active Moran-29 rig stream, or query the Drilling Knowledge Graph in natural language.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={(e) => handleProtectedAction(e, '/map')}
              className="px-6 py-3 bg-[#0D5C75] hover:bg-[#0284c7] text-white text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-[0_0_20px_rgba(13,92,117,0.5)] flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Geospatial Mission Control</span>
              <ChevronRight size={15} />
            </button>
            <button
              onClick={(e) => handleProtectedAction(e, '/doghouse')}
              className="px-6 py-3 bg-[#121f24] hover:bg-[#182a32] border border-[#D97706]/50 text-[#fcd34d] text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Radio size={14} className="text-[#D97706]" />
              <span>Rig Floor Doghouse Terminal</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. Enterprise Footer */}
      <footer className="relative z-10 py-12 bg-[#040809]/80 backdrop-blur-sm text-slate-400 text-xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#0D5C75]/30 border border-[#0D5C75] flex items-center justify-center text-[#D97706]">
              <Flame size={14} />
            </div>
            <span className="text-white font-bold">SRISHTI·AI</span>
            <span>· Oil India Limited (eRTMAC Intelligence Companion)</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-500">
            <span>Duliajan Corporate HQ, Assam</span>
            <span>·</span>
            <span>Subsurface Drilling Intelligence Division</span>
            <span>·</span>
            <span>Sovereign Air-Gap Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
