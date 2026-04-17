'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { API_BASE_URL } from '@/services/api';

// Fix Leaflet default marker icon issue in Next.js/webpack
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
  const mapRef = useRef<L.Map | null>(null);
  const [currentLayer, setCurrentLayer] = useState<'rgb' | 'ndvi' | 'heatmap'>('rgb');
  const layersRef = useRef<{
    rgb?: L.ImageOverlay;
    ndvi?: L.ImageOverlay;
    heatmap?: L.ImageOverlay;
    regions: L.Layer[];
  }>({ regions: [] });

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      const map = L.map('map').setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !bounds) return;

    const imageBounds: L.LatLngBoundsExpression = [
      [bounds.minLat, bounds.minLon],
      [bounds.maxLat, bounds.maxLon],
    ];

    // Clear existing layers
    if (layersRef.current.rgb) layersRef.current.rgb.remove();
    if (layersRef.current.ndvi) layersRef.current.ndvi.remove();
    if (layersRef.current.heatmap) layersRef.current.heatmap.remove();

    // Add RGB layer
    if (rgbImage) {
      layersRef.current.rgb = L.imageOverlay(
        `${API_BASE_URL}${rgbImage}`,
        imageBounds,
        { opacity: 0.8 }
      );
    }

    // Add NDVI layer
    if (ndviImage) {
      layersRef.current.ndvi = L.imageOverlay(
        `${API_BASE_URL}${ndviImage}`,
        imageBounds,
        { opacity: 0.8 }
      );
    }

    // Add Heatmap layer
    if (heatmapImage) {
      layersRef.current.heatmap = L.imageOverlay(
        `${API_BASE_URL}${heatmapImage}`,
        imageBounds,
        { opacity: 0.7 }
      );
    }

    // Show current layer
    updateLayer(currentLayer);

    // Fit map to bounds
    mapRef.current.fitBounds(imageBounds);
  }, [bounds, rgbImage, ndviImage, heatmapImage]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing region markers
    layersRef.current.regions.forEach(layer => layer.remove());
    layersRef.current.regions = [];

    // Add disease regions
    diseaseRegions.forEach((region) => {
      if (!region.center || !region.center.coordinates) return;

      const [lon, lat] = region.center.coordinates;
      
      const color = region.severity === 'critical' ? '#ef4444' 
                  : region.severity === 'warning' ? '#f59e0b' 
                  : '#10b981';

      const circle = L.circle([lat, lon], {
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        radius: region.spray_radius || 10,
      }).addTo(mapRef.current!);

      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        }),
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <strong>${region.region_id}</strong><br/>
        Severity: ${region.severity}<br/>
        Confidence: ${(region.confidence * 100).toFixed(1)}%<br/>
        Area: ${region.area_hectares.toFixed(2)} ha
      `);

      if (onRegionClick) {
        marker.on('click', () => onRegionClick(region));
      }

      layersRef.current.regions.push(circle, marker);
    });
  }, [diseaseRegions]);

  const updateLayer = (layerType: 'rgb' | 'ndvi' | 'heatmap') => {
    if (!mapRef.current) return;

    // Remove all layers
    if (layersRef.current.rgb) layersRef.current.rgb.remove();
    if (layersRef.current.ndvi) layersRef.current.ndvi.remove();
    if (layersRef.current.heatmap) layersRef.current.heatmap.remove();

    // Add selected layer
    if (layerType === 'rgb' && layersRef.current.rgb) {
      layersRef.current.rgb.addTo(mapRef.current);
    } else if (layerType === 'ndvi' && layersRef.current.ndvi) {
      layersRef.current.ndvi.addTo(mapRef.current);
    } else if (layerType === 'heatmap' && layersRef.current.heatmap) {
      layersRef.current.heatmap.addTo(mapRef.current);
    }

    setCurrentLayer(layerType);
  };

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full"></div>
      
      {/* Layer Toggle */}
      <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-2 z-[1000]">
        <button
          onClick={() => updateLayer('rgb')}
          className={`px-4 py-2 rounded ${
            currentLayer === 'rgb' ? 'bg-green-600 text-white' : 'bg-gray-100'
          }`}
        >
          RGB
        </button>
        <button
          onClick={() => updateLayer('ndvi')}
          className={`px-4 py-2 rounded ml-2 ${
            currentLayer === 'ndvi' ? 'bg-green-600 text-white' : 'bg-gray-100'
          }`}
        >
          NDVI
        </button>
        <button
          onClick={() => updateLayer('heatmap')}
          className={`px-4 py-2 rounded ml-2 ${
            currentLayer === 'heatmap' ? 'bg-green-600 text-white' : 'bg-gray-100'
          }`}
        >
          Heatmap
        </button>
      </div>
    </div>
  );
};

export default MapViewer;
