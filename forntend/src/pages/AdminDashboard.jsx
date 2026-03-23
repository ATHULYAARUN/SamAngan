import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import UserManagement from "../components/UserManagement";
import WorkerManagement from "../components/admin/WorkerManagement";
import ReportsAnalytics from "../components/admin/ReportsAnalytics";
import ReportsAnalyticsDebug from "../components/ReportsAnalyticsDebug";
import SimpleReportsTest from "../components/admin/SimpleReportsTest";
import SystemSettings from "../components/admin/SystemSettings";
import HealthMonitoring from "../components/admin/HealthMonitoring";
import HealthMonitoringTest from "../components/admin/HealthMonitoringTest";
import HealthMonitoringSimple from "../components/admin/HealthMonitoringSimple";
import ErrorBoundary from "../components/ErrorBoundary";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Baby, 
  Heart, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  FileText, 
  MapPin, 
  Calendar, 
  TrendingUp,
  UserCheck,
  Activity,
  Shield,
  Database,
  Bell,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import ExportButton from '../components/admin/ExportButton';
import dashboardService from '../services/dashboardService';
import authService from '../services/authService';
import sessionManager from '../utils/sessionManager';

const VALID_TAB_IDS = ['overview', 'anganwadis', 'users', 'workers', 'monitoring', 'waste', 'reports', 'settings'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() =>
    VALID_TAB_IDS.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Anganwadi management state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);
  
  // Force reports rendering state (true when URL or state says reports)
  const [forceReports, setForceReports] = useState(() => tabFromUrl === 'reports');
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, online, offline, error

  // Set up real-time dashboard updates
  useEffect(() => {
    console.log('🚀 Setting up real-time dashboard...');

    // Check and fix authentication if needed
    const ensureAuthentication = async () => {
      const adminToken = localStorage.getItem('adminToken');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const userRole = localStorage.getItem('userRole');

      if (!adminToken && isAuthenticated === 'true' && userRole === 'super-admin') {
        console.log('🔧 No admin token found, attempting to re-authenticate...');
        try {
          // Try to login with admin credentials to get a fresh token
          const response = await fetch('/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: 'admin',
              password: 'admin123'
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.token) {
              localStorage.setItem('adminToken', result.data.token);
              console.log('✅ Authentication recovered with fresh token');
            }
          }
        } catch (error) {
          console.error('❌ Failed to recover authentication:', error);
        }
      }
    };

    // Ensure authentication before starting dashboard updates
    ensureAuthentication().then(() => {
      // Subscribe to dashboard updates
      const unsubscribe = dashboardService.subscribe((data) => {
        console.log('📊 Received dashboard update:', data);
        setDashboardData(data);
        setLastUpdated(data.lastUpdated);
        setIsRealTime(data.isRealTime);
        setIsLoading(false);
        
        // Update connection status based on data received
        if (data.error) {
          setConnectionStatus('offline');
        } else if (data.isRealTime) {
          setConnectionStatus('online');
        } else {
          setConnectionStatus('offline');
        }
      });

      // Start real-time updates (every 15 seconds for more responsive updates)
      dashboardService.startRealTimeUpdates(15000);

      // Set high frequency when user is on anganwadi management tab
      if (activeTab === 'anganwadi') {
        dashboardService.setUpdateFrequency('high'); // 5 seconds
      } else {
        dashboardService.setUpdateFrequency('normal'); // 15 seconds
      }

      // Store cleanup function
      return () => {
        console.log('🛑 Cleaning up dashboard service...');
        dashboardService.stopRealTimeUpdates();
        unsubscribe();
      };
    });

    // Cleanup on unmount
    return () => {
      console.log('🛑 Cleaning up dashboard service...');
      dashboardService.stopRealTimeUpdates();
    };
  }, [activeTab]);

  // Update frequency based on active tab
  useEffect(() => {
    if (activeTab === 'anganwadi') {
      dashboardService.setUpdateFrequency('high'); // More frequent updates for anganwadi data
    } else if (activeTab === 'overview') {
      dashboardService.setUpdateFrequency('normal');
    } else {
      dashboardService.setUpdateFrequency('low');
    }
  }, [activeTab]);

  // Keep activeTab in sync with URL (e.g. browser back/forward or initial load)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (VALID_TAB_IDS.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
      setForceReports(tab === 'reports');
    }
  }, [searchParams]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterMenu]);

  // Reconnect function for offline recovery
  const handleReconnect = async () => {
    console.log('🔄 Manual reconnection attempt...');
    setConnectionStatus('connecting');
    
    try {
      // Clear any bad tokens
      const currentToken = localStorage.getItem('adminToken');
      if (currentToken && currentToken.includes('demo')) {
        localStorage.removeItem('adminToken');
      }
      
      // Attempt fresh authentication
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin',
          password: 'admin123'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.token) {
          localStorage.setItem('adminToken', result.data.token);
          console.log('✅ Reconnection successful with fresh token');
          
          // Restart dashboard updates
          dashboardService.stopRealTimeUpdates();
          dashboardService.startRealTimeUpdates(15000);
          setConnectionStatus('online');
        }
      } else {
        throw new Error('Failed to authenticate');
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      setConnectionStatus('offline');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 Admin logout button clicked, starting logout process...');
      
      // Stop real-time updates
      dashboardService.stopRealTimeUpdates();

      // Use sessionManager for complete cleanup
      sessionManager.destroySession();
      console.log('🧹 Session destroyed via sessionManager');

      // Call logout service
      await authService.logout();
      console.log('✅ AuthService logout successful');
      
      // Redirect to login page
      navigate('/login', { replace: true });
      console.log('📍 Navigated to login page');
      
    } catch (error) {
      console.error('❌ Admin logout error:', error);
      // Force logout even if there's an error
      console.log('🔧 Force clearing session data...');
      sessionManager.destroySession();
      navigate('/login', { replace: true });
    }
  };

  // Manual refresh function with authentication recovery
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setConnectionStatus('connecting');
    
    try {
      console.log('🔄 Starting manual refresh with auth recovery...');
      
      // First, check and recover authentication if needed
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        console.log('🔧 No admin token found, attempting to re-authenticate...');
        try {
          const response = await fetch('/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: 'admin',
              password: 'admin123'
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.token) {
              localStorage.setItem('adminToken', result.data.token);
              console.log('✅ Authentication recovered during refresh');
            }
          }
        } catch (authError) {
          console.error('❌ Failed to recover authentication during refresh:', authError);
          setConnectionStatus('error');
        }
      }
      
      // Now perform the dashboard refresh
      await dashboardService.refreshNow();
      console.log('✅ Manual refresh completed');
      setConnectionStatus('online');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      setConnectionStatus('offline');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Icon mapping for string to component conversion
  const iconMap = {
    Baby,
    Users,
    Shield,
    Heart,
    Activity,
    FileText,
    Database
  };

  // Get real-time stats or fallback to default values
  const getStats = () => {
    if (isLoading || !dashboardData) {
      return [
        {
          title: 'Total Anganwadis',
          value: '2',
          change: '+0%',
          icon: Baby,
          color: 'blue',
          description: 'Active centers under monitoring'
        },
        {
          title: 'Total Users',
          value: '0',
          change: '+0%',
          icon: Users,
          color: 'green',
          description: 'All registered users in system'
        },
        {
          title: 'Scheme Coverage',
          value: '85%',
          change: '+5.2%',
          icon: Shield,
          color: 'purple',
          description: 'Overall scheme implementation'
        },
        {
          title: 'Health Alerts',
          value: '0',
          change: '+0%',
          icon: Heart,
          color: 'red',
          description: 'High-risk pregnancy & anemia alerts'
        },
        {
          title: 'Waste Management',
          value: '94.5%',
          change: '+2.1%',
          icon: Activity,
          color: 'orange',
          description: 'Collection efficiency rate'
        },
        {
          title: 'Data Verification',
          value: '0',
          change: '+0%',
          icon: FileText,
          color: 'indigo',
          description: 'Pending verifications'
        }
      ];
    }

    // Get stats from service and map icon strings to components
    const serviceStats = dashboardService.getFormattedStats(dashboardData);
    return serviceStats.map(stat => ({
      ...stat,
      icon: iconMap[stat.icon] || Activity
    }));
  };

  const stats = getStats();

  // Get real-time recent activities
  const getRecentActivities = () => {
    if (dashboardData && dashboardData.recentActivities) {
      return dashboardData.recentActivities.map(activity => ({
        ...activity,
        icon: getIconForActivityType(activity.type)
      }));
    }

    // Fallback activities when no data is available
    return [
      {
        id: 'default-1',
        type: 'info',
        message: 'No recent activities to display',
        time: 'Just now',
        icon: Activity,
        priority: 'low'
      },
      {
        id: 'default-2',
        type: 'info',
        message: 'System monitoring active',
        time: '1 min ago',
        icon: Bell,
        priority: 'low'
      }
    ];
  };

  // Helper function to get icon for activity type
  const getIconForActivityType = (type) => {
    switch (type) {
      case 'alert': return Heart;
      case 'registration': return Users;
      case 'verification': return FileText;
      case 'waste': return Activity;
      case 'report': return BarChart3;
      default: return Bell;
    }
  };

  const recentActivities = getRecentActivities();

  // Get real-time Anganwadi data
  const anganwadiData = dashboardService.getAnganwadiData(dashboardData);

  // Filter anganwadi data based on search and filter criteria
  const filteredAnganwadiData = (anganwadiData || []).filter(center => {
    // Ensure all properties exist to prevent errors
    const centerName = center.name || '';
    const centerLocation = center.location || '';
    const centerCode = center.code || '';
    const centerWard = center.ward ? center.ward.toString() : '';
    const centerStatus = center.status || 'Active';
    
    const matchesSearch = searchTerm === '' || 
      centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centerLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centerWard.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      centerStatus.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-3xl font-bold text-black mt-1">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-2">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-black mb-4">Monthly Growth</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization will be here</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-black mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <activity.icon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-black">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderAnganwadiManagement = () => {
    console.log('🏢 Rendering Anganwadi Management');
    console.log('📊 Dashboard Data:', dashboardData);
    console.log('🏘️ Anganwadi Data:', anganwadiData);
    console.log('🔍 Search Term:', searchTerm);
    console.log('🎯 Filter Status:', filterStatus);
    console.log('📋 Filtered Data:', filteredAnganwadiData);
    
    return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-black">Anganwadi Management</h2>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search anganwadis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
          <div className="relative" ref={filterMenuRef}>
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {filterStatus !== 'all' && (
                <span className="ml-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                  {filterStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              )}
            </button>
            
            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      filterStatus === 'all' ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    All Centers
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('active');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      filterStatus === 'active' ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    Active Centers Only
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('inactive');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      filterStatus === 'inactive' ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    Inactive Centers Only
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
        <p className="text-sm text-gray-600">
          Showing {filteredAnganwadiData.length} of {(anganwadiData || []).length} anganwadi centers
          {searchTerm && (
            <span className="ml-1">
              for "<span className="font-medium text-gray-800">{searchTerm}</span>"
            </span>
          )}
          {filterStatus !== 'all' && (
            <span className="ml-1">
              ({filterStatus === 'active' ? 'Active' : 'Inactive'} only)
            </span>
          )}
        </p>
        {(searchTerm || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
            }}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Anganwadi Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anganwadi Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Children
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAnganwadiData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-lg font-medium">No anganwadi centers found</p>
                      <p className="text-sm">
                        {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filter criteria'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnganwadiData.map((center) => (
                <tr key={center.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-black">{center.name}</div>
                    <div className="text-sm text-gray-500">Last updated: {center.lastUpdate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-sm font-semibold text-blue-600">{center.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-black">{center.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {center.ward}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-green-500 mr-1" />
                      <span className="font-semibold">{center.workers}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    <div className="flex items-center">
                      <Baby className="w-4 h-4 text-purple-500 mr-1" />
                      <span className="font-semibold">{center.children}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      center.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {center.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
    );
  };

  const renderUserManagement = () => (
    <UserManagement />
  );

  const renderWorkerManagement = () => (
    <WorkerManagement />
  );

  const renderReports = () => {
    console.log('🔄 Rendering Reports Analytics page - TEST VERSION');
    console.log('⚠️ Current activeTab in renderReports:', activeTab);
    
    // Ensure we stay on the reports tab
    return (
      <div className="space-y-6">
        {/* Force Reports Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Analytics & Reports - TEST MODE</h1>
              <p className="text-gray-600 mt-1">Testing if this component loads correctly</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                🧪 Test Mode
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                📍 Current Tab: {activeTab}
              </div>
            </div>
          </div>
        </div>
        
        {/* Full ReportsAnalytics Component with Enhanced Debugging */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <ErrorBoundary fallback={
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">⚠️ ReportsAnalytics Component Error</h3>
              <p className="text-gray-600 mb-4">There was an issue loading the analytics component.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🔄 Reload Page
              </button>
            </div>
          }>
            <ReportsAnalytics />
          </ErrorBoundary>
        </div>
      </div>
    );
  };

  const renderHealthMonitoring = () => (
    <ErrorBoundary>
      <HealthMonitoringSimple />
    </ErrorBoundary>
  );

  const renderWasteManagement = () => {
    const summary = dashboardData?.stats?.wasteManagementSummary || {};
    const logs = summary.recentWasteLogs || [];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Waste Management Monitoring</h2>
        
        {/* Waste Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Collection Rate</h3>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-black">
              {summary.collectionRate != null ? `${summary.collectionRate}%` : '0%'}
            </p>
            <p className="text-xs text-green-600">
              {summary.collectionRate != null ? 'Based on today’s sanitation tasks' : 'No data for today'}
            </p>
          </motion.div>

          <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pending Collections</h3>
              <Bell className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-black">{summary.pendingCollections ?? 0}</p>
            <p className="text-xs text-orange-600">Sanitation tasks pending or in progress</p>
          </motion.div>

          <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Workers</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-black">{summary.activeSanitationWorkers ?? 0}</p>
            <p className="text-xs text-blue-600">Sanitation workers (active accounts)</p>
          </motion.div>

          <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Waste Collected Today</h3>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-black">{summary.wasteTodayKg ?? 0} kg</p>
            <p className="text-xs text-purple-600">From sanitation worker logs</p>
          </motion.div>
        </div>

        {/* Waste Collection Logs */}
        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Recent Collection Logs</h3>
            <span className="text-sm text-gray-500">
              Showing latest {logs.length || 0} entries from sanitation dashboard
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black">Ward 9</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {log.anganwadiCenter || 'Akkarakunnu Anganwadi'}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{log.wasteType}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {log.quantity} {log.quantityUnit}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.collectionStatus === 'Collected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.collectionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.recordedBy || 'Sanitation Worker'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.date ? new Date(log.date).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.remarks || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={8}>
                      No sanitation waste logs found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderSettings = () => (
    <ErrorBoundary>
      <SystemSettings />
    </ErrorBoundary>
  );

  const tabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
    { id: 'anganwadis', label: 'Anganwadi Centers', icon: Baby },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'workers', label: 'Worker Management', icon: UserCheck },
    { id: 'monitoring', label: 'Health Monitoring', icon: Heart },
    { id: 'waste', label: 'Waste Management', icon: Activity },
    { id: 'reports', label: 'Analytics & Reports', icon: FileText },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  const renderContent = () => {
    console.log('🔄 Rendering content for activeTab:', activeTab);
    console.log('🔄 Force reports flag:', forceReports);
    
    // Force reports rendering if flag is set
    if (forceReports || activeTab === 'reports') {
      console.log('🚀 FORCING REPORTS RENDER');
      return renderReports();
    }
    
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'anganwadis':
        return renderAnganwadiManagement();
      case 'users':
        return renderUserManagement();
      case 'workers':
        return renderWorkerManagement();
      case 'monitoring':
        return renderHealthMonitoring();
      case 'waste':
        return renderWasteManagement();
      case 'reports':
        console.log('✅ Reports case matched, calling renderReports()');
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        console.log('⚠️ Default case triggered for activeTab:', activeTab);
        console.log('⚠️ Available cases: overview, anganwadis, users, workers, monitoring, waste, reports, settings');
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Dashboard Header - Not Homepage Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-black">Admin Dashboard</h1>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${isRealTime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-gray-500">
                    {isRealTime ? 'Live' : 'Offline'} •
                    {lastUpdated ? ` Updated ${new Date(lastUpdated).toLocaleTimeString()}` : ' Loading...'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Export Button */}
              <ExportButton />

              {/* Manual Refresh Button */}
              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 text-gray-600 hover:text-black transition-colors duration-200 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                title="Refresh dashboard data"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>

              {/* Enhanced Connection Status */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
                  {connectionStatus === 'online' || isRealTime ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : connectionStatus === 'connecting' ? (
                    <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs font-medium text-gray-700">
                    {connectionStatus === 'online' || isRealTime ? 'Online' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                  </span>
                </div>
                
                {/* Reconnect Button - shown when offline */}
                {(connectionStatus === 'offline' || connectionStatus === 'error') && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleReconnect}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors duration-200"
                    title="Reconnect to server"
                  >
                    Reconnect
                  </motion.button>
                )}
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-black transition-colors duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </motion.button>
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setForceReports(tab.id === 'reports');
                  setActiveTab(tab.id);
                  setSearchParams(tab.id === 'overview' ? {} : { tab: tab.id });
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={`Navigate to ${tab.label}`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'reports' && (
                  <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                    New
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={`content-${activeTab}`} className="w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
