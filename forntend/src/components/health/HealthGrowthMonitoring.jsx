import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Scale, 
  Ruler, 
  Activity, 
  Calendar, 
  Stethoscope,
  Plus,
  Edit3,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Syringe
} from 'lucide-react';
import healthService from '../../services/healthService';
import registrationService from '../../services/registrationService';

const HealthGrowthMonitoring = ({ anganwadiCenter = "Akkarakunnu Anganwadi" }) => {
  const [healthData, setHealthData] = useState(null);
  const [vaccinationSchedule, setVaccinationSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingChild, setEditingChild] = useState(null);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState(null);

  // Form states
  const [editForm, setEditForm] = useState({
    currentWeight: '',
    currentHeight: '',
    nutritionStatus: 'normal',
    bloodGroup: '',
    specialNeeds: ''
  });

  // Load health data (try registration API first, then health API as fallback for same center)
  const loadHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏥 Loading health data for:', anganwadiCenter);

      let children = [];

      try {
        const childrenResponse = await registrationService.getChildren({
          anganwadiCenter,
          status: 'active',
          limit: 50
        });
        children = childrenResponse?.data?.children || [];
      } catch (regErr) {
        console.warn('Registration service getChildren failed, trying health API:', regErr.message);
      }

      if (children.length === 0) {
        try {
          const healthResponse = await healthService.getChildrenHealthData(anganwadiCenter);
          const raw = healthResponse?.data?.children ?? healthResponse?.children ?? [];
          children = Array.isArray(raw) ? raw : [];
        } catch (healthErr) {
          console.warn('Health API getChildren failed:', healthErr.message);
        }
      }

      if (children.length === 0) {
        setHealthData([]);
        setVaccinationSchedule([]);
        setError(null);
        console.log('No children found for center:', anganwadiCenter);
      } else {
        const formattedData = healthService.formatHealthDataForDisplay(children);
        setHealthData(formattedData);
        const formattedSchedule = healthService.formatVaccinationSchedule(children);
        setVaccinationSchedule(formattedSchedule);
        setError(null);
        console.log('✅ Health data loaded:', formattedData.length, 'children');
      }
    } catch (err) {
      console.error('❌ Failed to load health data:', err);
      let errorMessage = err?.message || 'Failed to load health data. Please try again.';
      if (err?.message?.includes('Invalid response format')) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [anganwadiCenter]);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  // Handle edit child health
  const handleEditChild = (child) => {
    setEditingChild(child.id);
    setEditForm({
      currentWeight: child.weight || '',
      currentHeight: child.height || '',
      nutritionStatus: child.nutritionStatus || 'normal',
      bloodGroup: child.bloodGroup || '',
      specialNeeds: child.specialNeeds || ''
    });
  };

  // Handle save health data
  const handleSaveHealth = async () => {
    try {
      await healthService.updateChildHealth(editingChild, editForm);
      setEditingChild(null);
      await loadHealthData();
      alert('Health data updated successfully!');
    } catch (error) {
      console.error('Error updating health data:', error);
      alert('Failed to update health data: ' + error.message);
    }
  };

  // Handle vaccination recording
  const handleRecordVaccination = async (vaccinationData) => {
    try {
      await healthService.recordVaccination(selectedVaccination.childId, {
        vaccineName: selectedVaccination.vaccineName,
        dateGiven: vaccinationData.dateGiven,
        batchNumber: vaccinationData.batchNumber,
        givenBy: vaccinationData.givenBy
      });
      
      setShowVaccinationModal(false);
      setSelectedVaccination(null);
      await loadHealthData();
      alert('Vaccination recorded successfully!');
    } catch (error) {
      console.error('Error recording vaccination:', error);
      alert('Failed to record vaccination: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Health Data</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadHealthData}
              className="mt-3 bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health & Growth Monitoring</h2>
          <p className="text-gray-600">Track children's health metrics and vaccination schedule</p>
        </div>
        <button
          onClick={loadHealthData}
          className="bg-pink-100 text-pink-700 px-4 py-2 rounded-lg hover:bg-pink-200"
        >
          <Activity className="w-4 h-4 mr-2 inline" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Growth Monitoring */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Growth Monitoring</h3>
            <Heart className="w-6 h-6 text-pink-600" />
          </div>

          <div className="space-y-4">
            {healthData && healthData.length > 0 ? (
              healthData.map((child) => (
                <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                  {editingChild === child.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{child.name}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveHealth}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingChild(null)}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.currentWeight}
                            onChange={(e) => setEditForm({...editForm, currentWeight: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Height (cm)
                          </label>
                          <input
                            type="number"
                            value={editForm.currentHeight}
                            onChange={(e) => setEditForm({...editForm, currentHeight: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nutrition Status
                          </label>
                          <select
                            value={editForm.nutritionStatus}
                            onChange={(e) => setEditForm({...editForm, nutritionStatus: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pink-500"
                          >
                            <option value="normal">Normal</option>
                            <option value="underweight">Underweight</option>
                            <option value="severely-underweight">Severely Underweight</option>
                            <option value="overweight">Overweight</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Blood Group
                          </label>
                          <select
                            value={editForm.bloodGroup}
                            onChange={(e) => setEditForm({...editForm, bloodGroup: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pink-500"
                          >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Special Needs
                        </label>
                        <input
                          type="text"
                          value={editForm.specialNeeds}
                          onChange={(e) => setEditForm({...editForm, specialNeeds: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pink-500"
                          placeholder="Any special needs or conditions"
                        />
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{child.name}</h4>
                          <button
                            onClick={() => handleEditChild(child)}
                            className="p-1 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-gray-600">{child.displayAge}</span>
                          </div>
                          <div className="flex items-center">
                            <Scale className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-gray-600">{child.displayWeight}</span>
                          </div>
                          <div className="flex items-center">
                            <Ruler className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-gray-600">{child.displayHeight}</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${child.statusColor}`}>
                              {child.nutritionStatus}
                            </span>
                          </div>
                        </div>
                        {child.specialNeeds && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <strong>Special Needs:</strong> {child.specialNeeds}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Stethoscope className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No children found for health monitoring</p>
                <p className="text-sm mt-1">Center: <strong className="text-gray-700">{anganwadiCenter}</strong></p>
                <p className="text-sm mt-2">Register children at this center first, or use Refresh once the backend is connected.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Vaccination Schedule */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vaccination Schedule</h3>
            <Syringe className="w-6 h-6 text-purple-600" />
          </div>

          <div className="space-y-4">
            {vaccinationSchedule.length > 0 ? (
              vaccinationSchedule.slice(0, 5).map((vaccination, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{vaccination.childName}</p>
                    <p className="text-sm text-gray-600">
                      {vaccination.vaccineName} - {new Date(vaccination.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${vaccination.statusColor}`}>
                      {vaccination.status}
                    </span>
                    {vaccination.status === 'due' || vaccination.status === 'overdue' ? (
                      <button
                        onClick={() => {
                          setSelectedVaccination(vaccination);
                          setShowVaccinationModal(true);
                        }}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                        title="Record vaccination"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No pending vaccinations</p>
                <p className="text-sm">All children are up to date with their vaccines</p>
              </div>
            )}

            {vaccinationSchedule.length > 5 && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {vaccinationSchedule.length - 5} more vaccinations pending
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Vaccination Recording Modal */}
      {showVaccinationModal && selectedVaccination && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Record Vaccination</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Child: <strong>{selectedVaccination.childName}</strong></p>
                <p className="text-sm text-gray-600">Vaccine: <strong>{selectedVaccination.vaccineName}</strong></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Given</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  id="vaccinationDate"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Vaccine batch number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  id="batchNumber"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Given By</label>
                <input 
                  type="text" 
                  placeholder="Health worker name"
                  defaultValue="Anganwadi Worker"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  id="givenBy"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => {
                  const dateGiven = document.getElementById('vaccinationDate').value;
                  const batchNumber = document.getElementById('batchNumber').value;
                  const givenBy = document.getElementById('givenBy').value;
                  
                  handleRecordVaccination({ dateGiven, batchNumber, givenBy });
                }}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Record Vaccination
              </button>
              <button 
                onClick={() => {
                  setShowVaccinationModal(false);
                  setSelectedVaccination(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HealthGrowthMonitoring;