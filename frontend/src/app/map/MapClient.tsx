'use client';

import './leaflet.css';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import {
  AlertCircle, MapPin, Search, ShieldCheck, Compass, Layers,
  ExternalLink, Crosshair, ChevronRight, Navigation, RefreshCw,
  ZoomIn, ZoomOut, Calendar, Clock, AlertTriangle, CheckCircle2,
  Info, Activity, Gauge
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

// Leaflet & Well Types
type OffsetWell = {
  id: string;
  name: string;
  field: string | null;
  block?: string;
  status: string;
  lat: number;
  lon: number;
  distance_km: number | string;
  td_depth_md?: number;
  current_depth_md_m?: number;
  target_depth_md_m?: number;
  primary_hazard?: string;
  well_type?: string;
  rig?: string;
  spud_date?: string;
  total_npt_hrs?: number;
  mud_weight_ppg?: number;
};

type AllWell = {
  id: string;
  name: string;
  field: string;
  block?: string;
  status: string;
  lat: number;
  lon: number;
  td_depth_md: number;
  target_depth_md_m: number;
  current_depth_md_m: number;
  primary_hazard?: string;
  current_formation?: string;
  well_type?: string;
  rig?: string;
  spud_date?: string;
  total_npt_hrs?: number;
  mud_weight_ppg?: number;
};

type NearbyResponse = {
  center: { lat: number; lon: number };
  radius_km: number;
  count: number;
  offset_wells: OffsetWell[]
};

// Plain English Risk Level Helper
function getRiskDetails(well: any) {
  const status = (well.status || '').toUpperCase();
  const hazard = (well.primary_hazard || '').toLowerCase();
  const npt = Number(well.total_npt_hrs || 0);

  if (status.includes('CRITICAL') || hazard.includes('blowout') || hazard.includes('uncontrolled') || npt > 500) {
    return {
      level: 'HIGH RISK',
      shortLabel: 'High Risk',
      summary: 'Severe Gas Blowout / Fire Hazard',
      color: '#ef4444',
      markerColor: '#ef4444',
      badgeClass: 'bg-danger-soft text-danger border-danger/25'
    };
  }
  if (status.includes('ACTIVE')) {
    return {
      level: 'ACTIVE DRILLING',
      shortLabel: 'Active Now',
      summary: 'Currently Drilling (Bit Rotating)',
      color: '#10b981',
      markerColor: '#10b981',
      badgeClass: 'bg-success-soft text-success border-success/25 '
    };
  }
  if (hazard.includes('sticking') || hazard.includes('stuck') || hazard.includes('loss') || hazard.includes('kick') || hazard.includes('caving') || hazard.includes('breakout') || hazard.includes('pack-off') || npt > 50) {
    return {
      level: 'MEDIUM RISK',
      shortLabel: 'Medium Risk',
      summary: 'Pipe Stuck or Mud Leak Issue',
      color: '#f59e0b',
      markerColor: '#f59e0b',
      badgeClass: 'bg-warning-soft text-warning border-warning/25'
    };
  }
  return {
    level: 'LOW RISK',
    shortLabel: 'Low Risk',
    summary: 'Standard Normal Drilling (Safe)',
    color: '#285b89',
    markerColor: '#285b89',
    badgeClass: 'bg-accent-soft text-accent border-accent/25'
  };
}

// Plain English Hazard Simplifier (Eliminates confusing jargon)
function getPlainHazardText(hazard?: string): string {
  if (!hazard) return 'Standard normal drilling. No major historical accidents reported.';
  const lower = hazard.toLowerCase();
  if (lower.includes('blowout')) {
    return 'Severe gas blowout & rig fire disaster (May 2020) — high-pressure gas escaped deep reservoir.';
  }
  if (lower.includes('differential sticking') || lower.includes('stuck pipe')) {
    return 'Drill pipe got stuck in sticky swelling clay. Required weeks of pipe retrieval operations.';
  }
  if (lower.includes('lost circulation') || lower.includes('mud losses') || lower.includes('thief zone')) {
    return 'Drilling fluid leaked away into porous sandstone cracks. Needed special sealing mud.';
  }
  if (lower.includes('gas kick') || lower.includes('gas influx')) {
    return 'High-pressure gas suddenly surged up the wellbore. Required immediate heavy kill mud.';
  }
  if (lower.includes('pack-off') || lower.includes('caving') || lower.includes('tight hole')) {
    return 'Loose gravel fragments collapsed into the hole, jamming the rotating drill bit.';
  }
  if (lower.includes('breakout') || lower.includes('overpressure')) {
    return 'Wellbore walls collapsed under extreme underground tectonic pressures.';
  }
  return hazard;
}

// Human-friendly Construction Date Formatter
function getConstructionYear(dateStr?: string): string {
  if (!dateStr) return 'Historical Well';
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const currentYear = 2026;
    const diff = currentYear - year;
    if (diff <= 0) return `Constructed: ${year} (Active Campaign)`;
    if (diff === 1) return `Constructed: ${year} (1 yr ago)`;
    return `Constructed: ${year} (${diff} yrs ago)`;
  } catch {
    return `Constructed: ${dateStr}`;
  }
}

