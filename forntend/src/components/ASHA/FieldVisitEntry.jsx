import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Scale, 
  Activity, 
  Droplet,
  Heart,
  Pill,
  FileText,
  Save,
  X
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const FieldVisitEntry = ({ onSuccess }) => {
  const MotionDiv = motion.div;
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    personType: 'child', // child, woman, adolescent
    personName: '',
    age: '',
    weight: '',
    height: '',
    hemoglobin: '',
    bloodPressure: '',
    vaccination: {
      type: '',
      dose: '',
      date: ''
    },
    supplements: {
      iron: false,
      vitaminA: false,
      deworming: false
    },
    remarks: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Validation helpers
  const cleanName = (val) => {
    if (!val) return '';
    return val
      .replace(/[^A-Za-z\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s+/, '');
  };

  const cleanNumber = (val, max = 999) => {
    if (!val) return '';
    let num = val.replace(/\D/g, '');
    if (parseInt(num) > max) num = max.toString();
    return num;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'vaccination') {
        setFormData(prev => ({
          ...prev,
          vaccination: {
            ...prev.vaccination,
            [child]: value
          }
        }));
      } else if (parent === 'supplements') {
        setFormData(prev => ({
          ...prev,
          supplements: {
            ...prev.supplements,
            [child]: checked
          }
        }));
      }
    } else {
      let cleaned = value;
      
      if (name === 'personName') {
        cleaned = cleanName(value);
        setErrors(prev => ({ ...prev, [name]: '' }));
      } else if (name === 'age') {
        cleaned = cleanNumber(value, 100);
      } else if (name === 'weight') {
        cleaned = cleanNumber(value, 200);
      } else if (name === 'height') {
        cleaned = cleanNumber(value, 250);
      } else if (name === 'hemoglobin') {
        // Allow decimal for hemoglobin (0-20)
        cleaned = value.replace(/[^\d.]/g, '');
        if (parseFloat(cleaned) > 20) cleaned = '20';
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : cleaned
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.personName.trim()) newErrors.personName = 'Name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.visitDate) newErrors.visitDate = 'Visit date is required';

    // Name format validation
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (formData.personName && !nameRegex.test(formData.personName)) {
      newErrors.personName = 'Use letters only with single spaces';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const ashaArea = localStorage.getItem('ashaArea') || 'Default Area';
      
      await ashaService.createFieldVisit({
        ...formData,
        ashaArea
      });
      
      alert('Field visit recorded successfully!');
      
      // Reset form
      setFormData({
        visitDate: new Date().toISOString().split('T')[0],
        personType: 'child',
        personName: '',
        age: '',
        weight: '',
        height: '',
        hemoglobin: '',
        bloodPressure: '',
        vaccination: { type: '', dose: '', date: '' },
        supplements: { iron: false, vitaminA: false, deworming: false },
        remarks: ''
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating field visit:', error);
      alert(`Failed to record visit: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Household Visit Entry</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visit Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
              />
            </div>
            {errors.visitDate && <p className={errorClass}>{errors.visitDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Person Type *
            </label>
            <select
              name="personType"
              value={formData.personType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="child">Child (0-6 years)</option>
              <option value="woman">Pregnant Woman</option>
              <option value="adolescent">Adolescent Girl</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age *
            </label>
            <input
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter age"
            />
            {errors.age && <p className={errorClass}>{errors.age}</p>}
          </div>
        </div>

        {/* Person Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="personName"
              value={formData.personName}
              onChange={handleChange}
              className={`${inputClass} pl-12 ${errors.personName ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Enter full name"
            />
          </div>
          {errors.personName && <p className={errorClass}>{errors.personName}</p>}
          {!errors.personName && (
            <p className="text-xs text-gray-500 mt-1">Letters only. Use single spaces between words.</p>
          )}
        </div>

        {/* Health Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="e.g., 12.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="e.g., 85"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hemoglobin (g/dL)
              </label>
              <div className="relative">
                <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="hemoglobin"
                  value={formData.hemoglobin}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="e.g., 11.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Pressure
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="e.g., 120/80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vaccination Record */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccination Record (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vaccine Type
              </label>
              <input
                type="text"
                name="vaccination.type"
                value={formData.vaccination.type}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g., BCG, DPT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dose
              </label>
              <input
                type="text"
                name="vaccination.dose"
                value={formData.vaccination.dose}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g., 1st dose"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vaccination Date
              </label>
              <input
                type="date"
                name="vaccination.date"
                value={formData.vaccination.date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Nutrition Supplements */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Supplements Provided</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="supplements.iron"
                checked={formData.supplements.iron}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                <Pill className="w-4 h-4 inline mr-1" />
                Iron Tablets
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="supplements.vitaminA"
                checked={formData.supplements.vitaminA}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                <Pill className="w-4 h-4 inline mr-1" />
                Vitamin A
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="supplements.deworming"
                checked={formData.supplements.deworming}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                <Pill className="w-4 h-4 inline mr-1" />
                Deworming Tablets
              </label>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks / Observations
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={4}
              className={`${inputClass} pl-12`}
              placeholder="Any additional observations or notes..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Visit Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </MotionDiv>
  );
};

export default FieldVisitEntry;
