import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class RegistrationService {
  // Helper method to get auth headers (Firebase token or direct-login authToken so dashboard works for all workers)
  async getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
        return headers;
      }
    } catch (e) {
      console.warn('Firebase token not available, using stored token if any');
    }
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || localStorage.getItem('firebaseToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
    throw new Error('User not authenticated');
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error Response:', data);

      // Handle validation errors specifically
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(`Validation failed: ${data.errors.join(', ')}`);
      }

      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Register a child
  async registerChild(childData) {
    try {
      console.log('📝 Registering child:', childData.name);
      console.log('📋 Child data being sent:', JSON.stringify(childData, null, 2));

      const headers = await this.getAuthHeaders();
      console.log('🔑 Auth headers:', headers);

      const response = await fetch(`${API_BASE_URL}/registration/child`, {
        method: 'POST',
        headers,
        body: JSON.stringify(childData)
      });

      console.log('📡 Response status:', response.status);

      const result = await this.handleResponse(response);

      console.log('✅ Child registration successful:', result);
      return result;

    } catch (error) {
      console.error('❌ Child registration failed:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  // Register a pregnant woman
  async registerPregnantWoman(womanData) {
    try {
      console.log('📝 Registering pregnant woman:', womanData.name);
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registration/pregnant-woman`, {
        method: 'POST',
        headers,
        body: JSON.stringify(womanData)
      });

      const result = await this.handleResponse(response);
      
      console.log('✅ Pregnant woman registration successful:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Pregnant woman registration failed:', error);
      throw error;
    }
  }

  // Register an adolescent
  async registerAdolescent(adolescentData) {
    try {
      console.log('📝 Registering adolescent:', adolescentData.name);
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registration/adolescent`, {
        method: 'POST',
        headers,
        body: JSON.stringify(adolescentData)
      });

      const result = await this.handleResponse(response);
      
      console.log('✅ Adolescent registration successful:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Adolescent registration failed:', error);
      throw error;
    }
  }

  // Register a newborn
  async registerNewborn(newbornData) {
    try {
      console.log('📝 Registering newborn:', newbornData.motherName);
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registration/newborn`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newbornData)
      });

      const result = await this.handleResponse(response);
      
      console.log('✅ Newborn registration successful:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Newborn registration failed:', error);
      throw error;
    }
  }

  // Get children for an anganwadi center
  async getChildren(params = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params.anganwadiCenter) queryParams.append('anganwadiCenter', params.anganwadiCenter);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `${API_BASE_URL}/registration/children${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const result = await this.handleResponse(response);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to fetch children:', error);
      throw error;
    }
  }

  // Get pregnant women for an anganwadi center
  async getPregnantWomen(params = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params.anganwadiCenter) queryParams.append('anganwadiCenter', params.anganwadiCenter);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `${API_BASE_URL}/registration/pregnant-women${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const result = await this.handleResponse(response);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to fetch pregnant women:', error);
      throw error;
    }
  }

  // Get adolescents for an anganwadi center
  async getAdolescents(params = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params.anganwadiCenter) queryParams.append('anganwadiCenter', params.anganwadiCenter);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `${API_BASE_URL}/registration/adolescents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const result = await this.handleResponse(response);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to fetch adolescents:', error);
      throw error;
    }
  }

  // Get newborns for an anganwadi center
  async getNewborns(params = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params.anganwadiCenter) queryParams.append('anganwadiCenter', params.anganwadiCenter);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `${API_BASE_URL}/registration/newborns${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const result = await this.handleResponse(response);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to fetch newborns:', error);
      throw error;
    }
  }

  // Get registration statistics
  async getRegistrationStats(anganwadiCenter) {
    try {
      const [children, pregnantWomen, adolescents, newborns] = await Promise.all([
        this.getChildren({ anganwadiCenter, status: 'active', limit: 1 }),
        this.getPregnantWomen({ anganwadiCenter, status: 'active', limit: 1 }),
        this.getAdolescents({ anganwadiCenter, status: 'active', limit: 1 }),
        this.getNewborns({ anganwadiCenter, status: 'active', limit: 1 })
      ]);

      return {
        children: children.data?.pagination?.total || 0,
        pregnantWomen: pregnantWomen.data?.pagination?.total || 0,
        adolescents: adolescents.data?.pagination?.total || 0,
        newborns: newborns.data?.pagination?.total || 0
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch registration stats:', error);
      throw error;
    }
  }

  // Update child information
  async updateChild(childId, updateData) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registration/child/${childId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      const result = await this.handleResponse(response);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to update child:', error);
      throw error;
    }
  }

  // Delete/deactivate registration
  async deactivateRegistration(type, id) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registration/${type}/${id}`, {
        method: 'DELETE',
        headers
      });

      const result = await this.handleResponse(response);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to deactivate ${type}:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const registrationService = new RegistrationService();
export default registrationService;
