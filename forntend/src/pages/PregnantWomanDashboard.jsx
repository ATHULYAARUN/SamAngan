import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import PregnancyMonitoringDashboard from '../components/Pregnancy/PregnancyMonitoringDashboard';

const PregnantWomanDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = sessionManager.getUserData();
    if (userData) {
      setUser(userData);
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    sessionManager.destroySession();
    navigate('/login?logout=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Get the woman ID from session data - use actual user ID, not demo fallback
  const womanId = user?.id || user?._id || user?.roleSpecificData?.pregnantWomanDetails?.id;
  const userRole = user?.role || 'pregnant_woman';
  
  console.log('PregnantWomanDashboard: User data:', user);
  console.log('PregnantWomanDashboard: Using womanId:', womanId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pregnancy Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PregnancyMonitoringDashboard womanId={womanId} userRole={userRole} userData={user} />
      </div>
    </div>
  );
};

export default PregnantWomanDashboard;
