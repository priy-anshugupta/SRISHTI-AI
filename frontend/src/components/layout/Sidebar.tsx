'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe,
  MessageSquare,
  FileText,
  GitCompare,
  Share2,
  AlertTriangle,
  BarChart3,
  Upload,
  ClipboardList,
  Monitor,
  LogOut,
  User,
  ShieldCheck,
  ChevronLeft,
  Menu,
  Sparkles,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, PRESET_PERSONAS, UserProfile } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  shortcut: string;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { name: 'Geospatial Well Map', href: '/map', icon: Globe, shortcut: 'Alt+1', badge: '3D GIS', badgeColor: 'bg-[#0D5C75] text-[#38BDF8]' },
  { name: 'Ask SRISHTI (AI Chat)', href: '/ask', icon: MessageSquare, shortcut: 'Alt+2', badge: 'AI CHAT', badgeColor: 'bg-[#D97706] text-black font-bold' },
  { name: 'Well Dossier (MOR-29)', href: '/well/MOR-29', icon: FileText, shortcut: 'Alt+3' },
  { name: 'Offset Comparison', href: '/compare', icon: GitCompare, shortcut: 'Alt+4' },
  { name: 'Drilling Knowledge Graph', href: '/knowledge', icon: Share2, shortcut: 'Alt+5' },
  { name: 'Proactive Hazard Alerts', href: '/alerts', icon: AlertTriangle, shortcut: 'Alt+6', badge: 'LIVE', badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40' },
  { name: 'Formation Analytics', href: '/analytics', icon: BarChart3, shortcut: 'Alt+7' },
  { name: 'Document Ingestion (OCR)', href: '/ingest', icon: Upload, shortcut: 'Alt+8' },
  { name: 'Well Program Generator', href: '/report', icon: ClipboardList, shortcut: 'Alt+9' },
  { name: 'Doghouse Touch Cockpit', href: '/doghouse', icon: Monitor, shortcut: 'Alt+0', badge: 'RIG', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Connect to global auth context
  const { user, logout, login } = useAuth();
  const currentUser = user || PRESET_PERSONAS[0];

  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "print:hidden h-full bg-[#030709] border-r-2 border-[#162D38] shadow-[8px_0_30px_rgba(0,0,0,0.85)] flex flex-col transition-all duration-300 relative z-30 shrink-0 select-none",
          expanded ? "w-64" : "w-18"
        )}
      >
        {/* Brand Top Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#162D38] bg-[#050C10] shadow-sm">
          {expanded ? (
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/30 border border-cyan-500/50 flex items-center justify-center text-[#D97706] shrink-0 shadow-[0_0_12px_rgba(13,92,117,0.4)]">
                <Flame size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-wider leading-none">
                  SRISHTI <span className="text-[#D97706]">· AI</span>
                </span>
                <span className="text-[10px] text-amber-500/90 font-semibold tracking-wider mt-0.5">
                  OIL INDIA · eRTMAC
                </span>
              </div>
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/30 border border-cyan-500/50 flex items-center justify-center text-[#D97706] mx-auto shadow-[0_0_12px_rgba(13,92,117,0.4)]">
              <Flame size={18} />
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/60"
            title={expanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {expanded ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Category Header */}
        {expanded && (
          <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-[#112028]/80 mx-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              DRILLING INTELLIGENCE
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#0D5C75]/30 text-[#38BDF8] border border-cyan-500/40 font-semibold">
              10 AGENTS
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative",
                  active
                    ? "bg-gradient-to-r from-[#0D5C75]/40 via-[#0D5C75]/15 to-transparent text-white border-l-[3px] border-cyan-400 font-semibold shadow-[inset_0_0_12px_rgba(14,165,233,0.15)]"
                    : "text-slate-400 hover:text-white hover:bg-[#081216] border-l-[3px] border-transparent"
                )}
              >
                <Icon size={16} className={cn("shrink-0 transition-colors", active ? "text-cyan-300" : "text-slate-400 group-hover:text-cyan-300")} />
                
                {expanded && (
                  <div className="flex items-center justify-between flex-1 overflow-hidden">
                    <span className="truncate">{item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded font-bold", item.badgeColor)}>
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-slate-600 hidden group-hover:inline">
                        {item.shortcut}
                      </span>
                    </div>
                  </div>
                )}

                {/* Collapsed Tooltip */}
                {!expanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#09151A] border border-cyan-800/80 text-white text-xs rounded shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.name} <span className="text-slate-400 text-[10px] font-mono ml-1">({item.shortcut})</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-[#162D38] bg-[#030608] space-y-2">
          {expanded && (
            <>
              {/* Air-gap / Model Indicator Pill */}
              <div className="flex items-center justify-between text-[10px] bg-[#060E12] px-2.5 py-1.5 rounded-lg border border-[#162D38]">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={12} className="text-[#10B981]" />
                  AIR-GAP SOVEREIGN
                </span>
                <span className="text-[#38BDF8] font-bold font-mono">100% Zero-Cloud</span>
              </div>
            </>
          )}

          {/* User Profile Card */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl bg-[#060E12] hover:bg-[#0A161C] border border-[#162D38] transition-all group shadow-md"
          >
            <div 
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer"
              title="Click to Switch User Profile"
            >
              <div className="w-7 h-7 rounded-full bg-[#0D5C75] text-[#38BDF8] flex items-center justify-center text-xs font-bold shrink-0 border border-[#38BDF8]/50 shadow-sm">
                {currentUser.initials}
              </div>
              {expanded && (
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-xs font-bold text-white truncate leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
              )}
            </div>

            {expanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                title="Sign Out / Lock Console"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* User Switch / Authentication Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e171a] border border-slate-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white">OIL INDIA PERSONA SELECTOR</h3>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Active Drilling Persona:</span>
              
              {PRESET_PERSONAS.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    login(u);
                    setShowUserModal(false);
                  }}
                  className={cn(
                    "p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
                    currentUser.name === u.name ? "bg-[#0D5C75]/20 border-[#0D5C75] text-white" : "bg-[#080d0f] border-slate-800 text-slate-300 hover:bg-[#101b1f]"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-[#38BDF8]">
                    {u.initials}
                  </div>
                  <div>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.role}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  logout();
                }}
                className="flex-1 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
