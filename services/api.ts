import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 min timeout for large analysis operations
});

// Upload API
export const uploadFiles = async (rgbFile: File, nirFile: File, fieldId?: string) => {
  const formData = new FormData();
  formData.append('rgb_file', rgbFile);
  formData.append('nir_file', nirFile);
  if (fieldId) {
    formData.append('field_id', fieldId);
  }

  const response = await axios.post(`${API_BASE_URL}/api/upload/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const listFields = async () => {
  const response = await api.get('/api/upload/fields');
  return response.data;
};

export const getFieldDetails = async (fieldId: string) => {
  const response = await api.get(`/api/upload/field/${fieldId}`);
  return response.data;
};

// Analysis API
export const runAnalysis = async (fieldId: string) => {
  const response = await api.post('/api/analyze/run', { field_id: fieldId });
  return response.data;
};

export const getAnalysisResults = async (analysisId: string) => {
  const response = await api.get(`/api/analyze/results/${analysisId}`);
  return response.data;
};

export const getFieldAnalysisHistory = async (fieldId: string) => {
  const response = await api.get(`/api/analyze/field/${fieldId}/history`);
  return response.data;
};

export const getNDVITimeseries = async (fieldId: string) => {
  const response = await api.get(`/api/analyze/field/${fieldId}/ndvi-timeseries`);
  return response.data;
};

// Mission API
export const createSprayMission = async (fieldId: string, analysisId: string, minSeverity: string = 'warning') => {
  const response = await api.post('/api/mission/create', {
    field_id: fieldId,
    analysis_id: analysisId,
    min_severity: minSeverity,
  });
  return response.data;
};

export const listMissions = async (fieldId?: string) => {
  const params = fieldId ? { field_id: fieldId } : {};
  const response = await api.get('/api/mission/list', { params });
  return response.data;
};

export const getMission = async (missionId: string) => {
  const response = await api.get(`/api/mission/${missionId}`);
  return response.data;
};

export const downloadMissionJSON = (missionId: string) => {
  return `${API_BASE_URL}/api/mission/download/${missionId}/json`;
};

export const downloadMissionCSV = (missionId: string) => {
  return `${API_BASE_URL}/api/mission/download/${missionId}/csv`;
};

export const updateMissionStatus = async (missionId: string, status: string) => {
  const response = await api.put(`/api/mission/${missionId}/status`, null, {
    params: { status },
  });
  return response.data;
};

// Health & Stats API
export const getHealthCheck = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};

export { API_BASE_URL };
