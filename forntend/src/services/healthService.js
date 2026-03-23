import apiClient from '../utils/apiClient';

class HealthService {
  constructor() {
    this.baseURL = '/api/health';
  }

  // Get children's health data for a specific Anganwadi center
  async getChildrenHealthData(anganwadiCenter) {
    try {
      console.log('🏥 Fetching health data for:', anganwadiCenter);
      
      const response = await apiClient.get(`${this.baseURL}/children`, {
        params: { anganwadiCenter }
      });
      
      // Check if response has data
      if (!response || !response.data) {
        throw new Error('Empty response from server');
      }
      
      console.log('📊 Health data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching health data:', error);
      
      // Handle specific JSON parsing errors
      if (error.message?.includes('JSON') || error.name === 'SyntaxError') {
        throw new Error('Invalid response format from server. Please check your connection.');
      }
      
      throw error;
    }
  }

  // Update child's health metrics
  async updateChildHealth(childId, healthData) {
    try {
      console.log('📝 Updating health data for child:', childId, healthData);
      
      const response = await apiClient.put(`${this.baseURL}/children/${childId}`, healthData);
      
      console.log('✅ Health data updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating health data:', error);
      throw error;
    }
  }

  // Get vaccination schedule for children
  async getVaccinationSchedule(anganwadiCenter) {
    try {
      console.log('💉 Fetching vaccination schedule for:', anganwadiCenter);
      
      const response = await apiClient.get(`${this.baseURL}/vaccinations`, {
        params: { anganwadiCenter }
      });
      
      // Check if response has data
      if (!response || !response.data) {
        throw new Error('Empty response from server');
      }
      
      console.log('📅 Vaccination schedule received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vaccination schedule:', error);
      
      // Handle specific JSON parsing errors
      if (error.message?.includes('JSON') || error.name === 'SyntaxError') {
        throw new Error('Invalid response format from server. Please check your connection.');
      }
      
      throw error;
    }
  }

  // Get health statistics for dashboard (vaccinations due, nutrition stats, etc.)
  async getHealthStatistics(anganwadiCenter) {
    try {
      const response = await apiClient.get(`${this.baseURL}/statistics`, {
        params: { anganwadiCenter }
      });
      return response?.data?.data || { vaccinationsDue: 0, totalChildren: 0, nutritionStats: {} };
    } catch (error) {
      console.error('❌ Error fetching health statistics:', error);
      return { vaccinationsDue: 0, totalChildren: 0, nutritionStats: {} };
    }
  }

  // Record vaccination
  async recordVaccination(childId, vaccinationData) {
    try {
      console.log('💉 Recording vaccination for child:', childId, vaccinationData);
      
      const response = await apiClient.post(`${this.baseURL}/children/${childId}/vaccinations`, vaccinationData);
      
      console.log('✅ Vaccination recorded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error recording vaccination:', error);
      throw error;
    }
  }

  // Calculate nutrition status based on WHO growth standards
  calculateNutritionStatus(age, weight, height, gender) {
    // Simplified calculation - in real implementation, this would use WHO z-scores
    if (!age || !weight) return 'unknown';
    
    const expectedWeightRanges = {
      1: { male: [8, 12], female: [7.5, 11.5] },
      2: { male: [10, 15], female: [9.5, 14.5] },
      3: { male: [12, 17], female: [11.5, 16.5] },
      4: { male: [14, 20], female: [13.5, 19] },
      5: { male: [16, 23], female: [15.5, 22] }
    };
    
    const range = expectedWeightRanges[age]?.[gender];
    if (!range) return 'normal';
    
    if (weight < range[0] * 0.8) return 'severely-underweight';
    if (weight < range[0]) return 'underweight';
    if (weight > range[1] * 1.2) return 'overweight';
    
    return 'normal';
  }

