// Anganwadi Worker Service for API calls (uses shared apiClient with retry logic)

import { apiCall } from '../utils/apiClient';

const anganwadiService = {
  // Get awareness sessions from ASHA workers
  getAwarenessSessions: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await apiCall(`/anganwadi/awareness-sessions${params ? `?${params}` : ''}`);
      return response;
    } catch (error) {
      console.error('Error fetching awareness sessions:', error);
      throw error;
    }
  },

  // Get cross-dashboard awareness sessions
  getCrossDashboardAwarenessSessions: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await apiCall(`/anganwadi/awareness-sessions/cross-dashboard${params ? `?${params}` : ''}`);
      return response;
    } catch (error) {
      console.error('Error fetching cross-dashboard awareness sessions:', error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await apiCall('/anganwadi/dashboard-stats');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get children data
  getChildren: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/anganwadi/children${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  },

  // Update child data
  updateChild: async (childId, childData) => {
    try {
      const response = await apiCall(`/anganwadi/children/${childId}`, {
        method: 'PUT',
        body: JSON.stringify(childData)
      });
      return response;
    } catch (error) {
      console.error('Error updating child:', error);
      throw error;
    }
  },

  // Get nutrition data
  getNutritionData: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/anganwadi/nutrition${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      throw error;
    }
  },

  // Update nutrition data
  updateNutritionData: async (nutritionId, nutritionData) => {
    try {
      const response = await apiCall(`/anganwadi/nutrition/${nutritionId}`, {
        method: 'PUT',
        body: JSON.stringify(nutritionData)
      });
      return response;
    } catch (error) {
      console.error('Error updating nutrition data:', error);
      throw error;
    }
  },

  // Get immunization records
  getImmunizationRecords: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/anganwadi/immunization${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching immunization records:', error);
      throw error;
    }
  },

  // Update immunization record
  updateImmunizationRecord: async (recordId, recordData) => {
    try {
      const response = await apiCall(`/anganwadi/immunization/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(recordData)
      });
      return response;
    } catch (error) {
      console.error('Error updating immunization record:', error);
      throw error;
    }
  },

  // Get growth monitoring data
  getGrowthMonitoring: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/anganwadi/growth-monitoring${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching growth monitoring data:', error);
      throw error;
    }
  },

  // Add growth monitoring record
  addGrowthMonitoring: async (monitoringData) => {
    try {
      const response = await apiCall('/anganwadi/growth-monitoring', {
        method: 'POST',
        body: JSON.stringify(monitoringData)
      });
      return response;
    } catch (error) {
      console.error('Error adding growth monitoring record:', error);
      throw error;
    }
  },

  // Get preschool education data
  getPreschoolEducation: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/anganwadi/preschool-education${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching preschool education data:', error);
      throw error;
    }
  },

  // Update preschool education data
  updatePreschoolEducation: async (educationId, educationData) => {
    try {
      const response = await apiCall(`/anganwadi/preschool-education/${educationId}`, {
        method: 'PUT',
        body: JSON.stringify(educationData)
      });
      return response;
    } catch (error) {
      console.error('Error updating preschool education data:', error);
      throw error;
    }
  },

  // Verify ASHA data
  verifyASHAData: async (dataId, verificationData) => {
    try {
      const response = await apiCall(`/anganwadi/verify-asha-data/${dataId}`, {
        method: 'POST',
        body: JSON.stringify(verificationData)
      });
      return response;
    } catch (error) {
      console.error('Error verifying ASHA data:', error);
      throw error;
    }
  },

  // Get verification status
  getVerificationStatus: async (dataId) => {
    try {
      const response = await apiCall(`/anganwadi/verification-status/${dataId}`);
      return response;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      throw error;
    }
  },

  // Get reports
  getReports: async (reportType, filters = {}) => {
    try {
      const params = new URLSearchParams({ type: reportType, ...filters }).toString();
      const endpoint = `/anganwadi/reports${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiCall('/anganwadi/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get waste collection logs for this center (from Sanitation Worker Dashboard)
  getWasteLogsForCenter: async (center) => {
    try {
      const params = center ? new URLSearchParams({ center }).toString() : '';
      const endpoint = `/sanitation/waste-logs/for-center${params ? `?${params}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching waste logs for center:', error);
      throw error;
    }
  },

  // Get notifications
  getNotifications: async () => {
    try {
      const response = await apiCall('/anganwadi/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Update notification status
  updateNotificationStatus: async (notificationId, statusData) => {
    try {
      const response = await apiCall(`/anganwadi/notifications/${notificationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData)
      });
      return response;
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }
};

export default anganwadiService;
