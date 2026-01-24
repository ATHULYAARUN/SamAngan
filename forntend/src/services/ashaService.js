import sessionManager from '../utils/sessionManager';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  // Try multiple sources for token (sessionManager first)
  const token = (sessionManager && sessionManager.getToken && sessionManager.getToken())
    || localStorage.getItem('authToken')
    || localStorage.getItem('firebaseToken')
    || localStorage.getItem('adminToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

const ashaService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await apiCall('/asha/dashboard-stats');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Field Visit Entry
  createFieldVisit: async (visitData) => {
    try {
      const response = await apiCall('/asha/field-visits', {
        method: 'POST',
        body: JSON.stringify(visitData)
      });
      return response;
    } catch (error) {
      console.error('Error creating field visit:', error);
      throw error;
    }
  },

  getFieldVisits: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/asha/field-visits${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching field visits:', error);
      throw error;
    }
  },

  // Awareness Sessions
  createAwarenessSession: async (sessionData) => {
    try {
      const formData = new FormData();
      Object.keys(sessionData).forEach(key => {
        if (sessionData[key] !== null && sessionData[key] !== undefined) {
          formData.append(key, sessionData[key]);
        }
      });

      const token = (sessionManager && sessionManager.getToken && sessionManager.getToken())
        || localStorage.getItem('authToken')
        || localStorage.getItem('firebaseToken')
        || localStorage.getItem('adminToken');

      const response = await fetch(`${BASE_URL}/asha/awareness-sessions`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create awareness session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating awareness session:', error);
      throw error;
    }
  },

  getAwarenessSessions: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/asha/awareness-sessions${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching awareness sessions:', error);
      throw error;
    }
  },

  // Feedback & Alerts
  createFeedback: async (feedbackData) => {
    try {
      const formData = new FormData();
      Object.keys(feedbackData).forEach(key => {
        if (feedbackData[key] !== null && feedbackData[key] !== undefined) {
          formData.append(key, feedbackData[key]);
        }
      });

      const token = (sessionManager && sessionManager.getToken && sessionManager.getToken())
        || localStorage.getItem('authToken')
        || localStorage.getItem('firebaseToken')
        || localStorage.getItem('adminToken');

      const response = await fetch(`${BASE_URL}/asha/feedback`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  getFeedback: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/asha/feedback${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await apiCall('/asha/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; // Return empty array on error
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await apiCall(`/asha/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Reports
  getReportData: async () => {
    try {
      const response = await apiCall('/asha/reports');
      return response;
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  },

  // Profile Management
  updateProfile: async (profileData) => {
    try {
      const response = await apiCall('/asha/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await apiCall('/asha/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });
      return response;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};

export default ashaService;
