import axios from 'axios';

function resolveApiBaseUrl() {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    return envBase;
  }

  return '/api';
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Attach logged-in user's email to every request so the backend
// can tag sessions with the correct owner.
export function setAuthEmail(email) {
  if (email) {
    apiClient.defaults.headers.common['x-user-email'] = email;
  } else {
    delete apiClient.defaults.headers.common['x-user-email'];
  }
}

export const api = {
  uploadFile: (formData) =>
    apiClient.post('/upload', formData),

  submitExplanation: (data) => apiClient.post('/explain', data),

  sendChatMessage: (data) => apiClient.post('/chat', data),

  generateReport: (data) => apiClient.post('/report', data),

  getReport: (sessionId) => apiClient.get(`/report/${sessionId}`),

  // Dashboard
  getUserSessions: (email) =>
    apiClient.get('/sessions', { params: { email } }),

  // Session detail
  getSessionDetail: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}`),
};
