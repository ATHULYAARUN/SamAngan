import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Filter, 
  Search,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Shield,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Activity
} from 'lucide-react';

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    dateRange: '7days'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const activityTypes = [
    { id: 'waste-collection', name: 'Waste Collection', icon: Trash2, color: 'green' },
    { id: 'hygiene-checklist', name: 'Hygiene Checklist', icon: Shield, color: 'blue' },
    { id: 'issue-reported', name: 'Issue Reported', icon: AlertTriangle, color: 'red' },
    { id: 'issue-resolved', name: 'Issue Resolved', icon: CheckCircle, color: 'green' },
    { id: 'verification', name: 'Verification', icon: CheckCircle, color: 'purple' }
  ];

  const dateRanges = [
    { id: 'today', name: 'Today', days: 0 },
    { id: '7days', name: 'Last 7 Days', days: 7 },
    { id: '30days', name: 'Last 30 Days', days: 30 },
    { id: 'all', name: 'All Time', days: null }
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockActivities = [
      {
        id: 1,
        type: 'waste-collection',
        title: 'Organic Waste Collection',
        description: 'Collected 25.5 kg of organic waste from main collection point',
        timestamp: '2024-01-20 08:30 AM',
        performedBy: 'SAN-001',
        status: 'completed',
        location: 'Main Collection Point',
        quantity: '25.5 kg',
        verificationStatus: 'verified',
        verifiedBy: 'AWW-001',
        metadata: {
          category: 'organic',
          collectionTime: '08:30 AM',
          remarks: 'Regular morning collection'
        }
      },
      {
        id: 2,
        type: 'hygiene-checklist',
        title: 'Daily Hygiene Inspection',
        description: 'Completed daily hygiene checklist with 87.5% compliance score',
        timestamp: '2024-01-20 10:15 AM',
        performedBy: 'SAN-001',
        status: 'completed',
        location: 'Entire Facility',
        complianceScore: 87.5,
        verificationStatus: 'verified',
        verifiedBy: 'AWW-001',
        metadata: {
          frequency: 'daily',
          issuesFound: 'Toilet area needs cleaning supplies',
          nextAction: 'Restock supplies tomorrow'
        }
      },
      {
        id: 3,
        type: 'issue-reported',
        title: 'Drainage Blockage Issue',
        description: 'Reported blocked drainage channel near kitchen area',
        timestamp: '2024-01-20 11:45 AM',
        performedBy: 'SAN-001',
        status: 'open',
        location: 'Kitchen Area - Back Side',
        severity: 'high',
        verificationStatus: 'submitted',
        verifiedBy: null,
        metadata: {
          issueType: 'drainage',
          severity: 'high',
          assignedTo: 'Maintenance Team'
        }
      },
      {
        id: 4,
        type: 'issue-resolved',
        title: 'Pest Control Issue Resolved',
        description: 'Rodent activity issue in storage area has been resolved',
        timestamp: '2024-01-20 02:30 PM',
        performedBy: 'Pest Control Team',
        status: 'completed',
        location: 'Storage Room',
        verificationStatus: 'approved',
        verifiedBy: 'Admin-001',
        metadata: {
          originalIssueId: 3,
          resolutionTime: '2 hours',
          actions: ['Pest control treatment completed', 'Monitoring setup']
        }
      },
      {
        id: 5,
        type: 'waste-collection',
        title: 'Plastic Waste Collection',
        description: 'Collected 12 kg of segregated plastic waste',
        timestamp: '2024-01-19 02:00 PM',
        performedBy: 'SAN-001',
        status: 'completed',
        location: 'Main Collection Point',
        quantity: '12 kg',
        verificationStatus: 'approved',
        verifiedBy: 'Admin-001',
        metadata: {
          category: 'plastic',
          collectionTime: '02:00 PM',
          remarks: 'Properly segregated plastic waste'
        }
      },
      {
        id: 6,
        type: 'verification',
        title: 'Waste Log Verification',
        description: 'AWW verified yesterday\'s waste collection logs',
        timestamp: '2024-01-19 04:15 PM',
        performedBy: 'AWW-001',
        status: 'completed',
        verificationStatus: 'approved',
        verifiedBy: 'Admin-001',
        metadata: {
          logsVerified: 3,
          complianceRate: '100%',
          remarks: 'All logs properly documented'
        }
      }
    ];
    setActivities(mockActivities);
  }, []);

  const filteredActivities = activities.filter(activity => {
    if (filter.type !== 'all' && activity.type !== filter.type) return false;
    if (filter.status !== 'all' && activity.status !== filter.status) return false;
    if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !activity.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    if (filter.dateRange !== 'all') {
      const range = dateRanges.find(r => r.id === filter.dateRange);
      if (range && range.days !== null) {
        const activityDate = new Date(activity.timestamp);
        const cutoffDate = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000);
        if (activityDate < cutoffDate) return false;
      }
    }
    
    return true;
  });

  const getActivityTypeInfo = (typeId) => {
    return activityTypes.find(type => type.id === typeId) || { name: typeId, color: 'gray' };
  };

  const getVerificationBadge = (status) => {
    const badges = {
      submitted: { color: 'yellow', text: 'Submitted' },
      verified: { color: 'green', text: 'Verified (AWW)' },
      approved: { color: 'blue', text: 'Approved (Admin)' },
      rejected: { color: 'red', text: 'Rejected' }
    };
    return badges[status] || { color: 'gray', text: status };
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: CheckCircle,
      open: AlertTriangle,
      'in-progress': Clock,
      pending: Clock
    };
    return icons[status] || Activity;
  };

  const getActivityStats = () => {
    const total = filteredActivities.length;
    const completed = filteredActivities.filter(a => a.status === 'completed').length;
    const pending = filteredActivities.filter(a => a.status === 'open' || a.status === 'pending').length;
    const verified = filteredActivities.filter(a => a.verificationStatus === 'verified' || a.verificationStatus === 'approved').length;
    
    return { total, completed, pending, verified };
  };

  const stats = getActivityStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recent Activities</h2>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {filteredActivities.length} activities
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600">Total Activities</div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600">Completed</div>
              <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-600">Verified</div>
              <div className="text-2xl font-bold text-purple-900">{stats.verified}</div>
            </div>
            <Shield className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Filters</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            value={filter.type}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {activityTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
          </select>
          <select
            value={filter.dateRange}
            onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {dateRanges.map(range => (
              <option key={range.id} value={range.id}>
                {range.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setFilter({ type: 'all', status: 'all', dateRange: '7days' })}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Activities Timeline */}
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => {
            const typeInfo = getActivityTypeInfo(activity.type);
            const TypeIcon = typeInfo.icon;
            const StatusIcon = getStatusIcon(activity.status);
            const verificationBadge = getVerificationBadge(activity.verificationStatus);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full bg-${typeInfo.color}-100 flex items-center justify-center`}>
                    <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <div className="flex items-center space-x-1">
                        <StatusIcon className={`w-4 h-4 ${
                          activity.status === 'completed' ? 'text-green-500' :
                          activity.status === 'open' ? 'text-red-500' :
                          'text-yellow-500'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">{activity.status}</span>
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${verificationBadge.color}-100 text-${verificationBadge.color}-800`}>
                        {verificationBadge.text}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{activity.timestamp}</div>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{activity.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{activity.performedBy}</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                    {activity.quantity && (
                      <div className="flex items-center space-x-1">
                        <Trash2 className="w-3 h-3" />
                        <span>{activity.quantity}</span>
                      </div>
                    )}
                    {activity.complianceScore && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{activity.complianceScore}% compliance</span>
                      </div>
                    )}
                  </div>

                  {/* Additional metadata based on activity type */}
                  {activity.metadata && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;
