'use client';

import React, { useState } from 'react';
import { createSprayMission, downloadMissionJSON, downloadMissionCSV } from '@/services/api';

interface SprayButtonProps {
  fieldId: string;
  analysisId: string;
  onMissionCreated?: (missionId: string) => void;
}

const SprayButton: React.FC<SprayButtonProps> = ({
  fieldId,
  analysisId,
  onMissionCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [missionData, setMissionData] = useState<any>(null);
  const [minSeverity, setMinSeverity] = useState<string>('warning');

  const handleGenerateMission = async () => {
    setLoading(true);
    try {
      const result = await createSprayMission(fieldId, analysisId, minSeverity);
      setMissionId(result.mission_id);
      setMissionData(result);
      if (onMissionCreated) {
        onMissionCreated(result.mission_id);
      }
    } catch (error) {
      console.error('Error creating mission:', error);
      alert('Failed to generate spray mission');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type: 'json' | 'csv') => {
    if (!missionId) return;

    const url = type === 'json' 
      ? downloadMissionJSON(missionId)
      : downloadMissionCSV(missionId);

    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">🎯 Smart Spraying Mission</h3>

      {!missionId ? (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Minimum Severity Level
            </label>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="healthy">All Regions (Including Healthy)</option>
              <option value="warning">Warning & Critical Only</option>
              <option value="critical">Critical Only</option>
            </select>
          </div>

          <button
            onClick={handleGenerateMission}
            disabled={loading}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Generating Mission...' : '🚁 Generate Spray Mission'}
          </button>

          <div className="mt-4 text-sm text-gray-600">
            <p>This will create GPS waypoints for the EE drone controller to spray only infected areas.</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <div className="font-semibold text-green-800 mb-2">✅ Mission Generated</div>
            <div className="text-sm text-green-700">
              <div>Mission ID: {missionId}</div>
              <div>Total Targets: {missionData?.total_targets}</div>
              <div>Total Area: {missionData?.total_area} hectares</div>
              <div>Est. Duration: {missionData?.estimated_duration} minutes</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleDownload('json')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              📥 Download JSON
            </button>
            <button
              onClick={() => handleDownload('csv')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              📥 Download CSV
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Next Steps:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Download mission file (JSON or CSV)</li>
              <li>Upload to drone controller</li>
              <li>EE team loads waypoints</li>
              <li>Drone sprays infected areas automatically</li>
            </ol>
          </div>

          <button
            onClick={() => setMissionId(null)}
            className="w-full mt-4 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
          >
            Generate New Mission
          </button>
        </div>
      )}
    </div>
  );
};

export default SprayButton;
