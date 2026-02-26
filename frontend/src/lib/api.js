import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Credits
export const creditsAPI = {
  balance: () => api.get('/credits/balance'),
};

// RAG
export const ragAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => api.get('/rag/docs'),
  delete: (id) => api.delete(`/rag/docs/${id}`),
  query: (data) => api.post('/rag/query', data),
};

// Generators
export const genAPI = {
  content: (data) => api.post('/gen/content', data),
  code: (data) => api.post('/gen/code', data),
  research: (data) => api.post('/gen/research', data),
  tts: (data) => api.post('/gen/tts', data),
  stt: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/gen/stt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  image: (data) => api.post('/gen/image', data),
  imageEdit: (data) => api.post('/gen/image/edit', data),
  video: (data) => api.post('/gen/video', data),
};

// Jobs
export const jobsAPI = {
  status: (id) => api.get(`/jobs/${id}`),
  download: (id) => `${API_URL}/api/jobs/${id}/download`,
};

// MCP Tools
export const mcpAPI = {
  tools: () => api.get('/mcp/tools'),
  run: (data) => api.post('/mcp/run', data),
};

// Subscription
export const subscriptionAPI = {
  plans: () => api.get('/subscription/plans'),
  create: (data) => api.post('/subscription/create', data),
  verify: (data) => api.post('/subscription/verify', data),
};

// History
export const historyAPI = {
  get: (limit = 50) => api.get(`/history?limit=${limit}`),
};

// Admin
export const adminAPI = {
  users: () => api.get('/admin/users'),
  grantCredits: (data) => api.post('/admin/credits/grant', data),
  usage: (limit = 100) => api.get(`/admin/usage?limit=${limit}`),
  errors: (limit = 100) => api.get(`/admin/errors?limit=${limit}`),
  documents: () => api.get('/admin/documents'),
  subscriptions: () => api.get('/admin/subscriptions'),
  revenue: () => api.get('/admin/revenue'),
  exportUsage: () => `${API_URL}/api/admin/export/usage`,
};

export default api;
