'use client';

import React, { useState } from 'react';
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
  const [deepDiveTab, setDeepDiveTab] = useState<'geology' | 'swarm' | 'compliance'>('geology');

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
          <a href="#preview" className="hover:text-[#38BDF8] transition-colors">Hazard Radar</a>
          <a href="#problem" className="hover:text-[#38BDF8] transition-colors">The Problem</a>
          <a href="#capabilities" className="hover:text-[#38BDF8] transition-colors">Capabilities</a>
          <a href="#deep-dive" className="hover:text-[#38BDF8] transition-colors">Deep Dive</a>
        </nav>

        {/* Right Status Pills & Actions (Sleek, Compact, Placed Far Right) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Offline Ready</span>
          </div>

          {isAuthenticated && user ? (
            <>
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0C1518]/80 border border-slate-700/70 rounded-md text-xs font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{user.name} ({user.role})</span>
              </span>

              <button
                onClick={(e) => handleProtectedAction(e, '/doghouse')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#0C1518]/90 hover:bg-[#142329] border border-slate-700/80 text-slate-200 hover:text-white rounded-md text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Radio size={12} className="text-amber-400" />
                <span>Rig Floor View</span>
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D5C75] hover:bg-[#116F8C] text-white text-xs font-medium rounded-md border border-[#38BDF8]/30 hover:border-[#38BDF8]/60 transition-colors shadow-sm whitespace-nowrap"
              >
                <span>Open Dashboard</span>
                <ChevronRight size={13} />
              </button>

              <button
                onClick={logout}
                className="p-1.5 bg-red-950/30 hover:bg-red-900/50 border border-red-800/60 rounded-md text-red-300 hover:text-white transition-colors"
                title="Log Out"
              >
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C1518]/90 hover:bg-[#142329] border border-slate-700/80 text-slate-200 hover:text-white rounded-md text-xs font-medium transition-colors whitespace-nowrap"
              >
                <LogIn size={12} className="text-slate-400" />
                <span>Sign In</span>
              </Link>

              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D5C75] hover:bg-[#116F8C] text-white text-xs font-medium rounded-md border border-[#38BDF8]/30 hover:border-[#38BDF8]/60 transition-colors shadow-sm whitespace-nowrap"
              >
                <span>Enter Platform</span>
                <ChevronRight size={13} />
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C1518]/80 border border-slate-700/60 text-[11px] font-semibold text-slate-300 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="tracking-wide uppercase">Oil India Limited · AI Drilling Copilot</span>
            </div>

            {/* Tagline & Headline (Crisp executive size, perfectly left-aligned) */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.18] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
                Drill with 60 years of memory. <br />
                <span className="text-[#38BDF8]">
                  Never repeat a hazard.
                </span>
              </h1>
            </div>

            {/* Executive Hook (No heavy jargons, clear for managers) */}
            <div className="bg-slate-900/75 backdrop-blur-md p-4 rounded-xl border border-slate-700/60 max-w-xl shadow-xl">
              <p className="text-xs sm:text-[14px] text-slate-100 leading-relaxed font-normal">
                SRISHTI connects 60 years of past well reports with live rig sensors to warn engineers before entering dangerous zones. Predict and prevent pipe sticking, sudden gas kicks, and mud losses across all Upper Assam fields.
              </p>
            </div>

            {/* 4 Feature Badges (2x2 Grid) - Clean & Professional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-w-xl">
              <div className="p-3 bg-[#0C1518]/85 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 rounded-lg flex items-start gap-2.5 transition-colors">
                <div className="p-1.5 rounded bg-[#0D5C75]/20 text-[#38BDF8] shrink-0 mt-0.5">
                  <FileSearch size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Smart Document Reader</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Extracts facts from decades of PDF reports & well logs</div>
                </div>
              </div>

              <div className="p-3 bg-[#0C1518]/85 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 rounded-lg flex items-start gap-2.5 transition-colors">
                <div className="p-1.5 rounded bg-amber-900/20 text-amber-400 shrink-0 mt-0.5">
                  <Globe size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Nearby Well Finder</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Scans neighboring wells to reveal known danger zones</div>
                </div>
              </div>

              <div className="p-3 bg-[#0C1518]/85 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 rounded-lg flex items-start gap-2.5 transition-colors">
                <div className="p-1.5 rounded bg-[#0D5C75]/20 text-[#38BDF8] shrink-0 mt-0.5">
                  <Network size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Past Incident Memory</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Remembers past drilling troubles so mistakes never repeat</div>
                </div>
              </div>

              <div className="p-3 bg-[#0C1518]/85 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 rounded-lg flex items-start gap-2.5 transition-colors">
                <div className="p-1.5 rounded bg-emerald-900/20 text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Early Hazard Warnings</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Real-time safety alerts before reaching high-pressure depths</div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Professional, Clean Enterprise Styling */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="px-5 py-2.5 bg-[#0D5C75] hover:bg-[#116F8C] active:bg-[#0A4A5E] text-white text-xs sm:text-[13px] font-semibold rounded-lg border border-[#38BDF8]/30 hover:border-[#38BDF8]/60 transition-all shadow-sm flex items-center gap-2 cursor-pointer group"
              >
                <span>Launch Mission Control</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform text-slate-200" />
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/ask')}
                className="px-4 py-2.5 bg-[#0C1518]/90 hover:bg-[#142329] border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white text-xs sm:text-[13px] font-medium rounded-lg backdrop-blur-md transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} className="text-cyan-400" />
                <span>Ask AI Copilot</span>
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/doghouse')}
                className="px-4 py-2.5 bg-[#0C1518]/90 hover:bg-[#142329] border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white text-xs sm:text-[13px] font-medium rounded-lg backdrop-blur-md transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Radio size={14} className="text-amber-400" />
                <span>Rig Floor View</span>
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Stat Strip (Clean executive terminology) */}
        <div className="mt-10 pt-6 border-t border-slate-800/40 bg-transparent px-6 lg:px-12 w-full">
          <div className="max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-white">5,000+</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Wells Analyzed</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-cyan-400">50+</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Assam Oil Fields</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-amber-400">60 Years</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Historical Memory</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-emerald-400">&lt; 3.8s</div>
              <div className="text-[11px] text-slate-400 uppercase font-medium mt-0.5 tracking-wider">Instant Warnings</div>
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
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>LIVE HAZARD RADAR</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                Active Well Hazard Radar
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                Matches the active drilling bit in real-time against past incidents in nearby wells to warn engineers before danger strikes.
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
                  <span className="text-xs font-bold text-white uppercase tracking-wider">ACTIVE DRILLING STATUS</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#0D5C75]/20 text-[#38BDF8] border border-[#0D5C75]/40 font-semibold">
                    OIL-RIG-04
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-[#070D0F] border border-slate-800/60">
                    <span className="text-slate-400 font-medium">Target Well:</span>
                    <span className="text-white font-bold">MORAN-29</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#070D0F] border border-slate-800/60">
                    <span className="text-slate-400 font-medium">Current Bit Depth:</span>
                    <span className="text-white font-bold text-sm tabular-nums">2,418.0 m</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#070D0F] border border-slate-800/60">
                    <span className="text-slate-400 font-medium">Current Rock Layer:</span>
                    <span className="text-[#38BDF8] font-semibold">Barail Group (2,350m–3,200m)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-red-950/20 border border-red-800/40">
                    <span className="text-red-300 font-medium">Early Warning:</span>
                    <span className="text-red-400 font-bold">High-Pressure Gas Zone at 2,450m</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#070D0F] border border-emerald-900/40 rounded-lg text-xs space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>RECOMMENDED SAFETY ACTION</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Prepare heavy drilling mud (12.4 ppg) before reaching 2,440m. Stop and check well flow for 15 minutes if drilling speed suddenly jumps.
                </p>
              </div>
            </div>

            {/* Right: Top 3 Correlated Offset Wells */}
            <div className="lg:col-span-7 bg-[#0B1316] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">NEARBY WELLS (15 KM RADIUS)</span>
                <span className="text-[10px] text-slate-400 font-semibold">3 MATCHES FOUND</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-[#070D0F] border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#D97706]" />
                      <span className="font-bold text-white text-sm">Moran-7</span>
                      <span className="text-[11px] text-slate-400 font-normal">0.8 km away · Total Depth 3,420m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#0D5C75]/25 text-[#38BDF8] border border-[#0D5C75]/50 font-semibold text-[10px]">
                      94% MATCH
                    </span>
                  </div>
                  <div className="text-red-400 text-[11px] leading-relaxed">
                    ⚠️ Sudden Gas Kick at 2,448m. Required pumping heavy kill mud to safely regain well control.
                  </div>
                </div>

                <div className="p-3 bg-[#070D0F] border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#D97706]" />
                      <span className="font-bold text-white text-sm">Moran-12</span>
                      <span className="text-[11px] text-slate-400 font-normal">2.4 km away · Total Depth 3,210m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#0D5C75]/25 text-[#38BDF8] border border-[#0D5C75]/50 font-semibold text-[10px]">
                      89% MATCH
                    </span>
                  </div>
                  <div className="text-amber-400 text-[11px] leading-relaxed">
                    ⚠️ Drill Pipe Stuck at 2,390m. Freed by pumping 50 barrels of special lubricant and rotating the drill pipe.
                  </div>
                </div>

                <div className="p-3 bg-[#070D0F] border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#D97706]" />
                      <span className="font-bold text-white text-sm">Naharkatiya-512</span>
                      <span className="text-[11px] text-slate-400 font-normal">11.2 km away · Total Depth 3,650m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#0D5C75]/25 text-[#38BDF8] border border-[#0D5C75]/50 font-semibold text-[10px]">
                      82% MATCH
                    </span>
                  </div>
                  <div className="text-emerald-400 text-[11px] leading-relaxed">
                    ✅ Safe &amp; Fast Drilling (14.2 m/hr) achieved using clean polymer drilling mud.
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
              <span>THE DRILLING KNOWLEDGE GAP</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              Why Drilling Lessons Get Forgotten in Indian Oilfields
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Decades of critical drilling experience are trapped in paper binders and scanned PDFs. When senior engineers retire, that hard-won knowledge is lost.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Flaw 1 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-red-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 flex items-center justify-center">
                <EyeOff size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">1. No Map of Nearby Wells</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Engineers cannot easily see what subsurface hazards happened at the same depths in neighboring wells within 5–25 km.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                Risk: Drilling blindly into unknown fault zones
              </div>
            </div>

            {/* Flaw 2 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-amber-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-400 flex items-center justify-center">
                <FileSearch size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">2. Days Spent Reading Old PDFs</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Engineers spend 3–7 days manually digging through hundreds of old PDF completion reports just to plan one new well.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                Risk: Planning delays and missed warning signs
              </div>
            </div>

            {/* Flaw 3 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-purple-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-purple-950/40 border border-purple-800/50 text-purple-400 flex items-center justify-center">
                <Unlink size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">3. Disconnected Records</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                A gas kick in Well A and a stuck pipe in Well B are never linked because reports sit on separate, isolated computer drives.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                Risk: The exact same drilling accidents repeat
              </div>
            </div>

            {/* Flaw 4 */}
            <div className="p-5 bg-[#0C1518] border border-slate-800 border-t-2 border-t-sky-500 rounded-xl space-y-3 hover:border-slate-700 transition-all">
              <div className="p-2 w-9 h-9 rounded-lg bg-sky-950/40 border border-sky-800/50 text-[#38BDF8] flex items-center justify-center">
                <BellOff size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">4. No Real-Time Warning</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                When a drill bit approaches a known trouble depth, nobody warns the rig floor in real-time until the incident repeats.
              </p>
              <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
                Risk: ₹10–50 Crores in avoidable rig downtime &amp; repairs
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
              <span>HOW SRISHTI SOLVES THIS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              7 Core Capabilities for Oil India
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Turning 60 years of Oil India drilling records into an instant, intelligent assistant for every engineer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Cap 1 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all group">
              <div className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider">CAPABILITY 01</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSearch size={18} className="text-[#38BDF8]" />
                <span>Smart Document Reader</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Automatically reads decades of scanned PDF completion reports, daily drilling logs, and mud charts — pulling out casing sizes, rock formations, and past incidents in seconds.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Eliminates 3–7 days of manual report reading
              </div>
            </div>

            {/* Cap 2 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all group">
              <div className="text-[11px] font-semibold text-[#D97706] uppercase tracking-wider">CAPABILITY 02</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe size={18} className="text-[#D97706]" />
                <span>Interactive Nearby Well Map</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Visualizes offset wells on an interactive map. Set any search distance (1 km to 25 km) to instantly find nearby wells and see what problems occurred at each depth.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Instant 360° view of surrounding wells
              </div>
            </div>

            {/* Cap 3 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all group">
              <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">CAPABILITY 03</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network size={18} className="text-purple-400" />
                <span>Incident Memory &amp; Solutions</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Connects past drilling issues directly to their proven solutions: <code className="font-mono text-[11px] bg-black/40 px-1 py-0.5 rounded text-slate-200">Layer → Hazard → Fix → Result</code>. Preserves decades of senior engineer expertise.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Retains knowledge when senior staff retire
              </div>
            </div>

            {/* Cap 4 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all group">
              <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">CAPABILITY 04</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-sky-400" />
                <span>Safe Drilling Boundaries</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Analyzes past wells to calculate safe limits for drilling speed, mud weight, and underground pressures for every rock formation across Upper Assam.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Clear green/yellow/red safety corridors
              </div>
            </div>

            {/* Cap 5 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all group">
              <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">CAPABILITY 05</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-400" />
                <span>Early Hazard Warnings</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Monitors active rig bit depth and projects a 30m–50m lookahead warning before drilling into high-pressure gas pockets or fragile lost-circulation zones.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ Warns before incidents occur, not after
              </div>
            </div>

            {/* Cap 6 */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all group">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">CAPABILITY 06</div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-amber-400" />
                <span>Ask Questions in English or Hindi</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Ask field questions in plain conversational English or Hindi: <em>&ldquo;Moran ke paas Tipam mein kya problem aaya tha?&rdquo;</em> Get instant answers citing the exact report page.
              </p>
              <div className="text-[11px] font-medium text-emerald-400 pt-2 border-t border-slate-800/80">
                ✓ 100% verified answers backed by real reports
              </div>
            </div>

            {/* Cap 7 (Spans Full Width on lg) */}
            <div className="p-6 bg-[#0B1316] border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">CAPABILITY 07 · DIGITAL PRE-DRILL ADVISORY</div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileDown size={18} className="text-emerald-400" />
                  <span>1-Click Well Planning &amp; Shift Handover Briefs</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Combines proven practices from the best nearby wells into an instant safety briefing and PDF handover report, complete with mud plans and hazard checklists.
                </p>
              </div>
              <Link
                href="/plan"
                className="px-4.5 py-2.5 bg-[#0D5C75] hover:bg-[#116F8C] active:bg-[#0A4A5E] text-white text-xs font-medium rounded-lg border border-[#38BDF8]/30 hover:border-[#38BDF8]/60 transition-colors shadow-sm shrink-0 flex items-center gap-2"
              >
                <span>Generate Sample Brief</span>
                <ChevronRight size={14} />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 6. Unified Technical Deep Dive: Subsurface Geology, Multi-Agent AI & Safety Compliance */}
      <section id="deep-dive" className="relative z-10 py-16 lg:py-24 bg-transparent border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider flex items-center justify-center gap-2">
              <Layers size={14} />
              <span>TECHNICAL FOUNDATIONS &amp; DOMAIN DEPTH</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              Assam Subsurface, AI Swarm &amp; Safety Compliance
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Explore the underground formations, autonomous multi-agent architecture, and PSU compliance standards powering SRISHTI.
            </p>
          </div>

          {/* Interactive Executive Tab Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-xl bg-[#0B1316] border border-slate-800 shadow-lg gap-1.5 max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setDeepDiveTab('geology')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  deepDiveTab === 'geology'
                    ? 'bg-[#0D5C75] text-white shadow-sm border border-[#38BDF8]/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers size={14} className={deepDiveTab === 'geology' ? 'text-[#38BDF8]' : 'text-slate-400'} />
                <span>1. Assam Underground Formations</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300">6 Layers</span>
              </button>

              <button
                type="button"
                onClick={() => setDeepDiveTab('swarm')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  deepDiveTab === 'swarm'
                    ? 'bg-[#0D5C75] text-white shadow-sm border border-[#38BDF8]/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Cpu size={14} className={deepDiveTab === 'swarm' ? 'text-[#38BDF8]' : 'text-slate-400'} />
                <span>2. 10-Agent Autonomous Swarm</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-emerald-300">LangGraph</span>
              </button>

              <button
                type="button"
                onClick={() => setDeepDiveTab('compliance')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  deepDiveTab === 'compliance'
                    ? 'bg-[#0D5C75] text-white shadow-sm border border-[#38BDF8]/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck size={14} className={deepDiveTab === 'compliance' ? 'text-[#38BDF8]' : 'text-slate-400'} />
                <span>3. Safety &amp; PSU Compliance</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-300">OISD-STD-174</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Geological Horizons (Assam Rock Layers) */}
          {deepDiveTab === 'geology' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
              {/* Horizon 1 */}
              <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wide">ALLUVIUM</span>
                  <span className="text-slate-400 font-mono tabular-nums">0 – 200 m</span>
                </div>
                <div className="text-[11px] text-[#38BDF8] font-medium">Shallow Surface Sands</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Soft surface sand and gravel. Watch out for shallow gas pockets and soil collapse near the surface.
                </p>
                <div className="text-[10px] font-medium text-emerald-400 pt-1 border-t border-slate-800/80">
                  Mud Weight: <span className="font-mono tabular-nums">8.9 – 9.2 ppg</span> · Low Risk
                </div>
              </div>

              {/* Horizon 2 */}
              <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wide">DHEKIAJULI / NAMSANG</span>
                  <span className="text-slate-400 font-mono tabular-nums">200 – 800 m</span>
                </div>
                <div className="text-[11px] text-amber-400 font-medium">Porous Sandy Layers</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Highly porous rock that can absorb drilling mud like a sponge, causing mud loss and hole widening.
                </p>
                <div className="text-[10px] font-medium text-amber-400 pt-1 border-t border-slate-800/80">
                  Main Risk: Heavy Drilling Mud Loss
                </div>
              </div>

              {/* Horizon 3 */}
              <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wide">GIRUJAN CLAY</span>
                  <span className="text-slate-400 font-mono tabular-nums">800 – 1,500 m</span>
                </div>
                <div className="text-[11px] text-red-400 font-medium">Swelling Sticky Clay</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Clay that swells up when wet, tightly gripping the drill pipe and causing costly stuck pipe incidents.
                </p>
                <div className="text-[10px] font-medium text-red-400 pt-1 border-t border-slate-800/80">
                  Main Risk: Drill Pipe Sticking
                </div>
              </div>

              {/* Horizon 4 */}
              <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wide">TIPAM SANDSTONE</span>
                  <span className="text-slate-400 font-mono tabular-nums">1,500 – 2,500 m</span>
                </div>
                <div className="text-[11px] text-amber-400 font-medium">Main Oil &amp; Gas Reservoir Sand</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Porous sandstone containing oil and gas. Requires special additives to prevent mud loss without clogging oil pores.
                </p>
                <div className="text-[10px] font-medium text-amber-400 pt-1 border-t border-slate-800/80">
                  Main Risk: Mud Loss &amp; Pipe Jamming
                </div>
              </div>

              {/* Horizon 5 */}
              <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 border-t-2 border-t-red-500 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wide">BARAIL GROUP</span>
                  <span className="text-red-400 font-bold font-mono tabular-nums">2,500 – 3,500 m</span>
                </div>
                <div className="text-[11px] text-red-400 font-medium">High-Pressure Gas &amp; Coal Layer</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Contains powerful high-pressure gas that can suddenly surge upward (gas kick). Heavy mud is mandatory before entering.
                </p>
                <div className="text-[10px] font-medium text-red-400 pt-1 border-t border-slate-800/80">
                  Current Depth: MORAN-29 at 2,418m (Active)
                </div>
              </div>

              {/* Horizon 6 */}
              <div className="p-5 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-2.5 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wide">BASEMENT</span>
                  <span className="text-slate-400 font-mono tabular-nums">&gt; 3,500 m</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Hard Granitic Rock</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Extremely hard ancient rock that wears down drill bits rapidly and slows drilling speed to less than 2 meters per hour.
                </p>
                <div className="text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-800/80">
                  Main Risk: Heavy Drill Bit Wear &amp; Slow Speed
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 10-Agent Swarm Content */}
          {deepDiveTab === 'swarm' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-[#0B1316] border border-slate-800 rounded-lg text-xs text-slate-300 flex items-center justify-between">
                <span>Multi-agent coordination runs on an evidence-verified LangGraph state machine. Each agent specializes in one critical task.</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-semibold shrink-0">10 OF 10 OPERATIONAL</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                {[
                  { num: '01', name: 'Document Reader Agent', task: 'Extracts data from PDF completion reports and daily logs.' },
                  { num: '02', name: 'Nearby Well Finder Agent', task: 'Finds and ranks neighboring wells within 1–25 km.' },
                  { num: '03', name: 'Incident Memory Agent', task: 'Links past drilling hazards directly to proven solutions.' },
                  { num: '04', name: 'Log Correlation Agent', task: 'Matches subsurface depth logs between adjacent wells.' },
                  { num: '05', name: 'Risk Forecaster Agent', task: 'Predicts pore pressures and safe mud weight limits.' },
                  { num: '06', name: 'Early Warning Agent', task: 'Triggers radar alerts 30–50m before entering danger zones.' },
                  { num: '07', name: 'Bilingual Q&A Agent', task: 'Answers questions in plain English or Hindi with report citations.' },
                  { num: '08', name: 'Well Plan Generator Agent', task: 'Creates 1-click safety briefs and shift handover reports.' },
                  { num: '09', name: 'Safety Compliance Agent', task: 'Verifies operations against OISD-STD-174 petroleum rules.' },
                  { num: '10', name: 'Rig Floor Dispatch Agent', task: 'Sends priority alerts directly to the driller terminal.' },
                ].map((agent, i) => (
                  <div key={i} className="p-3.5 bg-[#0B1316] border border-slate-800 rounded-lg space-y-1.5 hover:border-slate-700 transition-colors shadow-lg">
                    <div className="text-[10px] text-[#38BDF8] font-bold font-mono">AGENT {agent.num}</div>
                    <div className="font-bold text-white font-sans text-xs leading-tight">{agent.name}</div>
                    <div className="text-[10px] text-slate-300 leading-snug">{agent.task}</div>
                    <div className="pt-1 text-[9px] text-[#10B981] flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      Active
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Compliance & Standards Content */}
          {deepDiveTab === 'compliance' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Standard 1 */}
              <div className="p-6 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-3 shadow-xl hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck size={20} className="text-[#10B981]" />
                  <span>OISD-STD-174 Safety Rules</span>
                </div>
                <div className="text-[11px] font-semibold text-[#10B981]">Well Control Operations Standard</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Enforces mandatory flow check intervals, shut-in procedures, and casing integrity rules in compliance with Indian petroleum safety statutes.
                </p>
              </div>

              {/* Standard 2 */}
              <div className="p-6 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-3 shadow-xl hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Database size={20} className="text-[#38BDF8]" />
                  <span>WITSML Telemetry Standard</span>
                </div>
                <div className="text-[11px] font-semibold text-[#38BDF8]">Real-Time Rig Data Exchange</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Standard format used across drilling rigs to read live depth, drilling speed, standpipe pressure, and mud tank levels automatically without manual entry.
                </p>
              </div>

              {/* Standard 3 */}
              <div className="p-6 bg-[#0C1518]/90 backdrop-blur-md border border-slate-800 rounded-xl space-y-3 shadow-xl hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Building2 size={20} className="text-[#D97706]" />
                  <span>100% Air-Gapped Data Sovereignty</span>
                </div>
                <div className="text-[11px] font-semibold text-[#D97706]">Zero Cloud Data Leakage</div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Runs entirely on on-premise infrastructure inside Oil India&apos;s secured network at Duliajan Corporate HQ. Zero sensitive subsurface data leaves the country.
                </p>
              </div>
            </div>
          )}

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
              className="px-6 py-3 bg-[#121f24] hover:bg-[#182a32] border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Radio size={14} className="text-amber-400" />
              <span>Rig Floor View</span>
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
            <span>· Oil India Limited · AI Drilling Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-500">
            <span>Duliajan Corporate HQ, Assam</span>
            <span>·</span>
            <span>Assam Oilfields</span>
            <span>·</span>
            <span>Private &amp; Secure Network</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
