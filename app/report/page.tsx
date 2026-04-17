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
      <div className="container mx-auto p-8 text-center">
        <div className="text-gray-500">Loading fields...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Field Reports</h1>
      <p className="text-gray-600 mb-8">Select a field to view its analysis report and statistics</p>

      {fields.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📭</div>
          <h2 className="text-2xl font-bold mb-2">No Fields Available</h2>
          <p className="text-gray-600 mb-4">Upload RGB and NIR image pairs to get started</p>
          <a href="/upload">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
              Upload Field Data
            </button>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <div
              key={field.field_id}
              onClick={() => router.push(`/report?field=${field.field_id}`)}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-mono text-sm font-semibold text-gray-800 truncate" title={field.field_id}>
                  {field.field_id}
                </h3>
                {field.has_analysis ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Analyzed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div>RGB: {field.rgb_filename}</div>
                <div>NIR: {field.nir_filename}</div>
                <div className="text-xs text-gray-400 mt-2">
                  Uploaded: {new Date(field.upload_date).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-4 text-sm text-blue-600 font-medium">
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
      <div className="container mx-auto p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mb-4" />
        <div className="text-gray-500">Loading field data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="text-red-400 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">Error Loading Field</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={loadFieldData}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/report')}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100"
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
    <main className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/report')}
                className="text-gray-500 hover:text-gray-700 text-sm"
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
                className="border border-green-600 text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 disabled:opacity-50 text-sm"
              >
                {analyzing ? 'Re-analyzing...' : 'Re-run Analysis'}
              </button>
            )}
            {!analysisData && (
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {analyzing ? '🔄 Running Analysis...' : '🤖 Run ML Analysis'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
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
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-gray-600 mb-4">
                  Click "Run ML Analysis" to detect disease regions
                </p>
                {analyzing && (
                  <div className="mt-4">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mb-2" />
                    <p className="text-sm text-green-600">Processing images with ML model...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-gray-50 overflow-y-auto border-l">
          {analysisData ? (
            <div className="p-4 space-y-4">
              {/* Statistics */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3">📊 Analysis Summary</h3>
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
                <div className="mt-3 pt-3 border-t">
                  {(() => {
                    const regions = analysisData.disease_regions || [];
                    const critical = regions.filter((r: any) => r.severity === 'critical').length;
                    const warning = regions.filter((r: any) => r.severity === 'warning').length;
                    const healthy = regions.filter((r: any) => r.severity === 'healthy').length;
                    const total = regions.length || 1;
                    return (
                      <div className="flex gap-1 h-4 rounded-full overflow-hidden">
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
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Critical</span>
                    <span>Warning</span>
                    <span>Healthy</span>
                  </div>
                </div>
              </div>

              {/* NDVI Chart */}
              <div className="bg-white rounded-lg shadow p-4">
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
              <div className="text-4xl mb-4">🔬</div>
              <p className="mb-4">Run analysis to see disease detection results</p>
              <div className="text-sm text-gray-400 space-y-2">
                <p>The ML model will:</p>
                <ul className="text-left list-disc list-inside space-y-1">
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
    <Suspense fallback={<div className="container mx-auto p-8 text-center text-gray-500">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