// Master Field Locations Dictionary for 100% Synchronized Map & List Views
const FIELD_LOCATIONS: Record<string, { lat: string; lon: string; desc: string }> = {
  Moran: { lat: '27.4853', lon: '95.3456', desc: 'Active Rig-04 Location (Well MORAN-29)' },
  Baghjan: { lat: '27.6012', lon: '95.4215', desc: 'Historical Blowout Zone (Well BAGHJAN-5)' },
  Naharkatiya: { lat: '27.2845', lon: '95.3567', desc: 'Main Producing Trend (Well NHK-162)' },
  Duliajan: { lat: '27.3712', lon: '95.3045', desc: 'Oil India Limited Headquarters' },
  Digboi: { lat: '27.3930', lon: '95.6180', desc: 'Heritage Oilfield Anticline (Well DGB-1001)' },
  Hugrijan: { lat: '27.3560', lon: '95.3210', desc: 'Tipam Formation Trend (Well HGJ-48)' },
  Lakwa: { lat: '26.9320', lon: '94.8850', desc: 'ONGC Assam Asset (Well LK-112)' },
  Rudrasagar: { lat: '26.9710', lon: '94.9350', desc: 'Historical Barail Field (Well RDS-25)' },
};

const FIELDS_LIST = ['ALL', 'Moran', 'Naharkatiya', 'Baghjan', 'Duliajan', 'Hugrijan', 'Lakwa', 'Rudrasagar', 'Digboi'];

function createMapTileLayer(L: any, mode: 'dark' | 'satellite' | 'street') {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // 1. If free Mapbox API token is provided, use ultra-HD 4K vector / satellite / outdoors
  if (mapboxToken && mapboxToken.trim().length > 10) {
    if (mode === 'satellite') {
      return L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
        { attribution: '&copy; Mapbox &copy; Maxar', tileSize: 512, zoomOffset: -1, maxZoom: 20 }
      );
    }
    if (mode === 'street') {
      return L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
        { attribution: '&copy; Mapbox &copy; OpenStreetMap', tileSize: 512, zoomOffset: -1, maxZoom: 20 }
      );
    }
    return L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
      { attribution: '&copy; Mapbox &copy; OpenStreetMap', tileSize: 512, zoomOffset: -1, maxZoom: 20 }
    );
  }

  // 2. Best-in-Class 100% Free Providers (Zero API Key Required)
  if (mode === 'satellite') {
    // Ultra-crisp Esri World Imagery + Hybrid Boundaries & Highway/Town Labels
    const sat = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri, Maxar, Earthstar Geographics', maxZoom: 19 }
    );
    const ref = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );
    return L.layerGroup([sat, ref]);
  }

  if (mode === 'street') {
    // Esri World Topographic Map (Elevation contours & rivers - 100% free, ZERO watermark, NO API key)
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri, USGS, NOAA', maxZoom: 18 }
    );
  }

  // Dark Ops: Esri World Dark Gray Base + Reference (High-contrast, 100% free, ZERO watermark, NO API key)
  const baseDark = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    { attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap', maxZoom: 16 }
  );
  const refDark = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 16 }
  );
  return L.layerGroup([baseDark, refDark]);
}

