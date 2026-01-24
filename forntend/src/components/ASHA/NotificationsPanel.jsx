import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle,
  Calendar,
  Heart,
  Activity,
  RefreshCw
} from 'lucide-react';

const NotificationsPanel = ({ notifications = [], onRefresh }) => {
  const MotionDiv = motion.div;

  const getIcon = (type) => {
    switch (type) {
      case 'vaccination':
        return Activity;
      case 'anc':
        return Heart;
      case 'alert':
        return AlertTriangle;
      default:
        return Calendar;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const mockNotifications = [
    {
      id: 1,
      type: 'vaccination',
      title: 'Vaccination Reminder',
      message: '5 children due for DPT vaccination this week',
      priority: 'high',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'anc',
      title: 'Missed ANC Visit',
      message: 'Mrs. Sharma missed her ANC checkup - Follow-up required',
      priority: 'high',
      time: '5 hours ago'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Malnutrition Alert',
      message: 'Child Ravi Kumar (4 years) showing signs of malnutrition',
      priority: 'high',
      time: '1 day ago'
    },
    {
      id: 4,
      type: 'alert',
      title: 'Low Hemoglobin',
      message: '3 pregnant women with hemoglobin below 10 g/dL',
      priority: 'medium',
      time: '2 days ago'
    },
    {
      id: 5,
      type: 'vaccination',
      title: 'Immunization Camp',
      message: 'Scheduled immunization camp at Community Center next Monday',
      priority: 'medium',
      time: '3 days ago'
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Notifications & Alerts</h2>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayNotifications.map((notification, index) => {
          const Icon = getIcon(notification.type);
          const color = getPriorityColor(notification.priority);
          
          return (
            <MotionDiv
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl p-6 shadow-lg border-l-4 border-${color}-500 hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-black">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    
                    <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800 flex-shrink-0 ml-4`}>
                      {notification.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">{notification.time}</span>
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            </MotionDiv>
          );
        })}
      </div>

      {displayNotifications.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-lg text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No New Notifications</h3>
          <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-red-900">High Priority</h4>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {displayNotifications.filter(n => n.priority === 'high').length}
          </p>
          <p className="text-sm text-red-700 mt-1">Require immediate attention</p>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-yellow-900">Medium Priority</h4>
            <Calendar className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {displayNotifications.filter(n => n.priority === 'medium').length}
          </p>
          <p className="text-sm text-yellow-700 mt-1">Address this week</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">Total Alerts</h4>
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{displayNotifications.length}</p>
          <p className="text-sm text-blue-700 mt-1">All notifications</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
