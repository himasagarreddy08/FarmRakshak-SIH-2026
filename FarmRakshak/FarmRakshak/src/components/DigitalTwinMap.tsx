import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin } from 'lucide-react';
import { AppLanguage, TRANSLATIONS } from '../lib/translations';

export type PartitionMapData = {
  id: string;
  name: string;
  crop: string;
  stage: string;
  area: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  soilMoisture: number;
  boundary?: [number, number][];
  center?: [number, number];
};

export type DigitalTwinMapProps = {
  farmName?: string;
  farmLocation?: string;
  centerCoordinates?: [number, number];
  farmBoundary?: [number, number][];
  partitions: PartitionMapData[];
  selectedPartitionId?: string;
  onSelectPartition?: (id: string) => void;
  role?: 'Farmer' | 'Educator' | 'Authority' | 'Administrator';
  height?: string | number;
  interactive?: boolean;
  t?: (key: string) => string;
};

// Default Nandgaon Farm Coordinates & Boundaries
const DEFAULT_CENTER: [number, number] = [18.6720, 74.2455];

const DEFAULT_FARM_BOUNDARY: [number, number][] = [
  [18.6745, 74.2420],
  [18.6748, 74.2485],
  [18.6695, 74.2490],
  [18.6690, 74.2425],
];

const DEFAULT_PARTITION_BOUNDARIES: Record<string, [number, number][]> = {
  'field-01': [
    [18.6725, 74.2420],
    [18.6745, 74.2420],
    [18.6748, 74.2455],
    [18.6725, 74.2455],
  ],
  'field-02': [
    [18.6690, 74.2425],
    [18.6725, 74.2420],
    [18.6725, 74.2455],
    [18.6695, 74.2455],
  ],
  'field-03': [
    [18.6725, 74.2455],
    [18.6748, 74.2485],
    [18.6710, 74.2490],
    [18.6700, 74.2460],
  ],
  'field-04': [
    [18.6695, 74.2455],
    [18.6725, 74.2455],
    [18.6700, 74.2490],
    [18.6690, 74.2485],
  ],
};