export default function MapClient() {
  const [latitude, setLatitude] = useState('27.4853');
  const [longitude, setLongitude] = useState('95.3456');
  const [radius, setRadius] = useState('25');
  const [result, setResult] = useState<NearbyResponse | null>(null);
  const [allWells, setAllWells] = useState<AllWell[]>([]);
  const [selectedWell, setSelectedWell] = useState<AllWell | OffsetWell | null>(null);
  const [fieldFilter, setFieldFilter] = useState<string>('ALL');
  const [tileLayer, setTileLayer] = useState<'dark' | 'satellite' | 'street'>('satellite');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const circleLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // 1. Fetch all wells on mount
  useEffect(() => {
    async function fetchAllWells() {
      try {
        const res = await api<{ total: number; wells: AllWell[] }>('/api/wells');
        if (res?.wells) {
          setAllWells(res.wells);
        }
      } catch (err) {
        console.error('Failed to load all wells for map:', err);
      }
    }
    fetchAllWells();
    executeSearch('27.4853', '95.3456', '25', false);
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;


      if (!isMounted || !mapContainerRef.current) return;

      // Centered on Moran Field (Active Rig-04 Location)
      const map = L.map(mapContainerRef.current, {
        center: [27.4853, 95.3456],
        zoom: 11,
        minZoom: 6,
        maxZoom: 18,
        zoomControl: false,
        scrollWheelZoom: false // Activated dynamically only when mouse is over map canvas
      });

      // Default Satellite Layer (First in sequence)
      const initialLayer = createMapTileLayer(L, 'satellite');
      initialLayer.addTo(map);
      tileLayerRef.current = initialLayer;

      // Layers group
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      const circleLayer = L.layerGroup().addTo(map);
      circleLayerRef.current = circleLayer;

      // Map background click: set custom coordinates and search
      map.on('click', (e: any) => {
        const lat = e.latlng.lat.toFixed(4);
        const lon = e.latlng.lng.toFixed(4);
        setLatitude(lat);
        setLongitude(lon);
        executeSearch(lat, lon, radius, false);
      });

      mapInstanceRef.current = map;
      setMapReady(true);

      // Invalidate size to guarantee exact centering inside flex canvas
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Switch Tile Layer (Dark Ops / Satellite / Terrain Topo)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((module) => {
      const L = module.default;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const newTile = createMapTileLayer(L, tileLayer);
      newTile.addTo(map);
      tileLayerRef.current = newTile;
    });
  }, [tileLayer, mapReady]);

  // 4. Update Markers & Radius Circle on Data Change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const circleLayer = circleLayerRef.current;

    import('leaflet').then((module) => {
      const L = module.default;
      markersLayer.clearLayers();
      circleLayer.clearLayers();

      const centerLat = parseFloat(latitude) || 27.4853;
      const centerLon = parseFloat(longitude) || 95.3456;
      const radiusKm = parseFloat(radius) || 25;

      // Draw Search Radius Circle with Glow
      const circle = L.circle([centerLat, centerLon], {
        radius: radiusKm * 1000,
        color: '#285b89',
        weight: 2,
        dashArray: '5, 8',
        fillColor: '#0891b2',
        fillOpacity: 0.12
      });
      circleLayer.addLayer(circle);

      // Center search origin marker (rendered when user drops pin at custom location)
      const isCustomSearch = Math.abs(centerLat - 27.4853) > 0.002 || Math.abs(centerLon - 95.3456) > 0.002;
      if (isCustomSearch) {
        const centerIcon = L.divIcon({
          className: 'custom-center-marker',
          html: `
            <div style="position:relative; width:26px; height:26px;">
              <div style="position:absolute; inset:0; border-radius:50%; background:var(--ui-accent); opacity:0.4; "></div>
              <div style="position:absolute; inset:4px; border-radius:50%; background:var(--ui-accent); border:2.5px solid #ffffff; "></div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        circleLayer.addLayer(L.marker([centerLat, centerLon], { icon: centerIcon, zIndexOffset: 1000 }));
      }

      // Wells to render: filtered by fieldFilter
      const wellsToRender = allWells.filter((w) => fieldFilter === 'ALL' || w.field?.toLowerCase() === fieldFilter.toLowerCase());

      wellsToRender.forEach((w) => {
        if (!w.lat || !w.lon) return;

        const risk = getRiskDetails(w);
        const isActive = w.status === 'ACTIVE DRILLING';

        const markerHtml = isActive
          ? `
          <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; width:120px; pointer-events:auto;">
            <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; inset:-4px; border-radius:50%; background:var(--ui-accent); opacity:0.35; "></div>
              <div style="width:24px; height:24px; border-radius:50%; background:var(--ui-surface); border:2px solid var(--ui-accent);  display:flex; align-items:center; justify-content:center;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ui-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M7 22l5-18 5 18M5 14h14M7 8h10"/>
                </svg>
              </div>
            </div>
            <div style="font-size:11px; font-weight:700; color:var(--ui-accent); background:var(--ui-surface); padding:1.5px 6px; border-radius:4px; border:1px solid var(--ui-accent); white-space:nowrap; margin-top:2px; box-shadow:0 2px 8px rgba(0,0,0,0.95); font-family:var(--font-inter),sans-serif; display:flex; align-items:center; gap:3px;">
              <span style="width:5px; height:5px; border-radius:50%; background:#10B981; display:inline-block;"></span>
              ${w.name} (RIG-04)
            </div>
          </div>
          `
          : `
          <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; width:100px; pointer-events:auto;">
            <div style="
              width:22px; height:22px; border-radius:50%;
              background:var(--ui-surface); border:2px solid ${risk.color};
              box-shadow: 0 0 12px ${risk.color};
              display:flex; align-items:center; justify-content:center;
            ">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${risk.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <circle cx="12" cy="12" r="3" fill="${risk.color}"/>
              </svg>
            </div>
            <div style="font-size:11px; font-weight:700; color:var(--ui-ink); background:var(--ui-surface); padding:1px 5px; border-radius:3px; border:1px solid ${risk.color}99; white-space:nowrap; margin-top:2px; box-shadow:0 2px 6px rgba(0,0,0,0.9); font-family:var(--font-inter),sans-serif;">
              ${w.id || w.name}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: `well-marker-${w.id}`,
          html: markerHtml,
          iconSize: [isActive ? 120 : 100, 44],
          iconAnchor: [isActive ? 60 : 50, 12]
        });

        const marker = L.marker([w.lat, w.lon], { icon }).addTo(markersLayer);

        // Informative Hover Tooltip with Construction Year & Plain Risk
        marker.bindTooltip(
          `<div style="font-family:sans-serif; font-size:11px; padding:4px 6px; line-height:1.4;">
            <div style="font-weight:bold; color:var(--ui-ink); font-size:12px;">${w.name} (${w.field})</div>
            <div style="color:${risk.color}; font-weight:600; font-size:10px; margin-top:1px;">● ${risk.level}</div>
            <div style="color:var(--ui-muted); font-size:10px;">${getConstructionYear(w.spud_date)}</div>
          </div>`,
          { direction: 'top', offset: [0, -12], className: 'custom-leaflet-tooltip' }
        );

        // Click handler: opens detailed floating card without resetting search coordinates
        marker.on('click', (e: any) => {
          if (e) {
            L.DomEvent.stopPropagation(e);
          }
          setSelectedWell(w);
          map.setView([w.lat, w.lon], Math.max(map.getZoom(), 12), { animate: true });
        });
      });
    });
  }, [allWells, fieldFilter, latitude, longitude, radius, mapReady]);

  // Execute offset proximity query
  async function executeSearch(latVal: string, lonVal: string, radVal: string, autoFit: boolean = true) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ lat: latVal, lon: lonVal, radius_km: radVal });
      const res = await api<NearbyResponse>(`/api/wells/nearby?${params}`);
      setResult(res);

      // Auto-fit map to show search circle and all offset wells cleanly
      if (autoFit && mapInstanceRef.current) {
        import('leaflet').then((module) => {
          const L = module.default;
          const latNum = parseFloat(latVal);
          const lonNum = parseFloat(lonVal);
          const radNum = parseFloat(radVal);
          if (!isNaN(latNum) && !isNaN(lonNum)) {
            const bounds = L.latLng(latNum, lonNum).toBounds(radNum * 1000 * 1.15);
            mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
          }
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not retrieve offset wells.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    executeSearch(latitude, longitude, radius, true);
  }

  // 100% Synchronized Location Picker (Updates coordinates, map center, search circle, and filters list)
  function handleSelectField(fieldName: string) {
    setFieldFilter(fieldName);
    setSelectedWell(null);

    if (fieldName === 'ALL') {
      // Re-center on active Moran rig location
      setLatitude('27.4853');
      setLongitude('95.3456');
      executeSearch('27.4853', '95.3456', radius, true);
    } else if (FIELD_LOCATIONS[fieldName]) {
      const loc = FIELD_LOCATIONS[fieldName];
      setLatitude(loc.lat);
      setLongitude(loc.lon);
      executeSearch(loc.lat, loc.lon, radius, true);
    }
  }

  function handleResetView() {
    handleSelectField('ALL');
  }

  function focusWell(w: AllWell | OffsetWell) {
    setSelectedWell(w);
    if (mapInstanceRef.current && w.lat && w.lon) {
      mapInstanceRef.current.setView([w.lat, w.lon], 13, { animate: true });
    }
  }

  // Synchronized Offset Wells: filtered by the active fieldFilter
  const displayedOffsets = (result?.offset_wells || []).filter((w) => {
    if (fieldFilter === 'ALL') return true;
    return w.field?.toLowerCase() === fieldFilter.toLowerCase();
  });

  return (
    <div className="min-h-full flex flex-col space-y-3.5 font-sans text-secondary pb-8">

      {/* 1. Top Controls Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-line shadow-sm rounded-lg relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success " />
            <h1 className=" font-bold tracking-tight text-ink flex items-center gap-2 page-title">
              <Compass className="text-accent" size={19} />
              Geospatial Well Intelligence Map
            </h1>
          </div>
          <span className="hidden md:inline text-xs px-2.5 py-1 rounded-full bg-surface-muted/60 text-secondary border border-line/60 font-medium">
            Upper Assam Basin · 18 Wells Mapped
          </span>
        </div>

        {/* Layer Switcher & Re-Center View */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center bg-surface-muted border border-line rounded-lg p-1 shadow-inner gap-0.5">
            <button
              onClick={() => setTileLayer('satellite')}
              title="Real Surface View: Aerial photos of drill pads, tea gardens, forests, and villages"
              className={`px-3 py-1 rounded-lg transition-all ${tileLayer === 'satellite' ? 'bg-brand text-ink font-bold shadow-md' : 'text-muted hover:text-ink'}`}
            >
              Satellite
            </button>
            <button
              onClick={() => setTileLayer('dark')}
              title="24/7 Control Room View: High contrast to clearly track well risks & radius circle"
              className={`px-3 py-1 rounded-lg transition-all ${tileLayer === 'dark' ? 'bg-brand text-ink font-bold shadow-md' : 'text-muted hover:text-ink'}`}
            >
              Dark Ops
            </button>
            <button
              onClick={() => setTileLayer('street')}
              title="Flood & Elevation View: River drainage and contour heights for monsoon safety"
              className={`px-3 py-1 rounded-lg transition-all ${tileLayer === 'street' ? 'bg-brand text-ink font-bold shadow-md' : 'text-muted hover:text-ink'}`}
            >
              Terrain / Topo
            </button>
          </div>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface border border-line hover:border-accent/25 text-secondary hover:text-ink transition-all shadow-md"
            title="Reset Map to Active Moran Rig-04 Position"
          >
            <Crosshair size={13} className="text-accent" />
            <span className="hidden sm:inline font-medium">Re-Center Rig-04</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Layout: 12 Cols */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* Left Column: Proximity Search & Nearby Wells List (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col space-y-3.5">

          {/* Spatial Search Form Card */}
          <div className="p-4 bg-surface border border-line rounded-lg space-y-3 shadow-sm ring-1 ring-accent/25">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Navigation size={14} className="text-accent" />
                Find Nearby Wells
              </span>
              <span className="text-xs text-muted font-medium bg-surface-muted px-2 py-0.5 rounded border border-line">Click map to set</span>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="map-latitude" className="block text-xs text-muted mb-1 font-semibold">LATITUDE (°N)</label>
                  <input id="map-latitude"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    inputMode="decimal"
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-muted border border-line text-ink tabular-nums focus:outline-none focus:border-accent/25 focus:ring-1 focus:ring-accent/25 shadow-inner"
                  />
                </div>
                <div>
                  <label htmlFor="map-longitude" className="block text-xs text-muted mb-1 font-semibold">LONGITUDE (°E)</label>
                  <input id="map-longitude"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    inputMode="decimal"
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-muted border border-line text-ink tabular-nums focus:outline-none focus:border-accent/25 focus:ring-1 focus:ring-accent/25 shadow-inner"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span>SEARCH RADIUS: <strong className="text-accent tabular-nums font-bold">{radius} km</strong></span>
                  <span className="text-xs text-muted">Max 50 km</span>
                </div>
                <input
                  aria-label="Search radius in kilometres"
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-ink text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Search size={14} />
                <span>{loading ? 'Searching Coordinates…' : 'Find Nearby Historical Wells'}</span>
              </button>
            </form>
          </div>

          {/* Synchronized Field Filter Buttons */}
          <div className="p-2.5 bg-surface border border-line rounded-lg flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar shadow-md">
            <span className="text-muted text-xs uppercase font-bold pl-1">FIELD:</span>
            {FIELDS_LIST.map((f) => (
              <button
                key={f}
                onClick={() => handleSelectField(f)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors border font-medium cursor-pointer ${
                  fieldFilter === f
                    ? 'bg-brand/30 text-ink border-accent/50 font-semibold'
                    : 'bg-surface-muted text-muted border-line hover:border-line hover:text-ink'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Detailed Nearby Wells List with Construction Year & Plain Issues */}
          <div className="bg-surface border border-line rounded-lg flex flex-col shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-line bg-surface flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {fieldFilter === 'ALL' ? `NEARBY WELLS (WITHIN ${radius} KM)` : `${fieldFilter.toUpperCase()} WELLS`}
              </span>
              <span className="text-xs tabular-nums px-2.5 py-0.5 rounded-full bg-surface-muted/60 text-secondary border border-line/60 font-semibold">
                {displayedOffsets.length} {fieldFilter === 'ALL' ? 'Wells Found' : 'Wells in Field'}
              </span>
            </div>

            {/* Scrollable Wells Container with Natural Heights */}
            <div className="overflow-y-auto max-h-[500px] p-3 space-y-2.5 text-xs">
              {loading && (
                <div className="p-8 text-center text-muted flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-accent" />
                  <span>Searching offset wells & historical logs…</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-danger-soft border border-danger/25 rounded-lg text-danger text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {!loading && displayedOffsets.length === 0 && (
                <div className="p-8 text-center text-muted">
                  <p className="font-semibold text-secondary">No {fieldFilter !== 'ALL' ? fieldFilter : ''} wells found in this search radius.</p>
                  <p className="text-xs mt-1 text-muted">Click &quot;ALL&quot; or expand the radius slider.</p>
                </div>
              )}

              {!loading && displayedOffsets.map((well) => {
                const isSelected = selectedWell?.id === well.id;
                const risk = getRiskDetails(well);
                const depth = well.current_depth_md_m ?? well.td_depth_md ?? 3200;

                return (
                  <div
                    key={well.id}
                    onClick={() => focusWell(well)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-accent-soft border-accent/25 shadow-sm  ring-1 ring-accent/25'
                        : 'bg-surface-muted border-line hover:border-accent/25 hover:bg-surface'
                    }`}
                  >
                    {/* Header: Name + Distance */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: risk.color }} />
                        <span className="font-bold text-ink text-xs">{well.name}</span>
                        <span className="text-xs text-muted font-medium">({well.field})</span>
                      </div>
                      <span className="font-bold text-accent tabular-nums text-xs bg-surface px-2 py-0.5 rounded border border-line">
                        {Number(well.distance_km).toFixed(1)} km away
                      </span>
                    </div>

                    {/* Meta: Construction Year & Depth */}
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="flex items-center gap-1 text-secondary">
                        <Calendar size={11} className="text-accent" />
                        {getConstructionYear(well.spud_date)}
                      </span>
                      <span className="tabular-nums text-secondary">
                        Depth: <strong className="text-ink">{depth}m</strong>
                      </span>
                    </div>

                    {/* Plain English Issue & Risk Badge */}
                    <div className="pt-1.5 border-t border-line flex items-start justify-between gap-2">
                      <p className="text-xs text-secondary leading-snug flex-1">
                        <strong className="text-muted font-medium">Past Issue: </strong>
                        {getPlainHazardText(well.primary_hazard)}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 border ${risk.badgeClass}`}>
                        {risk.shortLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Fullscreen Leaflet Map (8 cols) */}
        <div className="col-span-12 lg:col-span-8 relative rounded-lg overflow-hidden border border-line bg-surface-muted flex flex-col shadow-sm ring-1 ring-accent/25 min-h-[550px] lg:min-h-[720px]">

          {/* Leaflet Canvas Container */}
          <div
            ref={mapContainerRef}
            onMouseEnter={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.scrollWheelZoom.enable();
                mapInstanceRef.current.dragging.enable();
              }
            }}
            onMouseLeave={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.scrollWheelZoom.disable();
              }
            }}
            className="w-full h-full min-h-[550px] lg:min-h-[720px] z-0 cursor-grab active:cursor-grabbing"
          />

          {/* Floating Zoom Controls */}
          <div
            onMouseEnter={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.scrollWheelZoom.disable();
                mapInstanceRef.current.dragging.disable();
              }
            }}
            onMouseLeave={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.scrollWheelZoom.enable();
                mapInstanceRef.current.dragging.enable();
              }
            }}
            className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-surface/95 backdrop-blur-md border border-line rounded-lg p-1 shadow-sm"
          >
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="p-2 hover:bg-surface-muted rounded-lg text-secondary hover:text-ink transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="p-2 hover:bg-surface-muted rounded-lg text-secondary hover:text-ink transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
          </div>

          {/* Tactical Map Legend Overlay (Simple Jargon-Free Words) */}
          <div
            onMouseEnter={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.scrollWheelZoom.disable();
                mapInstanceRef.current.dragging.disable();
              }
            }}
            onMouseLeave={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.scrollWheelZoom.enable();
                mapInstanceRef.current.dragging.enable();
              }
            }}
            className="absolute bottom-4 left-4 z-10 bg-surface/95 backdrop-blur-md border border-line rounded-lg p-3 text-xs shadow-sm hidden sm:block font-sans ring-1 ring-accent/25"
          >
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Tactical Map Legend
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 text-secondary font-medium"><span className="w-2 h-2 rounded-full bg-success" /> Active Drilling Now</span>
              <span className="flex items-center gap-1.5 text-secondary font-medium"><span className="w-2 h-2 rounded-full bg-accent" /> Low Risk (Safe Well)</span>
              <span className="flex items-center gap-1.5 text-secondary font-medium"><span className="w-2 h-2 rounded-full bg-warning" /> Medium Risk (Stuck/Loss)</span>
              <span className="flex items-center gap-1.5 text-secondary font-medium"><span className="w-2 h-2 rounded-full bg-danger" /> High Risk (Kick/Blowout)</span>
            </div>
          </div>

          {/* Selected Well Intelligence Floating Card (Plain English) */}
          {selectedWell && (
            <div
              onMouseEnter={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.scrollWheelZoom.disable();
                  mapInstanceRef.current.dragging.disable();
                }
              }}
              onMouseLeave={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.scrollWheelZoom.enable();
                  mapInstanceRef.current.dragging.enable();
                }
              }}
              className="absolute top-4 left-4 z-10 max-w-sm w-full bg-surface/95 backdrop-blur-md border border-accent/25 rounded-lg p-4 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-accent/25"
            >

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getRiskDetails(selectedWell).color }} />
                  <div>
                    <h3 className="font-bold text-ink text-sm leading-none">{selectedWell.name}</h3>
                    <span className="text-xs text-muted">{selectedWell.field} Field · {selectedWell.block || 'Block I'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWell(null)}
                  className="text-muted hover:text-ink text-sm p-1 cursor-pointer"
                >

                </button>
              </div>

              {/* Key Well Parameters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-canvas rounded-lg border border-line">
                  <div className="text-xs text-muted font-medium">CONSTRUCTION</div>
                  <div className="text-secondary font-semibold">{getConstructionYear(selectedWell.spud_date)}</div>
                </div>
                <div className="p-2 bg-canvas rounded-lg border border-line">
                  <div className="text-xs text-muted font-medium">TOTAL DEPTH</div>
                  <div className="text-accent font-bold tabular-nums">{selectedWell.current_depth_md_m ?? selectedWell.td_depth_md ?? '—'} m MD</div>
                </div>
                <div className="p-2 bg-canvas rounded-lg border border-line">
                  <div className="text-xs text-muted font-medium">RISK LEVEL</div>
                  <div className="font-bold" style={{ color: getRiskDetails(selectedWell).color }}>{getRiskDetails(selectedWell).level}</div>
                </div>
                <div className="p-2 bg-canvas rounded-lg border border-line">
                  <div className="text-xs text-muted font-medium">OPERATING RIG</div>
                  <div className="text-secondary font-medium">{selectedWell.rig || 'OIL-RIG-01'}</div>
                </div>
              </div>

              {/* Plain English Past Hazard Explanation */}
              <div className="p-2.5 rounded-lg bg-canvas border border-line space-y-1">
                <div className="text-xs text-warning font-bold uppercase flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  What Happened in this Well:
                </div>
                <p className="text-xs text-secondary leading-snug">
                  {getPlainHazardText(selectedWell.primary_hazard)}
                </p>
                {selectedWell.total_npt_hrs ? (
                  <div className="text-xs text-muted mt-1">
                    Historical Drilling Delay: <strong className="text-warning tabular-nums">{selectedWell.total_npt_hrs} hours delayed</strong>
                  </div>
                ) : null}
              </div>

              {/* Coordinates & Link to Dossier */}
              <div className="pt-1 flex items-center justify-between border-t border-line/80">
                <span className="text-xs tabular-nums text-muted">
                  {selectedWell.lat.toFixed(4)}°N, {selectedWell.lon.toFixed(4)}°E
                </span>
                <Link
                  href={`/well/${selectedWell.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-ink text-xs font-semibold transition-colors shadow-md"
                >
                  <span>{selectedWell.id === 'MOR-29' ? 'Open Active Rig (MOR-29)' : `Open Dossier (${selectedWell.name})`}</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
