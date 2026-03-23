import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Heart, 
  Activity, 
  Calendar, 
  TrendingUp,
  Bell,
  LogOut,
  Eye,
  FileText,
  Scale,
  Droplets,
  Pill,
  BookOpen,
  Award
} from 'lucide-react';
import authService from '../services/authService';
import sessionManager from '../utils/sessionManager';
import ashaService from '../services/ashaService';

const AdolescentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [myVisits, setMyVisits] = useState([]);
  const [mySupplements, setMySupplements] = useState(null);
  const [myAlerts, setMyAlerts] = useState([]);
  const [loadingMyData, setLoadingMyData] = useState(true);

  useEffect(() => {
    const userData = sessionManager.getUserData ? sessionManager.getUserData() : null;
    const name = userData?.name || localStorage.getItem('userName');
    if (!name) {
      setLoadingMyData(false);
      return;
    }
    const load = async () => {
      try {
        setLoadingMyData(true);
        const [visitsRes, alertsRes] = await Promise.all([
          ashaService.getBeneficiaryVisits('adolescent', name),
          ashaService.getAiAlerts().catch(() => ({ data: [] }))
        ]);
        const visits = visitsRes?.data || [];
        setMyVisits(visits);
        const supplementsSummary = visits.reduce(
          (acc, v) => {
            const s = v.supplements || {};
            if (s.iron) acc.iron += 1;
            if (s.vitaminA) acc.vitaminA += 1;
            if (s.deworming) acc.deworming += 1;
            if (s.calcium) acc.calcium += 1;
            if (s.folicAcid) acc.folicAcid += 1;
            return acc;
          },
          { iron: 0, vitaminA: 0, deworming: 0, calcium: 0, folicAcid: 0 }
        );
        setMySupplements(supplementsSummary);
        const allAlerts = alertsRes?.data || alertsRes || [];
        const relatedAlerts = allAlerts.filter(
          (a) =>
            a.beneficiaryName &&
            a.beneficiaryName.toLowerCase() === String(name || '').toLowerCase()
        );
        setMyAlerts(relatedAlerts);
      } catch (e) {
        console.warn('AdolescentDashboard: Failed to load personal ASHA data', e);
      } finally {
        setLoadingMyData(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🔐 Adolescent logout button clicked, starting logout process...');
      
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
      console.error('❌ Adolescent logout error:', error);
      // Force logout even if there's an error
      console.log('🔧 Force clearing session data...');
      sessionManager.destroySession();
      navigate('/login', { replace: true });
    }
  };

  // Adolescent Dashboard Stats - Limited access to own health data
  const stats = [
    {
      title: 'BMI Status',
      value: '18.5',
      change: 'Normal Range',
      icon: Scale,
      color: 'green',
      description: 'Body Mass Index within healthy range'
    },
    {
      title: 'Hemoglobin Level',
      value: '11.2 g/dL',
      change: 'Mild Anemia',
      icon: Droplets,
      color: 'orange',
      description: 'Iron supplementation recommended'
    },
    {
      title: 'Iron Tablets',
      value: '28/30',
      change: 'This month',
      icon: Pill,
      color: 'blue',
      description: 'Iron tablet consumption tracking'
    },
    {
      title: 'Menstrual Kit',
      value: 'Received',
      change: 'This month',
      icon: Heart,
      color: 'pink',
      description: 'Hygiene kit distribution status'
    },
    {
      title: 'Health Checkups',
      value: '2',
      change: 'This quarter',
      icon: Activity,
      color: 'purple',
      description: 'Regular health monitoring sessions'
    },
    {
      title: 'Awareness Sessions',
      value: '4',
      change: 'Attended this month',
      icon: BookOpen,
      color: 'indigo',
      description: 'Health and hygiene education sessions'
    }
  ];

  const healthRecords = [
    {
      date: '2024-01-15',
      weight: '45 kg',
      height: '155 cm',
      bmi: '18.5',
      hemoglobin: '11.2 g/dL',
      status: 'Normal'
    },
    {
      date: '2023-12-15',
      weight: '44 kg',
      height: '155 cm',
      bmi: '18.3',
      hemoglobin: '10.8 g/dL',
      status: 'Mild Anemia'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'health',
      message: 'Monthly health checkup completed',
      time: '2 days ago',
      icon: Heart
    },
    {
      id: 2,
      type: 'iron',
      message: 'Iron tablet distribution - 30 tablets received',
      time: '1 week ago',
      icon: Pill
    },
    {
      id: 3,
      type: 'hygiene',
      message: 'Menstrual hygiene kit distributed',
      time: '2 weeks ago',
      icon: Heart
    },
    {
      id: 4,
      type: 'education',
      message: 'Attended nutrition awareness session',
      time: '3 weeks ago',
      icon: BookOpen
    }
  ];

  const tabs = [
    { id: 'overview', label: 'My Dashboard', icon: Activity },
    { id: 'health', label: 'My Health', icon: Heart },
    { id: 'iron', label: 'Iron Tablets', icon: Pill },
    { id: 'hygiene', label: 'Menstrual Care', icon: Droplets },
    { id: 'awareness', label: 'Health Education', icon: BookOpen }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-black mt-2">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.change === 'Normal' ? 'text-green-600' : 
                  stat.change === 'Mild Anemia' ? 'text-yellow-600' : 'text-blue-600'
                }`}>{stat.change}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Health Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Health Alert</h3>
            {loadingMyData ? (
              <p className="text-sm text-yellow-600">Loading your latest alerts...</p>
            ) : myAlerts.length === 0 ? (
              <p className="text-sm text-yellow-600">
                No AI health alerts right now. Keep following healthy habits and taking supplements as advised.
              </p>
            ) : (
              <div className="text-sm text-yellow-700">
                <p className="font-medium">{myAlerts[0].title}</p>
                <p className="mt-1">
                  <strong>Reason:</strong> {myAlerts[0].reason}
                </p>
                <p className="mt-1">
                  <strong>Action:</strong> {myAlerts[0].action}
                </p>
                <p className="text-xs text-yellow-800 mt-1">
                  {new Date(myAlerts[0].date).toLocaleDateString()} • Risk: {myAlerts[0].riskLevel}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Health Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">Recent Health Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Height</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BMI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hemoglobin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {healthRecords.map((record, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 text-sm text-black">{record.date}</td>
                  <td className="px-4 py-4 text-sm text-black">{record.weight}</td>
                  <td className="px-4 py-4 text-sm text-black">{record.height}</td>
                  <td className="px-4 py-4 text-sm text-black">{record.bmi}</td>
                  <td className="px-4 py-4 text-sm text-black">{record.hemoglobin}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'Normal' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                <activity.icon className="w-4 h-4 text-secondary-600" />
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
  );

  const renderHealth = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">My Health Records</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Current Health Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">BMI</span>
              <span className="font-medium text-green-600">18.5 (Normal)</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Hemoglobin</span>
              <span className="font-medium text-orange-600">11.2 g/dL (Mild Anemia)</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Weight</span>
              <span className="font-medium text-black">45 kg</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Height</span>
              <span className="font-medium text-black">155 cm</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-orange-600 mr-2" />
              <p className="text-orange-800 font-medium">Health Alert</p>
            </div>
            <p className="text-orange-700 text-sm mt-1">
              Mild anemia detected. Continue iron tablet supplementation as prescribed.
            </p>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Health Progress</h3>
          <div className="space-y-4">
            {healthRecords.slice(0, 3).map((record, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-black">{record.date}</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    record.status === 'Normal' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">BMI: {record.bmi}</p>
                    <p className="text-gray-600">Weight: {record.weight}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Height: {record.height}</p>
                    <p className="text-gray-600">Hb: {record.hemoglobin}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* My ASHA visit history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">My ASHA Visit History</h3>
        {loadingMyData ? (
          <p className="text-sm text-gray-500">Loading visits recorded by your ASHA worker...</p>
        ) : myVisits.length === 0 ? (
          <p className="text-sm text-gray-500">
            No ASHA visits have been recorded for you yet in the system.
          </p>
        ) : (
          <div className="space-y-3">
            {myVisits.map((v) => (
              <div key={v._id} className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-black">
                    {new Date(v.visitDate).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">{v.personType}</span>
                </div>
                <div className="text-gray-600">
                  {[
                    v.hemoglobin != null && `Hb: ${v.hemoglobin}`,
                    v.weight != null && `Wt: ${v.weight} kg`,
                    v.muac != null && `MUAC: ${v.muac} cm`
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </div>
                {v.supplements && (
                  <div className="text-xs text-gray-500 mt-1">
                    Supplements:{' '}
                    {[
                      v.supplements.iron && 'Iron',
                      v.supplements.vitaminA && 'Vitamin A',
                      v.supplements.deworming && 'Deworming',
                      v.supplements.calcium && 'Calcium',
                      v.supplements.folicAcid && 'Folic acid'
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None recorded'}
                  </div>
                )}
                {v.remarks && (
                  <div className="text-xs text-gray-500 mt-1">Notes: {v.remarks}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderIron = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Iron Tablet Distribution</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Current Month Progress</h3>
          <div className="text-center mb-6">
            {loadingMyData ? (
              <>
                <div className="text-sm text-gray-500 mb-2">Loading your supplement data...</div>
              </>
            ) : (
              <>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {mySupplements ? `${mySupplements.iron}/` : ''}{mySupplements ? myVisits.length : 0}
                </div>
                <p className="text-gray-600">
                  Visits where iron tablets were given (from ASHA field visit records)
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width:
                        mySupplements && myVisits.length
                          ? `${Math.min(100, Math.round((mySupplements.iron / myVisits.length) * 100))}%`
                          : '0%'
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {mySupplements && myVisits.length
                    ? `${Math.min(
                        100,
                        Math.round((mySupplements.iron / myVisits.length) * 100)
                      )}% of your visits included iron tablets`
                    : 'No iron tablet records found yet.'}
                </p>
              </>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tablets Received</span>
              <span className="font-medium text-black">
                {mySupplements ? mySupplements.iron : '--'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tablets Consumed</span>
              <span className="font-medium text-green-600">
                {mySupplements ? mySupplements.iron : '--'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Remaining</span>
              <span className="font-medium text-orange-600">--</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Distribution History</h3>
          <div className="space-y-4">
            {[
              { month: 'January 2024', received: 30, consumed: 28, status: 'current' },
              { month: 'December 2023', received: 30, consumed: 30, status: 'completed' },
              { month: 'November 2023', received: 30, consumed: 29, status: 'completed' },
              { month: 'October 2023', received: 30, consumed: 30, status: 'completed' }
            ].map((record, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-black">{record.month}</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    record.status === 'current' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Received: {record.received}</span>
                  <span className="text-gray-600">Consumed: {record.consumed}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Pill className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-blue-800 font-medium">Reminder</p>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Take your iron tablet daily after meals for better absorption.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderHygiene = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Menstrual Hygiene Care</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Hygiene Kit Distribution</h3>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-lg font-semibold text-black">Kit Received</p>
            <p className="text-gray-600">January 2024</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Sanitary Pads</span>
              <span className="font-medium text-black">20 pieces</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Soap</span>
              <span className="font-medium text-black">2 bars</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Information Booklet</span>
              <span className="font-medium text-black">1 copy</span>
            </div>
          </div>
          
          <button className="mt-4 w-full bg-pink-50 text-pink-600 py-2 px-4 rounded-lg hover:bg-pink-100">
            Request Next Kit
          </button>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Health Tips & Care</h3>
          <div className="space-y-4">
            {[
              {
                title: 'Maintain Hygiene',
                tip: 'Change sanitary pads every 4-6 hours',
                icon: Droplets,
                color: 'blue'
              },
              {
                title: 'Proper Nutrition',
                tip: 'Eat iron-rich foods during menstruation',
                icon: Heart,
                color: 'red'
              },
              {
                title: 'Stay Hydrated',
                tip: 'Drink plenty of water throughout the day',
                icon: Activity,
                color: 'green'
              },
              {
                title: 'Rest Well',
                tip: 'Get adequate sleep and avoid heavy work',
                icon: BookOpen,
                color: 'purple'
              }
            ].map((tip, index) => (
              <div key={index} className={`p-4 bg-${tip.color}-50 border border-${tip.color}-200 rounded-lg`}>
                <div className="flex items-start">
                  <tip.icon className={`w-5 h-5 text-${tip.color}-600 mr-3 mt-0.5`} />
                  <div>
                    <p className={`font-medium text-${tip.color}-800`}>{tip.title}</p>
                    <p className={`text-${tip.color}-700 text-sm mt-1`}>{tip.tip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderAwareness = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Health Education & Awareness</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Attended Sessions</h3>
          <div className="space-y-4">
            {[
              { topic: 'Menstrual Hygiene Management', date: '2024-01-15', duration: '2 hours', status: 'completed' },
              { topic: 'Nutrition for Adolescents', date: '2024-01-10', duration: '1.5 hours', status: 'completed' },
              { topic: 'Personal Health & Hygiene', date: '2024-01-05', duration: '2 hours', status: 'completed' },
              { topic: 'Anemia Prevention', date: '2023-12-28', duration: '1 hour', status: 'completed' }
            ].map((session, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-black">{session.topic}</p>
                    <p className="text-sm text-gray-600">{session.date} • {session.duration}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Total Sessions Attended: 4</p>
            <p className="text-green-700 text-sm mt-1">
              Great progress! Keep attending sessions to stay informed.
            </p>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Upcoming Sessions</h3>
          <div className="space-y-4">
            {[
              { topic: 'Life Skills Development', date: '2024-01-25', time: '10:00 AM', location: 'Community Center' },
              { topic: 'Career Guidance', date: '2024-02-01', time: '02:00 PM', location: 'Anganwadi Center' },
              { topic: 'Health & Wellness', date: '2024-02-08', time: '11:00 AM', location: 'School Premises' }
            ].map((session, index) => (
              <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-800">{session.topic}</p>
                <p className="text-blue-700 text-sm mt-1">{session.date} at {session.time}</p>
                <p className="text-blue-600 text-sm">{session.location}</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Register for Session
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-indigo-600 mr-2" />
              <p className="text-indigo-800 font-medium">Educational Resources</p>
            </div>
            <p className="text-indigo-700 text-sm mt-1">
              Access health education materials and interactive learning content.
            </p>
            <button className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View Resources
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'health':
        return renderHealth();
      case 'iron':
        return renderIron();
      case 'hygiene':
        return renderHygiene();
      case 'awareness':
        return renderAwareness();
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
              <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-black">Adolescent Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-black transition-colors duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="text-sm text-gray-600">
                Welcome, {localStorage.getItem('userName') || 'Adolescent'}
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
                    ? 'border-secondary-500 text-secondary-600'
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

export default AdolescentDashboard;