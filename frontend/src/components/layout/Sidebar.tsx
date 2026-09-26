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
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, PRESET_PERSONAS } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  shortcut: string;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  subtitle: string;
  dotColor: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'RIG OPERATIONS',
    subtitle: 'Live',
    dotColor: '#ef4444', // Red
    items: [
      { name: 'Active Well (MOR-29)', href: '/well/MOR-29', icon: FileText, shortcut: 'Alt+1' },
      { name: 'Early Safety Alerts', href: '/alerts', icon: AlertTriangle, shortcut: 'Alt+2', badge: 'LIVE', badgeColor: 'bg-red-950 text-red-300 border border-red-800/80 font-bold' },
      { name: 'Rig Floor View', href: '/doghouse', icon: Monitor, shortcut: 'Alt+3', badge: 'Rig', badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold' },
    ],
  },
  {
    title: 'OFFSET INTELLIGENCE',
    subtitle: 'Historical Memory',
    dotColor: '#38bdf8', // Blue/Cyan
    items: [
      { name: 'Nearby Well Map', href: '/map', icon: Globe, shortcut: 'Alt+4' },
      { name: 'Compare Nearby Wells', href: '/compare', icon: GitCompare, shortcut: 'Alt+5' },
      { name: 'Past Incident Memory', href: '/knowledge', icon: Share2, shortcut: 'Alt+6' },
      { name: 'Ask SRISHTI', href: '/ask', icon: MessageSquare, shortcut: 'Alt+7', badge: 'AI Chat', badgeColor: 'bg-amber-950 text-amber-300 border border-amber-800/80 font-bold' },
    ],
  },
  {
    title: 'ENGINEERING & DATA',
    subtitle: 'Planning',
    dotColor: '#10b981', // Green
    items: [
      { name: 'Rock Layer Analysis', href: '/analytics', icon: BarChart3, shortcut: 'Alt+8' },
      { name: 'Pre-Drill Safety Brief', href: '/report', icon: ClipboardList, shortcut: 'Alt+9' },
      { name: 'Upload & Read Reports', href: '/ingest', icon: Upload, shortcut: 'Alt+0' },
    ],
  },
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
          "print:hidden h-full bg-[#020507] border-r border-[#153240] shadow-[8px_0_30px_rgba(0,0,0,0.85)] flex flex-col transition-all duration-300 relative z-30 shrink-0 select-none",
          expanded ? "w-64" : "w-18"
        )}
      >
        {/* Subtle razor-sharp 1px vertical gradient seam */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-400/50 via-[#0D5C75] to-emerald-400/30 shadow-[0_0_8px_rgba(56,189,248,0.25)] pointer-events-none z-30" />

        {/* Brand Top Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#162D38] bg-[#050C10] shadow-sm">
          {expanded ? (
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/30 border border-slate-700/60 flex items-center justify-center text-[#D97706] shrink-0">
                <Flame size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-wider leading-none">
                  SRISHTI <span className="text-[#D97706]">· AI</span>
                </span>
                <span className="text-[10px] text-amber-500/90 font-semibold tracking-wider mt-0.5">
                  OIL INDIA LIMITED
                </span>
              </div>
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/30 border border-slate-700/60 flex items-center justify-center text-[#D97706] mx-auto">
              <Flame size={18} />
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer"
            title={expanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {expanded ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Grouped Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2 no-scrollbar">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-1">
              
              {/* Subtle architectural separator before groups 2 & 3 */}
              {groupIdx > 0 && (
                <div className="pt-2 border-t border-[#13242E] my-1" />
              )}

              {/* Group Header with Sleek Colored Gradient Line */}
              {expanded ? (
                <div className="px-2.5 pt-1 pb-1.5 flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm" 
                    style={{ backgroundColor: group.dotColor }}
                  />
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-300 whitespace-nowrap">
                    {group.title}
                  </span>
                  <div 
                    className="flex-1 h-[1px] ml-1.5 opacity-40" 
                    style={{ background: `linear-gradient(to right, ${group.dotColor}, transparent)` }}
                  />
                </div>
              ) : (
                groupIdx > 0 && <div className="border-t border-[#13242E] my-2" />
              )}

              {/* Items in this Group */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group relative cursor-pointer",
                        active
                          ? "bg-[#0D5C75]/25 text-white border-l-[3px] font-bold shadow-md shadow-cyan-950/20"
                          : "text-slate-400 hover:text-white hover:bg-[#071318] border-l-[3px] border-transparent"
                      )}
                      style={active ? { borderLeftColor: group.dotColor } : undefined}
                    >
                      <Icon
                        size={16}
                        className={cn(
                          "shrink-0 transition-colors",
                          active ? "text-white" : "text-slate-400 group-hover:text-cyan-300"
                        )}
                        style={active ? { color: group.dotColor } : undefined}
                      />
                      
                      {expanded && (
                        <div className="flex items-center justify-between flex-1 overflow-hidden">
                          <span className="truncate">{item.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className={cn("text-[9px] px-1.5 py-0.5 rounded", item.badgeColor)}>
                                {item.badge}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500 font-mono hidden group-hover:inline">
                              {item.shortcut}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Collapsed Tooltip */}
                      {!expanded && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#09151A] border border-cyan-800/80 text-white text-xs rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.dotColor }} />
                            <span>{group.title}</span> · <span>{item.shortcut}</span>
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-[#162D38] bg-[#030608] space-y-2">
          {expanded && (
            <div className="flex items-center justify-between text-[10px] bg-[#060E12] px-2.5 py-1.5 rounded-lg border border-[#162D38]">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck size={12} className="text-[#10B981]" />
                PRIVATE NETWORK
              </span>
              <span className="text-[#38BDF8] font-medium">Local &amp; Secure</span>
            </div>
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
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
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
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
                className="flex-1 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors cursor-pointer"
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

/* commit-step-17: feat(sidebar) */
