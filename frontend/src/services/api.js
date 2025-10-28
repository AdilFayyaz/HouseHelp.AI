import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Issues API
export const issuesAPI = {
  // Create new issue with image upload
  createIssue: async (formData) => {
    const response = await api.post('/api/issues/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all issues
  getIssues: async () => {
    const response = await api.get('/api/issues/');
    return response.data;
  },

  // Get specific issue
  getIssue: async (issueId) => {
    const response = await api.get(`/api/issues/${issueId}`);
    return response.data;
  },

  // Analyze issue with AI
  analyzeIssue: async (issueId) => {
    const response = await api.post(`/api/issues/${issueId}/analyze`);
    return response.data;
  },

  // Update issue
  updateIssue: async (issueId, updates) => {
    const response = await api.put(`/api/issues/${issueId}`, updates);
    return response.data;
  },

  // Call maintenance for issue
  callMaintenance: async (issueId, providerId) => {
    const response = await api.post(`/api/issues/${issueId}/call-maintenance`, {
      provider_id: providerId,
    });
    return response.data;
  },
};

// Maintenance Providers API
export const providersAPI = {
  // Get all providers
  getProviders: async (specialty = null) => {
    const params = specialty ? { specialty } : {};
    const response = await api.get('/api/providers/', { params });
    return response.data;
  },

  // Create new provider
  createProvider: async (providerData) => {
    const response = await api.post('/api/providers/', providerData);
    return response.data;
  },
};

// Audit Logs API
export const auditAPI = {
  // Get audit logs
  getAuditLogs: async (issueId = null) => {
    const params = issueId ? { issue_id: issueId } : {};
    const response = await api.get('/api/audit-logs/', { params });
    return response.data;
  },

  // Create audit log
  createAuditLog: async (logData) => {
    const response = await api.post('/api/audit-logs/', logData);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  // Send chat message
  sendMessage: async (message, issueId = null) => {
    const response = await api.post('/api/chat', {
      message,
      issue_id: issueId,
    });
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/api/dashboard');
    return response.data;
  },
};

export default api;