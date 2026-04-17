'use client';

import { useEffect, useState } from 'react';
import { listFields, getStats, getHealthCheck } from '@/services/api';
import Link from 'next/link';

export default function Home() {
  const [fields, setFields] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [fieldsResult, statsResult, healthResult] = await Promise.allSettled([
        listFields(),
        getStats(),
        getHealthCheck(),
      ]);

      if (fieldsResult.status === 'fulfilled') {
        setFields(fieldsResult.value.fields || []);
      }
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
        setBackendOnline(true);
      }
      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value);
        setBackendOnline(true);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const severityCounts = stats?.severity_counts || { critical: 0, warning: 0, healthy: 0 };
  const totalRegions = severityCounts.critical + severityCounts.warning + severityCounts.healthy;

  return (
    <main className="container p-8 mx-auto">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-800">
          IndusAgri.ai
        </h1>
        <p className="text-gray-600">
          Control & Analysis Platform for Smart Spraying using Deep Learning
        </p>
      </div>

      {/* Backend Connection Status */}
      <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-3 ${
        backendOnline ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className={`w-3 h-3 rounded-full ${backendOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className={`text-sm font-medium ${backendOnline ? 'text-green-800' : 'text-red-800'}`}>
          {backendOnline
            ? `Backend Online | Model: ${health?.model_loaded ? 'Loaded' : 'Not Loaded'} | Device: ${health?.device || 'N/A'}`
            : 'Backend Offline - Start the backend server on port 8000'}
        </span>
        {!backendOnline && (
          <button
            onClick={() => { setLoading(true); loadDashboardData(); }}
            className="ml-auto text-sm text-red-700 underline hover:text-red-900"
          >
            Retry
          </button>
        )}
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
        <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-br from-green-500 to-green-600">
          <div className="mb-1 text-sm opacity-90">Fields Uploaded</div>
          <div className="text-3xl font-bold">{stats?.total_fields ?? fields.length}</div>
          <div className="mt-2 text-xs opacity-75">
            {stats?.has_sample_data ? 'Includes sample data' : 'Upload RGB + NIR pairs'}
          </div>
        </div>

        <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="mb-1 text-sm opacity-90">Analyses Completed</div>
          <div className="text-3xl font-bold">{stats?.total_analyses ?? 0}</div>
          <div className="mt-2 text-xs opacity-75">
            {stats?.total_analyses > 0
              ? `Avg infection: ${stats.avg_infection_rate}%`
              : 'Run ML model on uploaded fields'}
          </div>
        </div>

        <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="mb-1 text-sm opacity-90">Disease Regions Found</div>
          <div className="text-3xl font-bold">{totalRegions}</div>
          <div className="mt-2 text-xs opacity-75">
            {severityCounts.critical > 0
              ? `${severityCounts.critical} critical regions`
              : 'No critical regions detected'}
          </div>
        </div>

        <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="mb-1 text-sm opacity-90">Spray Missions</div>
          <div className="text-3xl font-bold">{stats?.total_missions ?? 0}</div>
          <div className="mt-2 text-xs opacity-75">
            {stats?.total_spray_targets > 0
              ? `${stats.total_spray_targets} spray targets`
              : 'Generate from analysis results'}
          </div>
        </div>
      </div>

      {/* Severity Breakdown & Infection Overview */}
      {stats?.total_analyses > 0 && (
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
          {/* Severity Distribution */}
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Severity Distribution</h2>
            <div className="space-y-4">
              {[
                { label: 'Critical', count: severityCounts.critical, color: 'bg-red-500', textColor: 'text-red-700' },
                { label: 'Warning', count: severityCounts.warning, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                { label: 'Healthy', count: severityCounts.healthy, color: 'bg-green-500', textColor: 'text-green-700' },
              ].map((item) => {
                const pct = totalRegions > 0 ? (item.count / totalRegions) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm font-medium ${item.textColor}`}>{item.label}</span>
                      <span className="text-sm text-gray-600">{item.count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div
                        className={`${item.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Infection Overview */}
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Infection Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 text-center border border-red-200 rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">
                  {stats?.avg_infection_rate ?? 0}%
                </div>
                <div className="mt-1 text-xs text-red-700">Avg Infection Rate</div>
              </div>
              <div className="p-4 text-center border border-blue-200 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.total_field_area ?? 0} ha
                </div>
                <div className="mt-1 text-xs text-blue-700">Total Area Scanned</div>
              </div>
              <div className="p-4 text-center border border-orange-200 rounded-lg bg-orange-50">
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.total_infected_area ?? 0} ha
                </div>
                <div className="mt-1 text-xs text-orange-700">Infected Area</div>
              </div>
              <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.total_spray_targets ?? 0}
                </div>
                <div className="mt-1 text-xs text-green-700">Spray Targets</div>
              </div>
            </div>

            {/* Per-analysis infection rates */}
            {stats?.recent_analyses && stats.recent_analyses.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-gray-600">Infection by Field</h4>
                <div className="space-y-2">
                  {stats.recent_analyses.map((a: any) => (
                    <div key={a.analysis_id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 truncate w-28" title={a.field_id}>{a.field_id}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${
                            a.infection_percentage > 20 ? 'bg-red-500'
                            : a.infection_percentage > 10 ? 'bg-yellow-500'
                            : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(a.infection_percentage, 100)}%` }}
                        />
                      </div>
                      <span className="w-12 text-xs font-medium text-right">
                        {a.infection_percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/upload">
            <div className="p-6 transition-all border-2 border-green-200 rounded-lg cursor-pointer hover:border-green-500 hover:shadow-md">
              <div className="mb-2 text-4xl">📤</div>
              <div className="text-lg font-semibold">Upload Data</div>
              <div className="text-sm text-gray-600">Upload RGB & NIR imagery</div>
            </div>
          </Link>

          <Link href="/report">
            <div className="p-6 transition-all border-2 border-blue-200 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md">
              <div className="mb-2 text-4xl">📊</div>
              <div className="text-lg font-semibold">View Reports</div>
              <div className="text-sm text-gray-600">Analyze disease detection results</div>
            </div>
          </Link>

          <Link href="/report">
            <div className="p-6 transition-all border-2 border-purple-200 rounded-lg cursor-pointer hover:border-purple-500 hover:shadow-md">
              <div className="mb-2 text-4xl">🎯</div>
              <div className="text-lg font-semibold">Mission Control</div>
              <div className="text-sm text-gray-600">Generate spray missions</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Fields */}
      <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">Recent Fields</h2>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading fields...</div>
        ) : fields.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-5xl text-gray-400">📭</div>
            <div className="mb-4 text-gray-600">No fields uploaded yet</div>
            <Link href="/upload">
              <button className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">
                Upload Your First Field
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Field ID
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    RGB File
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    NIR File
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field) => (
                  <tr key={field.field_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">
                      {field.field_id}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {new Date(field.upload_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {field.rgb_filename}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {field.nir_filename}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {field.has_analysis ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          Analyzed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <Link href={`/report?field=${field.field_id}`}>
                        <button className="font-medium text-blue-600 hover:text-blue-800">
                          {field.has_analysis ? 'View Report →' : 'Analyze →'}
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Analyses */}
      {stats?.recent_analyses && stats.recent_analyses.length > 0 && (
        <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
          <h2 className="mb-4 text-2xl font-bold">Recent Analyses</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.recent_analyses.map((analysis: any) => (
              <Link key={analysis.analysis_id} href={`/report?field=${analysis.field_id}`}>
                <div className="p-4 transition-all border rounded-lg cursor-pointer hover:shadow-md">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm text-gray-700 truncate" title={analysis.field_id}>
                      {analysis.field_id}
                    </span>
                    <span className={`text-sm font-bold ${
                      analysis.infection_percentage > 20 ? 'text-red-600'
                      : analysis.infection_percentage > 10 ? 'text-yellow-600'
                      : 'text-green-600'
                    }`}>
                      {analysis.infection_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mb-2 text-xs text-gray-500">
                    {new Date(analysis.analyzed_date).toLocaleString()}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded">{analysis.total_regions} regions</span>
                    <span className="px-2 py-1 text-red-700 rounded bg-red-50">
                      {analysis.total_infected_area.toFixed(1)} ha infected
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

     
    </main>
  );
}
