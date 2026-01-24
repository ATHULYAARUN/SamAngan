import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Save,
  X,
  GraduationCap
} from 'lucide-react';

const AdolescentRegistrationForm = ({ onSubmit, onCancel, isLoading = false }) => {
  // Create a PascalCase component to satisfy lint rules and keep animation API
  const MotionDiv = motion.div;
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    relationToAdolescent: '',
    address: {
      street: '',
      village: '',
      block: '',
      district: '',
      state: '',
      pincode: ''
    },
    education: {
      schoolName: '',
      grade: '',
      isInSchool: true,
      dropoutReason: '',
      educationLevel: 'middle'
    },
    height: '',
    weight: '',
    bloodGroup: '',
    menstrualHealth: {
      hasMenstruationStarted: false,
      ageAtMenarche: '',
      menstrualCycleLength: '',
      lastMenstrualPeriod: '',
      menstrualProblems: [],
      hygieneEducationReceived: false
    },
    medicalHistory: {
      allergies: [],
      chronicConditions: [],
      disabilities: [],
      medications: [],
      previousSurgeries: []
    },
    nutritionStatus: 'normal',
    anganwadiCenter: '',
    specialNeeds: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Helper functions for real-time validation and cleaning
  const cleanName = (value) => {
    // Remove numbers and special characters, allow only letters and single spaces
    let cleaned = value.replace(/[^A-Za-z\s]/g, '');
    // Replace multiple spaces with single space
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    return cleaned;
  };

  const cleanPhone = (value) => {
    // Remove all non-digit characters
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const cleanEmail = (value) => {
    // Basic email cleaning - remove spaces
    return value.trim().toLowerCase();
  };

  const validatePhoneRealtime = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (/0{3,}/.test(digits)) return 'Phone number cannot have 3 consecutive zeros';
    if (digits.length < 10) return `Please enter 10 digits (${digits.length}/10)`;
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let cleaned = value;

    // Field-specific cleaning and real-time validation
    if (name === 'name' || name === 'parentName') {
      cleaned = cleanName(value);
      setErrors(prev => ({ ...prev, [name]: '' }));
    } else if (name === 'phone' || name === 'parentPhone') {
      cleaned = cleanPhone(value);
      const msg = validatePhoneRealtime(cleaned);
      setErrors(prev => ({ ...prev, [name]: msg }));
    } else if (name === 'email' || name === 'parentEmail') {
      cleaned = cleanEmail(value);
      let msg = '';
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (cleaned && !emailRegex.test(cleaned)) msg = 'Enter a valid email like example@gmail.com';
      setErrors(prev => ({ ...prev, [name]: msg }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address' && child === 'pincode') {
        cleaned = (value || '').replace(/\D/g, '').slice(0, 6);
        let msg = '';
        if (cleaned && cleaned.length !== 6) msg = `Please enter a valid 6-digit pincode (${cleaned.length}/6)`;
        setErrors(prev => ({ ...prev, [name]: msg }));
      }
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : cleaned
        }
      }));
      return;
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : cleaned
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : cleaned
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required';
    if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required';
    if (!formData.relationToAdolescent) newErrors.relationToAdolescent = 'Relation is required';
    if (!formData.anganwadiCenter.trim()) newErrors.anganwadiCenter = 'Anganwadi center is required';

    // Address validation
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.village.trim()) newErrors['address.village'] = 'Village is required';
    if (!formData.address.block.trim()) newErrors['address.block'] = 'Block is required';
    if (!formData.address.district.trim()) newErrors['address.district'] = 'District is required';
    if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
    if (!formData.address.pincode.trim()) {
      newErrors['address.pincode'] = 'Pincode is required';
    } else {
      const pincodeRegex = /^[0-9]{6}$/;
      if (!pincodeRegex.test(formData.address.pincode)) {
        newErrors['address.pincode'] = 'Please enter a valid 6-digit pincode';
      }
    }

    // Name format validation (letters and single spaces only)
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (formData.name && !nameRegex.test(formData.name)) {
      newErrors.name = 'Use letters only with single spaces between names';
    }
    if (formData.parentName && !nameRegex.test(formData.parentName)) {
      newErrors.parentName = 'Use letters only with single spaces between names';
    }

    // Phone validation - exactly 10 digits
    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
    if (phoneDigits && /0{3,}/.test(phoneDigits)) {
      newErrors.phone = 'Phone number cannot have 3 consecutive zeros';
    } else if (formData.phone && phoneDigits.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Parent phone validation - exactly 10 digits (required)
    const parentPhoneDigits = (formData.parentPhone || '').replace(/\D/g, '');
    if (/0{3,}/.test(parentPhoneDigits)) {
      newErrors.parentPhone = 'Phone number cannot have 3 consecutive zeros';
    } else if (parentPhoneDigits.length !== 10) {
      newErrors.parentPhone = 'Please enter a valid 10-digit phone number';
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address (must include @)';
    }
    if (formData.parentEmail && !emailRegex.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid email address (must include @)';
    }

    // Validate age (10-19 years)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 10 || age > 19) {
        newErrors.dateOfBirth = 'Age must be between 10 and 19 years';
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

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Register Adolescent</h2>
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
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
                placeholder="Enter full name"
              />
            </div>
            {errors.name && <p className={errorClass}>{errors.name}</p>}
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
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
                placeholder="Enter phone number (optional)"
              />
            </div>
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
                placeholder="Enter email address (optional)"
              />
            </div>
            {errors.email && <p className={errorClass}>{errors.email}</p>}
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

        {/* Parent Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter parent/guardian name"
                />
              </div>
              {errors.parentName && <p className={errorClass}>{errors.parentName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter parent phone number"
                />
              </div>
              {errors.parentPhone && <p className={errorClass}>{errors.parentPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter parent email (optional)"
                />
              </div>
              {errors.parentEmail && <p className={errorClass}>{errors.parentEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relation to Adolescent *
              </label>
              <select
                name="relationToAdolescent"
                value={formData.relationToAdolescent}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select relation</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="grandmother">Grandmother</option>
                <option value="grandfather">Grandfather</option>
                <option value="aunt">Aunt</option>
                <option value="uncle">Uncle</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
              {errors.relationToAdolescent && <p className={errorClass}>{errors.relationToAdolescent}</p>}
            </div>
          </div>
        </div>

        {/* Education Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Education Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="education.schoolName"
                  value={formData.education.schoolName}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter school name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade/Class
              </label>
              <input
                type="text"
                name="education.grade"
                value={formData.education.grade}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter current grade/class"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currently in School?
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="education.isInSchool"
                    value="true"
                    checked={formData.education.isInSchool === true}
                    onChange={() => handleChange({
                      target: { name: 'education.isInSchool', value: true, type: 'checkbox', checked: true }
                    })}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="education.isInSchool"
                    value="false"
                    checked={formData.education.isInSchool === false}
                    onChange={() => handleChange({
                      target: { name: 'education.isInSchool', value: false, type: 'checkbox', checked: false }
                    })}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <select
                name="education.educationLevel"
                value={formData.education.educationLevel}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="primary">Primary</option>
                <option value="middle">Middle</option>
                <option value="secondary">Secondary</option>
                <option value="higher-secondary">Higher Secondary</option>
                <option value="graduate">Graduate</option>
                <option value="dropout">Dropout</option>
              </select>
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
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Register Adolescent</span>
              </>
            )}
          </button>
        </div>
      </form>
    </MotionDiv>
  );
};

export default AdolescentRegistrationForm;
