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
      { name: 'Early Safety Alerts', href: '/alerts', icon: AlertTriangle, shortcut: 'Alt+2', badge: 'LIVE', badgeColor: 'bg-danger-soft text-danger border border-danger/25 font-semibold' },
      { name: 'Rig Floor View', href: '/doghouse', icon: Monitor, shortcut: 'Alt+3', badge: 'Rig', badgeColor: 'bg-success-soft text-success border border-success/25 font-semibold' },
    ],
  },
  {
    title: 'OFFSET INTELLIGENCE',
    subtitle: 'Historical Memory',
    items: [
      { name: 'Nearby Well Map', href: '/map', icon: Globe, shortcut: 'Alt+4' },
      { name: 'Compare Nearby Wells', href: '/compare', icon: GitCompare, shortcut: 'Alt+5' },
      { name: 'Past Incident Memory', href: '/knowledge', icon: Share2, shortcut: 'Alt+6' },
      { name: 'Ask SRISHTI', href: '/ask', icon: MessageSquare, shortcut: 'Alt+7', badge: 'AI Chat', badgeColor: 'bg-accent-soft text-accent border border-accent/25 font-semibold' },
    ],
  },
  {
    title: 'ENGINEERING & DATA',
    subtitle: 'Planning',
    items: [
      { name: 'Rock Layer Analysis', href: '/analytics', icon: BarChart3, shortcut: 'Alt+8' },
      { name: 'Pre-Drill Safety Brief', href: '/report', icon: ClipboardList, shortcut: 'Alt+9' },
      { name: 'Upload & Read Reports', href: '/ingest', icon: Upload, shortcut: 'Alt+0' },
      { name: 'Review & Verification', href: '/review', icon: ShieldCheck, shortcut: '' },
    ],
  },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
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
        data-collapsed={!expanded}
        className={cn(
          "app-sidebar print:hidden h-full bg-surface border-r border-line flex flex-col transition-all duration-200 relative z-30 shrink-0",
          expanded ? "w-72" : "w-20"
        )}
      >
        {/* Brand Top Header */}
        <div className="sidebar-brand h-16 flex items-center justify-between px-4 border-b border-line bg-surface">
          {expanded ? (
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-brand/30 border border-line flex items-center justify-center text-accent shrink-0">
                <Flame size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-ink font-bold text-sm tracking-wider leading-none">
                  SRISHTI <span className="text-accent">· AI</span>
                </span>
                <span className="text-xs text-warning/90 font-semibold tracking-wider mt-0.5">
                  OIL INDIA LIMITED
                </span>
              </div>
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand/30 border border-line flex items-center justify-center text-accent mx-auto">
              <Flame size={18} />
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-surface-muted cursor-pointer"
            title={expanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {expanded ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Rig Floor Kiosk Status Banner */}
        {isRigFloorMode && expanded && (
          <div className="mx-2.5 mt-2.5 p-2 rounded-lg bg-warning-soft border border-warning/25 text-xs space-y-1.5 shadow-md">
            <div className="flex items-center justify-between font-bold text-warning">
              <span className="flex items-center gap-1.5">
                <Lock size={12} className="text-warning" />
                <span>RIG KIOSK LOCKED</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-warning-soft text-xs uppercase font-mono tracking-wider">
                Driller Mode
              </span>
            </div>
            <p className="text-muted text-xs leading-tight">
              Office planning &amp; analytics tools are locked to prevent wellsite interference.
            </p>
            <button
              onClick={() => login(PRESET_PERSONAS[0], '/map')}
              className="w-full mt-1 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-ink font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Unlock size={11} />
              <span>Switch to HQ View (Unlock)</span>
            </button>
          </div>
        )}

        {/* Grouped Navigation Items */}
        <nav aria-label="Main navigation" className="sidebar-nav flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-1">

              {/* Subtle architectural separator before groups 2 & 3 */}
              {groupIdx > 0 && (
                <div className="pt-2 border-t border-line my-1" />
              )}

              {/* Group Header */}
              {expanded ? (
                <div className="px-2.5 pt-2 pb-1 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted select-none">
                    {group.title}
                  </span>
                </div>
              ) : (
                groupIdx > 0 && <div className="border-t border-line my-2" />
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
                          isItemLocked ? "text-muted" : (active ? "text-accent" : "text-muted group-hover:text-secondary")
                        )}
                      />

                      {expanded && (
                        <div className="flex items-center justify-between flex-1 overflow-hidden">
                          <span className={cn("truncate", isItemLocked && "text-muted opacity-75")}>{item.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isItemLocked ? (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-surface-muted border border-warning/25 text-warning/90 font-bold flex items-center gap-1">
                                <Lock size={9} /> Locked
                              </span>
                            ) : (
                              item.badge && (
                                <span className={cn("text-xs px-1.5 py-0.5 rounded", item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )
                            )}
                            <span className="text-xs text-muted font-mono hidden group-hover:inline">
                              {item.shortcut}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Collapsed Tooltip */}
                      {!expanded && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-surface border border-line text-ink text-xs rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                          <div className="font-bold flex items-center gap-1.5">
                            {isItemLocked && <Lock size={12} className="text-warning" />}
                            <span>{item.name}</span>
                            {isItemLocked && <span className="text-warning text-xs">(Rig Locked)</span>}
                          </div>
                          <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
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
                        className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative cursor-pointer text-muted hover:text-warning hover:bg-warning-soft border-l-[3px] border-transparent"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      title={item.name}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all group relative cursor-pointer",
                        active
                          ? "bg-brand/15 text-accent border border-accent/40 font-semibold shadow-sm"
                          : "text-muted hover:text-secondary hover:bg-surface-muted border border-transparent font-medium"
                      )}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>

            </div>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="sidebar-footer p-3 border-t border-line bg-surface space-y-2">
          {expanded && (
            <div className="flex items-center justify-between text-xs bg-surface px-2.5 py-1.5 rounded-lg border border-line">
              <span className="text-muted flex items-center gap-1.5 font-medium">
                <ShieldCheck size={12} className="text-success" />
                PRIVATE NETWORK
              </span>
              <span className="text-accent font-medium">Local &amp; Secure</span>
            </div>
          )}

          {/* User Profile Card */}
          <div
            className="flex items-center justify-between p-2 rounded-lg bg-surface hover:bg-surface-muted border border-line transition-all group shadow-sm"
          >
            <div
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer"
              title="Click to Switch User Profile"
            >
              <div className="w-7 h-7 rounded-full bg-brand text-accent flex items-center justify-center text-xs font-bold shrink-0 border border-accent/50 shadow-sm">
                {currentUser.initials}
              </div>
              {expanded && (
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-xs font-bold text-ink truncate leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-xs text-muted font-medium truncate leading-tight mt-0.5">
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
                className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
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
          <div className="bg-surface border border-line rounded-lg max-w-sm w-full p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-accent" />
                <h3 className="text-sm font-bold text-ink">OIL INDIA PERSONA SELECTOR</h3>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-muted hover:text-ink text-xs cursor-pointer"></button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-muted text-xs uppercase font-semibold">Active Drilling Persona:</span>

              {PRESET_PERSONAS.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    login(u);
                    setShowUserModal(false);
                  }}
                  className={cn(
                    "p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
                    currentUser.name === u.name ? "bg-brand/20 border-accent text-ink" : "bg-surface border-line text-secondary hover:bg-surface-muted"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-surface-muted border border-line flex items-center justify-center font-bold text-xs text-accent">
                    {u.initials}
                  </div>
                  <div>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-xs text-muted">{u.role}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-line flex gap-2">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  logout();
                }}
                className="flex-1 py-2 bg-danger-soft hover:bg-danger-soft border border-danger/25 text-danger text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 bg-surface-muted hover:bg-surface-muted border border-line text-secondary text-xs font-medium rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-surface border border-warning/25 rounded-lg max-w-md w-full p-6 space-y-4 shadow-md relative">
            <button
              onClick={() => setLockedModalItem(null)}
              className="absolute top-4 right-4 text-muted hover:text-ink p-1 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-soft border border-warning/25 flex items-center justify-center text-warning shrink-0">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink tracking-wide uppercase font-mono">
                    Rig Terminal Restricted
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-warning-soft border border-warning/25 text-warning font-bold">
                    OISD-STD-174
                  </span>
                </div>
                <p className="text-xs text-warning/90 font-medium">
                  {lockedModalItem.name} is locked in Rig Floor mode.
                </p>
              </div>
            </div>

            <div className="bg-surface-muted border border-line rounded-lg p-3.5 text-xs text-secondary space-y-2">
              <p className="text-secondary leading-relaxed text-xs">
                Under <strong className="text-warning">OISD-STD-174 Well Control Guidelines</strong>, active rig floor touchscreens are restricted strictly to real-time mud telemetry, gas kick detection, and emergency shut-in procedures.
              </p>
              <p className="text-muted leading-relaxed text-xs">
                Office engineering, multi-well correlation, and AI chat interfaces are locked to prevent operational distraction during active drilling on <strong className="text-ink">OIL-RIG-04</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => {
                  const targetHref = lockedModalItem.href;
                  setLockedModalItem(null);
                  login(PRESET_PERSONAS[0], targetHref);
                }}
                className="flex-1 py-2.5 px-3 bg-brand hover:bg-brand-hover border border-accent/40 text-ink text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Unlock size={14} />
                <span>Unlock &amp; Switch to HQ View</span>
              </button>
              <button
                onClick={() => setLockedModalItem(null)}
                className="py-2.5 px-4 bg-surface-muted hover:bg-surface-muted border border-line text-secondary text-xs font-medium rounded-lg transition-colors cursor-pointer"
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
