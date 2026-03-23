import { apiCall, buildApiUrl, fetchWithRetry } from '../utils/apiClient';
import sessionManager from '../utils/sessionManager';

const ashaService = {
  // Helper function to update cross-dashboard statistics
  updateCrossDashboardStats: async (visitData) => {
    try {
      const updateData = {
        personType: visitData.personType,
        visitData: {
          name: visitData.personName,
          age: visitData.age,
          weight: visitData.weight,
          height: visitData.height,
          hemoglobin: visitData.hemoglobin,
          bloodPressure: visitData.bloodPressure,
          vaccination: visitData.vaccination,
          supplements: visitData.supplements,
          visitDate: visitData.visitDate,
          ashaArea: visitData.ashaArea
        }
      };

      // Call backend API to update relevant dashboard statistics
      await apiCall('/asha/update-dashboard-stats', {
        method: 'POST',
        body: JSON.stringify(updateData)
      });
    } catch (error) {
      console.error('Error updating cross-dashboard stats:', error);
      // Don't throw error to avoid breaking the main flow
    }
  },

  // Dashboard Stats – pass area and optional ashaName so counts are for the logged-in ASHA worker
  getDashboardStats: async (area, ashaName) => {
    try {
      const effectiveArea = area ?? (typeof window !== 'undefined' ? (localStorage.getItem('ashaArea') || 'Default Area') : '');
      const effectiveName = ashaName ?? (typeof window !== 'undefined' ? (localStorage.getItem('userName') || '').trim() : '');
      const params = new URLSearchParams();
      if (effectiveArea) params.set('area', effectiveArea);
      if (effectiveName) params.set('ashaName', effectiveName);
      const endpoint = `/asha/dashboard-stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Field Visit Entry
  createFieldVisit: async (visitData) => {
    try {
      const token = (sessionManager && sessionManager.getToken && sessionManager.getToken())
        || localStorage.getItem('authToken') || localStorage.getItem('firebaseToken') || localStorage.getItem('adminToken');
      const isFormData = visitData.photo && visitData.photo instanceof File;
      let response;
      if (isFormData) {
        const formData = new FormData();
        Object.keys(visitData).forEach(key => {
          if (key === 'photo') {
            if (visitData.photo) formData.append('photo', visitData.photo);
          } else if (visitData[key] !== null && visitData[key] !== undefined) {
            const val = visitData[key];
            formData.append(key, typeof val === 'object' && !(val instanceof Date) ? JSON.stringify(val) : val);
          }
        });
        const url = buildApiUrl('/asha/field-visits');
        const res = await fetchWithRetry(url, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || `HTTP error! status: ${res.status}`);
        }
        response = await res.json();
      } else {
        const url = buildApiUrl('/asha/field-visits');
        const res = await fetchWithRetry(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(visitData)
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || `HTTP error! status: ${res.status}`);
        }
        response = await res.json();
      }
      if (response.success) {
        try {
          await ashaService.updateCrossDashboardStats(visitData);
        } catch (e) {
          console.warn('Cross-dashboard stats update failed:', e);
        }
      }
      return response;
    } catch (error) {
      console.error('Error creating field visit:', error);
      const isNetworkError = !error.response && (error.message === 'Failed to fetch' || (error.name === 'TypeError' && String(error.message || '').toLowerCase().includes('fetch')));
      if (isNetworkError) {
        throw new Error('Cannot reach server. Ensure the backend is running (e.g. on port 5000) and try again.');
      }
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
        const val = sessionData[key];
        if (val !== null && val !== undefined && key !== 'file') {
          if (Array.isArray(val)) {
            formData.append(key, JSON.stringify(val));
          } else if (val instanceof File) {
            formData.append(key, val);
          } else {
            formData.append(key, val);
          }
        }
      });
      if (sessionData.file) formData.append('file', sessionData.file);

      const token = (sessionManager && sessionManager.getToken && sessionManager.getToken())
        || localStorage.getItem('authToken')
        || localStorage.getItem('firebaseToken')
        || localStorage.getItem('adminToken');

      const res = await fetchWithRetry(buildApiUrl('/asha/awareness-sessions'), {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create awareness session');
      }

      return await res.json();
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

      const res = await fetchWithRetry(buildApiUrl('/asha/feedback'), {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to submit feedback');
      }

      return await res.json();
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

  // Reports (real data from backend; optional area, months, year)
  getReportData: async (area, months, year) => {
    try {
      const params = new URLSearchParams();
      if (area) params.set('area', area);
      if (months != null) params.set('months', String(months));
      if (year != null) params.set('year', String(year));
      const query = params.toString();
      const response = await apiCall(`/asha/reports${query ? `?${query}` : ''}`);
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

  // Cross-dashboard Integration
  getAlerts: async () => {
    try {
      // Must match field visit POST: same ashaArea as localStorage (User model often has no ashaArea)
      const area =
        (typeof window !== 'undefined' && localStorage.getItem('ashaArea')) || 'Default Area';
      const params = new URLSearchParams({ area }).toString();
      const response = await apiCall(`/asha/alerts?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  updateAlertStatus: async (alertId, statusData) => {
    try {
      const response = await apiCall(`/asha/alerts/${alertId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData)
      });
      return response;
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  },

  getRecentActivities: async () => {
    try {
      const response = await apiCall('/asha/activities/recent');
      return response;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  },

  updateNotificationStatus: async (notificationId, statusData) => {
    try {
      const response = await apiCall(`/asha/notifications/${notificationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData)
      });
      return response;
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  },

  // Forward data to AWW dashboard
  forwardToAWW: async (data) => {
    try {
      const response = await apiCall('/asha/forward/aww', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error forwarding to AWW:', error);
      throw error;
    }
  },

  // Forward data to Admin dashboard
  forwardToAdmin: async (data) => {
    try {
      const response = await apiCall('/asha/forward/admin', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error forwarding to Admin:', error);
      throw error;
    }
  },

  // Get verification status from AWW/Admin
  getVerificationStatus: async (recordId) => {
    try {
      const response = await apiCall(`/asha/verification/${recordId}`);
      return response;
    } catch (error) {
      console.error('Error fetching verification status:', error);
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
  },

  updateCrossDashboardAwarenessStats: async (sessionData) => {
    try {
      const updateData = {
        sessionType: 'awareness',
        sessionData: {
          sessionTitle: sessionData.sessionTitle,
          sessionDate: sessionData.sessionDate,
          audienceType: sessionData.audienceType,
          participantsCount: sessionData.participantsCount,
          description: sessionData.description,
          outcomes: sessionData.outcomes,
          venue: sessionData.venue,
          duration: sessionData.duration,
          facilitator: sessionData.facilitator,
          topics: sessionData.topics,
          materials: sessionData.materials,
          ashaArea: sessionData.ashaArea
        }
      };
      await apiCall('/asha/update-awareness-stats', {
        method: 'POST',
        body: JSON.stringify(updateData)
      });
    } catch (error) {
      console.error('Error updating cross-dashboard awareness stats:', error);
    }
  },

  // Scheme Awareness
  getSchemeAwareness: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiCall(`/asha/scheme-awareness${params ? `?${params}` : ''}`);
    return response;
  },
  postSchemeAwareness: async (data) => {
    const response = await apiCall('/asha/scheme-awareness', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  },

  // Beneficiary Lookup
  searchBeneficiaries: async (query, type = 'all') => {
    const params = new URLSearchParams({ q: query, type }).toString();
    const response = await apiCall(`/asha/beneficiaries/search?${params}`);
    return response;
  },
  getBeneficiariesBySupplement: async (supplement) => {
    const params = new URLSearchParams({ supplement }).toString();
    const response = await apiCall(`/asha/beneficiaries/by-supplement?${params}`);
    return response;
  },
  getBeneficiaryVisits: async (type, name, allAreas = false) => {
    const params = allAreas ? '?allAreas=1' : '';
    const response = await apiCall(`/asha/beneficiaries/${type}/${encodeURIComponent(name)}/visits${params}`);
    return response;
  },

  // AI Health Alerts
  getAiAlerts: async () => {
    const area =
      (typeof window !== 'undefined' && localStorage.getItem('ashaArea')) || 'Default Area';
    const params = new URLSearchParams({ area }).toString();
    const response = await apiCall(`/asha/ai-alerts?${params}`);
    return response;
  },
};

export default ashaService;