const REGIONAL_HOTSPOTS = [
  { name: 'Nashik / Nandgaon', coords: [18.672, 74.245] as [number, number], risk: 'High', threat: 'Leaf Spot + Rain Risk', crop: 'Cotton & Tomato' },
  { name: 'Ahmednagar / Rahuri', coords: [19.392, 74.651] as [number, number], risk: 'Medium', threat: 'Sucking Pest Alert', crop: 'Vegetables' },
  { name: 'Pune / Baramati', coords: [18.151, 74.577] as [number, number], risk: 'Low', threat: 'Stable Moisture', crop: 'Sugarcane' },
  { name: 'Aurangabad / Paithan', coords: [19.480, 75.380] as [number, number], risk: 'Medium', threat: 'Dry Spell Warning', crop: 'Pulses' },
];

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  farmName = 'Nandgaon Farm',
  farmLocation = 'Nandgaon, Maharashtra (18.672° N, 74.245° E)',
  centerCoordinates = DEFAULT_CENTER,
  farmBoundary = DEFAULT_FARM_BOUNDARY,
  partitions = [],
  selectedPartitionId,
  onSelectPartition,
  role = 'Farmer',
  height = 420,
  interactive = true,
  t: propT,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<L.TileLayer | null>(null);

  const currentLang = (typeof localStorage !== 'undefined' ? localStorage.getItem('farmrakshak-language') : 'en') as AppLanguage || 'en';
  const t = propT || ((key: string) => {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: role === 'Authority' ? [19.0, 74.8] : centerCoordinates,
      zoom: role === 'Authority' ? 8 : 16,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive ? 'center' : false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerCoordinates, role, interactive]);

  // Update Base Tile Layer (Esri World Imagery Genuine Satellite vs OpenStreetMap)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeLayer) {
      map.removeLayer(activeLayer);
    }

    let newLayer: L.TileLayer;
    if (mapType === 'satellite') {
      newLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
      });
    } else {
      newLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      });
    }

    newLayer.addTo(map);
    setActiveLayer(newLayer);
  }, [mapType]);

  // Draw Polygons, Markers & Hotspots
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing non-tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon || layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    if (role === 'Authority') {
      // Draw Regional Hotspots across Maharashtra
      REGIONAL_HOTSPOTS.forEach((spot) => {
        const color = spot.risk === 'High' ? '#ef4444' : spot.risk === 'Medium' ? '#f59e0b' : '#10b981';
        const circle = L.circle(spot.coords, {
          radius: 18000,
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 180px;">
            <strong style="font-size: 14px; color: #1e293b;">${spot.name}</strong><br/>
            <span style="font-size: 12px; color: #64748b;">Dominant: ${spot.crop}</span><br/>
            <div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; background: ${color}20; color: ${color}; font-weight: 600; font-size: 11px;">
              ${t('dashboard.risk')}: ${spot.risk} · ${spot.threat}
            </div>
          </div>
        `);
      });
      return;
    }

    // 1. Outer Farm Boundary
    if (farmBoundary && farmBoundary.length > 0) {
      L.polygon(farmBoundary, {
        color: '#f8fafc',
        weight: 2.5,
        dashArray: '4, 4',
        fill: false,
      }).addTo(map);
    }

    // 2. Partition Polygons with Risk-Adaptive Styling
    partitions.forEach((partition) => {
      const boundary = partition.boundary || DEFAULT_PARTITION_BOUNDARIES[partition.id] || DEFAULT_FARM_BOUNDARY;
      const isSelected = partition.id === selectedPartitionId;

      const fillColor =
        partition.riskLevel === 'High'
          ? '#ef4444'
          : partition.riskLevel === 'Medium'
          ? '#f59e0b'
          : '#10b981';

      const poly = L.polygon(boundary, {
        color: isSelected ? '#ffffff' : fillColor,
        weight: isSelected ? 3.5 : 2,
        fillColor,
        fillOpacity: isSelected ? 0.55 : 0.32,
      }).addTo(map);

      // Popup & Tooltip
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 190px; color: #0f172a;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 14px;">${partition.name}</strong>
            <span style="background: ${fillColor}; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px;">
              ${partition.riskLevel} ${t('fields.riskSuffix')}
            </span>
          </div>
          <div style="font-size: 12px; color: #475569; margin: 4px 0 8px;">
            🌾 <strong>${partition.crop}</strong> (${partition.stage})<br/>
            📐 ${t('fields.area')}: ${partition.area} ${t('common.acres')}<br/>
            💧 ${t('weather.soilMoisture')}: ${partition.soilMoisture}%
          </div>
          <button id="btn-select-${partition.id}" style="width: 100%; background: #064e3b; color: #fff; border: 0; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold;">
            ${isSelected ? t('digitalTwin.activeField') : t('digitalTwin.selectPartition')}
          </button>
        </div>
      `;

      poly.bindPopup(popupHtml);

      poly.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${partition.id}`);
        if (btn && onSelectPartition) {
          btn.onclick = () => {
            onSelectPartition(partition.id);
            map.closePopup();
          };
        }
      });

      poly.on('click', () => {
        if (onSelectPartition) {
          onSelectPartition(partition.id);
        }
      });
    });

    // 3. IoT Probe & Node Markers
    const probeIcon = L.divIcon({
      className: 'twin-probe-icon',
      html: `<div style="background: #0284c7; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: grid; place-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); color: white; font-size: 11px;">💧</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const weatherIcon = L.divIcon({
      className: 'twin-weather-icon',
      html: `<div style="background: #0d9488; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: grid; place-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); color: white; font-size: 11px;">🌤️</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([18.6730, 74.2435], { icon: probeIcon })
      .addTo(map)
      .bindTooltip(`${t('digitalTwin.sensorProbe')} #01 · North Block (31% ${t('fields.moisture')})`, { direction: 'top' });

    L.marker([18.6715, 74.2470], { icon: probeIcon })
      .addTo(map)
      .bindTooltip(`${t('digitalTwin.sensorProbe')} #02 · East Terrace (42% ${t('fields.moisture')})`, { direction: 'top' });

    L.marker([18.6740, 74.2475], { icon: weatherIcon })
      .addTo(map)
      .bindTooltip(`${t('digitalTwin.weatherStation')} · Nandgaon`, { direction: 'top' });

  }, [partitions, selectedPartitionId, farmBoundary, role, onSelectPartition, t]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid hsl(var(--border))',
        perspective: '1200px',
      }}
    >
      {/* Map Container with 3D Perspective Tilt Toggle */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          background: '#1e293b',
          zIndex: 1,
          transform: is3DMode ? 'rotateX(26deg) scale(1.04)' : 'none',
          transformOrigin: '50% 80%',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Map Controls Header Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 400,
        }}
      >
        {/* Title Tag */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#f8fafc',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
          }}
        >
          <MapPin size={14} color="#34d399" />
          <span>{farmName}</span>
          <span style={{ opacity: 0.6, fontSize: 11 }}>· {role === 'Authority' ? t('digitalTwin.stateScope') : t('digitalTwin.activeTwin')}</span>
        </div>

        {/* 3D Tilt & Satellite / Topo Layer Switcher */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: 3,
            borderRadius: 8,
            display: 'flex',
            gap: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
          }}
        >
          {/* 3D Terrain Toggle */}
          <button
            type="button"
            onClick={() => setIs3DMode(!is3DMode)}
            style={{
              background: is3DMode ? '#10b981' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              border: 0,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{is3DMode ? '3D Perspective' : '2D Top-Down'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType('satellite')}
            style={{
              background: mapType === 'satellite' ? '#059669' : 'transparent',
              color: '#ffffff',
              border: 0,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Layers size={12} />
            <span>{t('digitalTwin.satellite')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMapType('street')}
            style={{
              background: mapType === 'street' ? '#059669' : 'transparent',
              color: '#ffffff',
              border: 0,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('digitalTwin.osm')}
          </button>
        </div>
      </div>

      {/* Bottom Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          color: '#f8fafc',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 400,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981' }} />
          <span>{t('digitalTwin.lowRisk')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
          <span>{t('digitalTwin.medRisk')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} />
          <span>{t('digitalTwin.highRisk')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 10 }}>
          <span>{t('digitalTwin.probeLegend')}</span>
          <span>{t('digitalTwin.nodeLegend')}</span>
        </div>
      </div>
    </div>
  );
};
