import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle,
  Calendar,
  Heart,
  Activity,
  RefreshCw,
  Clock,
  Users,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const NotificationsPanel = ({ notifications = [], onRefresh }) => {
  const MotionDiv = motion.div;
  const [allNotifications, setAllNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    loadNotifications();
    // Set up real-time updates
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [allNotifications, filters, searchTerm]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await ashaService.getNotifications();
      const notificationsData = response.data || response;
      setAllNotifications(notificationsData.length > 0 ? notificationsData : getMockNotifications());
    } catch (error) {
      console.error('Error loading notifications:', error);
      setAllNotifications(getMockNotifications());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockNotifications = () => [
    {
      id: 1,
      type: 'vaccination',
      priority: 'high',
      status: 'pending',
      title: 'Vaccination Reminder',
      message: '5 children due for DPT vaccination this week',
      person: 'Multiple Children',
      location: 'Area A, B, C',
      time: '2 hours ago',
      date: '2026-01-28',
      actionRequired: 'Schedule vaccination camp',
      dueDate: '2026-01-30',
      category: 'immunization'
    },
    {
      id: 2,
      type: 'anc',
      priority: 'high',
      status: 'pending',
      title: 'Missed ANC Visit',
      message: 'Mrs. Sharma missed her ANC checkup - Follow-up required',
      person: 'Mrs. Sharma',
      location: 'Area D',
      time: '5 hours ago',
      date: '2026-01-28',
      actionRequired: 'Home visit and counseling',
      dueDate: '2026-01-29',
      category: 'maternal'
    },
    {
      id: 3,
      type: 'alert',
      priority: 'urgent',
      status: 'pending',
      title: 'Malnutrition Alert',
      message: 'Child Ravi Kumar (4 years) showing signs of severe malnutrition',
      person: 'Ravi Kumar',
      location: 'Area E',
      time: '1 day ago',
      date: '2026-01-27',
      actionRequired: 'Immediate referral to nutrition center',
      dueDate: '2026-01-28',
      category: 'nutrition'
    },
    {
      id: 4,
      type: 'alert',
      priority: 'medium',
      status: 'in-progress',
      title: 'Low Hemoglobin',
      message: '3 pregnant women with hemoglobin below 10 g/dL',
      person: 'Multiple Women',
      location: 'Area F, G',
      time: '2 days ago',
      date: '2026-01-26',
      actionRequired: 'Provide iron supplements and monitor',
      dueDate: '2026-02-01',
      category: 'anemia'
    },
    {
      id: 5,
      type: 'vaccination',
      priority: 'medium',
      status: 'pending',
      title: 'Immunization Camp',
      message: 'Scheduled immunization camp at Community Center next Monday',
      person: 'Community',
      location: 'Community Center',
      time: '3 days ago',
      date: '2026-01-25',
      actionRequired: 'Prepare materials and inform beneficiaries',
      dueDate: '2026-02-03',
      category: 'immunization'
    },
    {
      id: 6,
      type: 'followup',
      priority: 'low',
      status: 'pending',
      title: 'Follow-up Visit Due',
      message: 'Postnatal checkup due for Mrs. Priya and baby',
      person: 'Mrs. Priya',
      location: 'Area H',
      time: '4 days ago',
      date: '2026-01-24',
      actionRequired: 'Schedule home visit',
      dueDate: '2026-02-05',
      category: 'followup'
    },
    {
      id: 7,
      type: 'supplement',
      priority: 'medium',
      status: 'pending',
      title: 'Supplement Distribution',
      message: 'Monthly iron and folic acid supplements distribution due',
      person: 'Beneficiaries',
      location: 'All Areas',
      time: '5 days ago',
      date: '2026-01-23',
      actionRequired: 'Collect supplements from PHC',
      dueDate: '2026-02-01',
      category: 'supplements'
    },
    {
      id: 8,
      type: 'awareness',
      priority: 'low',
      status: 'pending',
      title: 'Awareness Session',
      message: 'Nutrition awareness session scheduled for adolescent girls',
      person: 'Adolescent Girls',
      location: 'School A',
      time: '1 week ago',
      date: '2026-01-21',
      actionRequired: 'Prepare session materials',
      dueDate: '2026-02-10',
      category: 'awareness'
    }
  ];

  const filterNotifications = () => {
    let filtered = [...allNotifications];

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(notif => notif.priority === filters.priority);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(notif => notif.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(notif => notif.type === filters.type);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.person.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId) => {
    try {
      await ashaService.markNotificationAsRead(notificationId);
      setAllNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, status: 'read' } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsCompleted = async (notificationId) => {
    try {
      await ashaService.updateNotificationStatus(notificationId, { status: 'completed' });
      setAllNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, status: 'completed' } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as completed:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'vaccination':
        return Activity;
      case 'anc':
        return Heart;
      case 'alert':
        return AlertTriangle;
      case 'followup':
        return Clock;
      case 'supplement':
        return Users;
      case 'awareness':
        return Calendar;
      default:
        return Bell;
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
        return 'blue';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'red';
      case 'in-progress':
        return 'yellow';
      case 'completed':
        return 'green';
      case 'read':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const NotificationCard = ({ notification }) => {
    const Icon = getIcon(notification.type);
    const priorityColor = getPriorityColor(notification.priority);
    const statusColor = getStatusColor(notification.status);

    return (
      <MotionDiv
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-white rounded-xl p-6 shadow-lg border-l-4 hover:shadow-xl transition-all cursor-pointer ${
          notification.status === 'read' ? 'opacity-75' : ''
        }`}
        style={{ borderLeftColor: priorityColor === 'red' ? '#EF4444' : priorityColor === 'orange' ? '#F97316' : priorityColor === 'yellow' ? '#EAB308' : '#22C55E' }}
        onClick={() => setSelectedNotification(notification)}
      >
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 bg-${priorityColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 text-${priorityColor}-600`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">{notification.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {notification.person}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {notification.location}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Due: {notification.dueDate}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-800`}>
                  {notification.priority}
                </span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                  {notification.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-500">{notification.time}</span>
              <div className="flex items-center space-x-2">
                {notification.status === 'pending' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark as Read
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsCompleted(notification.id);
                      }}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Mark Complete
                    </button>
                  </>
                )}
                <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>
    );
  };

  const NotificationDetailModal = ({ notification, onClose }) => {
    if (!notification) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{notification.title}</h2>
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
                  <p className="text-sm text-gray-600">Priority</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getPriorityColor(notification.priority)}-100 text-${getPriorityColor(notification.priority)}-800`}>
                    {notification.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(notification.status)}-100 text-${getStatusColor(notification.status)}-800`}>
                    {notification.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Person</p>
                  <p className="font-medium">{notification.person}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{notification.location}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Message</p>
                <p className="text-gray-900">{notification.message}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Action Required</p>
                <p className="text-gray-900">{notification.actionRequired}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{notification.dueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Received</p>
                  <p className="font-medium">{notification.time}</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={() => {
                    markAsRead(notification.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={notification.status === 'read'}
                >
                  Mark as Read
                </button>
                <button
                  onClick={() => {
                    markAsCompleted(notification.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={notification.status === 'completed'}
                >
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const displayNotifications = filteredNotifications.length > 0 ? filteredNotifications : allNotifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Notifications & Alerts</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={loadNotifications}
            className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setFilters({ type: 'all', priority: 'all', status: 'all', dateRange: 'all' })}
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
              <option value="vaccination">Vaccination</option>
              <option value="anc">ANC</option>
              <option value="alert">Alert</option>
              <option value="followup">Follow-up</option>
              <option value="supplement">Supplements</option>
              <option value="awareness">Awareness</option>
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
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="read">Read</option>
              <option value="completed">Completed</option>
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
                placeholder="Search notifications..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-red-900">Urgent</h4>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {allNotifications.filter(n => n.priority === 'urgent').length}
          </p>
          <p className="text-sm text-red-700 mt-1">Immediate attention</p>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-orange-900">High Priority</h4>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {allNotifications.filter(n => n.priority === 'high').length}
          </p>
          <p className="text-sm text-orange-700 mt-1">Action needed today</p>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-yellow-900">In Progress</h4>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {allNotifications.filter(n => n.status === 'in-progress').length}
          </p>
          <p className="text-sm text-yellow-700 mt-1">Being addressed</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">Total Alerts</h4>
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{allNotifications.length}</p>
          <p className="text-sm text-blue-700 mt-1">All notifications</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayNotifications.length > 0 ? (
          displayNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications Found</h3>
            <p className="text-gray-600">No notifications match your current filters.</p>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      <NotificationDetailModal 
        notification={selectedNotification} 
        onClose={() => setSelectedNotification(null)} 
      />
    </div>
  );
};

export default NotificationsPanel;
