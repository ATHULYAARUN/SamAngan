import React, { useState, useEffect } from 'react';
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
  X,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const FieldVisitEntry = ({ onSuccess }) => {
  const MotionDiv = motion.div;
  const [menstrualIssueInput, setMenstrualIssueInput] = useState('');
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    personType: 'woman',
    personName: '',
    age: '',
    location: '',
    weight: '',
    height: '',
    hemoglobin: '',
    bloodPressure: '',
    temperature: '',
    muac: '', // Mid-Upper Arm Circumference
    vaccination: {
      type: '',
      dose: '',
      date: '',
      nextDue: ''
    },
    supplements: {
      iron: false,
      vitaminA: false,
      deworming: false,
      calcium: false,
      folicAcid: false
    },
    healthIndicators: {
      anemia: false,
      malnutrition: false,
      highRiskPregnancy: false,
      immunizationDelay: false,
      developmentalDelays: false
    },
    referrals: {
      referred: false,
      facility: '',
      reason: '',
      urgency: 'routine' // routine, urgent, emergency
    },
    followUp: {
      required: false,
      date: '',
      notes: ''
    },
    adolescentDetails: {
      lastMenstrualDate: '',
      cycleRegularity: 'unknown',
      menstrualIssues: [],
      schoolStatus: 'unknown'
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

  /** Digits + one decimal point; optional max (e.g. °F body temp or MUAC cm). */
  const cleanDecimalInput = (val, max) => {
    if (!val) return '';
    let cleaned = String(val).replace(/[^\d.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    const parts = cleaned.split('.');
    if (parts[1] && parts[1].length > 2) {
      cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n) && n > max) {
      return String(max);
    }
    return cleaned;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (
        parent === 'vaccination' ||
        parent === 'supplements' ||
        parent === 'healthIndicators' ||
        parent === 'referrals' ||
        parent === 'followUp' ||
        parent === 'adolescentDetails'
      ) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
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
      } else if (name === 'temperature') {
        // Label is °F — typical range ~95–106; allow 80–120 (do not cap at 45, that was °C-style)
        cleaned = cleanDecimalInput(value, 120);
      } else if (name === 'muac') {
        // Centimetres, often e.g. 22.5 — must allow decimals (cleanNumber stripped "." → 22.5 became 225)
        cleaned = cleanDecimalInput(value, 50);
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

    const numericAge = Number(formData.age);
    if (formData.personType === 'adolescent' && formData.age && (numericAge < 10 || numericAge > 19)) {
      newErrors.age = 'Adolescent age must be between 10 and 19';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addMenstrualIssue = () => {
    const issue = menstrualIssueInput.trim();
    if (!issue) return;
    setFormData((prev) => ({
      ...prev,
      adolescentDetails: {
        ...prev.adolescentDetails,
        menstrualIssues: Array.from(new Set([...(prev.adolescentDetails.menstrualIssues || []), issue]))
      }
    }));
    setMenstrualIssueInput('');
  };

  const removeMenstrualIssue = (issue) => {
    setFormData((prev) => ({
      ...prev,
      adolescentDetails: {
        ...prev.adolescentDetails,
        menstrualIssues: (prev.adolescentDetails.menstrualIssues || []).filter((i) => i !== issue)
      }
    }));
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
        adolescentDetails: formData.personType === 'adolescent'
          ? {
              lastMenstrualDate: formData.adolescentDetails.lastMenstrualDate || null,
              cycleRegularity: formData.adolescentDetails.cycleRegularity || 'unknown',
              menstrualIssues: formData.adolescentDetails.menstrualIssues || [],
              schoolStatus: formData.adolescentDetails.schoolStatus || 'unknown'
            }
          : {},
        ashaArea
      });
      
      alert('Field visit recorded successfully!');
      
      // Reset form
      setFormData({
        ...formData,
        visitDate: new Date().toISOString().split('T')[0],
        personType: 'child',
        personName: '',
        age: '',
        location: '',
        weight: '',
        height: '',
        hemoglobin: '',
        bloodPressure: '',
        temperature: '',
        muac: '',
        vaccination: { type: '', dose: '', date: '', nextDue: '' },
        supplements: { iron: false, vitaminA: false, deworming: false, calcium: false, folicAcid: false },
        healthIndicators: formData.healthIndicators,
        referrals: formData.referrals,
        followUp: formData.followUp,
        adolescentDetails: {
          lastMenstrualDate: '',
          cycleRegularity: 'unknown',
          menstrualIssues: [],
          schoolStatus: 'unknown'
        },
        remarks: ''
      });
      setMenstrualIssueInput('');
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating field visit:', error);
      const msg = error.message || 'Unknown error';
      alert(`Failed to record visit: ${msg}${msg.includes('Cannot reach server') ? '' : '. Check your connection and try again.'}`);
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

        {formData.personType === 'adolescent' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adolescent-Specific Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Menstrual Date</label>
                <input
                  type="date"
                  name="adolescentDetails.lastMenstrualDate"
                  value={formData.adolescentDetails.lastMenstrualDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Regularity</label>
                <select
                  name="adolescentDetails.cycleRegularity"
                  value={formData.adolescentDetails.cycleRegularity}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="unknown">Unknown</option>
                  <option value="regular">Regular</option>
                  <option value="irregular">Irregular</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Status</label>
                <select
                  name="adolescentDetails.schoolStatus"
                  value={formData.adolescentDetails.schoolStatus}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="unknown">Unknown</option>
                  <option value="student">Student</option>
                  <option value="dropout">Dropout</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Menstrual Issues</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={menstrualIssueInput}
                    onChange={(e) => setMenstrualIssueInput(e.target.value)}
                    className={inputClass}
                    placeholder="e.g., pain, heavy bleeding"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMenstrualIssue();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addMenstrualIssue}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(formData.adolescentDetails.menstrualIssues || []).map((issue) => (
                    <span
                      key={issue}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded-full"
                    >
                      {issue}
                      <button
                        type="button"
                        onClick={() => removeMenstrualIssue(issue)}
                        className="text-pink-700 hover:text-pink-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            House / Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`${inputClass} pl-12`}
              placeholder="e.g. Ward 3, House no."
            />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Due Date
              </label>
              <input
                type="date"
                name="vaccination.nextDue"
                value={formData.vaccination.nextDue}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Additional Health Details (not shown for adolescent form) */}
        {formData.personType !== 'adolescent' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Health Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°F)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., 98.6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MUAC (cm) - Mid-Upper Arm Circumference
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="muac"
                    value={formData.muac}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., 22.5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Indicators */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'anemia', label: 'Anemia', icon: Droplet },
              { key: 'malnutrition', label: 'Malnutrition', icon: AlertTriangle },
              ...(formData.personType === 'woman' ? [{ key: 'highRiskPregnancy', label: 'High Risk Pregnancy', icon: Heart }] : []),
              { key: 'immunizationDelay', label: 'Immunization Delay', icon: Clock },
              { key: 'developmentalDelays', label: 'Developmental Delays', icon: Activity }
            ].map((indicator) => (
              <div key={indicator.key} className="flex items-center">
                <input
                  type="checkbox"
                  name={`healthIndicators.${indicator.key}`}
                  checked={formData.healthIndicators[indicator.key]}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label className="ml-2 text-sm text-gray-700 flex items-center">
                  <indicator.icon className="w-4 h-4 inline mr-1" />
                  {indicator.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Information</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="referrals.referred"
                checked={formData.referrals.referred}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Refer to Health Facility
              </label>
            </div>

            {formData.referrals.referred && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facility Name
                  </label>
                  <input
                    type="text"
                    name="referrals.facility"
                    value={formData.referrals.facility}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., PHC, District Hospital"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Referral
                  </label>
                  <input
                    type="text"
                    name="referrals.reason"
                    value={formData.referrals.reason}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., Severe anemia, High fever"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="referrals.urgency"
                    value={formData.referrals.urgency}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Required</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="followUp.required"
                checked={formData.followUp.required}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Follow-up Visit Required
              </label>
            </div>

            {formData.followUp.required && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    name="followUp.date"
                    value={formData.followUp.date}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Notes
                  </label>
                  <input
                    type="text"
                    name="followUp.notes"
                    value={formData.followUp.notes}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., Check hemoglobin levels, Monitor weight"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Nutrition Supplements */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Supplements Provided</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'iron', label: 'Iron Tablets', icon: Pill },
              { key: 'vitaminA', label: 'Vitamin A', icon: Pill },
              { key: 'deworming', label: 'Deworming Tablets', icon: Pill },
              { key: 'calcium', label: 'Calcium', icon: Pill },
              { key: 'folicAcid', label: 'Folic Acid', icon: Pill }
            ].map((supplement) => (
              <div key={supplement.key} className="flex items-center">
                <input
                  type="checkbox"
                  name={`supplements.${supplement.key}`}
                  checked={formData.supplements[supplement.key]}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label className="ml-2 text-sm text-gray-700 flex items-center">
                  <supplement.icon className="w-4 h-4 inline mr-1" />
                  {supplement.label}
                </label>
              </div>
            ))}
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
