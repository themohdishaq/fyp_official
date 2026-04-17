'use client';

import React from 'react';

interface DiseaseRegion {
  region_id: string;
  severity: string;
  confidence: number;
  area_hectares: number;
  anomaly_score: number;
  center?: {
    coordinates: [number, number];
  };
}

interface DiseaseSidebarProps {
  regions: DiseaseRegion[];
  onRegionClick?: (region: DiseaseRegion) => void;
  selectedRegion?: string;
}

const DiseaseSidebar: React.FC<DiseaseSidebarProps> = ({
  regions,
  onRegionClick,
  selectedRegion,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'healthy':
        return 'bg-green-100 border-green-500 text-green-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'healthy':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const criticalRegions = regions.filter((r) => r.severity === 'critical');
  const warningRegions = regions.filter((r) => r.severity === 'warning');
  const healthyRegions = regions.filter((r) => r.severity === 'healthy');

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Disease Alerts</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{criticalRegions.length}</div>
          <div className="text-xs text-red-700">Critical</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{warningRegions.length}</div>
          <div className="text-xs text-yellow-700">Warning</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{healthyRegions.length}</div>
          <div className="text-xs text-green-700">Healthy</div>
        </div>
      </div>

      {/* Critical Regions */}
      {criticalRegions.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-red-600 mb-2">🔴 Critical Priority</h3>
          {criticalRegions.map((region) => (
            <div
              key={region.region_id}
              onClick={() => onRegionClick && onRegionClick(region)}
              className={`border-l-4 p-3 mb-2 rounded cursor-pointer transition-all ${getSeverityColor(
                region.severity
              )} ${
                selectedRegion === region.region_id ? 'ring-2 ring-offset-2 ring-red-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="font-semibold">{region.region_id}</div>
                <div className="text-sm">{getSeverityIcon(region.severity)}</div>
              </div>
              <div className="text-sm mt-1">
                <div>Confidence: {(region.confidence * 100).toFixed(1)}%</div>
                <div>Area: {region.area_hectares.toFixed(2)} ha</div>
                <div>Anomaly Score: {region.anomaly_score.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Regions */}
      {warningRegions.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-yellow-600 mb-2">🟡 Warning</h3>
          {warningRegions.map((region) => (
            <div
              key={region.region_id}
              onClick={() => onRegionClick && onRegionClick(region)}
              className={`border-l-4 p-3 mb-2 rounded cursor-pointer transition-all ${getSeverityColor(
                region.severity
              )} ${
                selectedRegion === region.region_id
                  ? 'ring-2 ring-offset-2 ring-yellow-500'
                  : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="font-semibold">{region.region_id}</div>
                <div className="text-sm">{getSeverityIcon(region.severity)}</div>
              </div>
              <div className="text-sm mt-1">
                <div>Confidence: {(region.confidence * 100).toFixed(1)}%</div>
                <div>Area: {region.area_hectares.toFixed(2)} ha</div>
                <div>Anomaly Score: {region.anomaly_score.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Healthy Regions */}
      {healthyRegions.length > 0 && (
        <div>
          <h3 className="font-semibold text-green-600 mb-2">🟢 Healthy</h3>
          <div className="text-sm text-gray-600">
            {healthyRegions.length} regions with healthy vegetation
          </div>
        </div>
      )}

      {regions.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No disease regions detected
        </div>
      )}
    </div>
  );
};

export default DiseaseSidebar;
