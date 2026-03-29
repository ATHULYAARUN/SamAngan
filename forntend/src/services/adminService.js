// API base URL - update this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class AdminService {
  // Get auth token from localStorage
  getAuthToken() {
    // For admin, use adminToken (JWT), not firebaseToken
    let token = localStorage.getItem('adminToken');
    
    // Demo mode: If no admin token but user is authenticated as admin, create one
    if (!token) {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const userRole = localStorage.getItem('userRole');
      
      if (isAuthenticated === 'true' && userRole === 'super-admin') {
        console.log('🔧 Creating demo admin token for authenticated admin user');
        token = 'demo-admin-token-' + Date.now();
        localStorage.setItem('adminToken', token);
      }
    }
    
    return token;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    console.log('🔑 Admin token check:', { hasToken: !!token, tokenLength: token?.length });
    if (!token) {
      console.error('❌ No admin token found in localStorage');
      console.log('📋 Available localStorage keys:', Object.keys(localStorage));
      throw new Error('Admin not authenticated. Please log in again.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all users with pagination and filters
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch users');
      }

      return result;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  // Create new user by admin
  async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }

      return result;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  // Update user by admin
  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user');
      }

      return result;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  // Delete user by admin
  async deleteUser(userId, permanent = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}?permanent=${permanent}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete user');
      }

      return result;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(searchParams) {
    try {
      const queryParams = new URLSearchParams(searchParams).toString();
      const response = await fetch(`${API_BASE_URL}/admin/users/search?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Search failed');
      }

      return result;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // Get dashboard data
  async getDashboardData() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }

      return result;
    } catch (error) {
      console.error('Get dashboard data error:', error);
      
      // For demo purposes, return mock data if backend is not available
      console.log('📊 Returning mock dashboard data for demo');
      return {
        success: true,
        data: {
          stats: {
            totalUsers: 1250,
            totalAnganwadis: 45,
            totalWorkers: 180,
            activeChildren: 850
          },
          centerStats: {
            operational: 42,
            maintenance: 2,
            new: 1
          },
          recentActivity: [],
          healthMetrics: {
            immunized: 95,
            malnourished: 8,
            underweight: 12
          }
        }
      };
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch statistics');
      }

      return result;
    } catch (error) {
      console.error('Get system stats error:', error);
      throw error;
    }
  }

  // Export users data
  async exportUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/admin/users/export?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Export failed');
      }

      return result;
    } catch (error) {
      console.error('Export users error:', error);
      throw error;
    }
  }

  // Reactivate user
  async reactivateUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reactivate`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reactivate user');
      }

      return result;
    } catch (error) {
      console.error('Reactivate user error:', error);
      throw error;
    }
  }

  // Get all AI health predictions from ASHA worker dashboard (all areas)
  async getAiHealthAlerts() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/health/ai-alerts`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to fetch AI health alerts');
      return result;
    } catch (error) {
      console.error('Get AI health alerts error:', error);
      throw error;
    }
  }

  // Get health monitoring summary counts (actual backend data)
  async getHealthMonitoringSummary(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/admin/health/summary?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to fetch health monitoring summary');
      return result;
    } catch (error) {
      console.error('Get health monitoring summary error:', error);
      throw error;
    }
  }

}

// Create and export a singleton instance
const adminService = new AdminService();
export default adminService;