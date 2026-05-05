'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getFieldDetails,
  runAnalysis,
  getAnalysisResults,
  listFields,
} from '@/services/api';
import DiseaseSidebar from '@/components/DiseaseSidebar';
import NDVIChart from '@/components/NDVIChart';
import SprayButton from '@/components/SprayButton';

// Dynamic import for MapViewer (client-side only)
const MapViewer = dynamic(() => import('@/components/MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

function FieldSelector() {
  const router = useRouter();
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const result = await listFields();
      setFields(result.fields || []);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container p-8 mx-auto text-center">
        <div className="text-gray-500">Loading fields...</div>
      </div>
    );
  }

  return (
    <div className="container p-8 mx-auto">
      <h1 className="mb-2 text-3xl font-bold text-gray-800">Field Reports</h1>
      <p className="mb-8 text-gray-600">Select a field to view its analysis report and statistics</p>

      {fields.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-5xl text-gray-400">📭</div>
          <h2 className="mb-2 text-2xl font-bold">No Fields Available</h2>
          <p className="mb-4 text-gray-600">Upload RGB and NIR image pairs to get started</p>
          <a href="/upload">
            <button className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
              Upload Field Data
            </button>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div
              key={field.field_id}
              onClick={() => router.push(`/report?field=${field.field_id}`)}
              className="p-6 transition-all bg-white border-2 border-transparent rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:border-green-500"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-mono text-sm font-semibold text-gray-800 truncate" title={field.field_id}>
                  {field.field_id}
                </h3>
                {field.has_analysis ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                    Analyzed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                    Pending
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                <div>RGB: {field.rgb_filename}</div>
                <div>NIR: {field.nir_filename}</div>
                <div className="mt-2 text-xs text-gray-400">
                  Uploaded: {new Date(field.upload_date).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-4 text-sm font-medium text-blue-600">
                {field.has_analysis ? 'View Report →' : 'Run Analysis →'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fieldId = searchParams.get('field');

  const [fieldData, setFieldData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fieldId) {
      loadFieldData();
    }
  }, [fieldId]);

  const loadFieldData = async () => {
    setLoading(true);
    setError(null);
    try {
      const field = await getFieldDetails(fieldId!);
      setFieldData(field);

      // Check if analysis exists
      if (field.has_analysis && field.analysis_id) {
        try {
          const analysis = await getAnalysisResults(field.analysis_id);
          setAnalysisData(analysis);
        } catch (err) {
          console.error('Error loading analysis:', err);
        }
      }
    } catch (err: any) {
      console.error('Error loading field:', err);
      setError(err?.response?.data?.detail || 'Failed to load field data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await runAnalysis(fieldId!);
      const analysis = await getAnalysisResults(result.analysis_id);
      setAnalysisData(analysis);
    } catch (err: any) {
      console.error('Analysis error:', err);
      alert(err?.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!fieldId) {
    return <FieldSelector />;
  }

  if (loading) {
    return (
      <div className="container p-8 mx-auto text-center">
        <div className="inline-block w-8 h-8 mb-4 border-4 border-green-500 rounded-full animate-spin border-t-transparent" />
        <div className="text-gray-500">Loading field data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-8 mx-auto text-center">
        <div className="mb-4 text-5xl text-red-400">⚠️</div>
        <h2 className="mb-2 text-2xl font-bold">Error Loading Field</h2>
        <p className="mb-4 text-gray-600">{error}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={loadFieldData}
            className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/report')}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Back to Fields
          </button>
        </div>
      </div>
    );
  }

  // Use analysis bounds if available, then field bounds, then defaults
  const bounds = analysisData?.bounds || fieldData?.rgb?.bounds;
  const mapCenter: [number, number] = bounds
    ? [
        (bounds.minLat + bounds.maxLat) / 2,
        (bounds.minLon + bounds.maxLon) / 2,
      ]
    : [35.2974, 75.6331];

  return (
    <main className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 bg-white border-b">
        <div className="container flex items-center justify-between mx-auto">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/report')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← All Fields
              </button>
              <h1 className="text-2xl font-bold">Field Analysis: {fieldId}</h1>
            </div>
            <p className="text-sm text-gray-600">
              {analysisData
                ? `Analyzed: ${new Date(analysisData.analyzed_date).toLocaleString()} | ${analysisData.disease_regions?.length || 0} regions found`
                : 'Not yet analyzed'}
            </p>
          </div>
          <div className="flex gap-3">
            {analysisData && (
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50"
              >
                {analyzing ? 'Re-analyzing...' : 'Re-run Analysis'}
              </button>
            )}
            {!analysisData && (
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {analyzing ? '🔄 Running Analysis...' : '🤖 Run ML Analysis'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Area */}
        <div className="relative flex-1">
          {analysisData ? (
            <MapViewer
              center={mapCenter}
              zoom={15}
              bounds={bounds}
              rgbImage={analysisData.rgb_image}
              ndviImage={analysisData.ndvi_image}
              heatmapImage={analysisData.heatmap_image}
              diseaseRegions={analysisData.disease_regions}
              onRegionClick={(region) => setSelectedRegion(region.region_id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <div className="mb-4 text-6xl">🗺️</div>
                <h3 className="mb-2 text-xl font-semibold">Ready to Analyze</h3>
                <p className="mb-4 text-gray-600">
                  Click "Run ML Analysis" to detect disease regions
                </p>
                {analyzing && (
                  <div className="mt-4">
                    <div className="inline-block w-8 h-8 mb-2 border-4 border-green-500 rounded-full animate-spin border-t-transparent" />
                    <p className="text-sm text-green-600">Processing images with ML model...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="overflow-y-auto border-l w-96 bg-gray-50">
          {analysisData ? (
            <div className="p-4 space-y-4">
              {/* Statistics */}
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="mb-3 font-semibold">📊 Analysis Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Regions:</span>
                    <span className="font-semibold">
                      {analysisData.disease_regions?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Infected Area:</span>
                    <span className="font-semibold">
                      {(analysisData.total_infected_area || 0).toFixed(2)} ha
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Field:</span>
                    <span className="font-semibold">
                      {(analysisData.total_field_area || 0).toFixed(2)} ha
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Infection Rate:</span>
                    <span
                      className={`font-semibold ${
                        analysisData.infection_percentage > 20
                          ? 'text-red-600'
                          : analysisData.infection_percentage > 10
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {(analysisData.infection_percentage || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Severity mini-bars */}
                <div className="pt-3 mt-3 border-t">
                  {(() => {
                    const regions = analysisData.disease_regions || [];
                    const critical = regions.filter((r: any) => r.severity === 'critical').length;
                    const warning = regions.filter((r: any) => r.severity === 'warning').length;
                    const healthy = regions.filter((r: any) => r.severity === 'healthy').length;
                    const total = regions.length || 1;
                    return (
                      <div className="flex h-4 gap-1 overflow-hidden rounded-full">
                        {critical > 0 && (
                          <div className="bg-red-500" style={{ width: `${(critical / total) * 100}%` }} title={`${critical} critical`} />
                        )}
                        {warning > 0 && (
                          <div className="bg-yellow-500" style={{ width: `${(warning / total) * 100}%` }} title={`${warning} warning`} />
                        )}
                        {healthy > 0 && (
                          <div className="bg-green-500" style={{ width: `${(healthy / total) * 100}%` }} title={`${healthy} healthy`} />
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Critical</span>
                    <span>Warning</span>
                    <span>Healthy</span>
                  </div>
                </div>
              </div>

              {/* NDVI Chart */}
              <div className="p-4 bg-white rounded-lg shadow">
                <NDVIChart fieldId={fieldId!} />
              </div>

              {/* Disease Regions */}
              <DiseaseSidebar
                regions={analysisData.disease_regions || []}
                onRegionClick={(region) => setSelectedRegion(region.region_id)}
                selectedRegion={selectedRegion || undefined}
              />

              {/* Spray Mission */}
              <SprayButton fieldId={fieldId!} analysisId={analysisData.analysis_id} />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4 text-4xl">🔬</div>
              <p className="mb-4">Run analysis to see disease detection results</p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>The ML model will:</p>
                <ul className="space-y-1 text-left list-disc list-inside">
                  <li>Process RGB + NIR images</li>
                  <li>Detect anomalous regions</li>
                  <li>Calculate NDVI statistics</li>
                  <li>Generate severity classifications</li>
                  <li>Create disease heatmap</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="container p-8 mx-auto text-center text-gray-500">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
