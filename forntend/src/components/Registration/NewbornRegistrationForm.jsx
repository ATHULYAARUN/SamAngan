import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Baby, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Save,
  X,
  Clock
} from 'lucide-react';

const NewbornRegistrationForm = ({ onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    gender: '',
    motherName: '',
    motherAge: '',
    motherPhone: '',
    motherEmail: '',
    fatherName: '',
    fatherAge: '',
    fatherPhone: '',
    address: {
      street: '',
      village: '',
      block: '',
      district: '',
      state: '',
      pincode: ''
    },
    birthDetails: {
      placeOfBirth: '',
      deliveryType: '',
      attendedBy: '',
      complications: [],
      gestationalAge: ''
    },
    measurements: {
      birthWeight: '',
      birthLength: '',
      headCircumference: '',
      chestCircumference: ''
    },
    healthAssessment: {
      apgarScore: {
        oneMinute: '',
        fiveMinute: ''
      },
      bloodGroup: '',
      congenitalAnomalies: [],
      birthDefects: [],
      respiratoryDistress: false,
      feedingDifficulties: false,
      jaundice: false
    },
    feedingDetails: {
      breastfeedingInitiated: false,
      timeToFirstFeed: '',
      feedingType: 'exclusive-breastfeeding',
      feedingProblems: []
    },
    anganwadiCenter: '',
    specialNeeds: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if exactly 10 digits
    if (cleanPhone.length !== 10) return false;
    
    // Check for more than 2 consecutive zeros
    if (/000/.test(cleanPhone)) return false;
    
    // Check if all digits are the same (invalid)
    if (/^(\d)\1{9}$/.test(cleanPhone)) return false;
    
    // Check for invalid patterns (all zeros, starting with 0-5)
    if (cleanPhone.startsWith('0') || cleanPhone.startsWith('1') || cleanPhone.startsWith('2') || 
        cleanPhone.startsWith('3') || cleanPhone.startsWith('4') || cleanPhone.startsWith('5')) return false;
    
    return true;
  };

  // Phone number input handler
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow digits, block letters and special characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const truncatedPhone = digitsOnly.slice(0, 10);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: truncatedPhone
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Use special handler for phone fields
    if (name === 'motherPhone' || name === 'fatherPhone') {
      handlePhoneChange(e);
      return;
    }
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.timeOfBirth) newErrors.timeOfBirth = 'Time of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.motherName.trim()) newErrors.motherName = 'Mother name is required';
    if (!formData.motherAge) newErrors.motherAge = 'Mother age is required';
    if (!formData.motherPhone.trim()) newErrors.motherPhone = 'Mother phone is required';
    if (!formData.fatherName.trim()) newErrors.fatherName = 'Father name is required';
    if (!formData.anganwadiCenter.trim()) newErrors.anganwadiCenter = 'Anganwadi center is required';

    // Address validation
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.village.trim()) newErrors['address.village'] = 'Village is required';
    if (!formData.address.block.trim()) newErrors['address.block'] = 'Block is required';
    if (!formData.address.district.trim()) newErrors['address.district'] = 'District is required';
    if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
    if (!formData.address.pincode.trim()) newErrors['address.pincode'] = 'Pincode is required';

    // Birth details validation
    if (!formData.birthDetails.placeOfBirth) newErrors['birthDetails.placeOfBirth'] = 'Place of birth is required';
    if (!formData.birthDetails.deliveryType) newErrors['birthDetails.deliveryType'] = 'Delivery type is required';
    if (!formData.birthDetails.attendedBy) newErrors['birthDetails.attendedBy'] = 'Birth attendant is required';
    if (!formData.birthDetails.gestationalAge) newErrors['birthDetails.gestationalAge'] = 'Gestational age is required';

    // Measurements validation
    if (!formData.measurements.birthWeight) newErrors['measurements.birthWeight'] = 'Birth weight is required';
    if (!formData.measurements.birthLength) newErrors['measurements.birthLength'] = 'Birth length is required';

    // Validate phone numbers with enhanced validation
    if (formData.motherPhone) {
      if (!validatePhoneNumber(formData.motherPhone)) {
        newErrors.motherPhone = 'Please enter a valid 10-digit phone number (no consecutive zeros, must start with 6-9)';
      }
    }

    if (formData.fatherPhone && formData.fatherPhone.trim()) {
      if (!validatePhoneNumber(formData.fatherPhone)) {
        newErrors.fatherPhone = 'Please enter a valid 10-digit phone number (no consecutive zeros, must start with 6-9)';
      }
    }

    // Validate date of birth (should be within 6 weeks)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const diffTime = Math.abs(today - dob);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 42) {
        newErrors.dateOfBirth = 'Newborn registration is only for babies within 6 weeks of birth';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Baby className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Register Newborn</h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baby Name (if decided)
            </label>
            <div className="relative">
              <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
                placeholder="Enter baby's name (optional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
              />
            </div>
            {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time of Birth *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="time"
                name="timeOfBirth"
                value={formData.timeOfBirth}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
              />
            </div>
            {errors.timeOfBirth && <p className={errorClass}>{errors.timeOfBirth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && <p className={errorClass}>{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anganwadi Center *
            </label>
            <input
              type="text"
              name="anganwadiCenter"
              value={formData.anganwadiCenter}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter anganwadi center name"
            />
            {errors.anganwadiCenter && <p className={errorClass}>{errors.anganwadiCenter}</p>}
          </div>
        </div>

        {/* Mother Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mother Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter mother's name"
                />
              </div>
              {errors.motherName && <p className={errorClass}>{errors.motherName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother Age *
              </label>
              <input
                type="number"
                name="motherAge"
                value={formData.motherAge}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter mother's age"
                min="15"
                max="50"
              />
              {errors.motherAge && <p className={errorClass}>{errors.motherAge}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="motherPhone"
                  value={formData.motherPhone}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter mother's phone number"
                />
              </div>
              {errors.motherPhone && <p className={errorClass}>{errors.motherPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="motherEmail"
                  value={formData.motherEmail}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter mother's email (optional)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Father Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Father Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter father's name"
                />
              </div>
              {errors.fatherName && <p className={errorClass}>{errors.fatherName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father Age
              </label>
              <input
                type="number"
                name="fatherAge"
                value={formData.fatherAge}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter father's age"
                min="18"
                max="70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="fatherPhone"
                  value={formData.fatherPhone}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter father's phone number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Register Newborn</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default NewbornRegistrationForm;
