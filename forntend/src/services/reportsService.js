import axios from 'axios';
import sessionManager from '../utils/sessionManager';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ReportsService {
  constructor() {
    this.api = axios.create({
      baseURL: `${BASE_URL}/reports`,
      timeout: 30000, // 30 seconds for PDF generation
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        // Try to get token from sessionManager first, then fallback to localStorage
        const token = sessionManager.getToken() || 
                      localStorage.getItem('authToken') || 
                      localStorage.getItem('firebaseToken') || 
                      localStorage.getItem('adminToken');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('⚠️ No authentication token found for reports API call');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Reports API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get dashboard statistics for reports overview
   */
  async getDashboardStats() {
    try {
      const response = await this.api.get('/dashboard-stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get anganwadi centers with detailed information
   */
  async getAnganwadiCenters(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.ward) params.append('ward', filters.ward);
      if (filters.status) params.append('status', filters.status);

      const response = await this.api.get(`/anganwadi-centers?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch anganwadi centers');
    }
  }

  /**
   * Download PDF report for a specific anganwadi center
   */
  async downloadAnganwadiPDF(centerName) {
    try {
      const response = await this.api.get(`/anganwadi-centers/${encodeURIComponent(centerName)}/pdf`, {
        responseType: 'blob',
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${centerName.replace(/\s+/g, '_')}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'PDF downloaded successfully' };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download PDF report');
    }
  }

  /**
   * Download consolidated PDF report for all anganwadi centers
   */
  async downloadConsolidatedPDF() {
    try {
      const response = await this.api.get('/consolidated-pdf', {
        responseType: 'blob',
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'All_Anganwadi_Centers_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Consolidated PDF downloaded successfully' };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download consolidated PDF report');
    }
  }

  /**
   * Get available wards for filtering
   */
  async getWards() {
    try {
      const response = await this.api.get('/wards');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch wards');
    }
  }

  /**
   * Generate chart data from API response
   */
  generateChartData(statsData) {
    const { distributions, overview, recentActivity } = statsData;

    // Worker distribution chart data
    const workerChartData = {
      labels: distributions.workerDistribution.map(item => item.anganwadiCenter),
      datasets: [
        {
          label: 'Anganwadi Workers',
          data: distributions.workerDistribution.map(item => item.anganwadiWorkers),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'ASHA Volunteers',
          data: distributions.workerDistribution.map(item => item.ashaVolunteers),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 4,
        }
      ]
    };

    // Children distribution chart data
    const childrenChartData = {
      labels: distributions.childrenDistribution.map(item => item.anganwadiCenter),
      datasets: [
        {
          label: 'Children Count',
          data: distributions.childrenDistribution.map(item => item.childrenCount),
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(236, 72, 153, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
        }
      ]
    };

    // Age group distribution pie chart data
    const ageGroupData = distributions.childrenDistribution.reduce(
      (acc, item) => {
        acc.age0to2 += item.age0to2 || 0;
        acc.age3to5 += item.age3to5 || 0;
        acc.age6plus += item.age6plus || 0;
        return acc;
      },
      { age0to2: 0, age3to5: 0, age6plus: 0 }
    );

    const ageGroupChartData = {
      labels: ['0-2 Years', '3-5 Years', '6+ Years'],
      datasets: [
        {
          data: [ageGroupData.age0to2, ageGroupData.age3to5, ageGroupData.age6plus],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(249, 115, 22, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(249, 115, 22, 1)',
          ],
          borderWidth: 3,
          hoverOffset: 10,
        }
      ]
    };

    // Beneficiary types polar area chart
    const beneficiaryTypesData = {
      labels: ['Children', 'Pregnant Women', 'Adolescents', 'Newborns'],
      datasets: [
        {
          data: [
            overview.totalChildren,
            overview.totalPregnantWomen,
            overview.totalAdolescents,
            overview.totalNewborns
          ],
          backgroundColor: [
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(249, 115, 22, 0.7)',
          ],
          borderColor: [
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(249, 115, 22, 1)',
          ],
          borderWidth: 2,
        }
      ]
    };

    // Monthly trends chart (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      return monthNames[monthIndex];
    });

    // Generate sample trend data (in real implementation, this would come from the API)
    const generateTrendData = (baseValue, variance = 0.2) => {
      return last6Months.map(() => {
        const randomFactor = 1 + (Math.random() - 0.5) * variance;
        return Math.round(baseValue * randomFactor);
      });
    };

    const monthlyTrendsData = {
      labels: last6Months,
      datasets: [
        {
          label: 'Children',
          data: generateTrendData(recentActivity.newChildren || 5),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Pregnant Women',
          data: generateTrendData(recentActivity.newPregnantWomen || 3),
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Adolescents',
          data: generateTrendData(recentActivity.newAdolescents || 4),
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }
      ]
    };

    return {
      workerDistribution: workerChartData,
      childrenDistribution: childrenChartData,
      ageGroupDistribution: ageGroupChartData,
      beneficiaryTypes: beneficiaryTypesData,
      monthlyTrends: monthlyTrendsData,
    };
  }

  /**
   * Format numbers with commas
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  /**
   * Calculate growth percentage
   */
  calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  }

  /**
   * Get status color based on value
   */
  getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data, filename) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Upload a daily activity report with optional file
   */
  async uploadDailyReport({
    anganwadiCenter,
    attendancePresent,
    attendanceTotal,
    nutritionDistributed,
    healthCheckups,
    vaccinations,
    notes,
    file
  }) {
    const formData = new FormData();
    if (anganwadiCenter) formData.append('anganwadiCenter', anganwadiCenter);
    if (attendancePresent !== undefined) formData.append('attendancePresent', attendancePresent);
    if (attendanceTotal !== undefined) formData.append('attendanceTotal', attendanceTotal);
    if (nutritionDistributed !== undefined) formData.append('nutritionDistributed', nutritionDistributed);
    if (healthCheckups !== undefined) formData.append('healthCheckups', healthCheckups);
    if (vaccinations !== undefined) formData.append('vaccinations', vaccinations);
    if (notes) formData.append('notes', notes);
    if (file) formData.append('reportFile', file);

    try {
      const response = await this.api.post('/daily', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit daily report');
    }
  }
}

export default new ReportsService();