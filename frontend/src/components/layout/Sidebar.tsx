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
  Flame,
  Activity,
  Lock,
  Unlock,
  ShieldAlert,
  X
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
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'RIG OPERATIONS',
    subtitle: 'Live',
    items: [
      { name: 'Well Profile & Dossier', href: '/well/MOR-29', icon: FileText, shortcut: 'Alt+1' },
      { name: 'Early Safety Alerts', href: '/alerts', icon: AlertTriangle, shortcut: 'Alt+2', badge: 'LIVE', badgeColor: 'bg-red-500/10 text-red-400 border border-red-500/25 font-semibold' },
      { name: 'Rig Floor View', href: '/doghouse', icon: Monitor, shortcut: 'Alt+3', badge: 'Rig', badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold' },
    ],
  },
  {
    title: 'OFFSET INTELLIGENCE',
    subtitle: 'Historical Memory',
    items: [
      { name: 'Nearby Well Map', href: '/map', icon: Globe, shortcut: 'Alt+4' },
      { name: 'Compare Nearby Wells', href: '/compare', icon: GitCompare, shortcut: 'Alt+5' },
      { name: 'Past Incident Memory', href: '/knowledge', icon: Share2, shortcut: 'Alt+6' },
      { name: 'Ask SRISHTI', href: '/ask', icon: MessageSquare, shortcut: 'Alt+7', badge: 'AI Chat', badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-semibold' },
    ],
  },
  {
    title: 'ENGINEERING & DATA',
    subtitle: 'Planning',
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
  const [lockedModalItem, setLockedModalItem] = useState<{ name: string; href: string } | null>(null);
  
  // Connect to global auth context
  const { user, logout, login } = useAuth();
  const currentUser = user || PRESET_PERSONAS[0];

  const pathname = usePathname();

  // Rig Floor Kiosk Mode is ONLY active when a Rig Floor worker persona is logged in.
  // Engineers, Operations Managers, and Auditors have 100% full access to all dashboards, including doghouse.
  const isRigFloorWorker = (
    currentUser?.badge === 'Rig Floor' ||
    currentUser?.clearanceLevel === 'Rig Floor View'
  );
  const isRigFloorMode = isRigFloorWorker;

  const allowedRigRoutes = ['/doghouse', '/alerts', '/well/MOR-29'];

  return (
    <>
      <aside
        className={cn(
          "print:hidden h-full bg-[#0A0F12] border-r border-[#1C2C35] shadow-md flex flex-col transition-all duration-300 relative z-30 shrink-0 select-none",
          expanded ? "w-64" : "w-18"
        )}
      >
        {/* Subtle razor-sharp 1px vertical gradient seam */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#1C2C35] pointer-events-none z-30" />

        {/* Brand Top Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1C2C35] bg-[#0A0F12] shadow-sm">
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

        {/* Rig Floor Kiosk Status Banner */}
        {isRigFloorMode && expanded && (
          <div className="mx-2.5 mt-2.5 p-2 rounded-xl bg-amber-950/40 border border-amber-600/60 text-[10px] space-y-1.5 shadow-md">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Lock size={12} className="text-amber-400" />
                <span>RIG KIOSK LOCKED</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-900/80 text-[8px] uppercase font-mono tracking-wider">
                Driller Mode
              </span>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight">
              Office planning &amp; analytics tools are locked to prevent wellsite interference.
            </p>
            <button
              onClick={() => login(PRESET_PERSONAS[0], '/map')}
              className="w-full mt-1 py-1.5 rounded-lg bg-[#0D5C75] hover:bg-[#137494] text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Unlock size={11} />
              <span>Switch to HQ View (Unlock)</span>
            </button>
          </div>
        )}

        {/* Grouped Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2 no-scrollbar">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-1">
              
              {/* Subtle architectural separator before groups 2 & 3 */}
              {groupIdx > 0 && (
                <div className="pt-2 border-t border-[#1C2C35] my-1" />
              )}

              {/* Group Header */}
              {expanded ? (
                <div className="px-2.5 pt-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 select-none">
                    {group.title}
                  </span>
                </div>
              ) : (
                groupIdx > 0 && <div className="border-t border-[#1C2C35] my-2" />
              )}

              {/* Items in this Group */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)) || (item.href.startsWith('/well') && pathname?.startsWith('/well'));
                  const isItemLocked = isRigFloorMode && !allowedRigRoutes.includes(item.href);

                  const content = (
                    <>
                      <Icon
                        size={16}
                        className={cn(
                          "shrink-0 transition-colors",
                          isItemLocked ? "text-slate-600" : (active ? "text-[#38BDF8]" : "text-slate-400 group-hover:text-slate-200")
                        )}
                      />
                      
                      {expanded && (
                        <div className="flex items-center justify-between flex-1 overflow-hidden">
                          <span className={cn("truncate", isItemLocked && "text-slate-500 opacity-75")}>{item.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isItemLocked ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-amber-900/60 text-amber-400/90 font-bold flex items-center gap-1">
                                <Lock size={9} /> Locked
                              </span>
                            ) : (
                              item.badge && (
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded", item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )
                            )}
                            <span className="text-[9px] text-slate-500 font-mono hidden group-hover:inline">
                              {item.shortcut}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Collapsed Tooltip */}
                      {!expanded && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#131D24] border border-[#243542] text-white text-xs rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                          <div className="font-bold flex items-center gap-1.5">
                            {isItemLocked && <Lock size={12} className="text-amber-400" />}
                            <span>{item.name}</span>
                            {isItemLocked && <span className="text-amber-400 text-[10px]">(Rig Locked)</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{group.title}</span> · <span>{item.shortcut}</span>
                          </div>
                        </div>
                      )}
                    </>
                  );

                  if (isItemLocked) {
                    return (
                      <button
                        key={item.href}
                        onClick={() => setLockedModalItem(item)}
                        className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group relative cursor-pointer text-slate-500 hover:text-amber-300 hover:bg-amber-950/20 border-l-[3px] border-transparent"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all group relative cursor-pointer",
                        active
                          ? "bg-[#0D5C75]/15 text-[#38BDF8] border border-[#0D5C75]/40 font-semibold shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#111B21] border border-transparent font-medium"
                      )}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-[#1C2C35] bg-[#0A0F12] space-y-2">
          {expanded && (
            <div className="flex items-center justify-between text-[10px] bg-[#0D1419] px-2.5 py-1.5 rounded-lg border border-[#1C2C35]">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck size={12} className="text-[#10B981]" />
                PRIVATE NETWORK
              </span>
              <span className="text-[#38BDF8] font-medium">Local &amp; Secure</span>
            </div>
          )}

          {/* User Profile Card */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl bg-[#0D1419] hover:bg-[#111B21] border border-[#1C2C35] transition-all group shadow-sm"
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
          <div className="bg-[#0D1419] border border-[#1C2C35] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-[#1C2C35] pb-3">
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
                    currentUser.name === u.name ? "bg-[#0D5C75]/20 border-[#0D5C75] text-white" : "bg-[#0A0F12] border-[#1C2C35] text-slate-300 hover:bg-[#111B21]"
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

            <div className="pt-2 border-t border-[#1C2C35] flex gap-2">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  logout();
                }}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 bg-[#111B21] hover:bg-[#1A2732] border border-[#1C2C35] text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rig Floor Kiosk Locked Modal */}
      {lockedModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D1419] border border-amber-600/70 rounded-xl max-w-md w-full p-6 space-y-4 shadow-md relative">
            <button
              onClick={() => setLockedModalItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                    Rig Terminal Restricted
                  </h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700/80 text-amber-300 font-bold">
                    OISD-STD-174
                  </span>
                </div>
                <p className="text-xs text-amber-400/90 font-medium">
                  {lockedModalItem.name} is locked in Rig Floor mode.
                </p>
              </div>
            </div>

            <div className="bg-[#0A1115] border border-[#1C2C35] rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Under <strong className="text-amber-300">OISD-STD-174 Well Control Guidelines</strong>, active rig floor touchscreens are restricted strictly to real-time mud telemetry, gas kick detection, and emergency shut-in procedures.
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Office engineering, multi-well correlation, and AI chat interfaces are locked to prevent operational distraction during active drilling on <strong className="text-white">OIL-RIG-04</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => {
                  const targetHref = lockedModalItem.href;
                  setLockedModalItem(null);
                  login(PRESET_PERSONAS[0], targetHref);
                }}
                className="flex-1 py-2.5 px-3 bg-[#0D5C75] hover:bg-[#0F6D8A] border border-[#0D5C75]/40 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Unlock size={14} />
                <span>Unlock &amp; Switch to HQ View</span>
              </button>
              <button
                onClick={() => setLockedModalItem(null)}
                className="py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Stay on Rig Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
