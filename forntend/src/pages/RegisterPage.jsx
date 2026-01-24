import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Baby, User, Mail, Lock, Eye, EyeOff, MapPin, Phone, Users, Heart, GraduationCap, UserCheck, Trash2, Shield, CheckCircle, AlertCircle, Calendar, Home, Building, Briefcase, DollarSign, Plus, X } from 'lucide-react';
import authService from '../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
    phone: '',
    anganwadiName: '',
    location: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    // Enhanced Parent/Guardian fields
    gender: '',
    dateOfBirth: '',
    relationToChild: '',
    address: {
      house: '',
      street: '',
      ward: '',
      city: '',
      state: 'Kerala',  // Default value set to Kerala
      pincode: ''
    },
    // Family/Child Details
    numberOfChildren: '',
    children: [],
    linkedAnganwadiCenter: '',
    // Additional Information
    occupation: '',
    educationLevel: '',
    incomeBracket: '',
    // Role-specific fields (legacy compatibility)
    workerId: '',
    qualification: '',
    experience: '',
    childAge: '',
    parentName: '',
    age: '',
    schoolName: '',
    grade: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Only allow self-registration for parents, adolescent girls, and pregnant women
  // Other roles (workers) are managed by admin
  const roles = [
    {
      id: 'parent',
      title: 'Parent/Guardian',
      description: 'Monitor your child\'s development and status',
      icon: Users,
      color: 'primary',
      responsibilities: 'View child health records, track benefits'
    },
    {
      id: 'adolescent-girl',
      title: 'Adolescent Girl (10-19 years)',
      description: 'Access personal health data and education',
      icon: GraduationCap,
      color: 'secondary',
      responsibilities: 'View health records, menstrual hygiene tracking'
    },
    {
      id: 'pregnant-woman',
      title: 'Pregnant Woman',
      description: 'Track your pregnancy and access maternal health services',
      icon: Heart,
      color: 'danger',
      responsibilities: 'Prenatal care tracking, health tips, immunization schedule'
    }
  ];

  const anganwadiCenters = [
    {
      name: 'Akkarakunnu Anganwadi',
      code: 'AK34',
      location: 'Elangulam, Kottayam, Kerala',
      pincode: '686522'
    },
    {
      name: 'Veliyanoor Anganwadi',
      code: 'AK35',
      location: 'Veliyanoor, Kottayam, Kerala',
      pincode: '686522'
    }
  ];

  const educationLevels = [
    'No formal education',
    'Primary (1st-5th)',
    'Middle (6th-8th)',
    'Secondary (9th-10th)',
    'Higher Secondary (11th-12th)',
    'Graduate',
    'Post Graduate',
    'Professional Course'
  ];

  const occupations = [
    'Homemaker',
    'Agriculture/Farming',
    'Daily wage worker',
    'Government employee',
    'Private employee',
    'Self-employed/Business',
    'Unemployed',
    'Retired',
    'Student',
    'Other'
  ];

  const incomeBrackets = [
    'Below ₹1 Lakh (Low)',
    '₹1-3 Lakhs (Lower Middle)',
    '₹3-5 Lakhs (Middle)',
    '₹5-10 Lakhs (Upper Middle)',
    'Above ₹10 Lakhs (High)'
  ];

  const relationOptions = [
    'Mother',
    'Father',
    'Grandmother',
    'Grandfather',
    'Aunt',
    'Uncle',
    'Guardian',
    'Other'
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setFormData({
      ...formData,
      role: roleId
    });
  };

  // Helper functions for managing children
  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { name: '', age: '' }]
    }));
  };

  const removeChild = (index) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };

  // Enhanced validation function
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Basic validation
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    // Parent-specific validation
    if (selectedRole === 'parent') {
      if (!formData.gender) errors.gender = 'Gender is required';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.relationToChild) errors.relationToChild = 'Relation to child is required';
      if (!formData.address.house.trim()) errors['address.house'] = 'House/Building number is required';
      if (!formData.address.street.trim()) errors['address.street'] = 'Street address is required';
      if (!formData.address.ward.trim()) errors['address.ward'] = 'Ward is required';
      if (!formData.address.city.trim()) errors['address.city'] = 'City is required';
      if (!formData.address.state.trim()) errors['address.state'] = 'State is required';
      if (!formData.address.pincode.trim()) errors['address.pincode'] = 'Pincode is required';
      if (!formData.numberOfChildren) errors.numberOfChildren = 'Number of children is required';
      if (!formData.linkedAnganwadiCenter) errors.linkedAnganwadiCenter = 'Linked Anganwadi Center is required';
      
      // Children validation
      if (formData.children.length === 0 && parseInt(formData.numberOfChildren) > 0) {
        errors.children = 'Please add child details';
      }
      
      formData.children.forEach((child, index) => {
        if (!child.name.trim()) errors[`child_${index}_name`] = `Child ${index + 1} name is required`;
        if (!child.age || parseInt(child.age) < 3) errors[`child_${index}_age`] = `Child ${index + 1} must be at least 3 years old for admission`;
      });
    }
    
    if (!termsAccepted) errors.terms = 'You must accept the Terms of Service and Privacy Policy';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedRole, termsAccepted]);

  // Validation functions
  const validateField = (name, value) => {
    const errors = {};

    switch (name) {
      case 'name':
      case 'parentName':
        if (!value.trim()) {
          errors[name] = 'Full name is required';
        } else if (value.trim().length < 3) {
          errors[name] = 'Name must be at least 3 characters long';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors[name] = 'Name can only contain letters and spaces';
        }
        break;

      case 'email':
        if (!value.trim()) {
          errors.email = 'Email address is required';
        } else if (!value.includes('@')) {
          errors.email = 'Email must contain @ symbol';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address (e.g., user@example.com)';
        }
        break;

      case 'phone':
      case 'alternatePhone':
        if (!value.trim()) {
          errors[name] = 'Phone number is required';
        } else if (!/^\d{10}$/.test(value.trim())) {
          errors[name] = 'Phone number must be exactly 10 digits';
        } else if (value.trim() === '0000000000') {
          errors[name] = 'Phone number cannot be all zeros';
        } else if (/0{4,}/.test(value.trim())) {
          errors[name] = 'Phone number cannot have more than 3 consecutive zeros';
        }
        break;

      case 'pincode':
      case 'address.pincode':
        if (!value.trim()) {
          errors[name] = 'Pincode is required';
        } else if (!/^\d{6}$/.test(value.trim())) {
          errors[name] = 'Pincode must be exactly 6 digits';
        }
        break;

      case 'dateOfBirth':
        if (!value) {
          errors.dateOfBirth = 'Date of birth is required';
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18 || age > 100) {
            errors.dateOfBirth = 'Age must be between 18 and 100 years';
          }
        }
        break;

      case 'age':
        if (!value) {
          errors.age = 'Age is required';
        } else if (parseInt(value) < 18 || parseInt(value) > 100) {
          errors.age = 'Age must be between 18 and 100 years';
        }
        break;

      case 'gender':
        if (!value) {
          errors.gender = 'Gender is required';
        }
        break;

      case 'educationLevel':
        if (!value) {
          errors.educationLevel = 'Education level is required';
        }
        break;

      case 'primaryLanguage':
        if (!value.trim()) {
          errors.primaryLanguage = 'Primary language is required';
        }
        break;

      case 'identityProof':
        if (!value.trim()) {
          errors.identityProof = 'Identity proof number is required';
        } else if (value.trim().length < 10) {
          errors.identityProof = 'Identity proof must be at least 10 characters';
        }
        break;

      case 'maritalStatus':
        if (!value) {
          errors.maritalStatus = 'Marital status is required';
        }
        break;

      case 'spouseName':
        if (formData.maritalStatus === 'married' && !value.trim()) {
          errors.spouseName = 'Spouse name is required for married individuals';
        } else if (value.trim() && !/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.spouseName = 'Spouse name can only contain letters and spaces';
        }
        break;

      case 'occupation':
        if (!value) {
          errors.occupation = 'Occupation is required';
        }
        break;

      case 'monthlyIncome':
        if (!value) {
          errors.monthlyIncome = 'Monthly income is required';
        }
        break;

      case 'numberOfChildren':
        if (!value || parseInt(value) < 0) {
          errors.numberOfChildren = 'Number of children must be 0 or greater';
        }
        break;

      case 'linkedAnganwadiCenter':
        if (!value) {
          errors.linkedAnganwadiCenter = 'Please select an Anganwadi center';
        }
        break;

      case 'address.street':
        if (!value.trim()) {
          errors['address.street'] = 'Street address is required';
        }
        break;

      case 'address.city':
        if (!value.trim()) {
          errors['address.city'] = 'City is required';
        }
        break;

      case 'address.state':
        if (!value.trim()) {
          errors['address.state'] = 'State is required';
        }
        break;

      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
          errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;

      default:
        // Handle dynamic child field validations
        if (name.startsWith('child_') && name.endsWith('_name')) {
          if (!value.trim()) {
            errors[name] = 'Child name is required';
          } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
            errors[name] = 'Child name can only contain letters and spaces';
          }
        } else if (name.startsWith('child_') && name.endsWith('_age')) {
          if (!value || parseInt(value) < 0 || parseInt(value) > 18) {
            errors[name] = 'Child age must be between 0 and 18 years';
          }
        } else if (name.startsWith('child_') && name.endsWith('_gender')) {
          if (!value) {
            errors[name] = 'Child gender is required';
          }
        } else if (name.startsWith('child_') && name.endsWith('_relation')) {
          if (!value) {
            errors[name] = 'Relation to child is required';
          }
        }
        break;
    }

    return errors;
  };

  // Real-time validation effect
  useEffect(() => {
    validateForm();
  }, [formData, termsAccepted, validateForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Basic validation check
      if (!selectedRole) {
        setError('Please select a role before registering');
        setIsLoading(false);
        return;
      }

      if (!formData.name.trim()) {
        setError('Full name is required');
        setIsLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        setError('Email address is required');
        setIsLoading(false);
        return;
      }

      if (!formData.phone.trim()) {
        setError('Phone number is required');
        setIsLoading(false);
        return;
      }

      if (!formData.password) {
        setError('Password is required');
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (!termsAccepted) {
        setError('You must accept the Terms of Service and Privacy Policy');
        setIsLoading(false);
        return;
      }

      // Validate password strength
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long!');
        setIsLoading(false);
        return;
      }

      // Validate phone number
      if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
        setError('Phone number must be exactly 10 digits!');
        setIsLoading(false);
        return;
      }

      // Prepare user data for registration
      const userData = {
        name: selectedRole === 'parent' ? formData.parentName || formData.name : formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        phone: formData.phone,
        anganwadiName: formData.anganwadiName || '',
        address: {
          street: formData.address?.street || formData.location || '',
          city: formData.address?.city || '',
          state: formData.address?.state || '',
          pincode: formData.address?.pincode || formData.pincode || '',
          district: '',
          block: '',
        },
        roleSpecificData: getRoleSpecificData()
      };

      // Register user with Firebase and backend
      const result = await authService.registerUser(userData);
      
      if (result.success) {
        alert(`Registration successful! Welcome ${formData.name}. Now you can login.`);
        navigate('/login');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract role-specific data
  const getRoleSpecificData = () => {
    switch (formData.role) {
      case 'parent':
        return {
          parentDetails: {
            personalInfo: {
              parentName: formData.parentName || '',
              dateOfBirth: formData.dateOfBirth || '',
              age: formData.age || '',
              gender: formData.gender || '',
              educationLevel: formData.educationLevel || '',
              primaryLanguage: formData.primaryLanguage || '',
              identityProof: formData.identityProof || '',
            },
            contactInfo: {
              email: formData.email || '',
              phone: formData.phone || '',
              alternatePhone: formData.alternatePhone || '',
              address: {
                street: formData.address?.street || '',
                locality: formData.address?.locality || '',
                city: formData.address?.city || '',
                state: formData.address?.state || '',
                pincode: formData.address?.pincode || '',
              },
            },
            familyDetails: {
              maritalStatus: formData.maritalStatus || '',
              spouseName: formData.spouseName || '',
              occupation: formData.occupation || '',
              monthlyIncome: formData.monthlyIncome || '',
              numberOfChildren: parseInt(formData.numberOfChildren) || 0,
              children: formData.children || [],
              linkedAnganwadiCenter: formData.linkedAnganwadiCenter || '',
            },
          }
        };
      case 'adolescent-girl':
        return {
          adolescentDetails: {
            age: parseInt(formData.age) || 15,
            schoolName: formData.schoolName || '',
            class: formData.grade || '',
            guardianName: formData.parentName || '',
            guardianPhone: formData.phone || '',
          }
        };
      case 'pregnant-woman':
        return {
          pregnantWomanDetails: {
            husbandName: formData.husbandName || '',
            husbandPhone: formData.husbandPhone || '',
            lastMenstrualPeriod: formData.lastMenstrualPeriod || '',
            expectedDeliveryDate: formData.expectedDeliveryDate || '',
            pregnancyNumber: formData.pregnancyNumber || 1,
            bloodGroup: formData.bloodGroup || '',
            height: formData.height || 0,
            prePregnancyWeight: formData.prePregnancyWeight || 0,
            currentWeight: formData.currentWeight || 0,
            medicalHistory: {
              diabetes: formData.medicalHistory?.diabetes || false,
              hypertension: formData.medicalHistory?.hypertension || false,
              heartDisease: formData.medicalHistory?.heartDisease || false,
              kidneyDisease: formData.medicalHistory?.kidneyDisease || false,
              thyroidDisorder: formData.medicalHistory?.thyroidDisorder || false,
              anemia: formData.medicalHistory?.anemia || false,
              allergies: formData.medicalHistory?.allergies || [],
              medications: formData.medicalHistory?.medications || [],
              previousComplications: formData.medicalHistory?.previousComplications || []
            },
            anganwadiCenter: formData.linkedAnganwadiCenter || '',
            specialNeeds: formData.specialNeeds || ''
          }
        };
      default:
        return {};
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format specific fields
    let formattedValue = value;

    // 🔒 Full Name validation - Only allow letters and spaces (block numbers/special characters)
    if (name === 'name' || name === 'parentName') {
      formattedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    // 🔒 Phone number validation - Prevent more than 3 consecutive zeros
    else if (name === 'phone') {
      // Only allow numbers and limit to 10 digits
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
      
      // Check for more than 3 consecutive zeros
      if (/0{4,}/.test(formattedValue)) {
        // Prevent input by keeping old value
        formattedValue = formData.phone || '';
      }
    }
    else if (name === 'pincode' || name === 'address.pincode') {
      // Only allow numbers and limit to 6 digits
      formattedValue = value.replace(/\D/g, '').slice(0, 6);
    }

    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: formattedValue
        }
      }));
    } else {
      // Update form data for regular fields
      const newFormData = {
        ...formData,
        [name]: formattedValue
      };
      
      // Handle numberOfChildren change - update children array
      if (name === 'numberOfChildren') {
        const numChildren = parseInt(formattedValue) || 0;
        const currentChildren = newFormData.children || [];
        
        if (numChildren > currentChildren.length) {
          // Add more children entries
          const newChildren = [...currentChildren];
          for (let i = currentChildren.length; i < numChildren; i++) {
            newChildren.push({ name: '', age: '' });
          }
          newFormData.children = newChildren;
        } else if (numChildren < currentChildren.length) {
          // Remove extra children entries
          newFormData.children = currentChildren.slice(0, numChildren);
        }
      }
      
      setFormData(newFormData);
    }

    // Real-time validation for the changed field
    const fieldErrors = validateField(name, formattedValue);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Remove error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }));
  };

  const renderRoleSpecificFields = () => {
    const inputClass = "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black";
    
    switch (selectedRole) {
      case 'parent':
        return (
          <div className="space-y-8">
            {/* 🔹 Personal Details */}
            <div className="bg-primary-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Gender *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {validationErrors.gender && <p className="text-red-500 text-sm mt-1">{validationErrors.gender}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  {validationErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{validationErrors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Relation to Child *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="relationToChild"
                      value={formData.relationToChild}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Relation</option>
                      {relationOptions.map(relation => (
                        <option key={relation} value={relation.toLowerCase()}>{relation}</option>
                      ))}
                    </select>
                  </div>
                  {validationErrors.relationToChild && <p className="text-red-500 text-sm mt-1">{validationErrors.relationToChild}</p>}
                </div>
              </div>
            </div>

            {/* 🔹 Contact Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    House/Building Number *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="address.house"
                      value={formData.address.house}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="House/Flat/Building No."
                      required
                    />
                  </div>
                  {validationErrors['address.house'] && <p className="text-red-500 text-sm mt-1">{validationErrors['address.house']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Street Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Street, Locality"
                      required
                    />
                  </div>
                  {validationErrors['address.street'] && <p className="text-red-500 text-sm mt-1">{validationErrors['address.street']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Ward *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="address.ward"
                      value={formData.address.ward}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Ward Number/Name"
                      required
                    />
                  </div>
                  {validationErrors['address.ward'] && <p className="text-red-500 text-sm mt-1">{validationErrors['address.ward']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Pincode *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="6-digit pincode"
                      maxLength="6"
                      required
                    />
                  </div>
                  {validationErrors['address.pincode'] && <p className="text-red-500 text-sm mt-1">{validationErrors['address.pincode']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    City *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="City"
                      required
                    />
                  </div>
                  {validationErrors['address.city'] && <p className="text-red-500 text-sm mt-1">{validationErrors['address.city']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    State *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="Kerala">Kerala</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Bihar">Bihar</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Goa">Goa</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {validationErrors['address.state'] && <p className="text-red-500 text-sm mt-1">{validationErrors['address.state']}</p>}
                </div>
              </div>
            </div>

            {/* 🔹 Family / Child Details */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Baby className="w-5 h-5 mr-2" />
                Family / Child Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Number of Children *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="numberOfChildren"
                      value={formData.numberOfChildren}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select number</option>
                      <option value="1">1 Child</option>
                      <option value="2">2 Children</option>
                      <option value="3">3 Children</option>
                      <option value="4">4 Children</option>
                      <option value="5">5+ Children</option>
                    </select>
                  </div>
                  {validationErrors.numberOfChildren && <p className="text-red-500 text-sm mt-1">{validationErrors.numberOfChildren}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Linked Anganwadi Center *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="linkedAnganwadiCenter"
                      value={formData.linkedAnganwadiCenter}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Anganwadi Center</option>
                      {anganwadiCenters.map(center => (
                        <option key={center.code} value={center.name}>
                          {center.name} - {center.location}
                        </option>
                      ))}
                    </select>
                  </div>
                  {validationErrors.linkedAnganwadiCenter && <p className="text-red-500 text-sm mt-1">{validationErrors.linkedAnganwadiCenter}</p>}
                </div>
              </div>

              {/* Dynamic Children Fields */}
              {parseInt(formData.numberOfChildren) > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-black mb-4">Child Details *</h4>
                  {formData.children.map((child, index) => (
                    <div key={index} className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-white rounded-lg border">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Child {index + 1} Name *
                        </label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter child's name"
                          required
                        />
                        {validationErrors[`child_${index}_name`] && <p className="text-red-500 text-sm mt-1">{validationErrors[`child_${index}_name`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Child {index + 1} Age (≥ 3 years) *
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="6"
                          value={child.age}
                          onChange={(e) => updateChild(index, 'age', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Age in years"
                          required
                        />
                        {validationErrors[`child_${index}_age`] && <p className="text-red-500 text-sm mt-1">{validationErrors[`child_${index}_age`]}</p>}
                      </div>
                    </div>
                  ))}
                  {validationErrors.children && <p className="text-red-500 text-sm mt-1">{validationErrors.children}</p>}
                </div>
              )}
            </div>

            {/* 🔹 Additional Information (Optional) */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Additional Information (Optional)
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Occupation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select occupation</option>
                      {occupations.map(occupation => (
                        <option key={occupation} value={occupation}>{occupation}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Education Level
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select education level</option>
                      {educationLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Income Bracket
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="incomeBracket"
                      value={formData.incomeBracket}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select income bracket</option>
                      {incomeBrackets.map(bracket => (
                        <option key={bracket} value={bracket}>{bracket}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'adolescent-girl':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Personal & Educational Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Age
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <select
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select your age</option>
                    <option value="11">11 years</option>
                    <option value="12">12 years</option>
                    <option value="13">13 years</option>
                    <option value="14">14 years</option>
                    <option value="15">15 years</option>
                    <option value="16">16 years</option>
                    <option value="17">17 years</option>
                    <option value="18">18 years</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Grade/Class
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select grade</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                    <option value="dropout">Not in school</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                School Name
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter your school name (or 'Not applicable' if not in school)"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'pregnant-woman':
        return (
          <div className="space-y-8">
            {/* 🔹 Personal Details */}
            <div className="bg-pink-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Personal Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Date of Birth *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Blood Group</label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select blood group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 🔹 Pregnancy Details */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                <Baby className="w-5 h-5 mr-2" />
                Pregnancy Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Last Menstrual Period *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="date"
                      name="lastMenstrualPeriod"
                      value={formData.lastMenstrualPeriod}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Expected Delivery Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="date"
                      name="expectedDeliveryDate"
                      value={formData.expectedDeliveryDate}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Pregnancy Number</label>
                  <div className="relative">
                    <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="number"
                      name="pregnancyNumber"
                      value={formData.pregnancyNumber}
                      onChange={handleChange}
                      className={inputClass}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 🔹 Spouse Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Spouse Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Spouse/Husband Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="husbandName"
                      value={formData.husbandName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter spouse/husband name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Spouse/Husband Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="tel"
                      name="husbandPhone"
                      value={formData.husbandPhone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 🔹 Health Measurements */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Health Measurements
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Height in cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Pre-Pregnancy Weight (kg)</label>
                  <input
                    type="number"
                    name="prePregnancyWeight"
                    value={formData.prePregnancyWeight}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Current Weight (kg)</label>
                  <input
                    type="number"
                    name="currentWeight"
                    value={formData.currentWeight}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Current weight in kg"
                  />
                </div>
              </div>
            </div>

            {/* 🔹 Anganwadi Center */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Linked Anganwadi Center</h3>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <select
                  name="linkedAnganwadiCenter"
                  value={formData.linkedAnganwadiCenter}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Anganwadi Center</option>
                  {anganwadiCenters.map(center => (
                    <option key={center.code} value={center.code}>{center.name} ({center.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 🔹 Special Notes */}
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-4">Special Notes</h3>
              <textarea
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handleChange}
                className={inputClass}
                rows="4"
                placeholder="Any special medical needs, allergies, or medications..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {!selectedRole ? (
          // Role Selection Screen
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Header */}
            <div className="mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Baby className="w-10 h-10 text-white" />
              </motion.div>
              
              <h1 className="text-4xl font-bold text-black mb-4">
                Join SampoornaAngan
              </h1>
              <p className="text-xl text-black max-w-2xl mx-auto mb-4">
                Choose your role to create a personalized account and access features designed for you
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Anganwadi Workers, ASHA Volunteers, and Sanitation Workers are registered and managed by the Admin. 
                  If you are a worker, please contact your supervisor for account creation.
                </p>
              </div>
            </div>



            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => handleRoleSelect(role.id)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg transform hover:scale-105">
                    <div className={`w-16 h-16 bg-gradient-to-br from-${role.color}-500 to-${role.color}-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <role.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-black mb-2">{role.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                    <p className="text-xs text-gray-500 italic">{role.responsibilities}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in here
              </Link>
            </p>
          </motion.div>
        ) : (
          // Registration Form
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            {/* Back Button and Header */}
            <div className="mb-8">
              <button
                onClick={() => setSelectedRole('')}
                className="flex items-center text-primary-600 hover:text-primary-500 mb-6"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to role selection
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {React.createElement(roles.find(r => r.id === selectedRole)?.icon || Baby, { className: "w-8 h-8 text-white" })}
                </div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  Register as {roles.find(r => r.id === selectedRole)?.title}
                </h2>
                <p className="text-gray-600">
                  {roles.find(r => r.id === selectedRole)?.description}
                </p>
              </div>
            </div>
            {/* Registration Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}



                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Full Name * <span className="text-xs text-gray-500">(letters only)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name (letters only)"
                        required
                      />
                      {validationErrors.name && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    {validationErrors.name ? (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.name}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        ✓ Only letters and spaces allowed - numbers/special characters are blocked
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email Address * <span className="text-xs text-gray-500">(must contain @)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="example@email.com"
                        required
                      />
                      {validationErrors.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      {!validationErrors.email && formData.email && formData.email.includes('@') && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {validationErrors.email ? (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.email}
                      </p>
                    ) : formData.email && formData.email.includes('@') ? (
                      <p className="mt-1 text-xs text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid email format
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        Must include @ symbol (e.g., user@example.com)
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Phone Number * <span className="text-xs text-gray-500">(max 3 consecutive zeros)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="10-digit phone number"
                        maxLength="10"
                        required
                      />
                      {validationErrors.phone && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      {!validationErrors.phone && formData.phone && formData.phone.length === 10 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {validationErrors.phone ? (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.phone}
                      </p>
                    ) : formData.phone && formData.phone.length === 10 ? (
                      <p className="mt-1 text-xs text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid phone number
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        ✓ 10 digits only, no more than 3 consecutive zeros allowed
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                        placeholder="City, State"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Pincode *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black ${
                        validationErrors.pincode ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter 6-digit pincode"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      required
                    />
                    {validationErrors.pincode && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {validationErrors.pincode ? (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.pincode}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Please enter a valid 6-digit pincode</p>
                  )}
                </div>

                {selectedRole !== 'adolescent-girl' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Anganwadi Name
                    </label>
                    <div className="relative">
                      <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <select
                        name="anganwadiName"
                        value={formData.anganwadiName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                        required
                      >
                        <option value="">Select Anganwadi</option>
                        {anganwadiCenters.map(center => (
                          <option key={center.code} value={center.name}>
                            {center.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Role-specific fields */}
                {renderRoleSpecificFields()}

                {/* Password Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          validationErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Create a password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {validationErrors.password && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    {validationErrors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          validationErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {validationErrors.confirmPassword && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className={`h-4 w-4 text-primary-600 focus:ring-primary-500 rounded mt-1 ${
                        validationErrors.terms ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    <label htmlFor="terms" className="ml-3 block text-sm text-black">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-500 font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary-600 hover:text-primary-500 font-medium">
                        Privacy Policy
                      </Link>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                  </div>
                  {validationErrors.terms && (
                    <p className="text-sm text-red-600 flex items-center ml-7">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.terms}
                    </p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className={`w-full font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 disabled:cursor-not-allowed ${
                    !isLoading
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Create Account as {roles.find(r => r.id === selectedRole)?.title || 'User'}
                    </div>
                  )}
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm text-black">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
