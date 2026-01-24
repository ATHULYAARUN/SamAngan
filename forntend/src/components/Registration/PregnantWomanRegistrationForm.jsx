import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Save,
  X,
  Baby
} from 'lucide-react';

const PregnantWomanRegistrationForm = ({ onSubmit, onCancel, isLoading = false }) => {
  // Create a PascalCase component to satisfy lint rules and keep animation API
  const MotionDiv = motion.div;
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    husbandName: '',
    husbandPhone: '',
    address: {
      street: '',
      village: '',
      block: '',
      district: '',
      state: '',
      pincode: ''
    },
    lastMenstrualPeriod: '',
    expectedDeliveryDate: '',
    pregnancyNumber: '',
    previousPregnancies: {
      liveBirths: 0,
      stillBirths: 0,
      miscarriages: 0,
      abortions: 0
    },
    bloodGroup: '',
    height: '',
    prePregnancyWeight: '',
    currentWeight: '',
    medicalHistory: {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      kidneyDisease: false,
      thyroidDisorder: false,
      anemia: false,
      allergies: [],
      medications: [],
      previousComplications: []
    },
    anganwadiCenter: '',
    specialNeeds: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Helpers for consistent cleaning/validation
  const cleanName = (val) => {
    if (!val) return '';
    // Allow letters and spaces, collapse multiple spaces to one
    return val
      .replace(/[^A-Za-z\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s+/, '');
  };

  const cleanPhone = (val) => {
    if (!val) return '';
    let digits = val.replace(/\D/g, '');
    // Prevent more than 3 consecutive zeros while typing
    digits = digits.replace(/0{4,}/g, '000');
    return digits.slice(0, 10);
  };

  const validatePhoneRealtime = (digits) => {
    if (!digits) return '';
    if (/0{4,}/.test(digits)) return 'Cannot have more than 3 consecutive zeros';
    if (digits.length !== 10) return `Phone number must be 10 digits (${digits.length}/10)`;
    return '';
  };

  const cleanEmail = (val) => {
    if (!val) return '';
    return val
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let cleaned = value;

    // Field-specific cleaning and realtime validation
    if (name === 'name' || name === 'husbandName') {
      cleaned = cleanName(value);
      setErrors(prev => ({ ...prev, [name]: '' }));
    } else if (name === 'phone' || name === 'husbandPhone') {
      cleaned = cleanPhone(value);
      const msg = validatePhoneRealtime(cleaned);
      setErrors(prev => ({ ...prev, [name]: msg }));
    } else if (name === 'email') {
      cleaned = cleanEmail(value);
      let msg = '';
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (cleaned && !emailRegex.test(cleaned)) msg = 'Enter a valid email like example@gmail.com';
      setErrors(prev => ({ ...prev, [name]: msg }));
    } else if (name === 'expectedDeliveryDate') {
      // read-only field handled elsewhere
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

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : cleaned
    }));
  };

  const calculateEDD = (lmpDate) => {
    if (!lmpDate) return '';
    const lmp = new Date(lmpDate);
    const edd = new Date(lmp.getTime() + (280 * 24 * 60 * 60 * 1000)); // Add 280 days
    return edd.toISOString().split('T')[0];
  };

  const handleLMPChange = (e) => {
    const lmpDate = e.target.value;
    setFormData(prev => ({
      ...prev,
      lastMenstrualPeriod: lmpDate,
      expectedDeliveryDate: calculateEDD(lmpDate)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.husbandName.trim()) newErrors.husbandName = 'Husband/Partner name is required';
    if (!formData.lastMenstrualPeriod) newErrors.lastMenstrualPeriod = 'Last menstrual period is required';
    if (!formData.pregnancyNumber) newErrors.pregnancyNumber = 'Pregnancy number is required';
    if (!formData.anganwadiCenter.trim()) newErrors.anganwadiCenter = 'Anganwadi center is required';

    // Address validation (all fields required)
    if (!formData.address.street || !formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }
    if (!formData.address.village || !formData.address.village.trim()) {
      newErrors['address.village'] = 'Village is required';
    }
    if (!formData.address.block || !formData.address.block.trim()) {
      newErrors['address.block'] = 'Block is required';
    }
    if (!formData.address.district || !formData.address.district.trim()) {
      newErrors['address.district'] = 'District is required';
    }
    if (!formData.address.state || !formData.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }
    if (!formData.address.pincode || !formData.address.pincode.trim()) {
      newErrors['address.pincode'] = 'Pincode is required';
    } else {
      const pincodeRegex = /^[0-9]{6}$/;
      if (!pincodeRegex.test(formData.address.pincode)) {
        newErrors['address.pincode'] = 'Please enter a valid 6-digit pincode';
      }
    }

    // Blood group validation
    if (!formData.bloodGroup || !formData.bloodGroup.trim()) {
      newErrors.bloodGroup = 'Blood group is required';
    }

    // Validate phone number
    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) newErrors.phone = 'Please enter a valid 10-digit phone number';
    if (/0{4,}/.test(phoneDigits)) newErrors.phone = 'Phone number cannot have more than 3 consecutive zeros';

    // Validate email if provided
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate husband/partner phone if provided
    if (formData.husbandPhone) {
      const hp = formData.husbandPhone.replace(/\D/g, '');
      if (hp.length !== 10) newErrors.husbandPhone = 'Please enter a valid 10-digit phone number';
      if (/0{4,}/.test(hp)) newErrors.husbandPhone = 'Phone number cannot have more than 3 consecutive zeros';
    }

    // Name format (letters and single spaces)
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (formData.name && !nameRegex.test(formData.name)) newErrors.name = 'Use letters only with single spaces';
    if (formData.husbandName && !nameRegex.test(formData.husbandName)) newErrors.husbandName = 'Use letters only with single spaces';

    // Validate age (15-50 years)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 15 || age > 50) {
        newErrors.dateOfBirth = 'Age must be between 15 and 50 years';
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

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Register Pregnant Woman</h2>
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
                className={`${inputClass} pl-12 ${errors.name ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Enter full name"
              />
            </div>
            {errors.name && <p className={errorClass}>{errors.name}</p>}
            {!errors.name && (
              <p className="text-xs text-gray-500 mt-1">Letters only. Use single spaces between words.</p>
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
              />
            </div>
            {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`${inputClass} pl-12 ${errors.phone ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Enter phone number"
              />
            </div>
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
            {!errors.phone && (
              <p className="text-xs text-gray-500 mt-1">Digits only. Exactly 10 digits. Max 3 consecutive zeros allowed.</p>
            )}
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
                className={`${inputClass} pl-12 ${errors.email ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Enter email address (optional)"
              />
            </div>
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Husband/Partner Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="husbandName"
                value={formData.husbandName}
                onChange={handleChange}
                className={`${inputClass} pl-12 ${errors.husbandName ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Enter husband/partner name"
              />
            </div>
            {errors.husbandName && <p className={errorClass}>{errors.husbandName}</p>}
            {!errors.husbandName && (
              <p className="text-xs text-gray-500 mt-1">Letters only. Use single spaces between words.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Husband/Partner Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="husbandPhone"
                value={formData.husbandPhone}
                onChange={handleChange}
                className={`${inputClass} pl-12 ${errors.husbandPhone ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Enter husband/partner phone"
              />
            </div>
            {errors.husbandPhone && <p className={errorClass}>{errors.husbandPhone}</p>}
            {!errors.husbandPhone && formData.husbandPhone && (
              <p className="text-xs text-gray-500 mt-1">Digits only. Exactly 10 digits. Max 3 consecutive zeros allowed.</p>
            )}
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

        {/* Address Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter street address"
              />
              {errors['address.street'] && <p className={errorClass}>{errors['address.street']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village *
              </label>
              <input
                type="text"
                name="address.village"
                value={formData.address.village}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter village name"
              />
              {errors['address.village'] && <p className={errorClass}>{errors['address.village']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block *
              </label>
              <input
                type="text"
                name="address.block"
                value={formData.address.block}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter block name"
              />
              {errors['address.block'] && <p className={errorClass}>{errors['address.block']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <input
                type="text"
                name="address.district"
                value={formData.address.district}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter district name"
              />
              {errors['address.district'] && <p className={errorClass}>{errors['address.district']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter state name"
              />
              {errors['address.state'] && <p className={errorClass}>{errors['address.state']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter 6-digit pincode"
                maxLength="6"
              />
              {errors['address.pincode'] && <p className={errorClass}>{errors['address.pincode']}</p>}
            </div>
          </div>
        </div>

        {/* Pregnancy Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pregnancy Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Menstrual Period *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="lastMenstrualPeriod"
                  value={formData.lastMenstrualPeriod}
                  onChange={handleLMPChange}
                  className={`${inputClass} pl-12`}
                />
              </div>
              {errors.lastMenstrualPeriod && <p className={errorClass}>{errors.lastMenstrualPeriod}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <div className="relative">
                <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleChange}
                  className={`${inputClass} pl-12`}
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Automatically calculated from LMP
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pregnancy Number *
              </label>
              <select
                name="pregnancyNumber"
                value={formData.pregnancyNumber}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select pregnancy number</option>
                <option value="1">1st Pregnancy</option>
                <option value="2">2nd Pregnancy</option>
                <option value="3">3rd Pregnancy</option>
                <option value="4">4th Pregnancy</option>
                <option value="5">5th Pregnancy</option>
                <option value="6">6+ Pregnancy</option>
              </select>
              {errors.pregnancyNumber && <p className={errorClass}>{errors.pregnancyNumber}</p>}
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
              {errors.bloodGroup && <p className={errorClass}>{errors.bloodGroup}</p>}
            </div>
          </div>

          {/* Previous Pregnancies */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Previous Pregnancies (if any)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Live Births
                </label>
                <input
                  type="number"
                  name="previousPregnancies.liveBirths"
                  value={formData.previousPregnancies.liveBirths}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Still Births
                </label>
                <input
                  type="number"
                  name="previousPregnancies.stillBirths"
                  value={formData.previousPregnancies.stillBirths}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miscarriages
                </label>
                <input
                  type="number"
                  name="previousPregnancies.miscarriages"
                  value={formData.previousPregnancies.miscarriages}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abortions
                </label>
                <input
                  type="number"
                  name="previousPregnancies.abortions"
                  value={formData.previousPregnancies.abortions}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  max="10"
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
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Register</span>
              </>
            )}
          </button>
        </div>
      </form>
    </MotionDiv>
  );
};

export default PregnantWomanRegistrationForm;
