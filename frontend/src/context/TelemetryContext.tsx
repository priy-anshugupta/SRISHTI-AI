'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDashboardPolling } from '@/lib/useDashboardPolling';
import { ALERTS_POLL_MS, TELEMETRY_POLL_MS } from '@/lib/visiblePolling';

export interface PhysicsData {
  d_exponent: number;
  d_exponent_corrected: number;
  d_normal_trend: number;
  pore_pressure_pred_ppg: number;
  mse_psi: number;
  drilling_efficiency_pct: number;
  mse_status: string;
  ecd_ppg: number;
  delta_ecd_ppg: number;
  annular_pressure_loss_psi: number;
}

interface TelemetryPacket {
  depth_md?: number;
  tvd_md?: number;
  rop_m_per_hr?: number;
  wob_klbs?: number;
  rpm?: number;
  spp_psi?: number;
  torque_ftlbs?: number;
  flow_rate_gpm?: number;
  pit_volume_bbl?: number;
  distance_to_hazard_m?: number;
  formation?: string;
  well?: string;
  rig?: string;
  field?: string;
  corridor_status?: string;
  physics?: PhysicsData;
}

export interface TelemetryState {
  depthMd: number;
  tvdMd: number;
  rop: number;
  wob: number;
  rpm: number;
  spp: number;
  torque: number;
  flowRate: number;
  pitGain: number;
  hazardDistance: number;
  formation: string;
  wellName: string;
  rig: string;
  field: string;
  corridorStatus: string;
  physics: PhysicsData;
  unreadAlertsCount: number;
  isConnected: boolean;
  refreshAlerts: () => Promise<void>;
}

const defaultPhysics: PhysicsData = {
  d_exponent: 1.54,
  d_exponent_corrected: 1.28,
  d_normal_trend: 1.65,
  pore_pressure_pred_ppg: 11.2,
  mse_psi: 28400.0,
  drilling_efficiency_pct: 77.5,
  mse_status: 'OPTIMAL',
  ecd_ppg: 11.25,
  delta_ecd_ppg: 0.45,
  annular_pressure_loss_psi: 240.0
};

