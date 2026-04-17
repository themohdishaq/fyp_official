'use client';

import { useState } from 'react';
import { uploadFiles } from '@/services/api';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [rgbFile, setRgbFile] = useState<File | null>(null);
  const [nirFile, setNirFile] = useState<File | null>(null);
  const [fieldId, setFieldId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRgbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRgbFile(e.target.files[0]);
    }
  };

  const handleNirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNirFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!rgbFile || !nirFile) {
      alert('Please select both RGB and NIR files');
      return;
    }

    setUploading(true);
    setProgress(30);

    try {
      const result = await uploadFiles(rgbFile, nirFile, fieldId || undefined);
      setProgress(100);

      setTimeout(() => {
        alert(`Files uploaded successfully! Field ID: ${result.field_id}`);
        router.push(`/report?field=${result.field_id}`);
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Upload Field Data</h1>
        <p className="text-gray-600 mb-8">
          Upload RGB and NIR (Near-Infrared) image pairs for disease analysis
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Upload Instructions</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Prepare RGB image (visible spectrum - JPG, PNG, or TIFF)</li>
            <li>Prepare NIR image (Near-Infrared - corresponding to the RGB image)</li>
            <li>Both files should be from the same drone flight/capture</li>
            <li>Optional: Provide a custom Field ID for tracking</li>
            <li>Your ML model will process both images to detect diseases</li>
          </ol>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Field ID */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field ID (Optional)
            </label>
            <input
              type="text"
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              placeholder="Leave empty for auto-generated ID"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alphanumeric identifier for this field (e.g., "field_north_plot_1")
            </p>
          </div>

          {/* RGB Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RGB Orthomosaic *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept="image/*,.tif,.tiff"
                onChange={handleRgbChange}
                className="hidden"
                id="rgb-upload"
              />
              <label htmlFor="rgb-upload" className="cursor-pointer">
                <div className="text-5xl mb-2">🖼️</div>
                {rgbFile ? (
                  <div>
                    <div className="font-semibold text-green-600">{rgbFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(rgbFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-600 mb-1">Click to upload RGB image</div>
                    <div className="text-xs text-gray-500">
                      Supports: JPG, PNG, TIFF
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* NIR Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIR (Near-Infrared) Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept="image/*,.tif,.tiff"
                onChange={handleNirChange}
                className="hidden"
                id="nir-upload"
              />
              <label htmlFor="nir-upload" className="cursor-pointer">
                <div className="text-5xl mb-2">📡</div>
                {nirFile ? (
                  <div>
                    <div className="font-semibold text-green-600">{nirFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(nirFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-600 mb-1">Click to upload NIR image</div>
                    <div className="text-xs text-gray-500">
                      Near-Infrared image corresponding to RGB
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!rgbFile || !nirFile || uploading}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload Files'}
          </button>
        </div>

        {/* What Happens Next */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">What happens after upload?</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Files are saved and metadata is extracted</li>
            <li>You'll be redirected to the analysis page</li>
            <li>Run the ML model to detect disease regions (uses both RGB + NIR)</li>
            <li>View results on interactive map with disease heatmap overlays</li>
            <li>Generate GPS spray mission for drone controller</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
