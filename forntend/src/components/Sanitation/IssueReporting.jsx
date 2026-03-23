import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  MapPin,
  Save,
  Filter,
  Search,
  AlertCircle,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Loader2
} from 'lucide-react';
import sanitationService from '../../services/sanitationService';

const ISSUE_TYPES = [
  { id: 'Waste Overflow', name: 'Waste Overflow', color: 'red' },
  { id: 'Blocked Drain', name: 'Blocked Drain', color: 'blue' },
  { id: 'Garbage Dumping', name: 'Garbage Dumping', color: 'orange' },
  { id: 'Mosquito Breeding Area', name: 'Mosquito Breeding Area', color: 'red' },
  { id: 'Dirty Public Area', name: 'Dirty Public Area', color: 'yellow' }
];

const PRIORITY_LEVELS = [
  { id: 'Low', name: 'Low', color: 'green' },
  { id: 'Medium', name: 'Medium', color: 'yellow' },
  { id: 'High', name: 'High', color: 'red' }
];

const STATUS_OPTIONS = [
  { id: 'Open', name: 'Open', color: 'red', icon: AlertCircle },
  { id: 'Resolved', name: 'Resolved', color: 'green', icon: CheckCircle }
];

const IssueReporting = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    priorityLevel: 'Medium',
    location: '',
    photo: null
  });
  const [filter, setFilter] = useState({ type: '', priority: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(null);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.type) params.type = filter.type;
      const data = await sanitationService.getIssues(params);
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [filter.type, filter.priority, filter.status]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sanitationService.createIssue(
        {
          issueType: formData.issueType,
          description: formData.description,
          priorityLevel: formData.priorityLevel,
          location: formData.location
        },
        formData.photo || null
      );
      setFormData({ issueType: '', description: '', priorityLevel: 'Medium', location: '', photo: null });
      loadIssues();
      alert('Issue reported successfully! Admin can view it in the dashboard.');
    } catch (err) {
      alert(err.message || 'Failed to report issue');
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (searchTerm && !issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !issue.location?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getIssueTypeInfo = (id) => ISSUE_TYPES.find(t => t.id === id) || { name: id, color: 'gray' };
  const getPriorityInfo = (id) => PRIORITY_LEVELS.find(p => p.id === id) || { name: id, color: 'gray' };
  const getStatusInfo = (id) => STATUS_OPTIONS.find(s => s.id === id) || { name: id, color: 'gray' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Issue Reporting</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Open: {issues.filter(i => i.status === 'Open').length}
          </div>
          <div className="text-sm text-gray-500">
            Resolved: {issues.filter(i => i.status === 'Resolved').length}
          </div>
        </div>
      </div>

      {/* New Issue Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report New Issue</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Issue Type</option>
                {ISSUE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
              <select
                name="priorityLevel"
                value={formData.priorityLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {PRIORITY_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Where is the issue located?"
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Photo (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.files[0] || null }))}
                className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Issue
            </button>
          </div>
        </form>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reported Issues</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search issues..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Filters</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={filter.type}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {ISSUE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            value={filter.priority}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            {PRIORITY_LEVELS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => {
              const typeInfo = getIssueTypeInfo(issue.issueType);
              const priorityInfo = getPriorityInfo(issue.priorityLevel);
              const statusInfo = getStatusInfo(issue.status);
              const StatusIcon = statusInfo.icon || AlertCircle;
              return (
                <motion.div
                  key={issue._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{typeInfo.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800`}>
                          {priorityInfo.name}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.name}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {issue.location}
                        </span>
                        <span>Reported by {issue.reportedByName || issue.reportedBy || 'Worker'}</span>
                        <span>{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : ''}</span>
                      </div>
                      {issue.resolvedAt && (
                        <p className="mt-2 text-sm text-gray-600">Resolved: {new Date(issue.resolvedAt).toLocaleString()}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowDetails(showDetails === issue._id ? null : issue._id)}
                      className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showDetails === issue._id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                  {showDetails === issue._id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                      Issue ID: {issue._id}
                      {issue.photoUrl && <p>Photo: {issue.photoUrl}</p>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        {!loading && filteredIssues.length === 0 && (
          <p className="text-center py-6 text-gray-500">No issues found.</p>
        )}
      </div>
    </div>
  );
};

export default IssueReporting;
