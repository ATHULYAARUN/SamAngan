import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, MapPin, Briefcase, Building, Save, AlertCircle, Key, Eye, EyeOff, Calendar, Upload, UserCheck, Contact } from 'lucide-react';

const CreateWorkerModal = ({ worker, selectedRole, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: worker?.name || '',
    email: worker?.email || '',
    phone: worker?.phone || '',
    role: selectedRole?.id || worker?.role || 'anganwadi-worker',
    
    // New fields for enhanced Anganwadi Worker form
    gender: worker?.gender || '',
    dateOfBirth: worker?.dateOfBirth || '',
    qualification: worker?.qualification || '',
    
    // Employment Details
    dateOfJoining: worker?.dateOfJoining || '',
    designation: worker?.designation || '',
    experience: worker?.experience || '',
    
    // Emergency Contact
    alternatePhone: worker?.alternatePhone || '',
    emergencyContactPerson: worker?.emergencyContactPerson || '',
    
    // File uploads
    workerPhoto: null,
    
    // Password configuration
    useCustomPassword: false,
    customPassword: '',
    confirmPassword: '',
    
    address: {
      street: worker?.address?.street || '',
      city: worker?.address?.city || '',
      state: worker?.address?.state || 'Kerala',
      pincode: worker?.address?.pincode || '686522',
      district: worker?.address?.district || 'Kottayam',
      block: worker?.address?.block || ''
    },
    roleSpecificData: {
      anganwadiCenter: {
        name: worker?.roleSpecificData?.anganwadiCenter?.name || '',
        code: worker?.roleSpecificData?.anganwadiCenter?.code || '',
        district: worker?.roleSpecificData?.anganwadiCenter?.district || 'Kottayam',
        block: worker?.roleSpecificData?.anganwadiCenter?.block || ''
      },
      ashaArea: {
        villages: worker?.roleSpecificData?.ashaArea?.villages || [''],
        population: worker?.roleSpecificData?.ashaArea?.population || '',
        households: worker?.roleSpecificData?.ashaArea?.households || ''
      },
      sanitationZone: {
        area: worker?.roleSpecificData?.sanitationZone?.area || '',
        facilities: worker?.roleSpecificData?.sanitationZone?.facilities || [''],
        supervisor: worker?.roleSpecificData?.sanitationZone?.supervisor || ''
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Real-time field validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    emergencyContactPerson: '',
    pincode: ''
  });

  // eslint-disable-next-line no-unused-vars
  const workerRoles = [
    { 
      id: 'anganwadi-worker', 
      name: 'Anganwadi Worker', 
      icon: '👶',
      description: 'Manages child care, nutrition, and early education programs'
    },
    { 
      id: 'asha-volunteer', 
      name: 'ASHA Volunteer', 
      icon: '🏥',
      description: 'Provides health services and maternal care in communities'
    },
    { 
      id: 'sanitation-worker', 
      name: 'Sanitation Worker', 
      icon: '🧹',
      description: 'Maintains hygiene and sanitation facilities'
    }
  ];

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'other', label: 'Other' }
  ];

  const qualificationOptions = [
    { value: '', label: 'Select Qualification' },
    { value: '10th-pass', label: '10th Pass' },
    { value: '12th-pass', label: '12th Pass' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'postgraduate', label: 'Postgraduate' }
  ];

  const designationOptions = [
    { value: '', label: 'Select Designation' },
    { value: 'worker', label: 'Worker' },
    { value: 'helper', label: 'Helper' },
    { value: 'supervisor', label: 'Supervisor' }
  ];

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload only JPG or PNG images');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, workerPhoto: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let validatedValue = value;
    let errorMessage = '';
    
    // Input validations based on field type
    if (name === 'name' || name === 'emergencyContactPerson') {
      // Only letters and single spaces between words allowed
      // Block numbers and special characters
      validatedValue = value.replace(/[^a-zA-Z\s]/g, '').replace(/\s{2,}/g, ' ');
      
      // Real-time validation
      if (validatedValue && !/^[a-zA-Z\s]+$/.test(validatedValue)) {
        errorMessage = 'Only letters and spaces are allowed';
      } else if (value !== validatedValue) {
        errorMessage = 'Numbers and special characters are not allowed';
      }
    } else if (name === 'phone' || name === 'alternatePhone') {
      // Only 10 digits allowed, block letters and special characters
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
    } else if (name === 'email') {
      // Basic email validation (allow alphanumeric, @, ., -, _)
      validatedValue = value.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
      
      // Real-time validation
      if (validatedValue && !validatedValue.includes('@')) {
        errorMessage = 'Email must include @';
      } else if (validatedValue && validatedValue.includes('@') && !/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(validatedValue)) {
        errorMessage = 'Please enter a valid email address';
      }
    } else if (name === 'address.pincode') {
      // Only 6 digits allowed for pincode
      validatedValue = value.replace(/\D/g, '').slice(0, 6);
      
      if (validatedValue.length > 0 && validatedValue.length < 6) {
        errorMessage = `Pincode must be 6 digits (${validatedValue.length}/6)`;
      }
    }
    
    // Update field errors
    setFieldErrors(prev => ({
      ...prev,
      [name.includes('.') ? name.split('.')[1] : name]: errorMessage
    }));
    
    if (name.startsWith('roleSpecificData.')) {
      const path = name.split('.');
      if (path.length === 3) {
        // Handle roleSpecificData.section.field
        const [, section, field] = path;
        setFormData(prev => ({
          ...prev,
          roleSpecificData: {
            ...prev.roleSpecificData,
            [section]: {
              ...prev.roleSpecificData?.[section],
              [field]: validatedValue
            }
          }
        }));
      } else if (path.length === 4) {
        // Handle roleSpecificData.section.subsection.field
        const [, section, subsection, field] = path;
        setFormData(prev => ({
          ...prev,
          roleSpecificData: {
            ...prev.roleSpecificData,
            [section]: {
              ...prev.roleSpecificData?.[section],
              [subsection]: {
                ...prev.roleSpecificData?.[section]?.[subsection],
                [field]: validatedValue
              }
            }
          }
        }));
      }
    } else if (name.includes('.')) {
      // Handle address.field
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: validatedValue
        }
      }));
    } else {
      // Handle basic fields
      setFormData(prev => ({
        ...prev,
        [name]: validatedValue
      }));
    }

    if (error) setError('');
  };

  const handleArrayChange = (section, field, index, value) => {
    setFormData(prev => {
      const currentArray = prev.roleSpecificData?.[section]?.[field] || [];
      const newArray = [...currentArray];
      newArray[index] = value;
      
      return {
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          [section]: {
            ...prev.roleSpecificData?.[section],
            [field]: newArray
          }
        }
      };
    });
  };

  const addArrayItem = (section, field) => {
    setFormData(prev => {
      const currentArray = prev.roleSpecificData?.[section]?.[field] || [];
      
      return {
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          [section]: {
            ...prev.roleSpecificData?.[section],
            [field]: [...currentArray, '']
          }
        }
      };
    });
  };

  const removeArrayItem = (section, field, index) => {
    setFormData(prev => {
      const currentArray = prev.roleSpecificData?.[section]?.[field] || [];
      const newArray = currentArray.filter((_, i) => i !== index);
      
      return {
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          [section]: {
            ...prev.roleSpecificData?.[section],
            [field]: newArray
          }
        }
      };
    });
  };

  const validateForm = () => {
    // Basic Information Validation
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    // Validate name contains only letters and spaces
    if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      setError('Full name can only contain letters and spaces');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    // Enhanced email validation - must include @
    if (!formData.email.includes('@') || !/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(formData.email)) {
      setError('Please enter a valid email address (must include @)');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    // Validate exactly 10 digits
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      return false;
    }
    if (!formData.role) {
      setError('Role is required');
      return false;
    }

    // Enhanced validations for Anganwadi Worker
    if (formData.role === 'anganwadi-worker') {
      // Gender validation - Only female allowed
      if (!formData.gender) {
        setError('Gender is required');
        return false;
      }
      if (formData.gender !== 'female') {
        setError('Only female staff are allowed to be registered as Anganwadi workers.');
        return false;
      }

      // Date of Birth validation
      if (!formData.dateOfBirth) {
        setError('Date of Birth is required');
        return false;
      }
      
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        setError('Worker must be at least 18 years old');
        return false;
      }

      // Qualification validation
      if (!formData.qualification) {
        setError('Qualification is required');
        return false;
      }

      // Employment Details validation
      if (!formData.dateOfJoining) {
        setError('Date of Joining is required');
        return false;
      }
      if (!formData.designation) {
        setError('Designation is required');
        return false;
      }

      // Anganwadi Center validation
      if (!formData.roleSpecificData?.anganwadiCenter?.name) {
        setError('Please select an Anganwadi Center');
        return false;
      }
    }

    // Alternate phone validation (if provided) - must be exactly 10 digits
    if (formData.alternatePhone && formData.alternatePhone.trim()) {
      if (!/^\d{10}$/.test(formData.alternatePhone)) {
        setError('Alternate phone number must be exactly 10 digits');
        return false;
      }
    }

    // Emergency Contact Person validation - only letters and spaces
    if (formData.emergencyContactPerson && formData.emergencyContactPerson.trim()) {
      if (!/^[a-zA-Z\s]+$/.test(formData.emergencyContactPerson.trim())) {
        setError('Emergency contact person name can only contain letters and spaces');
        return false;
      }
    }
    
    // Password validation
    if (formData.useCustomPassword) {
      if (!formData.customPassword) {
        setError('Custom password is required when custom password option is selected');
        return false;
      }
      if (formData.customPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      if (formData.customPassword !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare form data for submission
      const submitData = {
        // Basic Information
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        
        // Enhanced fields for Anganwadi Worker
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        qualification: formData.qualification,
        
        // Employment Details
        dateOfJoining: formData.dateOfJoining,
        designation: formData.designation,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        
        // Emergency Contact
        alternatePhone: formData.alternatePhone.trim(),
        emergencyContactPerson: formData.emergencyContactPerson.trim(),
        
        // Address Information
        address: {
          street: formData.address.street || '',
          city: formData.address.city || '',
          state: formData.address.state || '',
          pincode: formData.address.pincode || '',
          district: formData.address.district || '',
          block: formData.address.block || ''
        },
        
        // Role-specific data
        roleSpecificData: formData.roleSpecificData || {},
        
        // Password Configuration
        useCustomPassword: formData.useCustomPassword,
        customPassword: formData.useCustomPassword ? formData.customPassword : undefined
      };

      console.log('Submitting worker data:', submitData);

      const url = worker 
        ? `/api/admin/workers/${worker._id}` 
        : '/api/admin/workers';
      
      const method = worker ? 'PUT' : 'POST';

      let requestBody;
      let headers = {
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
      };

      // Handle file upload with FormData if photo is present
      if (formData.workerPhoto) {
        const formDataWithFile = new FormData();
        
        // Append all form fields
        Object.keys(submitData).forEach(key => {
          if (key === 'address' || key === 'roleSpecificData') {
            formDataWithFile.append(key, JSON.stringify(submitData[key]));
          } else if (submitData[key] !== undefined && submitData[key] !== null) {
            formDataWithFile.append(key, submitData[key]);
          }
        });
        
        // Append the photo file
        formDataWithFile.append('workerPhoto', formData.workerPhoto);
        
        requestBody = formDataWithFile;
        // Don't set Content-Type header for FormData, let browser set it
      } else {
        // Standard JSON submission
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(submitData);
      }

      const response = await fetch(url, {
        method,
        headers,
        body: requestBody
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        onSuccess(data);
      } else {
        setError(data.message || `Failed to ${worker ? 'update' : 'create'} worker`);
      }
    } catch (error) {
      console.error('Worker operation error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const anganwadiCenters = [
    {
      name: 'Akkarakunnu Anganwadi Center',
      code: 'AK-KC969',
      location: 'Elangulam, Kottayam, Kerala',
      city: 'Elangulam',
      pincode: '686522'
    },
    {
      name: 'Veliyanoor Anganwadi Center',
      code: 'AK-VL969',
      location: 'Veliyanoor, Kottayam, Kerala',
      city: 'Veliyanoor',
      pincode: '686522'
    }
  ];

  const renderRoleSpecificFields = () => {
    try {
      switch (formData.role) {
      case 'anganwadi-worker':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Anganwadi Center Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Center
                </label>
                <select
                  name="roleSpecificData.anganwadiCenter.name"
                  value={formData.roleSpecificData?.anganwadiCenter?.name || ''}
                  onChange={(e) => {
                    const selectedCenter = anganwadiCenters.find(center => center.name === e.target.value);
                    if (selectedCenter) {
                      // Update both center details and address fields
                      setFormData(prev => ({
                        ...prev,
                        roleSpecificData: {
                          ...prev.roleSpecificData,
                          anganwadiCenter: selectedCenter
                        },
                        address: {
                          ...prev.address,
                          city: selectedCenter.city,
                          pincode: selectedCenter.pincode
                        }
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a center</option>
                  {anganwadiCenters.map((center) => (
                    <option key={center.code} value={center.name}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Center Code
                </label>
                <input
                  type="text"
                  name="roleSpecificData.anganwadiCenter.code"
                  value={formData.roleSpecificData?.anganwadiCenter?.code || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Auto-generated"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated based on selection</p>
              </div>
            </div>
            {formData.roleSpecificData?.anganwadiCenter?.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.roleSpecificData.anganwadiCenter.location}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
            )}
          </div>
        );

      case 'asha-volunteer':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              ASHA Coverage Area
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Population Covered
                </label>
                <input
                  type="number"
                  name="roleSpecificData.ashaArea.population"
                  value={formData.roleSpecificData?.ashaArea?.population || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter population count"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Households
                </label>
                <input
                  type="number"
                  name="roleSpecificData.ashaArea.households"
                  value={formData.roleSpecificData?.ashaArea?.households || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter household count"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Villages Covered
              </label>
              {(formData.roleSpecificData?.ashaArea?.villages || ['']).map((village, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={village || ''}
                    onChange={(e) => handleArrayChange('ashaArea', 'villages', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter village name"
                  />
                  {(formData.roleSpecificData?.ashaArea?.villages || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('ashaArea', 'villages', index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('ashaArea', 'villages')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Village
              </button>
            </div>
          </div>
        );

      case 'sanitation-worker':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Sanitation Zone Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coverage Area
                </label>
                <input
                  type="text"
                  name="roleSpecificData.sanitationZone.area"
                  value={formData.roleSpecificData?.sanitationZone?.area || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter coverage area"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor
                </label>
                <input
                  type="text"
                  name="roleSpecificData.sanitationZone.supervisor"
                  value={formData.roleSpecificData?.sanitationZone?.supervisor || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter supervisor name"
                />
              </div>
            </div>
          </div>
        );

        default:
          return null;
      }
    } catch (error) {
      console.error('Error rendering role-specific fields:', error);
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">
            Error loading role-specific fields. Please try selecting the role again.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {worker ? 'Edit Worker Account' : `Create New ${selectedRole?.name || 'Worker'} Account`}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {worker 
                  ? 'Update worker information' 
                  : `Register a new ${selectedRole?.name || 'worker'} with comprehensive details`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                    required
                  />
                  {fieldErrors.name ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.name}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Only letters and spaces allowed (no numbers or special characters)
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                    required
                  />
                  {fieldErrors.email ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.email}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Must be a valid email address (must include @)
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="10-digit phone number"
                    required
                    maxLength="10"
                  />
                  {fieldErrors.phone ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.phone}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Only 10 digits allowed (max 3 consecutive zeros)
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Worker Role *
                  </label>
                  {selectedRole ? (
                    <div className={`w-full px-4 py-3 border-2 ${selectedRole.borderColor} ${selectedRole.bgColor} rounded-lg flex items-center gap-3`}>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedRole.color} flex items-center justify-center text-white font-bold`}>
                        {selectedRole.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${selectedRole.textColor}`}>
                          {selectedRole.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedRole.description}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="anganwadi-worker">👶 Anganwadi Worker</option>
                      <option value="asha-volunteer">🏥 ASHA Volunteer</option>
                      <option value="sanitation-worker">🧹 Sanitation Worker</option>
                    </select>
                  )}
                  <input
                    type="hidden"
                    name="role"
                    value={formData.role}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedRole ? 'Role selected from previous step' : 'Select the worker role'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender * <span className="text-red-500">(Female Only)</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formData.gender && formData.gender !== 'female' && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Only female staff are allowed to be registered as Anganwadi workers.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                    max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  {formData.dateOfBirth && calculateAge(formData.dateOfBirth) < 18 && (
                    <p className="text-xs text-red-600 mt-1">
                      Worker must be at least 18 years old
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification *
                  </label>
                  <select
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    {qualificationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Employment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Joining *
                  </label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    {designationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter years of experience"
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>

            {/* Password Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Password Configuration
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="useCustomPassword"
                    name="useCustomPassword"
                    checked={formData.useCustomPassword}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        useCustomPassword: e.target.checked,
                        customPassword: '',
                        confirmPassword: ''
                      }));
                      if (error) setError('');
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useCustomPassword" className="text-sm font-medium text-gray-700">
                    Set custom password (otherwise auto-generated password will be used)
                  </label>
                </div>
                
                {!formData.useCustomPassword && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      <p className="text-blue-800 text-sm font-medium">Auto-Generated Password</p>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      A secure password will be automatically generated and sent to the worker via email.
                      The worker can change this password after their first login.
                    </p>
                  </div>
                )}
                
                {formData.useCustomPassword && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="customPassword"
                          value={formData.customPassword}
                          onChange={handleChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter custom password"
                          required={formData.useCustomPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Confirm password"
                          required={formData.useCustomPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter city"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled based on Anganwadi center selection</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter state"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Default state for this Anganwadi</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="address.district"
                    value={formData.address.district}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter district"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Default district for this Anganwadi</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.pincode ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="686522"
                    maxLength="6"
                  />
                  {fieldErrors.pincode ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.pincode}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Default: 686522 (based on Anganwadi center)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Contact className="w-5 h-5" />
                Emergency Contact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternate Phone Number
                  </label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.alternatePhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="10-digit phone number"
                    maxLength="10"
                  />
                  {fieldErrors.alternatePhone ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.alternatePhone}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Only 10 digits allowed (max 3 consecutive zeros)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Person
                  </label>
                  <input
                    type="text"
                    name="emergencyContactPerson"
                    value={formData.emergencyContactPerson}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.emergencyContactPerson ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter contact person name"
                  />
                  {fieldErrors.emergencyContactPerson ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.emergencyContactPerson}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Only letters and spaces allowed (no numbers or special characters)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Worker Photo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Worker Photo (Optional)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload JPG or PNG image (max 5MB)
                  </p>
                </div>

                {photoPreview && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={photoPreview}
                        alt="Worker photo preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Photo preview</p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, workerPhoto: null }));
                          setPhotoPreview(null);
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role-Specific Information */}
            {renderRoleSpecificFields()}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {worker ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {worker ? 'Update Worker' : 'Create Worker'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateWorkerModal;
