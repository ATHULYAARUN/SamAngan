import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Shield,
  Clock,
  Filter,
  Search,
  Volume2,
  VolumeX,
  Eye,
  CheckSquare
} from 'lucide-react';
import sanitationService from '../../services/sanitationService';

const SanitationNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    priority: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const notificationTypes = [
    { id: 'issue-submitted', name: 'Issue Submitted', icon: AlertTriangle, color: 'red' },
    { id: 'drainage-alert', name: 'Drainage Alert', icon: AlertTriangle, color: 'orange' },
    { id: 'waste-overflow', name: 'Waste Overflow', icon: Trash2, color: 'red' },
    { id: 'verification', name: 'Verification', icon: CheckCircle, color: 'green' },
    { id: 'compliance-fail', name: 'Compliance Fail', icon: Shield, color: 'yellow' },
    { id: 'collection-delay', name: 'Collection Delay', icon: Clock, color: 'blue' },
    { id: 'pest-alert', name: 'Pest Alert', icon: AlertTriangle, color: 'orange' },
    { id: 'water-contamination', name: 'Water Contamination', icon: AlertTriangle, color: 'red' }
  ];

  const priorities = [
    { id: 'critical', name: 'Critical', color: 'red' },
    { id: 'high', name: 'High', color: 'orange' },
    { id: 'medium', name: 'Medium', color: 'yellow' },
    { id: 'low', name: 'Low', color: 'green' }
  ];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await sanitationService.getNotifications();
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data.map((n, i) => ({
              id: n.id || `n-${i}`,
              type: n.type || 'info',
              title:
                n.title ||
                (n.type ? String(n.type).charAt(0).toUpperCase() + String(n.type).slice(1) : 'Notification'),
              message: n.message || '',
              priority: n.priority || 'medium',
              status: n.status || 'unread',
              timestamp: n.timestamp || new Date().toLocaleString(),
              sender: n.sender || 'System',
              recipients: Array.isArray(n.recipients) ? n.recipients : ['Sanitation Worker'],
              actionRequired: Boolean(n.actionRequired),
              metadata: n.metadata || null,
              actionUrl: n.actionUrl || null
            }))
          : [];
        setNotifications(list);
      } catch (err) {
        if (!cancelled) setNotifications([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter.type !== 'all' && notification.type !== filter.type) return false;
    if (filter.status !== 'all' && notification.status !== filter.status) return false;
    if (filter.priority !== 'all' && notification.priority !== filter.priority) return false;
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getNotificationTypeInfo = (typeId) => {
    return notificationTypes.find(type => type.id === typeId) || { name: typeId, color: 'gray' };
  };

  const getPriorityInfo = (priorityId) => {
    return priorities.find(priority => priority.id === priorityId) || { name: priorityId, color: 'gray' };
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: 'read' }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, status: 'read' }))
    );
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const handleActionClick = (notification) => {
    if (notification.actionUrl) {
      // In real implementation, this would navigate to the action URL
      alert(`Navigating to: ${notification.actionUrl}`);
    }
    handleMarkAsRead(notification.id);
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && n.status === 'unread').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {criticalCount > 0 && (
              <span className="text-sm text-red-600 font-medium">
                {criticalCount} critical
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {soundEnabled ? (
              <><Volume2 className="w-4 h-4 mr-2" />Sound On</>
            ) : (
              <><VolumeX className="w-4 h-4 mr-2" />Sound Off</>
            )}
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-600">Critical</div>
              <div className="text-2xl font-bold text-red-900">
                {notifications.filter(n => n.priority === 'critical' && n.status === 'unread').length}
              </div>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-orange-600">High Priority</div>
              <div className="text-2xl font-bold text-orange-900">
                {notifications.filter(n => n.priority === 'high' && n.status === 'unread').length}
              </div>
            </div>
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600">Unread Total</div>
              <div className="text-2xl font-bold text-blue-900">{unreadCount}</div>
            </div>
            <Bell className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600">Action Required</div>
              <div className="text-2xl font-bold text-green-900">
                {notifications.filter(n => n.actionRequired && n.status === 'unread').length}
              </div>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notification Center</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications..."
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
            {notificationTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <select
            value={filter.priority}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority.id} value={priority.id}>
                {priority.name}
              </option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setFilter({ type: 'all', status: 'all', priority: 'all' })}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const typeInfo = getNotificationTypeInfo(notification.type);
            const priorityInfo = getPriorityInfo(notification.priority);
            const TypeIcon = typeInfo.icon || Bell;
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border rounded-lg transition-all ${
                  notification.status === 'unread' 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-10 h-10 rounded-full bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        {notification.status === 'unread' && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800`}>
                          {priorityInfo.name}
                        </span>
                        {notification.actionRequired && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{notification.timestamp}</span>
                        <span>From: {notification.sender || 'System'}</span>
                        <span>To: {(notification.recipients || ['Sanitation Worker']).join(', ')}</span>
                      </div>

                      {notification.metadata && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(notification.metadata).map(([key, value]) => (
                              <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                <span className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>{' '}
                                {typeof value === 'object' ? JSON.stringify(value) : value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {notification.actionRequired && (
                      <button
                        onClick={() => handleActionClick(notification)}
                        className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Take Action
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedNotification(notification)}
                      className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </button>
                    {notification.status === 'unread' && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="flex items-center px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Notification Details</h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedNotification.title}</h4>
                  <p className="text-gray-700">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-600">
                      {getNotificationTypeInfo(selectedNotification.type).name}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <span className="ml-2 text-gray-600">
                      {getPriorityInfo(selectedNotification.priority).name}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedNotification.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time:</span>
                    <span className="ml-2 text-gray-600">{selectedNotification.timestamp}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sender:</span>
                    <span className="ml-2 text-gray-600">{selectedNotification.sender}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Recipients:</span>
                    <span className="ml-2 text-gray-600">{selectedNotification.recipients.join(', ')}</span>
                  </div>
                </div>

                {selectedNotification.metadata && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Additional Information</h5>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>{' '}
                          <span className="text-gray-600">
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedNotification.actionRequired && (
                  <button
                    onClick={() => {
                      handleActionClick(selectedNotification);
                      setSelectedNotification(null);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Take Action
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SanitationNotifications;
