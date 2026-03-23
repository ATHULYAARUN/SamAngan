import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Heart, 
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  Bell,
  Stethoscope,
  UserCheck,
  MessageSquare,
  FileText,
  TrendingUp
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const RecentActivityFeed = () => {
  const MotionDiv = motion.div;
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    dateRange: '7days',
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    loadActivities();
    // Set up real-time updates
    const interval = setInterval(loadActivities, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, filters, searchTerm]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const response = await ashaService.getRecentActivities();
      setActivities(response.data || response);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Use mock data if API fails
      setActivities(getMockActivities());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockActivities = () => [
    {
      id: 1,
      type: 'visit',
      title: 'Home Visit Completed',
      description: 'Field visit completed for Revathy (25 years, pregnant woman)',
      person: 'Revathy',
      age: 25,
      location: 'Area A',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      time: '2 hours ago',
      priority: 'medium',
      status: 'completed',
      details: {
        visitType: 'ANC Checkup',
        findings: 'Normal BP, weight gain appropriate',
        nextVisit: '2026-02-05',
        ashaWorker: 'Sunita Devi'
      }
    },
    {
      id: 2,
      type: 'alert',
      title: 'Malnutrition Alert',
      description: 'Child Ravi Kumar (4 years) showing signs of severe malnutrition',
      person: 'Ravi Kumar',
      age: 4,
      location: 'Area B',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000),
      time: '5 hours ago',
      priority: 'high',
      status: 'pending',
      details: {
        muac: 11.5,
        weight: 12,
        height: 95,
        action: 'Referred to Nutrition Center',
        ashaWorker: 'Sunita Devi'
      }
    },
    {
      id: 3,
      type: 'awareness',
      title: 'Nutrition Awareness Session',
      description: 'Conducted nutrition awareness session for 25 adolescent girls',
      person: 'Adolescent Girls',
      age: '10-19',
      location: 'School A',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      time: '1 day ago',
      priority: 'low',
      status: 'completed',
      details: {
        topic: 'Nutrition and Hygiene',
        participants: 25,
        duration: '2 hours',
        materials: 'Flip charts, demonstration kit',
        ashaWorker: 'Sunita Devi'
      }
    },
    {
      id: 4,
      type: 'vaccination',
      title: 'Vaccination Camp',
      description: 'Organized vaccination camp - 15 children immunized',
      person: 'Multiple Children',
      age: '0-6',
      location: 'Community Center',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      time: '2 days ago',
      priority: 'medium',
      status: 'completed',
      details: {
        vaccines: ['DPT', 'Polio', 'MMR'],
        children: 15,
        nextCamp: '2026-02-10',
        ashaWorker: 'Sunita Devi'
      }
    },
    {
      id: 5,
      type: 'referral',
      title: 'Emergency Referral',
      description: 'Emergency referral for Mrs. Priya - High BP detected',
      person: 'Mrs. Priya',
      age: 32,
      location: 'Area C',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      time: '3 days ago',
      priority: 'urgent',
      status: 'in-progress',
      details: {
        condition: 'Severe hypertension',
        facility: 'District Hospital',
        bp: '160/100',
        ashaWorker: 'Sunita Devi'
      }
    },
    {
      id: 6,
      type: 'followup',
      title: 'Postnatal Follow-up',
      description: 'Postnatal checkup completed for Mrs. Anjali and newborn',
      person: 'Mrs. Anjali',
      age: 28,
      location: 'Area D',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      time: '4 days ago',
      priority: 'medium',
      status: 'completed',
      details: {
        babyAge: '7 days',
        babyWeight: '3.2 kg',
        motherHealth: 'Good',
        nextVisit: '2026-02-15',
        ashaWorker: 'Sunita Devi'
      }
    },
    {
      id: 7,
      type: 'supplement',
      title: 'Supplement Distribution',
      description: 'Distributed iron and folic acid supplements to 45 beneficiaries',
      person: 'Multiple Beneficiaries',
      age: 'Various',
      location: 'All Areas',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      time: '5 days ago',
      priority: 'low',
      status: 'completed',
      details: {
        supplements: ['Iron Tablets', 'Folic Acid'],
        beneficiaries: 45,
        nextDistribution: '2026-02-01',
        ashaWorker: 'Sunita Devi'
      }
    },
    {
      id: 8,
      type: 'feedback',
      title: 'Community Feedback',
      description: 'Received feedback on water sanitation issues in Area E',
      person: 'Community Members',
      age: 'Various',
      location: 'Area E',
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      time: '6 days ago',
      priority: 'medium',
      status: 'pending',
      details: {
        issue: 'Water contamination',
        affected: '15 families',
        action: 'Forwarded to PHC',
        ashaWorker: 'Sunita Devi'
      }
    }
  ];

  const filterActivities = () => {
    let filtered = [...activities];

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.type);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(activity => activity.priority === filters.priority);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filters.status);
    }

    // Apply date range filter
    const now = new Date();
    let cutoffDate;
    switch (filters.dateRange) {
      case '1day':
        cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }
    filtered = filtered.filter(activity => activity.date >= cutoffDate);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.person.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'visit':
        return Stethoscope;
      case 'alert':
        return AlertTriangle;
      case 'awareness':
        return UserCheck;
      case 'vaccination':
        return Activity;
      case 'referral':
        return Heart;
      case 'followup':
        return Clock;
      case 'supplement':
        return Users;
      case 'feedback':
        return MessageSquare;
      default:
        return FileText;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in-progress':
        return 'yellow';
      case 'pending':
        return 'red';
      default:
        return 'gray';
    }
  };

  const ActivityCard = ({ activity }) => {
    const Icon = getActivityIcon(activity.type);
    const priorityColor = getPriorityColor(activity.priority);
    const statusColor = getStatusColor(activity.status);

    return (
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg border-l-4 hover:shadow-xl transition-all cursor-pointer"
        style={{ borderLeftColor: priorityColor === 'red' ? '#EF4444' : priorityColor === 'orange' ? '#F97316' : priorityColor === 'yellow' ? '#EAB308' : '#22C55E' }}
        onClick={() => setSelectedActivity(activity)}
      >
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 bg-${priorityColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 text-${priorityColor}-600`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">{activity.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {activity.person} ({activity.age})
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {activity.location}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {activity.date.toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-800`}>
                  {activity.priority}
                </span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                  {activity.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-500">{activity.time}</span>
              <div className="flex items-center space-x-2">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>
    );
  };

  const ActivityDetailModal = ({ activity, onClose }) => {
    if (!activity) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{activity.title}</h2>
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
                  <p className="font-medium">{activity.person} ({activity.age})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{activity.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getPriorityColor(activity.priority)}-100 text-${getPriorityColor(activity.priority)}-800`}>
                    {activity.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(activity.status)}-100 text-${getStatusColor(activity.status)}-800`}>
                    {activity.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900">{activity.description}</p>
              </div>

              {activity.details && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Additional Details</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {Object.entries(activity.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-sm text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{activity.date.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{activity.time}</p>
                </div>
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
        <h2 className="text-2xl font-bold text-black">Recent Activity Feed</h2>
        <button
          onClick={loadActivities}
          className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setFilters({ type: 'all', priority: 'all', dateRange: '7days', status: 'all' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="visit">Home Visits</option>
              <option value="alert">Health Alerts</option>
              <option value="awareness">Awareness Sessions</option>
              <option value="vaccination">Vaccination</option>
              <option value="referral">Referrals</option>
              <option value="followup">Follow-ups</option>
              <option value="supplement">Supplements</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>

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
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="1day">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
            <p className="text-gray-600">No activities match your current filters.</p>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      <ActivityDetailModal 
        activity={selectedActivity} 
        onClose={() => setSelectedActivity(null)} 
      />
    </div>
  );
};

export default RecentActivityFeed;
