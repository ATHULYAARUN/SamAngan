import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  AlertTriangle,
  Camera,
  Save,
  Send
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const FeedbackForm = ({ onSuccess }) => {
  const MotionDiv = motion.div;
  const [formData, setFormData] = useState({
    feedbackType: 'health', // health, sanitation, nutrition
    message: '',
    priority: 'medium', // low, medium, high
    photo: null
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'photo') {
      const file = files[0];
      if (file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          setErrors(prev => ({ ...prev, photo: 'Only JPG and PNG images are allowed' }));
          return;
        }
        
        // Validate file size (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, photo: 'Image size must be less than 3MB' }));
          return;
        }
        
        setFormData(prev => ({ ...prev, photo: file }));
        setErrors(prev => ({ ...prev, photo: '' }));
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';

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
      const ashaName = localStorage.getItem('userName') || 'ASHA Worker';
      
      await ashaService.createFeedback({
        ...formData,
        ashaArea,
        ashaName,
        submittedAt: new Date().toISOString()
      });
      
      alert('Feedback submitted successfully! It will be forwarded to AWW and Admin.');
      
      // Reset form
      setFormData({
        feedbackType: 'health',
        message: '',
        priority: 'medium',
        photo: null
      });
      setPhotoPreview(null);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(`Failed to submit feedback: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200";
  const errorClass = "text-red-500 text-sm mt-1";

  const feedbackTypes = [
    { value: 'health', label: 'Health Issue', icon: '🏥', color: 'red' },
    { value: 'sanitation', label: 'Sanitation Issue', icon: '🚰', color: 'blue' },
    { value: 'nutrition', label: 'Nutrition Concern', icon: '🍎', color: 'orange' }
  ];

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Submit Feedback & Alerts</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Feedback Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {feedbackTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, feedbackType: type.value }))}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.feedbackType === type.value
                    ? `border-${type.color}-500 bg-${type.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'low', label: 'Low', color: 'green' },
              { value: 'medium', label: 'Medium', color: 'yellow' },
              { value: 'high', label: 'High', color: 'red' }
            ].map((priority) => (
              <button
                key={priority.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                className={`p-3 border-2 rounded-lg transition-all ${
                  formData.priority === priority.value
                    ? `border-${priority.color}-500 bg-${priority.color}-50 text-${priority.color}-700`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {priority.value === 'high' && <AlertTriangle className="w-4 h-4" />}
                  <span className="font-medium">{priority.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message / Comments *
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className={`${inputClass} pl-12 ${errors.message ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Describe the issue or observation in detail. Include location, severity, and any immediate actions taken..."
            />
          </div>
          {errors.message && <p className={errorClass}>{errors.message}</p>}
          <p className="text-xs text-gray-500 mt-1">
            {formData.message.length} characters (minimum 10 required)
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attach Photo (Optional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
            <div className="space-y-1 text-center">
              {photoPreview ? (
                <div className="mb-4">
                  <img src={photoPreview} alt="Preview" className="mx-auto h-48 w-auto rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, photo: null }));
                      setPhotoPreview(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                  <span>Upload a photo</span>
                  <input
                    type="file"
                    name="photo"
                    onChange={handleChange}
                    className="sr-only"
                    accept="image/jpeg,image/png,image/jpg"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG up to 3MB</p>
              {formData.photo && (
                <p className="text-sm text-green-600 font-medium">{formData.photo.name}</p>
              )}
            </div>
          </div>
          {errors.photo && <p className={errorClass}>{errors.photo}</p>}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-900">Automatic Forwarding</p>
              <p className="text-sm text-blue-700 mt-1">
                This feedback will be automatically forwarded to the concerned Anganwadi Worker and Admin dashboard for immediate action. You will receive updates on the resolution status.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </MotionDiv>
  );
};

export default FeedbackForm;