const TelemetryContext = createContext<TelemetryState>({
  depthMd: 2418.0,
  tvdMd: 2396.2,
  rop: 14.2,
  wob: 18.5,
  rpm: 120,
  spp: 2440,
  torque: 14.0,
  flowRate: 650,
  pitGain: 0.3,
  hazardDistance: 32.0,
  formation: 'Barail Group',
  wellName: 'MORAN-29',
  rig: 'OIL-RIG-04',
  field: 'Moran',
  corridorStatus: 'KICK_PRECURSOR_HORIZON',
  physics: defaultPhysics,
  unreadAlertsCount: 2,
  isConnected: false,
  refreshAlerts: async () => {}
});

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [depthMd, setDepthMd] = useState(2418.0);
  const [tvdMd, setTvdMd] = useState(2396.2);
  const [rop, setRop] = useState(14.2);
  const [wob, setWob] = useState(18.5);
  const [rpm, setRpm] = useState(120);
  const [spp, setSpp] = useState(2440);
  const [torque, setTorque] = useState(14.0);
  const [flowRate, setFlowRate] = useState(650);
  const [pitGain, setPitGain] = useState(0.3);
  const [hazardDistance, setHazardDistance] = useState(32.0);
  const [formation, setFormation] = useState('Barail Group');
  const [wellName, setWellName] = useState('MORAN-29');
  const [rig, setRig] = useState('OIL-RIG-04');
  const [field, setField] = useState('Moran');
  const [corridorStatus, setCorridorStatus] = useState('KICK_PRECURSOR_HORIZON');
  const [physics, setPhysics] = useState<PhysicsData>(defaultPhysics);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(2);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  // Historical dossiers and tools only load data on demand. The global header
  // must not keep a Render instance awake on public or non-monitoring pages.
  const isDashboard = pathname === '/doghouse' || pathname === '/alerts' || pathname === '/well/MOR-29';
  const pollingEnabled = isAuthenticated && !isLoading && isDashboard;

  // Also used after explicit acknowledge actions; it does not create a timer.
  // Function to refresh alert badge count from API
  const refreshAlerts = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api<{ alerts: { acknowledged: boolean }[] }>('/api/alerts', { signal });
      if (!signal?.aborted && res && res.alerts) {
        const unread = res.alerts.filter(a => !a.acknowledged).length;
        setUnreadAlertsCount(unread);
      }
    } catch {
      // ignore
    }
  }, []);

  useDashboardPolling(refreshAlerts, ALERTS_POLL_MS, pollingEnabled, pathname);

  const applyTelemetry = useCallback((packet: TelemetryPacket) => {
    if (packet.depth_md !== undefined) setDepthMd(packet.depth_md);
    if (packet.tvd_md !== undefined) setTvdMd(packet.tvd_md);
    if (packet.rop_m_per_hr !== undefined) setRop(packet.rop_m_per_hr);
    if (packet.wob_klbs !== undefined) setWob(packet.wob_klbs);
    if (packet.rpm !== undefined) setRpm(packet.rpm);
    if (packet.spp_psi !== undefined) setSpp(packet.spp_psi);
    if (packet.torque_ftlbs !== undefined) setTorque(packet.torque_ftlbs / 1000.0);
    if (packet.flow_rate_gpm !== undefined) setFlowRate(packet.flow_rate_gpm);
    if (packet.pit_volume_bbl !== undefined) setPitGain(packet.pit_volume_bbl - 420.0);
    if (packet.distance_to_hazard_m !== undefined) setHazardDistance(packet.distance_to_hazard_m);
    if (packet.formation) setFormation(packet.formation);
    if (packet.well) setWellName(packet.well);
    if (packet.rig) setRig(packet.rig);
    if (packet.field) setField(packet.field);
    if (packet.corridor_status) setCorridorStatus(packet.corridor_status);
    if (packet.physics) setPhysics(packet.physics);
  }, []);

  const pollTelemetry = useCallback(async (signal: AbortSignal) => {
    // A healthy dashboard stream already supplies telemetry; no duplicate HTTP polling.
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const packet = await api<TelemetryPacket>('/api/telemetry/current', { signal });
      if (!signal.aborted) {
        applyTelemetry(packet);
        setIsConnected(true);
      }
    } catch {
      if (!signal.aborted) setIsConnected(false);
    }
  }, [applyTelemetry]);

  useDashboardPolling(pollTelemetry, TELEMETRY_POLL_MS, pollingEnabled, pathname);

  // Preserve live rig replay, but only while a monitoring dashboard is visible.
  useEffect(() => {
    if (!pollingEnabled) return;
    let pageActive = true;
    let disposed = false;
    const disconnect = () => {
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        ws.close();
      }
      setIsConnected(false);
    };
    const connect = () => {
      if (disposed || !pageActive || document.visibilityState !== 'visible' || wsRef.current) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
        const origin = apiUrl || (
          ['localhost', '127.0.0.1'].includes(window.location.hostname)
            ? 'http://127.0.0.1:8000' : window.location.origin
        );
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${origin.replace(/^http/, 'ws')}/ws/ertmac`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        const isCurrent = () => !disposed && wsRef.current === ws;
        ws.onopen = () => { if (isCurrent()) setIsConnected(true); };
        ws.onmessage = event => {
          if (!isCurrent()) return;
          try {
            applyTelemetry(JSON.parse(event.data));
          } catch {
            // Ignore malformed stream packets; HTTP fallback remains available.
          }
        };
        ws.onerror = () => { if (isCurrent()) setIsConnected(false); };
        ws.onclose = () => {
          if (isCurrent()) {
            wsRef.current = null;
            setIsConnected(false);
          }
        };
      } catch {
        setIsConnected(false);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') connect();
      else disconnect();
    };
    const onPageHide = () => { pageActive = false; disconnect(); };
    const onPageShow = () => { pageActive = true; connect(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    connect();
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      disconnect();
    };
  }, [pollingEnabled, pathname, applyTelemetry]);

  return (
    <TelemetryContext.Provider
      value={{
        depthMd,
        tvdMd,
        rop,
        wob,
        rpm,
        spp,
        torque,
        flowRate,
        pitGain,
        hazardDistance,
        formation,
        wellName,
        rig,
        field,
        corridorStatus,
        physics,
        unreadAlertsCount,
        isConnected,
        refreshAlerts
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  return useContext(TelemetryContext);
}
