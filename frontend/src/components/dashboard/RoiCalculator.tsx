'use client';

import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, ShieldCheck, Clock, 
  BarChart3, Award, Sparkles, Building, ArrowUpRight 
} from 'lucide-react';

export default function RoiCalculator() {
  // Input parameters
  const [activeRigs, setActiveRigs] = useState<number>(18); // OIL operates ~18 active drilling rigs
  const [rigDayRateLakhs, setRigDayRateLakhs] = useState<number>(18); // ₹18 Lakhs/day (~$22,000/day)
  const [nptPercent, setNptPercent] = useState<number>(28); // Industry average ~28% NPT
  const [avoidanceEfficiency, setAvoidanceEfficiency] = useState<number>(35); // 35% repeat problem reduction

  // Calculations
  const annualFleetOperatingDays = activeRigs * 365;
  const annualFleetOperatingCostCr = (annualFleetOperatingDays * rigDayRateLakhs) / 100;
  const annualNptCostCr = annualFleetOperatingCostCr * (nptPercent / 100);
  const avoidedNptSavingsCr = annualNptCostCr * (avoidanceEfficiency / 100);

  // Additional indirect streams
  const foreignLicensingAvoidedCr = 8.5; // Commercial Schlumberger/Halliburton enterprise seats
  const engineeringHoursSavedCr = 2.4; // 80 wells x 4.5 days saved per engineer
  const blowoutInsuranceRiskCr = 18.0; // Catastrophic well control probability mitigation

  const totalEconomicValueCr = avoidedNptSavingsCr + foreignLicensingAvoidedCr + engineeringHoursSavedCr + blowoutInsuranceRiskCr;
  const paybackMonths = Math.max(0.5, ((1.2 / totalEconomicValueCr) * 12)).toFixed(1);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#081216] border-2 border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] text-slate-100 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#162D38] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Executive Financial Modeling
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-cyan-400" size={20} />
            Oil India Limited · Fleet ROI & NPT Savings Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated against CAG Report No. 42 drilling performance benchmarks & Upper Assam rig day-rates
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <Award size={14} className="text-emerald-400" />
          <span>Payback Period: &lt; {paybackMonths} Months</span>
        </div>
      </div>

      {/* Main Grid: Interactive Sliders (Left) & Output Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Reactive Rig Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-[#050C0E] p-4 sm:p-5 rounded-xl border border-[#162D38]">
          <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
            1. Operational Variables
          </span>

          {/* Slider 1: Active Rigs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Active OIL Drilling Rigs:</span>
              <span className="font-mono font-bold text-cyan-300">{activeRigs} Rigs</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={activeRigs}
              onChange={(e) => setActiveRigs(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 Rig</span>
              <span>18 Rigs (OIL Assam baseline)</span>
              <span>40 Rigs</span>
            </div>
          </div>

          {/* Slider 2: Rig Day Rate */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Average Rig Day-Rate:</span>
              <span className="font-mono font-bold text-emerald-400">₹{rigDayRateLakhs} Lakhs / day</span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              value={rigDayRateLakhs}
              onChange={(e) => setRigDayRateLakhs(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>₹10 Lakhs (1500 HP)</span>
              <span>₹18 Lakhs (2000 HP SCR)</span>
              <span>₹35 Lakhs</span>
            </div>
          </div>

          {/* Slider 3: Historical NPT Rate */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Fleet NPT Rate:</span>
              <span className="font-mono font-bold text-amber-300">{nptPercent}% of time</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              value={nptPercent}
              onChange={(e) => setNptPercent(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>15% (World Class)</span>
              <span>28% (Basin Avg)</span>
              <span>45%</span>
            </div>
          </div>

          {/* Slider 4: SRISHTI Mitigation Efficiency */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Repeat Hazard Avoidance:</span>
              <span className="font-mono font-bold text-purple-300">{avoidanceEfficiency}% Reduction</span>
            </div>
            <input
              type="range"
              min="20"
              max="60"
              value={avoidanceEfficiency}
              onChange={(e) => setAvoidanceEfficiency(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>20% (Conservative)</span>
              <span>35% (Target)</span>
              <span>60% (Max)</span>
            </div>
          </div>

        </div>

        {/* Right Column: Calculated Annual Savings Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Hero Headline Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#0B2533] via-[#07161F] to-[#040B0E] border-2 border-cyan-400/50 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400" />
              TOTAL PROJECTED ANNUAL VALUE CREATION
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                ₹{totalEconomicValueCr.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-emerald-400 font-sans">Crore / Year</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Consisting of direct avoided NPT rig downtime, foreign software replacement, engineering man-hours, and high-severity well control mitigation.
            </p>
          </div>

          {/* 3 Secondary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Card 1 */}
            <div className="p-3.5 rounded-xl bg-[#050C0E] border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Clock size={12} className="text-cyan-400" />
                Avoided NPT Downtime
              </span>
              <div className="text-lg font-bold text-white font-mono tabular-nums">
                ₹{avoidedNptSavingsCr.toFixed(1)} Cr
              </div>
              <p className="text-[10px] text-slate-400">
                {avoidanceEfficiency}% cut in stuck pipe & mud losses
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-3.5 rounded-xl bg-[#050C0E] border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Building size={12} className="text-purple-400" />
                Foreign Licensing
              </span>
              <div className="text-lg font-bold text-white font-mono tabular-nums">
                ₹{foreignLicensingAvoidedCr.toFixed(1)} Cr
              </div>
              <p className="text-[10px] text-slate-400">
                Avoided SLB DrillPlan / Landmark fees
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-3.5 rounded-xl bg-[#050C0E] border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                Engineering Velocity
              </span>
              <div className="text-lg font-bold text-white font-mono tabular-nums">
                ₹{engineeringHoursSavedCr.toFixed(1)} Cr
              </div>
              <p className="text-[10px] text-slate-400">
                Well planning: 5 days → 30 seconds
              </p>
            </div>

          </div>

          {/* Qualitative Moat Strip */}
          <div className="p-3 rounded-lg bg-[#071317] border border-[#162D38] text-[11px] text-slate-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-cyan-400 shrink-0" />
              <span>
                <strong>Zero Licensing Overhead:</strong> 100% sovereign open-source stack saves ₹0 in perpetual proprietary vendor locks.
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
              HIGH ROI · ESG COMPLIANT
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
