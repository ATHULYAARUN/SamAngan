import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Bell, 
  Heart, 
  Activity,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  Calendar,
  Phone,
  MapPin,
  FileText,
  RefreshCw,
  Droplet
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const AlertsManagement = () => {
  const MotionDiv = motion.div;
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filters, searchTerm]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const [alertsRes, aiRes] = await Promise.all([
        ashaService.getAlerts().catch(() => ({ data: [] })),       // backend alerts (feedback + flagged visits)
        ashaService.getAiAlerts().catch(() => ({ data: [] }))     // AI-derived alerts from visit data
      ]);

      const baseAlerts = alertsRes?.data || alertsRes || [];
      const aiAlerts = (aiRes?.data || aiRes || []).map((a, idx) => {
        // Map AI alert risk level to priority for this UI
        const risk = (a.riskLevel || '').toLowerCase();
        let priority = 'low';
        if (risk === 'high') priority = 'high';
        else if (risk === 'moderate') priority = 'medium';

        return {
          id: a.id ?? a._id ?? `ai-${idx}`,
          type:
            a.type === 'pregnancy_risk'
              ? 'highRiskPregnancy'
              : a.type === 'child_malnutrition'
              ? 'malnutrition'
              : a.type === 'adolescent_anemia'
              ? 'anemia'
              : 'health',
          priority,
          status: 'pending',
          title: a.title || 'Health Alert',
          description: a.reason || '',
          person: a.beneficiaryName || 'Beneficiary',
          age: a.details?.age ?? '—',
          location: a.ashaArea || '', // area not included in AI alert; can be extended later
          date: a.date ? (typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0]) : '—',
          time: a.date ? (typeof a.date === 'string' ? a.date.slice(11, 16) : new Date(a.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })) : '—',
          actionRequired: a.action || 'Follow-up required',
          followUpDate: null,
          referredTo: null,
          assignedTo: null
        };
      });

      const merged = [...baseAlerts, ...aiAlerts];
      setAlerts(merged.length > 0 ? merged : getMockAlerts());
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts(getMockAlerts());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAlerts = () => [
    {
      id: 1,
      type: 'anemia',
      priority: 'high',
      status: 'pending',
      title: 'Severe Anemia Detected',
      description: 'Mrs. Revathy (25 years) - Hemoglobin: 8.2 g/dL',
      person: 'Revathy',
      age: 25,
      location: 'Area A',
      date: '2026-01-28',
      time: '10:30 AM',
      actionRequired: 'Immediate medical referral needed',
      followUpDate: '2026-01-30',
      referredTo: 'District Hospital',
      assignedTo: 'Dr. Sharma'
    },
    {
      id: 2,
      type: 'malnutrition',
      priority: 'high',
      status: 'pending',
      title: 'Severe Malnutrition Alert',
      description: 'Child Ravi (4 years) - MUAC: 11.5 cm, Weight: 12 kg',
      person: 'Ravi Kumar',
      age: 4,
      location: 'Area B',
      date: '2026-01-28',
      time: '9:15 AM',
      actionRequired: 'Nutritional rehabilitation required',
      followUpDate: '2026-01-29',
      referredTo: 'Nutrition Center',
      assignedTo: 'AWW Sunita'
    },
    {
      id: 3,
      type: 'highRiskPregnancy',
      priority: 'urgent',
      status: 'in-progress',
      title: 'High Risk Pregnancy',
      description: 'Mrs. Priya (32 years) - BP: 140/90, Gestational Diabetes',
      person: 'Priya Singh',
      age: 32,
      location: 'Area C',
      date: '2026-01-27',
      time: '2:45 PM',
      actionRequired: 'Specialized antenatal care needed',
      followUpDate: '2026-01-31',
      referredTo: 'Medical College',
      assignedTo: 'Dr. Patel'
    },
    {
      id: 4,
      type: 'immunizationDelay',
      priority: 'medium',
      status: 'resolved',
      title: 'Immunization Delay',
      description: 'Baby Anjali (8 months) - Missed DPT-3 dose',
      person: 'Anjali',
      age: 0.8,
      location: 'Area D',
      date: '2026-01-26',
      time: '11:00 AM',
      actionRequired: 'Vaccination catch-up required',
      followUpDate: '2026-01-28',
      referredTo: 'PHC',
      assignedTo: 'Nurse Rani'
    },
    {
      id: 5,
      type: 'developmentalDelays',
      priority: 'medium',
      status: 'pending',
      title: 'Developmental Delay Concern',
      description: 'Child Rohan (3 years) - Delayed motor skills',
      person: 'Rohan Verma',
      age: 3,
      location: 'Area E',
      date: '2026-01-25',
      time: '3:30 PM',
      actionRequired: 'Developmental assessment needed',
      followUpDate: '2026-02-01',
      referredTo: 'Child Development Center',
      assignedTo: 'Dr. Mehta'
    }
  ];

  const filterAlerts = () => {
    let filtered = [...alerts];

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(alert => alert.priority === filters.priority);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => alert.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAlerts(filtered);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'anemia': return Droplet;
      case 'malnutrition': return AlertTriangle;
      case 'highRiskPregnancy': return Heart;
      case 'immunizationDelay': return Clock;
      case 'developmentalDelays': return Activity;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'red';
      case 'in-progress': return 'yellow';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const updateAlertStatus = async (alertId, newStatus) => {
    const id = alertId != null ? String(alertId) : null;
    if (!id) return;
    try {
      await ashaService.updateAlertStatus(id, { status: newStatus });
      setAlerts(prev => prev.map(alert => 
        (String(alert.id) === id || alert.id === alertId) ? { ...alert, status: newStatus } : alert
      ));
    } catch (error) {
      console.error('Error updating alert status:', error);
    }
  };

  const AlertCard = ({ alert }) => {
    const Icon = getAlertIcon(alert.type);
    const priorityColor = getPriorityColor(alert.priority);
    const statusColor = getStatusColor(alert.status);

    return (
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border-l-4 border-gray-200 hover:shadow-xl transition-all cursor-pointer"
        style={{ borderLeftColor: priorityColor === 'red' ? '#EF4444' : priorityColor === 'orange' ? '#F97316' : priorityColor === 'yellow' ? '#EAB308' : '#22C55E' }}
        onClick={() => setSelectedAlert(alert)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${priorityColor}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${priorityColor}-600`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                <p className="text-sm text-gray-600">{alert.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-800`}>
                {alert.priority}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                {alert.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-1" />
              {alert.person} ({String(alert.age)}y)
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              {alert.location}
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              {alert.date}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {alert.time}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Action:</span> {alert.actionRequired}
              </div>
              <div className="flex items-center space-x-2">
                {alert.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlertStatus(alert.id, 'in-progress');
                    }}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    Start Work
                  </button>
                )}
                {alert.status === 'in-progress' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlertStatus(alert.id, 'resolved');
                    }}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>
    );
  };

  const AlertDetailModal = ({ alert, onClose }) => {
    if (!alert) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{alert.title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Person</p>
                  <p className="font-medium">{alert.person} ({alert.age} years)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{alert.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getPriorityColor(alert.priority)}-100 text-${getPriorityColor(alert.priority)}-800`}>
                    {alert.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(alert.status)}-100 text-${getStatusColor(alert.status)}-800`}>
                    {alert.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900">{alert.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Action Required</p>
                <p className="text-gray-900">{alert.actionRequired}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Referred To</p>
                  <p className="font-medium">{alert.referredTo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned To</p>
                  <p className="font-medium">{alert.assignedTo}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Follow-up Date</p>
                <p className="font-medium">{alert.followUpDate}</p>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={() => {
                    updateAlertStatus(alert.id, 'in-progress');
                    onClose();
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  disabled={alert.status !== 'pending'}
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => {
                    updateAlertStatus(alert.id, 'resolved');
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={alert.status === 'resolved'}
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Alerts & Referrals Management</h2>
        <button
          onClick={loadAlerts}
          className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-red-900">Urgent</h4>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {alerts.filter(a => a.priority === 'urgent').length}
          </p>
          <p className="text-sm text-red-700 mt-1">Immediate action required</p>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-orange-900">High Priority</h4>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {alerts.filter(a => a.priority === 'high').length}
          </p>
          <p className="text-sm text-orange-700 mt-1">Attention needed today</p>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-yellow-900">In Progress</h4>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {alerts.filter(a => a.status === 'in-progress').length}
          </p>
          <p className="text-sm text-yellow-700 mt-1">Being addressed</p>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-green-900">Resolved</h4>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {alerts.filter(a => a.status === 'resolved').length}
          </p>
          <p className="text-sm text-green-700 mt-1">Successfully handled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setFilters({ priority: 'all', status: 'all', type: 'all', dateRange: 'all' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="anemia">Anemia</option>
              <option value="malnutrition">Malnutrition</option>
              <option value="highRiskPregnancy">High Risk Pregnancy</option>
              <option value="immunizationDelay">Immunization Delay</option>
              <option value="developmentalDelays">Developmental Delays</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alerts..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, idx) => (
            <AlertCard key={String(alert.id ?? alert._id ?? idx)} alert={alert} />
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts Found</h3>
            <p className="text-gray-600">No alerts match your current filters.</p>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      <AlertDetailModal 
        alert={selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
      />
    </div>
  );
};

export default AlertsManagement;
