'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { API_BASE_URL } from '@/services/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewerProps {
  center: [number, number];
  zoom: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  rgbImage?: string;
  ndviImage?: string;
  heatmapImage?: string;
  diseaseRegions?: any[];
  onRegionClick?: (region: any) => void;
}

const SEVERITY_STYLES: Record<string, { fill: string; border: string; label: string }> = {
  critical: { fill: '#ef4444', border: '#b91c1c', label: 'Critical' },
  warning:  { fill: '#f59e0b', border: '#b45309', label: 'Warning'  },
  healthy:  { fill: '#10b981', border: '#047857', label: 'Healthy'  },
};

/** Creates a uniform filled circle SVG div-icon for every region */
function makeDotIcon(severity: string, size = 18) {
  const { fill, border } = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.healthy;
  const half = size / 2;
  // Outer ring + filled inner circle — matches the "dot grid" pattern in the screenshot
  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${fill};
      border:2.5px solid ${border};
      box-shadow:0 1px 4px rgba(0,0,0,.35);
      box-sizing:border-box;
    "></div>`;
  return L.divIcon({
    className: '',          // remove Leaflet's default white square wrapper
    html,
    iconSize:   [size, size],
    iconAnchor: [half, half],
    popupAnchor:[0, -(half + 4)],
  });
}

const MapViewer: React.FC<MapViewerProps> = ({
  center,
  zoom,
  bounds,
  rgbImage,
  ndviImage,
  heatmapImage,
  diseaseRegions = [],
  onRegionClick,
}) => {
  const mapRef   = useRef<L.Map | null>(null);
  const [currentLayer, setCurrentLayer] = useState<'rgb' | 'ndvi' | 'heatmap'>('rgb');
  const layersRef = useRef<{
    rgb?:     L.ImageOverlay;
    ndvi?:    L.ImageOverlay;
    heatmap?: L.ImageOverlay;
    regions:  L.Layer[];
  }>({ regions: [] });

  /* ─── Init map once ─── */
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map('map', { zoomControl: true }).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* ─── Image overlays ─── */
  useEffect(() => {
    if (!mapRef.current || !bounds) return;

    const imgBounds: L.LatLngBoundsExpression = [
      [bounds.minLat, bounds.minLon],
      [bounds.maxLat, bounds.maxLon],
    ];

    layersRef.current.rgb?.remove();
    layersRef.current.ndvi?.remove();
    layersRef.current.heatmap?.remove();

    if (rgbImage)     layersRef.current.rgb     = L.imageOverlay(`${API_BASE_URL}${rgbImage}`,     imgBounds, { opacity: 0.8 });
    if (ndviImage)    layersRef.current.ndvi    = L.imageOverlay(`${API_BASE_URL}${ndviImage}`,    imgBounds, { opacity: 0.8 });
    if (heatmapImage) layersRef.current.heatmap = L.imageOverlay(`${API_BASE_URL}${heatmapImage}`, imgBounds, { opacity: 0.7 });

    switchLayer(currentLayer);
    mapRef.current.fitBounds(imgBounds);
  }, [bounds, rgbImage, ndviImage, heatmapImage]);

  /* ─── Disease region dots ─── */
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    layersRef.current.regions.forEach(l => l.remove());
    layersRef.current.regions = [];

    diseaseRegions.forEach(region => {
      if (!region?.center?.coordinates) return;

      const [lon, lat] = region.center.coordinates;
      const severity   = region.severity ?? 'healthy';
      const { fill, border } = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.healthy;

      // ── Uniform filled-circle marker (no scatter "X" shape) ──
      const marker = L.marker([lat, lon], {
        icon: makeDotIcon(severity),
        // Keep markers on top of image overlays
        zIndexOffset: severity === 'critical' ? 200 : severity === 'warning' ? 100 : 0,
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:13px;line-height:1.6">
          <strong style="display:block;margin-bottom:4px">${region.region_id}</strong>
          <span style="
            display:inline-block;padding:1px 8px;border-radius:20px;font-size:11px;font-weight:600;
            background:${fill};color:#fff;margin-bottom:6px;
          ">${severity.toUpperCase()}</span><br/>
          Confidence: <strong>${(region.confidence * 100).toFixed(1)}%</strong><br/>
          Area: <strong>${region.area_hectares.toFixed(2)} ha</strong><br/>
          Anomaly score: <strong>${region.anomaly_score?.toFixed(3) ?? '—'}</strong>
        </div>
      `, { maxWidth: 220 });

      if (onRegionClick) {
        marker.on('click', () => onRegionClick(region));
      }

      layersRef.current.regions.push(marker);
    });
  }, [diseaseRegions]);

  /* ─── Layer toggle helper ─── */
  const switchLayer = (type: 'rgb' | 'ndvi' | 'heatmap') => {
    if (!mapRef.current) return;
    layersRef.current.rgb?.remove();
    layersRef.current.ndvi?.remove();
    layersRef.current.heatmap?.remove();

    if (type === 'rgb'     && layersRef.current.rgb)     layersRef.current.rgb.addTo(mapRef.current);
    if (type === 'ndvi'    && layersRef.current.ndvi)    layersRef.current.ndvi.addTo(mapRef.current);
    if (type === 'heatmap' && layersRef.current.heatmap) layersRef.current.heatmap.addTo(mapRef.current);

    setCurrentLayer(type);
  };

  /* ─── Render ─── */
  return (
    <div className="relative w-full h-full">
      {/* Map canvas */}
      <div id="map" className="w-full h-full" />

      {/* Layer toggle */}
      <div
        className="absolute top-4 right-4 z-[1000] flex gap-1 rounded-xl overflow-hidden shadow-lg"
        style={{ background: 'rgba(255,255,255,0.95)', padding: '6px' }}
      >
        {(['rgb', 'ndvi', 'heatmap'] as const).map(layer => (
          <button
            key={layer}
            onClick={() => switchLayer(layer)}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'background 0.15s',
              background: currentLayer === layer ? '#16a34a' : 'transparent',
              color:      currentLayer === layer ? '#fff'     : '#374151',
            }}
          >
            {layer.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-6 left-4 z-[1000] rounded-xl shadow-lg"
        style={{ background: 'rgba(255,255,255,0.95)', padding: '10px 14px' }}
      >
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Severity
        </p>
        {Object.entries(SEVERITY_STYLES).map(([key, { fill, label }]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: fill, border: '2px solid rgba(0,0,0,0.15)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '12px', color: '#374151' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapViewer;