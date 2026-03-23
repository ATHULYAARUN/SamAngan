import { apiCall, apiCallFormData } from '../utils/apiClient';

const sanitationService = {
  getDashboardStats: () => apiCall('/sanitation/dashboard-stats'),
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/sanitation/tasks${q ? `?${q}` : ''}`);
  },
  createTask: (data) => apiCall('/sanitation/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => apiCall(`/sanitation/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getWasteLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/sanitation/waste-logs${q ? `?${q}` : ''}`);
  },
  createWasteLog: (data) => apiCall('/sanitation/waste-logs', { method: 'POST', body: JSON.stringify(data) }),
  getDrainageReports: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/sanitation/drainage${q ? `?${q}` : ''}`);
  },
  createDrainageReport: (data) => apiCall('/sanitation/drainage', { method: 'POST', body: JSON.stringify(data) }),
  updateDrainageReport: (id, data) => apiCall(`/sanitation/drainage/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getIssues: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/sanitation/issues${q ? `?${q}` : ''}`);
  },
  createIssue: (data, photoFile = null) => {
    if (photoFile) {
      const form = new FormData();
      Object.keys(data).forEach(k => form.append(k, data[k]));
      form.append('photo', photoFile);
      return apiCallFormData('/sanitation/issues', form);
    }
    return apiCall('/sanitation/issues', { method: 'POST', body: JSON.stringify(data) });
  },
  updateIssue: (id, data) => apiCall(`/sanitation/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getReports: () => apiCall('/sanitation/reports'),
  generateReport: () => apiCall('/sanitation/reports/generate', { method: 'POST' }),
  getAiPredictions: () => apiCall('/sanitation/ai-predictions'),
  getNotifications: () => apiCall('/sanitation/notifications')
};

export default sanitationService;
