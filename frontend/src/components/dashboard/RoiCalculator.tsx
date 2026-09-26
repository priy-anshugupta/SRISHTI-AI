'use client';

import React, { useState } from 'react';
import { TrendingUp, Clock, ShieldCheck, Laptop, Sparkles, AlertCircle } from 'lucide-react';

export default function RoiCalculator() {
  // Input parameters (calibrated to Oil India Limited Assam operations)
  const [activeRigs, setActiveRigs] = useState<number>(18);
  const [rigDayRateLakhs, setRigDayRateLakhs] = useState<number>(18);
  const [nptPercent, setNptPercent] = useState<number>(28);
  const [avoidanceEfficiency, setAvoidanceEfficiency] = useState<number>(35);

  // Calculations
  const annualFleetOperatingDays = activeRigs * 365;
  const annualFleetOperatingCostCr = (annualFleetOperatingDays * rigDayRateLakhs) / 100;
  const annualNptCostCr = annualFleetOperatingCostCr * (nptPercent / 100);
  const avoidedNptSavingsCr = annualNptCostCr * (avoidanceEfficiency / 100);

  // Direct savings streams
  const foreignLicensingAvoidedCr = 8.5; // Avoided commercial software seats
  const engineeringHoursSavedCr = 2.4;  // Accelerated well planning and offset search

  const totalSavingsCr = avoidedNptSavingsCr + foreignLicensingAvoidedCr + engineeringHoursSavedCr;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#061014] border-2 border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] text-slate-100 font-sans space-y-5">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162D38] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Fleet Cost Savings Simulator
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-cyan-400" size={20} />
            Estimated Rig Downtime & Cost Savings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust rig count and daily costs to calculate projected fleet savings for Assam operations
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-400" />
          <span>Payback Period: &lt; 3 Months</span>
        </div>
      </div>

      {/* Main Grid: Sliders (Left) & Output Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-[#03090C] p-4 sm:p-5 rounded-xl border border-[#162D38]">
          <span className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
            Fleet Parameters
          </span>

          {/* Slider 1: Active Rigs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Active Drilling Rigs:</span>
              <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                {activeRigs} Rigs
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={activeRigs}
              onChange={(e) => setActiveRigs(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>1 Rig</span>
              <span className="text-cyan-400/90 font-medium">18 Rigs (OIL Assam)</span>
              <span>40 Rigs</span>
            </div>
          </div>

          {/* Slider 2: Rig Day Rate */}
          <div className="space-y-1.5 pt-2.5 border-t border-[#162D38]">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Rig Operating Cost / Day:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                ₹{rigDayRateLakhs} Lakhs / day
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              value={rigDayRateLakhs}
              onChange={(e) => setRigDayRateLakhs(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>₹10L (Small Rig)</span>
              <span className="text-emerald-400/90 font-medium">₹18L (Standard Rig)</span>
              <span>₹35L</span>
            </div>
          </div>

          {/* Slider 3: Historical NPT Rate */}
          <div className="space-y-1.5 pt-2.5 border-t border-[#162D38]">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Current Fleet Downtime (NPT):</span>
              <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                {nptPercent}% of time
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              value={nptPercent}
              onChange={(e) => setNptPercent(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>15% (Low)</span>
              <span className="text-amber-400/90 font-medium">28% (Basin Average)</span>
              <span>45% (High)</span>
            </div>
          </div>

          {/* Slider 4: Mitigation Efficiency */}
          <div className="space-y-1.5 pt-2.5 border-t border-[#162D38]">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">AI Downtime Reduction:</span>
              <span className="font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                {avoidanceEfficiency}% Reduction
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="60"
              value={avoidanceEfficiency}
              onChange={(e) => setAvoidanceEfficiency(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>20% (Modest)</span>
              <span className="text-purple-400/90 font-medium">35% (Target)</span>
              <span>60% (Optimal)</span>
            </div>
          </div>

        </div>

        {/* Right Column: Calculated Annual Savings (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Hero Headline Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-[#09222E] via-[#06161F] to-[#030B0F] border-2 border-cyan-400/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-xs uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              TOTAL ESTIMATED ANNUAL SAVINGS
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                ₹{totalSavingsCr.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-emerald-400">Crore / Year</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Achieved by preventing stuck drill pipes and gas kicks before they occur, eliminating expensive software licenses, and automating well planning.
            </p>
          </div>

          {/* 3 Secondary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Card 1 */}
            <div className="p-3.5 rounded-xl bg-[#03090C] border border-[#162D38] space-y-1">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-cyan-400" />
                Rig Downtime Saved
              </span>
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                ₹{avoidedNptSavingsCr.toFixed(1)} Cr
              </div>
              <p className="text-[11px] text-slate-400">
                {avoidanceEfficiency}% fewer stuck pipe & kick incidents
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-3.5 rounded-xl bg-[#03090C] border border-[#162D38] space-y-1">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Laptop size={13} className="text-purple-400" />
                Software Licenses Saved
              </span>
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                ₹{foreignLicensingAvoidedCr.toFixed(1)} Cr
              </div>
              <p className="text-[11px] text-slate-400">
                Replaces costly proprietary software seats
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-3.5 rounded-xl bg-[#03090C] border border-[#162D38] space-y-1">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                Engineering Time Saved
              </span>
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                ₹{engineeringHoursSavedCr.toFixed(1)} Cr
              </div>
              <p className="text-[11px] text-slate-400">
                Instant offset well briefs across 80 wells
              </p>
            </div>

          </div>

          {/* Simple Takeaway Strip */}
          <div className="p-3 rounded-lg bg-[#071317] border border-[#162D38] text-xs text-slate-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-cyan-400 shrink-0" />
              <span>
                <strong>Cost Rule of Thumb:</strong> Every 24 hours of avoided rig downtime saves approximately ₹18 Lakhs.
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 shrink-0">
              High Impact
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