  // Format health data for display
  formatHealthDataForDisplay(children) {
    return children.map(child => ({
      id: child._id,
      name: child.name,
      age: child.age,
      ageInMonths: child.ageInMonths,
      weight: child.currentWeight,
      height: child.currentHeight,
      nutritionStatus: child.nutritionStatus || this.calculateNutritionStatus(
        child.age, 
        child.currentWeight, 
        child.currentHeight, 
        child.gender
      ),
      bloodGroup: child.bloodGroup,
      vaccinations: child.vaccinations || [],
      medicalHistory: child.medicalHistory || {},
      specialNeeds: child.specialNeeds,
      lastHealthCheck: child.updatedAt,
      statusColor: this.getStatusColor(child.nutritionStatus),
      displayAge: child.age < 2 ? `${child.ageInMonths} months` : `${child.age} years`,
      displayWeight: child.currentWeight ? `${child.currentWeight}kg` : 'Not recorded',
      displayHeight: child.currentHeight ? `${child.currentHeight}cm` : 'Not recorded'
    }));
  }

  // Get status color for nutrition status
  getStatusColor(status) {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'underweight':
        return 'bg-yellow-100 text-yellow-800';
      case 'severely-underweight':
        return 'bg-red-100 text-red-800';
      case 'overweight':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Format vaccination schedule for display
  formatVaccinationSchedule(children) {
    const allVaccinations = [];
    
    children.forEach(child => {
      // Get pending vaccinations based on age
      const pendingVaccinations = this.getPendingVaccinations(child);
      
      pendingVaccinations.forEach(vaccination => {
        allVaccinations.push({
          childId: child._id,
          childName: child.name,
          vaccineName: vaccination.name,
          dueDate: vaccination.dueDate,
          status: vaccination.status,
          statusColor: this.getVaccinationStatusColor(vaccination.status)
        });
      });
    });
    
    // Sort by due date
    return allVaccinations.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // Get pending vaccinations for a child based on age
  getPendingVaccinations(child) {
    const vaccinations = [];
    const ageInMonths = child.ageInMonths;
    const givenVaccinations = child.vaccinations?.map(v => v.vaccineName) || [];
    
    // Standard vaccination schedule for India (simplified)
    const schedule = [
      { name: 'BCG', dueAge: 0, description: 'Birth' },
      { name: 'Hepatitis B (Birth dose)', dueAge: 0, description: 'Birth' },
      { name: 'OPV 1', dueAge: 6, description: '6 weeks' },
      { name: 'DPT 1', dueAge: 6, description: '6 weeks' },
      { name: 'Hepatitis B 1', dueAge: 6, description: '6 weeks' },
      { name: 'OPV 2', dueAge: 10, description: '10 weeks' },
      { name: 'DPT 2', dueAge: 10, description: '10 weeks' },
      { name: 'Hepatitis B 2', dueAge: 10, description: '10 weeks' },
      { name: 'OPV 3', dueAge: 14, description: '14 weeks' },
      { name: 'DPT 3', dueAge: 14, description: '14 weeks' },
      { name: 'Hepatitis B 3', dueAge: 14, description: '14 weeks' },
      { name: 'MMR 1', dueAge: 9, description: '9 months' },
      { name: 'DPT Booster', dueAge: 18, description: '18 months' },
      { name: 'MMR 2', dueAge: 24, description: '2 years' }
    ];
    
    schedule.forEach(vaccine => {
      if (!givenVaccinations.includes(vaccine.name)) {
        const dueDate = new Date(child.dateOfBirth);
        dueDate.setMonth(dueDate.getMonth() + vaccine.dueAge);
        
        let status = 'scheduled';
        if (ageInMonths >= vaccine.dueAge) {
          const daysPast = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24));
          if (daysPast > 30) status = 'overdue';
          else if (daysPast > 0) status = 'due';
        }
        
        vaccinations.push({
          name: vaccine.name,
          dueDate: dueDate.toISOString().split('T')[0],
          status,
          description: vaccine.description
        });
      }
    });
    
    return vaccinations;
  }

  // Get vaccination status color
  getVaccinationStatusColor(status) {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'due':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

const healthService = new HealthService();
export default healthService;