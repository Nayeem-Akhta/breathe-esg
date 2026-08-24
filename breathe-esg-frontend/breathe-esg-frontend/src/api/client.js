import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
export const ORG_ID = process.env.REACT_APP_ORG_ID || 'bdd9be7c-d742-4c79-9371-902c02aa3872';

const api = axios.create({ baseURL: BASE_URL });

// ── Request interceptor — log outgoing ──
api.interceptors.request.use(config => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// ── Response interceptor — log timing ──
api.interceptors.response.use(
  response => {
    const ms = Date.now() - response.config.metadata.startTime;
    console.log(`✓ ${response.config.method?.toUpperCase()} ${response.config.url} — ${ms}ms`);
    return response;
  },
  error => {
    console.error('✗ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getDashboard = () =>
  api.get(`/review/dashboard?organization_id=${ORG_ID}`);

export const getEntries = (filters = {}) => {
  const params = new URLSearchParams({ organization_id: ORG_ID });
  Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
  return api.get(`/review/entries?${params}`);
};

export const getEntry = (id) =>
  api.get(`/review/entries/${id}?organization_id=${ORG_ID}`);

export const approveEntry = (id, note = '') =>
  api.post(`/review/entries/${id}/approve`, { organization_id: ORG_ID, note });

export const rejectEntry = (id, note = '') =>
  api.post(`/review/entries/${id}/reject`, { organization_id: ORG_ID, note });

export const flagEntry = (id, note = '') =>
  api.post(`/review/entries/${id}/flag`, { organization_id: ORG_ID, note });

export const uploadFile = (file, sourceType) => {
  const form = new FormData();
  form.append('file', file);
  form.append('source_type', sourceType);
  form.append('organization_id', ORG_ID);
  return api.post('/ingest/upload', form);
};