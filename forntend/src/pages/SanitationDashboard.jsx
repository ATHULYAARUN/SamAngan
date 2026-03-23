import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trash2,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Bell,
  LogOut,
  FileText,
  Home,
  User,
  Loader2,
  RefreshCw,
  BarChart3,
  Droplets
} from 'lucide-react';
import authService from '../services/authService';
import sessionManager from '../utils/sessionManager';
import sanitationService from '../services/sanitationService';

import WardCleaningTasks from '../components/Sanitation/WardCleaningTasks';
import WasteCollectionLogging from '../components/Sanitation/WasteCollectionLogging';
import DrainageMonitoring from '../components/Sanitation/DrainageMonitoring';
import IssueReporting from '../components/Sanitation/IssueReporting';
import WeeklyReports from '../components/Sanitation/WeeklyReports';
import AISanitationAlerts from '../components/Sanitation/AISanitationAlerts';
import SanitationNotifications from '../components/Sanitation/SanitationNotifications';

const CENTER_LABEL = 'Akkarakunnu Anganwadi';
const WARD_LABEL = 'Ward 9, Elikkullam Grama Panchayat, Pampady Block, Kottayam, Kerala';

const SanitationDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalWasteCollectedToday: 0,
    pendingCleaningTasks: 0,
    completedCleaningTasks: 0,
    sanitationIssuesReported: 0,
    weeklyHygieneStatus: '',
    weeklySummary: '',
    weeklyTasksCompleted: 0,
    weeklyWasteCollectedKg: 0,
    weeklyDrainageIssues: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, notifRes] = await Promise.all([
        sanitationService.getDashboardStats(),
        sanitationService.getNotifications().catch(() => [])
      ]);
      setStats({
        totalWasteCollectedToday: statsRes?.totalWasteCollectedToday ?? 0,
        pendingCleaningTasks: statsRes?.pendingCleaningTasks ?? 0,
        completedCleaningTasks: statsRes?.completedCleaningTasks ?? 0,
        sanitationIssuesReported: statsRes?.sanitationIssuesReported ?? 0,
        weeklyHygieneStatus: statsRes?.weeklyHygieneStatus || 'Not yet assessed',
        weeklySummary: statsRes?.weeklySummary || '',
        weeklyTasksCompleted: statsRes?.weeklyTasksCompleted ?? 0,
        weeklyWasteCollectedKg: statsRes?.weeklyWasteCollectedKg ?? 0,
        weeklyDrainageIssues: statsRes?.weeklyDrainageIssues ?? 0
      });
      setNotifications(Array.isArray(notifRes) ? notifRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh dashboard immediately when sanitation data changes (tasks, waste, drainage, issues)
  useEffect(() => {
    const handler = () => {
      loadDashboard();
    };
    window.addEventListener('sanitation:updated', handler);
    return () => window.removeEventListener('sanitation:updated', handler);
  }, []);

  const handleLogout = async () => {
    try {
      sessionManager.destroySession();
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      sessionManager.destroySession();
      navigate('/login', { replace: true });
    }
  };

  const menuTabs = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Ward Cleaning Tasks', icon: CheckCircle },
    { id: 'waste', label: 'Waste Collection Log', icon: Trash2 },
    { id: 'drainage', label: 'Drainage Monitoring', icon: Droplets },
    { id: 'issues', label: 'Issue Reporting', icon: AlertTriangle },
    { id: 'reports', label: 'Weekly Reports', icon: FileText },
    { id: 'ai-alerts', label: 'AI Sanitation Alerts', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const statCards = [
    { title: 'Total Waste Collected Today', value: stats.totalWasteCollectedToday, sub: 'kg', icon: Trash2, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { title: 'Pending Cleaning Tasks', value: stats.pendingCleaningTasks, sub: 'Ward 9', icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { title: 'Completed Cleaning Tasks', value: stats.completedCleaningTasks, sub: 'Today', icon: CheckCircle, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: 'Sanitation Issues Reported', value: stats.sanitationIssuesReported, sub: 'Open', icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { title: 'Weekly Hygiene Status', value: stats.weeklyHygieneStatus, sub: 'Ward 9', icon: BarChart3, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl p-5 shadow border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
                          </div>
                          <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${card.iconColor}`} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {stats.weeklySummary && (
                  <div className="bg-white rounded-xl p-5 shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Summary</h3>
                    <p className="text-gray-700">{stats.weeklySummary}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={loadDashboard}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </>
            )}
          </div>
        );
      case 'tasks':
        return <WardCleaningTasks />;
      case 'waste':
        return <WasteCollectionLogging />;
      case 'drainage':
        return <DrainageMonitoring />;
      case 'issues':
        return <IssueReporting />;
      case 'reports':
        return <WeeklyReports />;
      case 'ai-alerts':
        return <AISanitationAlerts />;
      case 'notifications':
        return <SanitationNotifications />;
      case 'profile':
        return (
          <div className="bg-white rounded-xl p-6 shadow border border-gray-200 max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
            <p className="text-gray-600">
              <strong>Name:</strong> {localStorage.getItem('userName') || 'Sanitation Worker'}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Center:</strong> {CENTER_LABEL}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Area:</strong> {WARD_LABEL}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sanitation Worker Dashboard</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {CENTER_LABEL} · {WARD_LABEL}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {localStorage.getItem('userName') || 'Sanitation Worker'}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + extra logout for visibility */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {menuTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default SanitationDashboard;
