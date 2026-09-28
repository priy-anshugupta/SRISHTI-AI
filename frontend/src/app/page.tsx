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
    <div className="landing-page w-full min-h-screen bg-canvas text-secondary font-sans selection:bg-brand selection:text-ink relative">

      {/* 1. Floating Transparent Navigation Bar */}
      <header className="public-nav z-20 flex items-center justify-between">
        {/* Brand & Emblem */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-lg bg-brand/25 border border-accent flex items-center justify-center text-accent ">
            <Flame size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-ink font-bold text-base tracking-wider leading-none">
              SRISHTI <span className="text-accent">· AI</span>
            </span>
            <span className="text-xs text-muted font-medium tracking-wider mt-1">
              OIL INDIA LIMITED · eRTMAC
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden xl:flex items-center gap-6 text-xs font-medium text-secondary">
          <a href="#preview" className="hover:text-accent transition-colors">Hazard Radar</a>
          <a href="#problem" className="hover:text-accent transition-colors">The Problem</a>
          <a href="#capabilities" className="hover:text-accent transition-colors">Capabilities</a>
          <a href="#deep-dive" className="hover:text-accent transition-colors">Deep Dive</a>
        </nav>

        {/* Right Status Pills & Actions (Sleek, Compact, Placed Far Right) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-surface/90 backdrop-blur-md border border-line rounded-full px-2.5 py-1 text-xs font-medium text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            <span>Offline Ready</span>
          </div>

          {isAuthenticated && user ? (
            <>
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface/80 border border-line/70 rounded-md text-xs font-medium text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span>{user.name} ({user.role})</span>
              </span>

              <button
                onClick={(e) => handleProtectedAction(e, '/doghouse')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-surface/90 hover:bg-surface-muted border border-line/80 text-secondary hover:text-ink rounded-md text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Radio size={12} className="text-warning" />
                <span>Rig Floor View</span>
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-ink text-xs font-medium rounded-md border border-accent/30 hover:border-accent/60 transition-colors shadow-sm whitespace-nowrap"
              >
                <span>Open Dashboard</span>
                <ChevronRight size={13} />
              </button>

              <button
                onClick={logout}
                className="p-1.5 bg-danger-soft hover:bg-danger-soft border border-danger/25 rounded-md text-danger hover:text-ink transition-colors"
                title="Log Out"
              >
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/90 hover:bg-surface-muted border border-line/80 text-secondary hover:text-ink rounded-md text-xs font-medium transition-colors whitespace-nowrap"
              >
                <LogIn size={12} className="text-muted" />
                <span>Sign In</span>
              </Link>

              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-ink text-xs font-medium rounded-md border border-accent/30 hover:border-accent/60 transition-colors shadow-sm whitespace-nowrap"
              >
                <span>Enter Platform</span>
                <ChevronRight size={13} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section: Cinematic Rig Sunset Background with Left-Aligned Content */}
      <section className="landing-hero relative w-full border-b border-line">
        <div className="hero-layout w-full px-6 lg:px-12 relative">
          <div className="max-w-2xl space-y-5">

            {/* Enterprise Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line text-xs font-semibold text-secondary shadow-md">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="tracking-wide uppercase font-mono text-xs">Oil India Limited · AI Drilling Copilot</span>
            </div>

            {/* Tagline & Headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-extrabold text-ink tracking-tight leading-[1.16] drop-shadow-sm page-title">
                Drill with 60 years of memory. <br />
                <span className="text-accent">
                  Never repeat a hazard.
                </span>
              </h1>
            </div>

            {/* Clean Executive Hook (Free-standing, no clumsy box) */}
            <p className="text-sm sm:text-[15px] text-secondary leading-relaxed font-normal max-w-xl drop-shadow-sm">
              SRISHTI connects 60 years of past well reports with live rig sensors to warn engineers before entering dangerous zones. Predict and prevent pipe sticking, sudden gas kicks, and mud losses across all Upper Assam fields.
            </p>

            {/* 4 Feature Cards (2x2 Grid) - Crisp Solid Industrial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 max-w-xl font-sans">

              {/* Card 1: Document Reader */}
              <div className="p-3.5 bg-surface border border-line hover:border-accent/25 rounded-lg flex items-start gap-3 transition-all shadow-sm group">
                <div className="p-2 rounded-lg bg-surface border border-line text-accent shrink-0 mt-0.5  transition-transform">
                  <FileSearch size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink tracking-tight">Smart Document Reader</div>
                  <div className="text-xs text-muted mt-0.5 leading-snug">Extracts facts from decades of PDF reports & well logs</div>
                </div>
              </div>

              {/* Card 2: Nearby Well Finder */}
              <div className="p-3.5 bg-surface border border-line hover:border-warning/25 rounded-lg flex items-start gap-3 transition-all shadow-sm group">
                <div className="p-2 rounded-lg bg-surface border border-line text-warning shrink-0 mt-0.5  transition-transform">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink tracking-tight">Nearby Well Finder</div>
                  <div className="text-xs text-muted mt-0.5 leading-snug">Scans neighboring offset wells to reveal known danger zones</div>
                </div>
              </div>

              {/* Card 3: Incident Memory */}
              <div className="p-3.5 bg-surface border border-line hover:border-accent/25 rounded-lg flex items-start gap-3 transition-all shadow-sm group">
                <div className="p-2 rounded-lg bg-surface border border-line text-accent shrink-0 mt-0.5  transition-transform">
                  <Network size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink tracking-tight">Past Incident Memory</div>
                  <div className="text-xs text-muted mt-0.5 leading-snug">Remembers past drilling troubles so mistakes never repeat</div>
                </div>
              </div>

              {/* Card 4: Hazard Warnings */}
              <div className="p-3.5 bg-surface border border-line hover:border-success/25 rounded-lg flex items-start gap-3 transition-all shadow-sm group">
                <div className="p-2 rounded-lg bg-success-soft border border-line text-success shrink-0 mt-0.5  transition-transform">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink tracking-tight">Early Hazard Warnings</div>
                  <div className="text-xs text-muted mt-0.5 leading-snug">32-meter lookahead alerts before reaching dangerous depths</div>
                </div>
              </div>

            </div>

            {/* Action Buttons - Professional Solid Industrial Styling */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={(e) => handleProtectedAction(e, '/map')}
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover active:bg-brand text-ink text-xs sm:text-[13px] font-bold rounded-lg border border-accent/40 hover:border-accent/80 transition-all shadow-sm flex items-center gap-2 cursor-pointer group"
              >
                <span>Explore Offset Well Map</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform text-secondary" />
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/ask')}
                className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-line hover:border-accent/25 text-secondary hover:text-ink text-xs sm:text-[13px] font-semibold rounded-lg transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} className="text-accent" />
                <span>Ask AI Copilot</span>
              </button>

              <button
                onClick={(e) => handleProtectedAction(e, '/doghouse')}
                className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-line hover:border-warning/25 text-secondary hover:text-ink text-xs sm:text-[13px] font-semibold rounded-lg transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Radio size={14} className="text-warning" />
                <span>Rig Floor View</span>
              </button>
            </div>

          </div>
          <figure className="hero-visual" aria-label="Drilling operations in Upper Assam">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero-bg.png" alt="Drilling rig overlooking an oil field at sunset" />
            <figcaption className="hero-caption">Oil India Limited · Upper Assam operations<br /><span className="text-white/75">Historical intelligence. Informed decisions. Safer drilling.</span></figcaption>
          </figure>
        </div>

        {/* Bottom Stat Strip (Clean executive terminology) */}
        <div className="hero-stats mt-10 pt-6 border-t border-line/40 bg-transparent px-6 lg:px-12 w-full">
          <div className="max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-ink">18+</div>
              <div className="text-xs text-muted uppercase font-medium mt-0.5 tracking-wider">Wells Analyzed</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-accent">8+</div>
              <div className="text-xs text-muted uppercase font-medium mt-0.5 tracking-wider">Assam Oil Fields</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-warning">60 Years</div>
              <div className="text-xs text-muted uppercase font-medium mt-0.5 tracking-wider">OIL’s Operational Legacy</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-success">Depth-Aware</div>
              <div className="text-xs text-muted uppercase font-medium mt-0.5 tracking-wider">Proactive Hazard Alerts</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Live Offset Intelligence Preview */}
      <section id="preview" className="relative z-10 py-16 lg:py-24 bg-transparent border-b border-line/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>LIVE HAZARD RADAR</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight drop-shadow-sm">
                Active Well Hazard Radar
              </h2>
              <p className="text-xs sm:text-sm text-secondary max-w-2xl mt-1 drop-">
                Matches the active drilling bit in real-time against past incidents in nearby wells to warn engineers before danger strikes.
              </p>
            </div>

            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
            >
              <span>Explore Complete Geospatial Map</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* Left: Active Rig Status Box */}
            <div className="lg:col-span-5 bg-surface border border-line rounded-lg p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success " />
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">ACTIVE DRILLING STATUS</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-surface text-accent border border-line font-bold tracking-wider">
                    OIL-RIG-04
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface border border-line/80">
                    <span className="text-muted font-medium">Target Well:</span>
                    <span className="text-ink font-bold tracking-wide">MORAN-29</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface border border-line/80">
                    <span className="text-muted font-medium">Current Bit Depth:</span>
                    <span className="text-ink font-bold text-sm tabular-nums font-mono">2,418.0 m</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface border border-line/80">
                    <span className="text-muted font-medium">Current Rock Layer:</span>
                    <span className="text-accent font-semibold">Barail Group (2,350m – 3,200m)</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-danger-soft border border-danger/25">
                    <span className="text-danger font-medium">Lookahead Hazard:</span>
                    <span className="text-danger font-bold">High-Pressure Gas Zone at 2,450m</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-success-soft border border-success/25 rounded-lg text-xs space-y-1">
                <div className="text-success font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span className="tracking-wide uppercase text-xs">Recommended Safety Action</span>
                </div>
                <p className="text-secondary text-xs leading-relaxed">
                  Prepare heavy drilling mud (12.4 ppg) before reaching 2,440m. Stop and check well flow for 15 minutes if drilling speed suddenly jumps.
                </p>
              </div>
            </div>

            {/* Right: Top 3 Correlated Offset Wells */}
            <div className="lg:col-span-7 bg-surface border border-line rounded-lg p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-xs font-bold text-ink uppercase tracking-wider">NEARBY WELLS (15 KM RADIUS)</span>
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">3 Correlated Matches</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 bg-surface border border-line rounded-lg hover:border-accent/25 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-accent" />
                      <span className="font-bold text-ink text-sm">Moran-7</span>
                      <span className="text-xs text-muted font-normal">0.8 km away · Total Depth 3,420m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface text-accent border border-line font-bold text-xs">
                      94% MATCH
                    </span>
                  </div>
                  <div className="text-danger text-xs leading-relaxed">
                     Sudden Gas Kick at 2,448m. Required pumping heavy kill mud to safely regain well control.
                  </div>
                </div>

                <div className="p-3.5 bg-surface border border-line rounded-lg hover:border-accent/25 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-accent" />
                      <span className="font-bold text-ink text-sm">Moran-12</span>
                      <span className="text-xs text-muted font-normal">2.4 km away · Total Depth 3,210m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface text-accent border border-line font-bold text-xs">
                      89% MATCH
                    </span>
                  </div>
                  <div className="text-warning text-xs leading-relaxed">
                     Drill Pipe Stuck at 2,390m. Freed by pumping 50 barrels of special lubricant and rotating the drill pipe.
                  </div>
                </div>

                <div className="p-3.5 bg-surface border border-line rounded-lg hover:border-accent/25 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-accent" />
                      <span className="font-bold text-ink text-sm">Naharkatiya-512</span>
                      <span className="text-xs text-muted font-normal">11.2 km away · Total Depth 3,650m</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface text-accent border border-line font-bold text-xs">
                      82% MATCH
                    </span>
                  </div>
                  <div className="text-success text-xs leading-relaxed">
                     Safe &amp; Fast Drilling (14.2 m/hr) achieved using clean polymer drilling mud.
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Section: The ₹50-200 Crore Problem — The 4 Fatal Flaws */}
      <section id="problem" className="relative z-10 py-20 lg:py-28 bg-transparent border-b border-line/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">

          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-danger uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <AlertTriangle size={14} />
              <span>THE DRILLING KNOWLEDGE GAP</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight drop-shadow-sm">
              Why Drilling Lessons Get Forgotten in Indian Oilfields
            </h2>
            <p className="text-secondary text-xs sm:text-sm leading-relaxed drop-">
              Decades of critical drilling experience are trapped in paper binders and scanned PDFs. When senior engineers retire, that hard-won knowledge is lost.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Flaw 1 */}
            <div className="p-5 bg-surface border border-line border-t-2 border-t-danger rounded-lg space-y-3 hover:border-line transition-all shadow-sm">
              <div className="p-2 w-9 h-9 rounded-lg bg-danger-soft border border-danger/25 text-danger flex items-center justify-center">
                <EyeOff size={18} />
              </div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide">1. No Map of Nearby Wells</h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Engineers cannot easily see what underground hazards happened at the same depths in nearby wells within 5–25 km.
              </p>
              <div className="text-xs font-semibold text-danger pt-2 border-t border-line/80">
                 Risk: Drilling blind into unknown hazard zones
              </div>
            </div>

            {/* Flaw 2 */}
            <div className="p-5 bg-surface border border-line border-t-2 border-t-warning rounded-lg space-y-3 hover:border-line transition-all shadow-sm">
              <div className="p-2 w-9 h-9 rounded-lg bg-warning-soft border border-warning/25 text-warning flex items-center justify-center">
                <FileSearch size={18} />
              </div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide">2. Days Spent Reading Old PDFs</h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Engineers spend 3–7 days manually searching through hundreds of old PDF completion reports just to plan one new well.
              </p>
              <div className="text-xs font-semibold text-warning pt-2 border-t border-line/80">
                 Risk: Planning delays &amp; missed warning signs
              </div>
            </div>

            {/* Flaw 3 */}
            <div className="p-5 bg-surface border border-line border-t-2 border-t-accent rounded-lg space-y-3 hover:border-line transition-all shadow-sm">
              <div className="p-2 w-9 h-9 rounded-lg bg-accent-soft border border-accent/25 text-accent flex items-center justify-center">
                <Unlink size={18} />
              </div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide">3. Disconnected Records</h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                A gas leak in Well A and a stuck pipe in Well B are never linked because reports sit on separate, isolated computers.
              </p>
              <div className="text-xs font-semibold text-accent pt-2 border-t border-line/80">
                 Risk: The exact same drilling accidents repeat
              </div>
            </div>

            {/* Flaw 4 */}
            <div className="p-5 bg-surface border border-line border-t-2 border-t-accent rounded-lg space-y-3 hover:border-line transition-all shadow-sm">
              <div className="p-2 w-9 h-9 rounded-lg bg-accent-soft border border-accent/25 text-accent flex items-center justify-center">
                <BellOff size={18} />
              </div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide">4. No Real-Time Warning</h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                When a drill bit approaches a known danger depth, nobody warns the rig floor in advance until the incident repeats.
              </p>
              <div className="text-xs font-semibold text-accent pt-2 border-t border-line/80">
                 Risk: ₹10–50 Crores in avoidable rig downtime
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Section: The 7 Breakthrough Capabilities of SRISHTI·AI */}
      <section id="capabilities" className="relative z-10 py-20 lg:py-28 bg-transparent border-b border-line/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">

          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Sparkles size={14} />
              <span>HOW SRISHTI SOLVES THIS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight drop-shadow-sm">
              7 Core Capabilities for Oil India
            </h2>
            <p className="text-secondary text-xs sm:text-sm leading-relaxed drop-">
              Turning 60 years of Oil India drilling records into an instant, intelligent assistant for every engineer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Cap 1 */}
            <div className="p-6 bg-surface border border-line hover:border-accent/25 rounded-lg space-y-3.5 shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 w-10 h-10 rounded-lg bg-surface border border-line text-accent flex items-center justify-center">
                  <FileSearch size={18} />
                </div>
                <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest">CAPABILITY 01</span>
              </div>
              <h3 className="text-base font-bold text-ink tracking-wide">
                Smart Document Reader
              </h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Automatically reads decades of scanned PDF completion reports, daily drilling logs, and mud charts — pulling out casing sizes, rock formations, and past incidents in seconds.
              </p>
              <div className="text-xs font-semibold text-success pt-3 border-t border-line">
                 Eliminates 3–7 days of manual report reading
              </div>
            </div>

            {/* Cap 2 */}
            <div className="p-6 bg-surface border border-line hover:border-warning/25 rounded-lg space-y-3.5 shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 w-10 h-10 rounded-lg bg-surface border border-line text-warning flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <span className="text-xs font-mono font-bold text-warning uppercase tracking-widest">CAPABILITY 02</span>
              </div>
              <h3 className="text-base font-bold text-ink tracking-wide">
                Interactive Nearby Well Map
              </h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Visualizes offset wells on an interactive map. Set any search distance (1 km to 25 km) to instantly find nearby wells and see what problems occurred at each depth.
              </p>
              <div className="text-xs font-semibold text-success pt-3 border-t border-line">
                 Instant 360° view of surrounding wells
              </div>
            </div>

            {/* Cap 3 */}
            <div className="p-6 bg-surface border border-line hover:border-accent/25 rounded-lg space-y-3.5 shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 w-10 h-10 rounded-lg bg-accent-soft border border-line text-accent flex items-center justify-center">
                  <Network size={18} />
                </div>
                <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest">CAPABILITY 03</span>
              </div>
              <h3 className="text-base font-bold text-ink tracking-wide">
                Incident Memory &amp; Solutions
              </h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Connects past drilling issues directly to their proven solutions: <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded text-accent border border-line">Layer → Hazard → Fix → Result</code>. Preserves decades of senior engineer expertise.
              </p>
              <div className="text-xs font-semibold text-success pt-3 border-t border-line">
                 Retains knowledge when senior staff retire
              </div>
            </div>

            {/* Cap 4 */}
            <div className="p-6 bg-surface border border-line hover:border-accent/25 rounded-lg space-y-3.5 shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 w-10 h-10 rounded-lg bg-accent-soft border border-line text-accent flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest">CAPABILITY 04</span>
              </div>
              <h3 className="text-base font-bold text-ink tracking-wide">
                Safe Drilling Boundaries
              </h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Analyzes past wells to calculate safe limits for drilling speed, mud weight, and underground pressures for every rock formation across Upper Assam.
              </p>
              <div className="text-xs font-semibold text-success pt-3 border-t border-line">
                 Clear green/yellow/red safety corridors
              </div>
            </div>

            {/* Cap 5 */}
            <div className="p-6 bg-surface border border-line hover:border-danger/25 rounded-lg space-y-3.5 shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 w-10 h-10 rounded-lg bg-danger-soft border border-line text-danger flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <span className="text-xs font-mono font-bold text-danger uppercase tracking-widest">CAPABILITY 05</span>
              </div>
              <h3 className="text-base font-bold text-ink tracking-wide">
                Early Hazard Warnings
              </h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Monitors active rig bit depth and projects a 30m–50m lookahead warning before drilling into high-pressure gas pockets or fragile lost-circulation zones.
              </p>
              <div className="text-xs font-semibold text-success pt-3 border-t border-line">
                 Warns before incidents occur, not after
              </div>
            </div>

            {/* Cap 6 */}
            <div className="p-6 bg-surface border border-line hover:border-success/25 rounded-lg space-y-3.5 shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 w-10 h-10 rounded-lg bg-success-soft border border-line text-success flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <span className="text-xs font-mono font-bold text-success uppercase tracking-widest">CAPABILITY 06</span>
              </div>
              <h3 className="text-base font-bold text-ink tracking-wide">
                Ask Questions in English or Hindi
              </h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Ask field questions in plain conversational English or Hindi: <em>&ldquo;Moran ke paas Tipam mein kya problem aaya tha?&rdquo;</em> Get instant answers citing the exact report page.
              </p>
              <div className="text-xs font-semibold text-success pt-3 border-t border-line">
                 100% verified answers backed by real reports
              </div>
            </div>

            {/* Cap 7 (Spans Full Width on lg) */}
            <div className="p-6 sm:p-7 bg-surface border border-line hover:border-success/25 rounded-lg space-y-4 md:space-y-0 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm transition-all">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono font-bold text-success uppercase tracking-widest">CAPABILITY 07 · DIGITAL PRE-DRILL ADVISORY</div>
                <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <FileDown size={19} className="text-success" />
                  <span>Pre-Drill Safety &amp; Shift Handover Briefs</span>
                </h3>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Combines proven practices from the best nearby wells into an instant safety briefing and PDF handover report, complete with mud plans and hazard checklists.
                </p>
              </div>
              <Link
                href="/report"
                className="px-5 py-2.5 bg-surface hover:bg-accent-soft active:bg-surface text-accent hover:text-ink text-xs font-bold rounded-lg border border-line hover:border-accent/25 transition-colors shadow-sm shrink-0 flex items-center gap-2"
              >
                <span>Generate Sample Brief</span>
                <ChevronRight size={14} />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 6. Unified Technical Deep Dive: Subsurface Geology, Multi-Agent AI & Safety Compliance */}
      <section id="deep-dive" className="relative z-10 py-16 lg:py-24 bg-transparent border-b border-line/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-10">

          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center justify-center gap-2">
              <Layers size={14} />
              <span>TECHNICAL FOUNDATIONS &amp; DOMAIN DEPTH</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight drop-shadow-sm">
              Assam Subsurface, AI Swarm &amp; Safety Compliance
            </h2>
            <p className="text-secondary text-xs sm:text-sm leading-relaxed drop-">
              Explore the underground formations, autonomous multi-agent architecture, and PSU compliance standards powering SRISHTI.
            </p>
          </div>

          {/* Interactive Executive Tab Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-lg bg-surface border border-line shadow-sm gap-2 max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setDeepDiveTab('geology')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  deepDiveTab === 'geology'
                    ? 'bg-surface text-accent shadow-sm border border-accent/25'
                    : 'text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                <Layers size={14} className={deepDiveTab === 'geology' ? 'text-accent' : 'text-muted'} />
                <span>1. Assam Underground Formations</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-surface text-secondary border border-line">6 Layers</span>
              </button>

              <button
                type="button"
                onClick={() => setDeepDiveTab('swarm')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  deepDiveTab === 'swarm'
                    ? 'bg-surface text-accent shadow-sm border border-accent/25'
                    : 'text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                <Cpu size={14} className={deepDiveTab === 'swarm' ? 'text-accent' : 'text-muted'} />
                <span>2. 10-Agent Autonomous Swarm</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-success-soft text-success border border-line">LangGraph</span>
              </button>

              <button
                type="button"
                onClick={() => setDeepDiveTab('compliance')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  deepDiveTab === 'compliance'
                    ? 'bg-surface text-accent shadow-sm border border-accent/25'
                    : 'text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                <ShieldCheck size={14} className={deepDiveTab === 'compliance' ? 'text-accent' : 'text-muted'} />
                <span>3. Safety &amp; PSU Compliance</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-surface text-warning border border-line">OISD-STD-174</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Geological Horizons (Assam Rock Layers) */}
          {deepDiveTab === 'geology' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
              {/* Horizon 1 */}
              <div className="p-5 bg-surface border border-line border-t-2 border-t-accent rounded-lg space-y-3 shadow-sm hover:border-accent/25 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider">1. ALLUVIUM</span>
                  <span className="text-accent font-mono tabular-nums font-bold">0 – 200 m</span>
                </div>
                <div className="text-xs text-accent font-semibold">Surface Sand &amp; Gravel</div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Loose topsoil, river sand, and gravel. Standard shallow drilling zone with low pressure; check for pocket gas.
                </p>
                <div className="text-xs font-semibold text-success pt-2 border-t border-line flex items-center justify-between">
                  <span>Safe Mud: 8.9 – 9.2 ppg</span>
                  <span className="text-success/80"> Minimal Risk</span>
                </div>
              </div>

              {/* Horizon 2 */}
              <div className="p-5 bg-surface border border-line border-t-2 border-t-warning rounded-lg space-y-3 shadow-sm hover:border-warning/25 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider">2. DHEKIAJULI / NAMSANG</span>
                  <span className="text-warning font-mono tabular-nums font-bold">200 – 800 m</span>
                </div>
                <div className="text-xs text-warning font-semibold">Porous Sand Layer</div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Sponge-like porous rock that absorbs drilling fluid rapidly, leading to mud loss and unstable well walls.
                </p>
                <div className="text-xs font-semibold text-warning pt-2 border-t border-line flex items-center justify-between">
                  <span>Primary Risk: Mud Loss</span>
                  <span className="text-warning/80"> Add Lost Circulation Material</span>
                </div>
              </div>

              {/* Horizon 3 */}
              <div className="p-5 bg-surface border border-line border-t-2 border-t-danger rounded-lg space-y-3 shadow-sm hover:border-danger/25 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider">3. GIRUJAN CLAY</span>
                  <span className="text-danger font-mono tabular-nums font-bold">800 – 1,500 m</span>
                </div>
                <div className="text-xs text-danger font-semibold">Sticky Swelling Clay</div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Thick clay formation that reacts with water and expands, trapping the rotating drill bit and stalling the rig.
                </p>
                <div className="text-xs font-semibold text-danger pt-2 border-t border-line flex items-center justify-between">
                  <span>Primary Risk: Stuck Drill Pipe</span>
                  <span className="text-danger/80"> Use Potassium Inhibited Mud</span>
                </div>
              </div>

              {/* Horizon 4 */}
              <div className="p-5 bg-surface border border-line border-t-2 border-t-warning rounded-lg space-y-3 shadow-sm hover:border-warning/25 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider">4. TIPAM SANDSTONE</span>
                  <span className="text-warning font-mono tabular-nums font-bold">1,500 – 2,500 m</span>
                </div>
                <div className="text-xs text-warning font-semibold">Upper Assam Main Oil Reservoir</div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Major oil and gas producing sandstone. Needs balanced mud weight so oil pores aren&apos;t clogged or fractured.
                </p>
                <div className="text-xs font-semibold text-warning pt-2 border-t border-line flex items-center justify-between">
                  <span>Primary Risk: Differential Sticking</span>
                  <span className="text-warning/80"> Maintain 10.5 – 11.2 ppg Mud</span>
                </div>
              </div>

              {/* Horizon 5 */}
              <div className="p-5 bg-surface border border-line border-t-2 border-t-danger rounded-lg space-y-3 shadow-sm hover:border-danger/25 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider">5. BARAIL GROUP</span>
                  <span className="text-danger font-mono tabular-nums font-bold">2,500 – 3,500 m</span>
                </div>
                <div className="text-xs text-danger font-semibold">High-Pressure Gas &amp; Coal Pockets</div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Contains volatile high-pressure natural gas that can surge into the borehole (gas kick). Heavy mud is mandatory.
                </p>
                <div className="text-xs font-semibold text-danger pt-2 border-t border-line flex items-center justify-between">
                  <span>Current Active Depth: MORAN-29 at 2,418m</span>
                  <span className="text-danger font-bold"> 12.4 ppg Ready</span>
                </div>
              </div>

              {/* Horizon 6 */}
              <div className="p-5 bg-surface border border-line border-t-2 border-t-line rounded-lg space-y-3 shadow-sm hover:border-line transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink uppercase tracking-wider">6. BASEMENT ROCK</span>
                  <span className="text-muted font-mono tabular-nums font-bold">&gt; 3,500 m</span>
                </div>
                <div className="text-xs text-secondary font-semibold">Ultra-Hard Ancient Granite</div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Extremely hard crystalline rock bed. Destroys drill bit cutters quickly and drops drilling speed below 2 m/hr.
                </p>
                <div className="text-xs font-semibold text-muted pt-2 border-t border-line flex items-center justify-between">
                  <span>Primary Risk: Bit Wear &amp; Slow Speed</span>
                  <span className="text-muted/80"> PDC / Diamond Cutters</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 10-Agent Swarm Content */}
          {deepDiveTab === 'swarm' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-surface border border-line rounded-lg text-xs text-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <span>Multi-agent autonomous coordination runs on an evidence-verified LangGraph state machine. Each agent specializes in one drilling task.</span>
                <span className="text-xs font-mono px-3 py-1 rounded bg-success-soft text-success border border-line font-bold tracking-wider shrink-0">10 OF 10 OPERATIONAL</span>
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
                  <div key={i} className="p-4 bg-surface border border-line rounded-lg space-y-2 hover:border-accent/25 transition-colors shadow-sm">
                    <div className="text-xs text-accent font-bold font-mono tracking-wider">AGENT {agent.num}</div>
                    <div className="font-bold text-ink font-sans text-xs leading-tight">{agent.name}</div>
                    <div className="text-xs text-secondary leading-snug">{agent.task}</div>
                    <div className="pt-1.5 text-xs text-success flex items-center gap-1.5 font-bold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-success " />
                      ACTIVE
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
              <div className="p-6 bg-surface border border-line hover:border-success/25 rounded-lg space-y-3.5 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 w-10 h-10 rounded-lg bg-success-soft border border-line text-success flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm">OISD-STD-174 Safety Rules</h3>
                    <div className="text-xs font-semibold text-success">Well Control Safety Standard</div>
                  </div>
                </div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Enforces mandatory flow check intervals, shut-in procedures, and casing integrity rules in compliance with Indian petroleum safety statutes.
                </p>
                <div className="text-xs font-semibold text-success pt-2 border-t border-line">
                   Automated Safety Checklists Enabled
                </div>
              </div>

              {/* Standard 2 */}
              <div className="p-6 bg-surface border border-line hover:border-accent/25 rounded-lg space-y-3.5 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 w-10 h-10 rounded-lg bg-surface border border-line text-accent flex items-center justify-center shrink-0">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm">WITSML Telemetry Standard</h3>
                    <div className="text-xs font-semibold text-accent">Real-Time Rig Data Exchange</div>
                  </div>
                </div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Standard format used across drilling rigs to read live depth, drilling speed, standpipe pressure, and mud tank levels automatically without manual entry.
                </p>
                <div className="text-xs font-semibold text-accent pt-2 border-t border-line">
                   Direct Rig Sensor Ingestion
                </div>
              </div>

              {/* Standard 3 */}
              <div className="p-6 bg-surface border border-line hover:border-warning/25 rounded-lg space-y-3.5 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 w-10 h-10 rounded-lg bg-surface border border-line text-warning flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm">100% Air-Gapped Data Sovereignty</h3>
                    <div className="text-xs font-semibold text-warning">Zero Cloud Data Leakage</div>
                  </div>
                </div>
                <p className="text-xs text-secondary leading-relaxed font-sans">
                  Runs entirely on on-premise infrastructure inside Oil India&apos;s secured network at Duliajan Corporate HQ. Zero sensitive subsurface data leaves the country.
                </p>
                <div className="text-xs font-semibold text-warning pt-2 border-t border-line">
                   Certified PSU On-Premises Architecture
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 9. Section: Mission Operations Command Deck */}
      <section className="relative z-10 py-20 lg:py-28 bg-surface-muted/95 border-b border-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 space-y-10">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-xs font-mono font-bold text-accent uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-success " />
                <span>OIL INDIA OPERATIONS GATEWAY · DULIAJAN HQ</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
                SRISHTI Drilling Operations Hub
              </h2>
              <p className="text-secondary text-xs sm:text-sm leading-relaxed">
                Connect directly into 60 years of Upper Assam basin intelligence. Select an operational workspace below to begin offset analysis, monitor live rig bit depth, or query drilling incident memory.
              </p>
            </div>

            {/* Quick Live System Metrics */}
            <div className="flex items-center gap-5 shrink-0 bg-surface border border-line px-5 py-3 rounded-lg shadow-sm">
              <div>
                <div className="text-xs text-muted font-mono uppercase tracking-wider">SYSTEM STATUS</div>
                <div className="text-xs font-bold text-success flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  All 10 Agents Active
                </div>
              </div>
              <div className="h-8 w-px bg-surface-muted" />
              <div>
                <div className="text-xs text-muted font-mono uppercase tracking-wider">LIVE RIG MONITOR</div>
                <div className="text-xs font-bold text-accent font-mono mt-0.5">MORAN-29 (2,418m)</div>
              </div>
            </div>
          </div>

          {/* 4 Interactive Operational Launchpad Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Station 1: Geospatial Map */}
            <div
              onClick={(e) => handleProtectedAction(e, '/map')}
              className="p-6 bg-surface border border-line hover:border-accent/25 rounded-lg space-y-4 shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 w-11 h-11 rounded-lg bg-surface border border-line text-accent flex items-center justify-center  transition-transform">
                    <Globe size={20} />
                  </div>
                  <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-line">
                    01 · GIS
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                    Geospatial Map
                  </h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Interactive map of 18 wells across 8 Assam oil fields with 1–25 km radius offset search and 3D well trajectories.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-line flex items-center justify-between text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">
                <span>Launch Map Console</span>
                <ChevronRight size={15} />
              </div>
            </div>

            {/* Station 2: AI Copilot */}
            <div
              onClick={(e) => handleProtectedAction(e, '/ask')}
              className="p-6 bg-surface border border-line hover:border-accent/25 rounded-lg space-y-4 shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 w-11 h-11 rounded-lg bg-accent-soft border border-line text-accent flex items-center justify-center  transition-transform">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest px-2 py-0.5 rounded bg-accent-soft border border-line">
                    02 · AI Q&amp;A
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                    Field Copilot
                  </h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Ask field queries in English or Hindi. Cites exact pages in historical completion reports and mud charts.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-line flex items-center justify-between text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">
                <span>Open Copilot</span>
                <ChevronRight size={15} />
              </div>
            </div>

            {/* Station 3: Pre-Drill Safety Brief */}
            <div
              onClick={(e) => handleProtectedAction(e, '/report')}
              className="p-6 bg-surface border border-line hover:border-success/25 rounded-lg space-y-4 shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 w-11 h-11 rounded-lg bg-success-soft border border-line text-success flex items-center justify-center  transition-transform">
                    <FileDown size={20} />
                  </div>
                  <span className="text-xs font-mono font-bold text-success uppercase tracking-widest px-2 py-0.5 rounded bg-success-soft border border-line">
                    03 · SAFETY BRIEF
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink group-hover:text-success transition-colors">
                    Pre-Drill Advisory
                  </h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Generate instant safety briefs and shift handover packs with mud programs and historical risk checklists.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-line flex items-center justify-between text-xs font-bold text-success group-hover:translate-x-0.5 transition-transform">
                <span>Create Well Brief</span>
                <ChevronRight size={15} />
              </div>
            </div>

            {/* Station 4: Rig Floor View */}
            <div
              onClick={(e) => handleProtectedAction(e, '/doghouse')}
              className="p-6 bg-surface border border-line hover:border-warning/25 rounded-lg space-y-4 shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 w-11 h-11 rounded-lg bg-surface border border-line text-warning flex items-center justify-center  transition-transform">
                    <Radio size={20} />
                  </div>
                  <span className="text-xs font-mono font-bold text-warning uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-line">
                    04 · RIG
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink group-hover:text-warning transition-colors">
                    Rig Floor View
                  </h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Live drill bit radar for Moran-29. Delivers 30m lookahead hazard alerts directly to the driller terminal.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-line flex items-center justify-between text-xs font-bold text-warning group-hover:translate-x-0.5 transition-transform">
                <span>Open Rig Terminal</span>
                <ChevronRight size={15} />
              </div>
            </div>

          </div>

          {/* Natural Language Prompt Search Bar */}
          <div className="p-4 sm:p-5 bg-surface border border-line rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-lg bg-surface border border-line text-accent shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-xs text-secondary">
                <span className="text-muted font-mono uppercase text-xs mr-2">EXAMPLE DRILLING QUERY:</span>
                <span className="font-semibold text-ink">&ldquo;Show me stuck pipe incidents in Moran Tipam Sandstone below 2,200m&rdquo;</span>
              </div>
            </div>

            <button
              onClick={(e) => handleProtectedAction(e, '/ask')}
              className="w-full sm:w-auto px-4 py-2 bg-brand hover:bg-brand-hover active:bg-brand text-ink text-xs font-bold rounded-lg border border-accent/40 hover:border-accent/80 transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Run in AI Copilot</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </section>

      {/* 10. Enterprise Footer */}
      <footer className="relative z-10 py-10 bg-surface-muted text-muted text-xs border-t border-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-surface border border-line flex items-center justify-center text-accent">
              <Flame size={15} />
            </div>
            <span className="text-ink font-bold text-sm tracking-wide">SRISHTI·AI</span>
            <span className="text-muted">|</span>
            <span className="text-secondary">Oil India Limited · Autonomous Drilling Intelligence</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted">
            <span>Duliajan Corporate HQ, Assam</span>
            <span className="text-muted">·</span>
            <span>Upper Assam Basin</span>
            <span className="text-muted">·</span>
            <span className="text-success font-medium">100% On-Premise Air-Gapped</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
