import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
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
  AlertCircle,
  Upload,
  FileText,
  Building
} from 'lucide-react';

const ChildRegistrationForm = ({ onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    relationToChild: '',
    address: {
      street: '',
      village: 'Elikkullam',
      block: 'Pampady',
      district: 'Kottayam',
      state: 'Kerala',
      pincode: '686522'
    },
    anganwadiCenter: '',
    birthCertificate: null,
    birthWeight: '',
    currentWeight: '',
    currentHeight: '',
    bloodGroup: '',
    medicalHistory: {
      allergies: [],
      chronicConditions: [],
      disabilities: [],
      medications: []
    },
    specialNeeds: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [currentAllergy, setCurrentAllergy] = useState('');
  
  // Real-time field validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    parentName: '',
    parentPhone: '',
    parentEmail: ''
  });

  // Anganwadi Centers from database
  const anganwadiCenters = [
    {
      id: 1,
      name: 'Akkarakkunnu Anganwadi',
      code: 'AWC09001',
      location: 'Akkarakkunnu, Kottayam, Kerala',
      ward: 9
    },
    {
      id: 2,
      name: 'Veliyanoor Anganwadi',
      code: 'AWC09002',
      location: 'Veliyanoor, Kottayam, Kerala',
      ward: 9
    }
  ];

  // Helper function to calculate age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const ageInYears = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
    const ageInMonths = Math.floor((today - dob) / (30.44 * 24 * 60 * 60 * 1000));
    
    if (ageInYears >= 1) {
      return `${ageInYears} year${ageInYears !== 1 ? 's' : ''} old`;
    } else {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    }
  };

  // Get current age for display
  const currentAge = calculateAge(formData.dateOfBirth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let validatedValue = value;
    let errorMessage = '';
    
    // Prevent modification of default location fields
    const nonEditableFields = ['address.village', 'address.block', 'address.district', 'address.state', 'address.pincode'];
    if (nonEditableFields.includes(name)) {
      return; // Don't allow changes to these fields
    }
    
    // Validate name fields (child name and parent name)
    if (name === 'name' || name === 'parentName') {
      // Only allow letters and single spaces between words
      validatedValue = value.replace(/[^a-zA-Z\s]/g, '').replace(/\s{2,}/g, ' ');
      
      // Real-time validation
      if (validatedValue && !/^[a-zA-Z\s]+$/.test(validatedValue)) {
        errorMessage = 'Only letters and spaces are allowed';
      } else if (value !== validatedValue) {
        errorMessage = 'Numbers and special characters are not allowed';
      }
    }
    
    // Validate phone field
    if (name === 'parentPhone') {
      // Only allow digits and limit to 10
      validatedValue = value.replace(/\D/g, '').slice(0, 10);
      
      // Check for more than 3 consecutive zeros
      if (/0{4,}/.test(validatedValue)) {
        errorMessage = 'Cannot have more than 3 consecutive zeros';
        validatedValue = validatedValue.replace(/0{4,}/g, '000');
      }
      
      // Real-time validation
      if (validatedValue.length > 0 && validatedValue.length < 10) {
        errorMessage = `Phone number must be 10 digits (${validatedValue.length}/10)`;
      } else if (value !== validatedValue && !errorMessage) {
        errorMessage = 'Only numbers are allowed';
      }
    }
    
    // Validate email field
    if (name === 'parentEmail') {
      // Basic email validation (allow alphanumeric, @, ., -, _)
      validatedValue = value.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
      
      // Real-time validation
      if (validatedValue && !validatedValue.includes('@')) {
        errorMessage = 'Email must include @';
      } else if (validatedValue && validatedValue.includes('@') && !/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(validatedValue)) {
        errorMessage = 'Please enter a valid email address';
      }
    }
    
    // Update field errors
    setFieldErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: validatedValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: validatedValue
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

  // Helper function to block number input in name fields
  const handleNameKeyPress = (e) => {
    // Block numbers (0-9) from being typed
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Helper function to allow only numbers in phone field
  const handlePhoneKeyPress = (e) => {
    // Allow only numbers, backspace, delete, and navigation keys
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const addAllergy = () => {
    if (currentAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          allergies: [...prev.medicalHistory.allergies, currentAllergy.trim()]
        }
      }));
      setCurrentAllergy('');
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        allergies: prev.medicalHistory.allergies.filter((_, i) => i !== index)
      }
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PNG only)
      if (file.type !== 'image/png') {
        setErrors(prev => ({
          ...prev,
          birthCertificate: 'Please upload a PNG image file only'
        }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          birthCertificate: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        birthCertificate: file
      }));
      
      // Clear any previous errors
      if (errors.birthCertificate) {
        setErrors(prev => ({
          ...prev,
          birthCertificate: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Child name validation - must be exactly two words (first name and last name)
    if (!formData.name.trim()) {
      newErrors.name = 'Child name is required';
    } else {
      const nameWords = formData.name.trim().split(' ').filter(word => word.length > 0);
      if (nameWords.length !== 2) {
        newErrors.name = 'Child name must contain exactly two words (First Name and Last Name)';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
        newErrors.name = 'Child name must contain only letters and spaces';
      }
    }

    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    
    // Parent name validation - only letters and spaces allowed
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.parentName)) {
      newErrors.parentName = 'Parent name must contain only letters and spaces';
    }

    // Phone validation - exactly 10 digits
    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Parent phone is required';
    } else {
      const phoneDigits = formData.parentPhone.replace(/\D/g, ''); // Remove all non-digits
      if (phoneDigits.length !== 10) {
        newErrors.parentPhone = 'Phone number must be exactly 10 digits';
      } else if (!/^[6-9][0-9]{9}$/.test(phoneDigits)) {
        newErrors.parentPhone = 'Please enter a valid Indian mobile number (starting with 6, 7, 8, or 9)';
      }
    }

    if (!formData.relationToChild) newErrors.relationToChild = 'Relation to child is required';
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.anganwadiCenter.trim()) newErrors.anganwadiCenter = 'Anganwadi center is required';

    // Email validation - stricter pattern
    if (formData.parentEmail && formData.parentEmail.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.parentEmail)) {
        newErrors.parentEmail = 'Please enter a valid email address (e.g., user@example.com)';
      }
    }

    // Validate date of birth (should not be in future and age should be 3-6 years)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      } else {
        // Calculate age in years
        const ageInYears = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (ageInYears < 3) {
          newErrors.dateOfBirth = 'Child must be at least 3 years old for Anganwadi registration';
        } else if (ageInYears > 6) {
          newErrors.dateOfBirth = 'Child must be 6 years old or younger for Anganwadi registration';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📝 Form submission started');
    console.log('📋 Form data:', JSON.stringify(formData, null, 2));

    if (validateForm()) {
      console.log('✅ Form validation passed');
      onSubmit(formData);
    } else {
      console.log('❌ Form validation failed');
      console.log('❌ Validation errors:', errors);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Baby className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Register Child</h2>
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
              Child Name * (First Name and Last Name)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onKeyPress={handleNameKeyPress}
                className={`${inputClass} pl-12 ${fieldErrors.name ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="e.g., Arjun Kumar (two words only)"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.name}
              </p>
            )}
            {errors.name && <p className={errorClass}>{errors.name}</p>}
            {!fieldErrors.name && (
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Only letters and single space allowed (no numbers or special characters)
              </p>
            )}
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
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {/* Age Display */}
            {formData.dateOfBirth && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Current Age: <span className="font-medium text-blue-600">{currentAge}</span>
                  </span>
                  {(() => {
                    const dob = new Date(formData.dateOfBirth);
                    const today = new Date();
                    const ageInYears = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
                    
                    if (ageInYears >= 3 && ageInYears <= 6) {
                      return (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Eligible for Anganwadi
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Not eligible (Age: 3-6 years required)
                        </span>
                      );
                    }
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Anganwadi services are for children aged 3-6 years
                </p>
              </div>
            )}
            {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth}</p>}
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
              <option value="other">Other</option>
            </select>
            {errors.gender && <p className={errorClass}>{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anganwadi Center *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                name="anganwadiCenter"
                value={formData.anganwadiCenter}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
              >
                <option value="">Select Anganwadi Center</option>
                {anganwadiCenters.map(center => (
                  <option key={center.id} value={center.name}>
                    {center.name} - {center.location} (Ward {center.ward})
                  </option>
                ))}
              </select>
            </div>
            {/* Center Information Display */}
            {formData.anganwadiCenter && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {(() => {
                  const selectedCenter = anganwadiCenters.find(center => center.name === formData.anganwadiCenter);
                  if (selectedCenter) {
                    return (
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Building className="w-4 h-4" />
                          <span className="font-medium">{selectedCenter.name}</span>
                          <span className="text-blue-600">({selectedCenter.code})</span>
                        </div>
                        <div className="text-blue-700 mt-1">
                          📍 {selectedCenter.location}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            {errors.anganwadiCenter && <p className={errorClass}>{errors.anganwadiCenter}</p>}
          </div>

          {/* Birth Certificate Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Birth Certificate (PNG format only)
            </label>
            <div className="relative">
              <div className={`${inputClass} flex items-center justify-center border-2 border-dashed ${
                formData.birthCertificate ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
              } hover:border-blue-400 transition-colors cursor-pointer`}>
                <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {formData.birthCertificate ? (
                      <>
                        <FileText className="w-8 h-8 text-green-500 mb-2" />
                        <p className="text-sm text-green-600 font-medium">
                          {formData.birthCertificate.name}
                        </p>
                        <p className="text-xs text-green-500">
                          ({(formData.birthCertificate.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> birth certificate
                        </p>
                        <p className="text-xs text-gray-400">PNG format only, max 5MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".png,image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {errors.birthCertificate && <p className={errorClass}>{errors.birthCertificate}</p>}
            {formData.birthCertificate && (
              <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
                <span className="text-sm text-green-700">File uploaded successfully</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, birthCertificate: null }))}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Parent Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Name * (letters only)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  onKeyPress={handleNameKeyPress}
                  className={`${inputClass} pl-12 ${fieldErrors.parentName ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="e.g., Priya Nair (letters and spaces only)"
                />
              </div>
              {fieldErrors.parentName && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.parentName}
                </p>
              )}
              {errors.parentName && <p className={errorClass}>{errors.parentName}</p>}
              {!fieldErrors.parentName && (
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Only letters and single space allowed (no numbers or special characters)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number * (10 digits)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  onKeyPress={handlePhoneKeyPress}
                  className={`${inputClass} pl-12 ${fieldErrors.parentPhone ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="e.g., 9876543210 (10 digits only)"
                  maxLength={10}
                />
              </div>
              {fieldErrors.parentPhone && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.parentPhone}
                </p>
              )}
              {errors.parentPhone && <p className={errorClass}>{errors.parentPhone}</p>}
              {!fieldErrors.parentPhone && (
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Enter exactly 10 digits (max 3 consecutive zeros)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  className={`${inputClass} pl-12 ${fieldErrors.parentEmail ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="e.g., priya@gmail.com (must include @)"
                />
              </div>
              {fieldErrors.parentEmail && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.parentEmail}
                </p>
              )}
              {errors.parentEmail && <p className={errorClass}>{errors.parentEmail}</p>}
              {!fieldErrors.parentEmail && (
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Optional: Must be valid email format (must include @)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relation to Child *
              </label>
              <select
                name="relationToChild"
                value={formData.relationToChild}
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
              {errors.relationToChild && <p className={errorClass}>{errors.relationToChild}</p>}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Default Location (Kerala)</span>
            </div>
            <p className="text-sm text-blue-700">
              The following location details are pre-filled for Kerala region and cannot be modified:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputClass} pl-12`}
                  placeholder="Enter house number, street name, and locality"
                />
              </div>
              {errors['address.street'] && <p className={errorClass}>{errors['address.street']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village (Default: Elikkullam)
              </label>
              <input
                type="text"
                name="address.village"
                value={formData.address.village}
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                ✓ Default value for Kerala region
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block (Default: Pampady)
              </label>
              <input
                type="text"
                name="address.block"
                value={formData.address.block}
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                ✓ Default value for Kerala region
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District (Default: Kottayam)
              </label>
              <input
                type="text"
                name="address.district"
                value={formData.address.district}
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                ✓ Default value for Kerala region
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State (Default: Kerala)
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                ✓ Default value for Kerala region
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode (Default: 686522)
              </label>
              <input
                type="text"
                name="address.pincode"
                value={formData.address.pincode}
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                ✓ Default pincode for Kerala region
              </p>
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Information (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birth Weight (kg)
              </label>
              <input
                type="number"
                name="birthWeight"
                value={formData.birthWeight}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter birth weight"
                step="0.1"
                min="0.5"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Weight (kg)
              </label>
              <input
                type="number"
                name="currentWeight"
                value={formData.currentWeight}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter current weight"
                step="0.1"
                min="0.5"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Height (cm)
              </label>
              <input
                type="number"
                name="currentHeight"
                value={formData.currentHeight}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter current height"
                min="30"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={currentAllergy}
                  onChange={(e) => setCurrentAllergy(e.target.value)}
                  className={inputClass}
                  placeholder="Enter allergy and press Add"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.medicalHistory.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.medicalHistory.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Needs
              </label>
              <textarea
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handleChange}
                rows={3}
                className={inputClass}
                placeholder="Describe any special needs or requirements"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className={inputClass}
                placeholder="Any additional information"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/500 characters
              </p>
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Register Child</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChildRegistrationForm;
