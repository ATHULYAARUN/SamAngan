import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldVisitEntry from '../components/ASHA/FieldVisitEntry';
import AwarenessSessionForm from '../components/ASHA/AwarenessSessionForm';
import FeedbackForm from '../components/ASHA/FeedbackForm';
import NotificationsPanel from '../components/ASHA/NotificationsPanel';
import ReportsSection from '../components/ASHA/ReportsSection';
import ASHAProfile from '../components/Profile/ASHAProfile';
import ashaService from '../services/ashaService';
import authService from '../services/authService';
import sessionManager from '../utils/sessionManager';
import { 
  Users, 
  Heart, 
  Activity,
  Bell,
  LogOut,
  FileText,
  MessageSquare,
  UserCheck,
  Home,
  Stethoscope,
  AlertTriangle,
  User
} from 'lucide-react';

const ASHADashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalChildren: 0,
    pregnantWomen: 0,
    adolescents: 0,
    visitsThisMonth: 0,
    activeAlerts: 0
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const stats = await ashaService.getDashboardStats();
      const alerts = await ashaService.getNotifications();
      
      setDashboardStats(stats.data || stats);
      setNotifications(alerts.data || alerts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 ASHA logout button clicked, starting logout process...');
      sessionManager.destroySession();
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ ASHA logout error:', error);
      sessionManager.destroySession();
      navigate('/login', { replace: true });
    }
  };

  const stats = [
    {
      title: 'Total Children (0-6 years)',
      value: dashboardStats.totalChildren || 0,
      change: `Under ${localStorage.getItem('ashaArea') || 'your'} area`,
      icon: Users,
      color: 'blue',
      description: 'Children monitored'
    },
    {
      title: 'Pregnant Women',
      value: dashboardStats.pregnantWomen || 0,
      change: 'Currently monitored',
      icon: Heart,
      color: 'pink',
      description: 'Active pregnancies'
    },
    {
      title: 'Adolescent Girls',
      value: dashboardStats.adolescents || 0,
      change: 'Ages 10-19 tracked',
      icon: UserCheck,
      color: 'purple',
      description: 'Adolescents under care'
    },
    {
      title: 'Health Visits',
      value: dashboardStats.visitsThisMonth || 0,
      change: 'This month',
      icon: Stethoscope,
      color: 'green',
      description: 'Household visits completed'
    },
    {
      title: 'Active Alerts',
      value: dashboardStats.activeAlerts || 0,
      change: 'Requires attention',
      icon: AlertTriangle,
      color: 'red',
      description: 'Health & anemia alerts'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'field-visit', label: 'Field Visit Entry', icon: Stethoscope },
    { id: 'awareness', label: 'Awareness Sessions', icon: UserCheck },
    { id: 'feedback', label: 'Feedback & Alerts', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'visit',
      message: 'Home visit completed - Ananya Sharma household',
      time: '1 hour ago',
      icon: Stethoscope,
      priority: 'medium'
    },
    {
      id: 2,
      type: 'awareness',
      message: 'Hygiene awareness session conducted - 25 participants',
      time: '3 hours ago',
      icon: UserCheck,
      priority: 'low'
    },
    {
      id: 3,
      type: 'alert',
      message: 'Low hemoglobin alert - Child: Ravi Kumar (4 years)',
      time: '5 hours ago',
      icon: AlertTriangle,
      priority: 'high'
    },
    {
      id: 4,
      type: 'vaccination',
      message: 'Vaccination reminder: 5 children due this week',
      time: '1 day ago',
      icon: Activity,
      priority: 'medium'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { name: 'Log Visit', icon: Stethoscope, action: () => setActiveTab('field-visit'), color: 'blue' },
          { name: 'Add Session', icon: UserCheck, action: () => setActiveTab('awareness'), color: 'green' },
          { name: 'Send Feedback', icon: MessageSquare, action: () => setActiveTab('feedback'), color: 'orange' },
          { name: 'View Reports', icon: FileText, action: () => setActiveTab('reports'), color: 'purple' }
        ].map((action) => (
          <button
            key={action.name}
            onClick={action.action}
            className="p-4 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all text-center"
          >
            <action.icon className={`w-8 h-8 text-${action.color}-600 mx-auto mb-2`} />
            <p className="text-sm font-medium text-gray-900">{action.name}</p>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className="text-xs text-gray-500">{stat.change}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-3xl font-bold text-black mt-1">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-2">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-black mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.priority === 'high' ? 'bg-red-100' :
                activity.priority === 'medium' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <activity.icon className={`w-4 h-4 ${
                  activity.priority === 'high' ? 'text-red-600' :
                  activity.priority === 'medium' ? 'text-blue-600' : 'text-green-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-black">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'field-visit':
        return <FieldVisitEntry onSuccess={loadDashboardData} />;
      case 'awareness':
        return <AwarenessSessionForm onSuccess={loadDashboardData} />;
      case 'feedback':
        return <FeedbackForm onSuccess={loadDashboardData} />;
      case 'notifications':
        return <NotificationsPanel notifications={notifications} onRefresh={loadDashboardData} />;
      case 'reports':
        return <ReportsSection />;
      case 'profile':
        return <ASHAProfile />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-black">ASHA Worker Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-black transition-colors duration-200">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <div className="text-sm text-gray-600">
                Welcome, {localStorage.getItem('userName') || 'ASHA Worker'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ASHADashboard;