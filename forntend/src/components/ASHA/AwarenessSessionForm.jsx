import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  FileText,
  Upload,
  Save,
  Image as ImageIcon
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const AwarenessSessionForm = ({ onSuccess }) => {
  const MotionDiv = motion.div;
  const [formData, setFormData] = useState({
    sessionTitle: '',
    sessionDate: new Date().toISOString().split('T')[0],
    audienceType: 'parents', // parents, adolescents, general
    participantsCount: '',
    description: '',
    outcomes: '',
    file: null
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file') {
      const file = files[0];
      if (file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
          setErrors(prev => ({ ...prev, file: 'Only JPG, PNG, and PDF files are allowed' }));
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, file: 'File size must be less than 5MB' }));
          return;
        }
        
        setFormData(prev => ({ ...prev, file }));
        setErrors(prev => ({ ...prev, file: '' }));
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFilePreview(reader.result);
          };
          reader.readAsDataURL(file);
        } else {
          setFilePreview(null);
        }
      }
    } else if (name === 'participantsCount') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sessionTitle.trim()) newErrors.sessionTitle = 'Session title is required';
    if (!formData.sessionDate) newErrors.sessionDate = 'Session date is required';
    if (!formData.participantsCount) newErrors.participantsCount = 'Number of participants is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

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
      
      await ashaService.createAwarenessSession({
        ...formData,
        ashaArea
      });
      
      alert('Awareness session logged successfully!');
      
      // Reset form
      setFormData({
        sessionTitle: '',
        sessionDate: new Date().toISOString().split('T')[0],
        audienceType: 'parents',
        participantsCount: '',
        description: '',
        outcomes: '',
        file: null
      });
      setFilePreview(null);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating awareness session:', error);
      alert(`Failed to log session: ${error.message || 'Unknown error'}`);
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
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Log Awareness Session</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              name="sessionTitle"
              value={formData.sessionTitle}
              onChange={handleChange}
              className={`${inputClass} ${errors.sessionTitle ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="e.g., Hygiene Awareness, Menstrual Health Education"
            />
            {errors.sessionTitle && <p className={errorClass}>{errors.sessionTitle}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="sessionDate"
                value={formData.sessionDate}
                onChange={handleChange}
                className={`${inputClass} pl-12`}
              />
            </div>
            {errors.sessionDate && <p className={errorClass}>{errors.sessionDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience Type *
            </label>
            <select
              name="audienceType"
              value={formData.audienceType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="parents">Parents</option>
              <option value="adolescents">Adolescents</option>
              <option value="general">General Public</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Participants *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="participantsCount"
                value={formData.participantsCount}
                onChange={handleChange}
                className={`${inputClass} pl-12 ${errors.participantsCount ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Enter number of participants"
              />
            </div>
            {errors.participantsCount && <p className={errorClass}>{errors.participantsCount}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Description *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`${inputClass} pl-12 ${errors.description ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Describe the session content, topics covered, activities conducted..."
            />
          </div>
          {errors.description && <p className={errorClass}>{errors.description}</p>}
        </div>

        {/* Outcomes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Outcomes (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              name="outcomes"
              value={formData.outcomes}
              onChange={handleChange}
              rows={3}
              className={`${inputClass} pl-12`}
              placeholder="Key takeaways, participant feedback, follow-up actions planned..."
            />
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image/Report (Optional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
            <div className="space-y-1 text-center">
              {filePreview ? (
                <div className="mb-4">
                  <img src={filePreview} alt="Preview" className="mx-auto h-32 w-auto rounded" />
                </div>
              ) : (
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    name="file"
                    onChange={handleChange}
                    className="sr-only"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
              {formData.file && (
                <p className="text-sm text-green-600 font-medium">{formData.file.name}</p>
              )}
            </div>
          </div>
          {errors.file && <p className={errorClass}>{errors.file}</p>}
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
                <span>Save Session</span>
              </>
            )}
          </button>
        </div>
      </form>
    </MotionDiv>
  );
};

export default AwarenessSessionForm;
