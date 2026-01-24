import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Baby,
  Calendar,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  Download,
  Settings,
  LogOut,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Zap,
  Droplet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';

const PregnantWomanDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pregnancyData, setPregnancyData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if user is authenticated
    if (!sessionManager.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Get user data from session
    const userData = sessionManager.getUserData();
    if (userData) {
      setUser(userData);
      // Initialize pregnancy data from user's role-specific data
      if (userData.roleSpecificData?.pregnantWomanDetails) {
        setPregnancyData(userData.roleSpecificData.pregnantWomanDetails);
      }
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    sessionManager.destroySession();
    navigate('/login?logout=true');
  };

  const calculateWeeksOfPregnancy = () => {
    if (!pregnancyData?.lastMenstrualPeriod) return 0;
    const lmp = new Date(pregnancyData.lastMenstrualPeriod);
    const today = new Date();
    const weeks = Math.floor((today - lmp) / (7 * 24 * 60 * 60 * 1000));
    return weeks;
  };

  const calculateRemainingDays = () => {
    if (!pregnancyData?.expectedDeliveryDate) return 0;
    const edd = new Date(pregnancyData.expectedDeliveryDate);
    const today = new Date();
    const days = Math.floor((edd - today) / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  };

  const weeksOfPregnancy = calculateWeeksOfPregnancy();
  const remainingDays = calculateRemainingDays();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full"
        />
      </div>
    );
  }

  const getMilestones = () => {
    return [
      { week: '12', name: 'First Trimester', milestone: 'Body changes begin' },
      { week: '20', name: 'Mid-Pregnancy Scan', milestone: 'Anatomy scan' },
      { week: '28', name: 'Third Trimester', milestone: 'Baby growth accelerates' },
      { week: '36', name: 'Final Checks', milestone: 'Birth preparation' },
      { week: '40', name: 'Due Date', milestone: 'Baby arrival expected' }
    ];
  };

  const getHealthChecklist = () => {
    return [
      { id: 1, title: 'Antenatal Checkup - 1st Month', completed: false, dueDate: 'Week 4-6' },
      { id: 2, title: 'Blood Group & RH Factor Test', completed: false, dueDate: 'Week 8-12' },
      { id: 3, title: 'First Trimester Screening', completed: false, dueDate: 'Week 11-14' },
      { id: 4, title: 'Anomaly Scan', completed: false, dueDate: 'Week 18-22' },
      { id: 5, title: 'Glucose Tolerance Test', completed: false, dueDate: 'Week 24-28' },
      { id: 6, title: 'Third Trimester Scan', completed: false, dueDate: 'Week 28-32' },
      { id: 7, title: 'Iron & Calcium Supplementation', completed: false, dueDate: 'Ongoing' },
      { id: 8, title: 'Delivery Planning', completed: false, dueDate: 'Week 36+' }
    ];
  };

  const getTrimesterInfo = () => {
    if (weeksOfPregnancy < 12) {
      return {
        trimester: 'First Trimester',
        color: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        description: 'Body adjustments and baby development begins',
        focus: ['Morning sickness management', 'Prenatal vitamins', 'Avoid harmful substances']
      };
    } else if (weeksOfPregnancy < 28) {
      return {
        trimester: 'Second Trimester',
        color: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        description: 'Baby grows rapidly and movements felt',
        focus: ['Balanced diet', 'Regular exercise', 'Antenatal classes']
      };
    } else {
      return {
        trimester: 'Third Trimester',
        color: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800',
        description: 'Final preparations for delivery',
        focus: ['Birth planning', 'Pelvic floor exercises', 'Hospital registration']
      };
    }
  };

  const trimesterInfo = getTrimesterInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pregnancy Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pregnancy Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-8"
        >
          <div className="grid md:grid-cols-3 gap-8">
            {/* Weeks Progress */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#e0e7ff"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="8"
                    strokeDasharray={`${(weeksOfPregnancy / 40) * 352} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-pink-600">{weeksOfPregnancy}</span>
                  <span className="text-xs text-gray-600">Weeks</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">Weeks Completed</h3>
            </div>

            {/* Remaining Days */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-white">{remainingDays}</span>
                    <span className="text-xs text-white">Days Left</span>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">Days Remaining</h3>
            </div>

            {/* Current Trimester */}
            <div className={`rounded-lg p-6 border-2 ${trimesterInfo.color} ${trimesterInfo.borderColor}`}>
              <h3 className={`font-bold text-lg ${trimesterInfo.textColor} mb-2`}>
                {trimesterInfo.trimester}
              </h3>
              <p className="text-sm text-gray-700 mb-4">{trimesterInfo.description}</p>
              <ul className="space-y-1 text-xs text-gray-700">
                {trimesterInfo.focus.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: Heart },
            { id: 'checklist', label: 'Health Checklist', icon: ClipboardList },
            { id: 'milestones', label: 'Milestones', icon: Calendar },
            { id: 'profile', label: 'My Profile', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
                activeTab === tab.id
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Key Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  Vital Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Blood Group:</span>
                    <span className="font-semibold text-gray-800">{pregnancyData?.bloodGroup || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Height:</span>
                    <span className="font-semibold text-gray-800">{pregnancyData?.height || '-'} cm</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Pre-Pregnancy Weight:</span>
                    <span className="font-semibold text-gray-800">{pregnancyData?.prePregnancyWeight || '-'} kg</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Current Weight:</span>
                    <span className="font-semibold text-gray-800">{pregnancyData?.currentWeight || '-'} kg</span>
                  </div>
                </div>
              </div>

              {/* Pregnancy Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-purple-600" />
                  Pregnancy Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Pregnancy Number:</span>
                    <span className="font-semibold text-gray-800">{pregnancyData?.pregnancyNumber || 1}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">LMP Date:</span>
                    <span className="font-semibold text-gray-800">
                      {pregnancyData?.lastMenstrualPeriod
                        ? new Date(pregnancyData.lastMenstrualPeriod).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Expected Delivery:</span>
                    <span className="font-semibold text-gray-800">
                      {pregnancyData?.expectedDeliveryDate
                        ? new Date(pregnancyData.expectedDeliveryDate).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Anganwadi Center:</span>
                    <span className="font-semibold text-gray-800">{pregnancyData?.anganwadiCenter || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Tips */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Health Tips for This Week
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-700">💧 Stay hydrated with 2-3 liters of water daily</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">🥗 Eat balanced meals with fruits and vegetables</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">🚶 Take a 30-minute walk daily for mild exercise</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">😴 Get 7-8 hours of quality sleep</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'checklist' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="space-y-3">
              {getHealthChecklist().map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <input
                    type="checkbox"
                    defaultChecked={item.completed}
                    className="w-5 h-5 text-pink-600 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.dueDate}</p>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'milestones' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="space-y-4">
              {getMilestones().map((milestone, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-semibold">
                      {milestone.week}w
                    </div>
                    {idx < getMilestones().length - 1 && (
                      <div className="w-1 h-12 bg-pink-200 my-2"></div>
                    )}
                  </div>
                  <div className="pt-2">
                    <h4 className="font-semibold text-gray-800">{milestone.name}</h4>
                    <p className="text-sm text-gray-600">{milestone.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-pink-600" />
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-semibold text-gray-800">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-pink-600" />
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-pink-600" />
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-800">{user?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Spouse Information</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-gray-600">Spouse/Husband Name</p>
                      <p className="font-semibold text-gray-800">{pregnancyData?.husbandName || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-gray-600">Spouse/Husband Phone</p>
                      <p className="font-semibold text-gray-800">{pregnancyData?.husbandPhone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-gray-600">Anganwadi Center</p>
                      <p className="font-semibold text-gray-800">{pregnancyData?.anganwadiCenter || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PregnantWomanDashboard;
