import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
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
    apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

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
