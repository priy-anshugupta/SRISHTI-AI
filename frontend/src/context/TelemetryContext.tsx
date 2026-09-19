'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

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
  isConnected: true,
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
  const [isConnected, setIsConnected] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);

  // Function to refresh alert badge count from API
  const refreshAlerts = useCallback(async () => {
    try {
      const res = await api<any>('/api/alerts');
      if (res && res.alerts) {
        const unread = res.alerts.filter((a: any) => !a.acknowledged).length;
        setUnreadAlertsCount(unread);
      }
    } catch {
      // ignore
    }
  }, []);

  // Poll alerts count periodically
  useEffect(() => {
    refreshAlerts();
    const alertInterval = setInterval(refreshAlerts, 10000);
    return () => clearInterval(alertInterval);
  }, [refreshAlerts]);

  // Connect to live WebSocket telemetry stream with polling fallback
  useEffect(() => {
    let pollTimer: NodeJS.Timeout | null = null;
    let isMounted = true;

    const pollFallback = async () => {
      if (!isMounted) return;
      try {
        const res = await api<any>('/api/telemetry/current');
        if (res && isMounted) {
          if (res.depth_md !== undefined) setDepthMd(res.depth_md);
          if (res.tvd_md !== undefined) setTvdMd(res.tvd_md);
          if (res.rop_m_per_hr !== undefined) setRop(res.rop_m_per_hr);
          if (res.wob_klbs !== undefined) setWob(res.wob_klbs);
          if (res.rpm !== undefined) setRpm(res.rpm);
          if (res.spp_psi !== undefined) setSpp(res.spp_psi);
          if (res.torque_ftlbs !== undefined) setTorque(res.torque_ftlbs / 1000.0);
          if (res.flow_rate_gpm !== undefined) setFlowRate(res.flow_rate_gpm);
          if (res.pit_volume_bbl !== undefined) setPitGain(res.pit_volume_bbl - 420.0);
          if (res.distance_to_hazard_m !== undefined) setHazardDistance(res.distance_to_hazard_m);
          if (res.formation) setFormation(res.formation);
          if (res.well) setWellName(res.well);
          if (res.rig) setRig(res.rig);
          if (res.field) setField(res.field);
          if (res.corridor_status) setCorridorStatus(res.corridor_status);
          if (res.physics) setPhysics(res.physics);
        }
      } catch {
        // ignore
      }
    };

    const connectWebSocket = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws/ertmac';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            if (pollTimer) clearInterval(pollTimer);
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const packet = JSON.parse(event.data);
            if (packet) {
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
            }
          } catch {
            // ignore
          }
        };

        ws.onerror = () => {
          if (isMounted) {
            setIsConnected(false);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsConnected(false);
            if (!pollTimer) {
              pollTimer = setInterval(pollFallback, 1500);
            }
          }
        };
      } catch {
        if (isMounted) {
          setIsConnected(false);
          if (!pollTimer) {
            pollTimer = setInterval(pollFallback, 1500);
          }
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, []);

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
