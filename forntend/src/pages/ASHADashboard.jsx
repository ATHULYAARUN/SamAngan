import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldVisitEntry from '../components/ASHA/FieldVisitEntry';
import AwarenessSessionForm from '../components/ASHA/AwarenessSessionForm';
import AwarenessSessionsList from '../components/ASHA/AwarenessSessionsList';
import NotificationsPanel from '../components/ASHA/NotificationsPanel';
import ReportsSection from '../components/ASHA/ReportsSection';
import BeneficiaryLookup from '../components/ASHA/BeneficiaryLookup';
import SchemeAwareness from '../components/ASHA/SchemeAwareness';
import AdolescentChatInbox from '../components/ASHA/AdolescentChatInbox';
import ASHAProfile from '../components/Profile/ASHAProfile';
import ErrorBoundary from '../components/ErrorBoundary';
import ashaService from '../services/ashaService';

const HealthAlertsTab = lazy(() => import('../components/ASHA/HealthAlertsTab'));
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
  User,
  Calendar,
  MapPin,
  RefreshCw,
  Syringe,
  BookOpen,
  Droplet,
  Pill
} from 'lucide-react';

const AREA_MONITORING = {
  anganwadi: 'Akkarakunnu',
  village: 'Elikkullam',
  block: 'Pampady',
  district: 'Kottayam',
  state: 'Kerala'
};

const ASHADashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalChildren: 0,
    pregnantWomen: 0,
    adolescents: 0,
    visitsThisMonth: 0,
    activeAlerts: 0,
    healthIndicatorCounts: { anemia: 0, malnutrition: 0, highRiskPregnancy: 0, immunizationDelay: 0, developmentalDelays: 0 },
    supplementCounts: { iron: 0, vitaminA: 0, deworming: 0, calcium: 0, folicAcid: 0 },
    recentActivities: [],
    upcomingVaccinations: [],
    upcomingCheckups: []
  });
  const [notifications, setNotifications] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [awarenessView, setAwarenessView] = useState('list');
  const [awarenessListRefreshKey, setAwarenessListRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('ashaArea')) {
      localStorage.setItem('ashaArea', AREA_MONITORING.anganwadi);
    }
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const area = typeof window !== 'undefined' ? (localStorage.getItem('ashaArea') || AREA_MONITORING.anganwadi) : AREA_MONITORING.anganwadi;
    const ashaName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || '').trim() : '';
    const results = await Promise.allSettled([
      ashaService.getDashboardStats(area, ashaName),
      ashaService.getAlerts(),
      ashaService.getNotifications(),
      ashaService.getAwarenessSessions({ limit: 5 })
    ]);
    const [statsRes, alertsRes, notificationsRes, awarenessRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);
    const stats = (statsRes?.data || statsRes || {});
    setDashboardStats({
      totalChildren: stats.totalChildren ?? 0,
      pregnantWomen: stats.pregnantWomen ?? 0,
      adolescents: stats.adolescents ?? 0,
      visitsThisMonth: stats.visitsThisMonth ?? 0,
      activeAlerts: stats.activeAlerts ?? 0,
      healthIndicatorCounts: stats.healthIndicatorCounts || { anemia: 0, malnutrition: 0, highRiskPregnancy: 0, immunizationDelay: 0, developmentalDelays: 0 },
      supplementCounts: stats.supplementCounts || { iron: 0, vitaminA: 0, deworming: 0, calcium: 0, folicAcid: 0 },
      recentActivities: stats.recentActivities || [],
      upcomingVaccinations: stats.upcomingVaccinations || [],
      upcomingCheckups: stats.upcomingCheckups || []
    });
    setNotifications(alertsRes?.data || alertsRes || []);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    try {
      sessionManager.destroySession();
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      sessionManager.destroySession();
      navigate('/login', { replace: true });
    }
  };

  const menuTabs = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'field-visit', label: 'Field Visit Entry', icon: Stethoscope },
    { id: 'awareness', label: 'Awareness Sessions', icon: UserCheck },
    { id: 'beneficiaries', label: 'Beneficiary Records', icon: Users },
    { id: 'alerts', label: 'Health Alerts', icon: AlertTriangle },
    { id: 'scheme', label: 'Scheme Awareness', icon: BookOpen },
    { id: 'chat', label: 'Adolescent Chat', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const statCards = [
    { title: 'Total Children (0–6 years)', value: dashboardStats.totalChildren, sub: 'In assigned Anganwadi area', icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: 'Pregnant Women Under Monitoring', value: dashboardStats.pregnantWomen, sub: 'In area', icon: Heart, iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { title: 'Adolescent Girls Tracked', value: dashboardStats.adolescents, sub: 'Ages 10–19 under supervision', icon: UserCheck, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { title: 'Health Visits This Month', value: dashboardStats.visitsThisMonth, sub: 'Household visits completed', icon: Stethoscope, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { title: 'Active Health Alerts', value: dashboardStats.activeAlerts, sub: 'Anemia, malnutrition, high-risk', icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Area Monitoring - Bonus */}
      <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Area Monitoring
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div><span className="text-gray-500">Anganwadi:</span> <span className="font-medium">{AREA_MONITORING.anganwadi}</span></div>
          <div><span className="text-gray-500">Village:</span> <span className="font-medium">{AREA_MONITORING.village}</span></div>
          <div><span className="text-gray-500">Block:</span> <span className="font-medium">{AREA_MONITORING.block}</span></div>
          <div><span className="text-gray-500">District:</span> <span className="font-medium">{AREA_MONITORING.district}</span></div>
          <div><span className="text-gray-500">State:</span> <span className="font-medium">{AREA_MONITORING.state}</span></div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-white rounded-xl p-4 shadow border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500' : 'bg-green-500'} animate-pulse`} />
          <span className="text-sm text-gray-600">{isLoading ? 'Updating...' : 'Live Data'}</span>
          <span className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
        <button onClick={loadDashboardData} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Log Visit', icon: Stethoscope, action: () => setActiveTab('field-visit') },
          { name: 'Add Session', icon: UserCheck, action: () => setActiveTab('awareness') },
          { name: 'Send Alert', icon: MessageSquare, action: () => setActiveTab('alerts') },
          { name: 'Reports', icon: FileText, action: () => setActiveTab('reports') }
        ].map((a) => (
          <button key={a.name} onClick={a.action} className="p-4 bg-white rounded-xl shadow border border-gray-200 hover:shadow-md text-center transition-shadow">
            <a.icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">{a.name}</p>
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((s) => (
          <div key={s.title} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                <s.icon className={`w-6 h-6 ${s.iconColor}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">{s.title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Count of each: Health indicators & supplements this month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-500" />
            Health indicators this month
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'anemia', label: 'Anemia' },
              { key: 'malnutrition', label: 'Malnutrition' },
              { key: 'highRiskPregnancy', label: 'High-risk pregnancy' },
              { key: 'immunizationDelay', label: 'Immunization delay' },
              { key: 'developmentalDelays', label: 'Developmental delays' }
            ].map(({ key, label }) => (
              <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="text-sm text-gray-700">{label}</span>
                <span className="text-lg font-semibold text-gray-900">{dashboardStats.healthIndicatorCounts?.[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-green-600" />
            Supplements provided this month
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'iron', label: 'Iron tablets' },
              { key: 'vitaminA', label: 'Vitamin A' },
              { key: 'deworming', label: 'Deworming' },
              { key: 'calcium', label: 'Calcium' },
              { key: 'folicAcid', label: 'Folic acid' }
            ].map(({ key, label }) => (
              <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="text-sm text-gray-700">{label}</span>
                <span className="text-lg font-semibold text-gray-900">{dashboardStats.supplementCounts?.[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Vaccination / Checkups */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Upcoming Vaccination / Checkups
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Syringe className="w-4 h-4" /> Vaccinations</h4>
            {(dashboardStats.upcomingVaccinations || []).length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming vaccinations in next 14 days.</p>
            ) : (
              <ul className="space-y-2">
                {dashboardStats.upcomingVaccinations.slice(0, 5).map((v, i) => (
                  <li key={i} className="text-sm flex justify-between">
                    <span>{v.beneficiaryName} – {v.title}</span>
                    <span className="text-gray-500">{new Date(v.dueDate).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Heart className="w-4 h-4" /> ANC Checkups</h4>
            {(dashboardStats.upcomingCheckups || []).length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming checkups in next 14 days.</p>
            ) : (
              <ul className="space-y-2">
                {dashboardStats.upcomingCheckups.slice(0, 5).map((c, i) => (
                  <li key={i} className="text-sm flex justify-between">
                    <span>{c.beneficiaryName}</span>
                    <span className="text-gray-500">{new Date(c.dueDate).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <button onClick={() => setActiveTab('notifications')} className="text-sm text-green-600 hover:text-green-700 font-medium">View All →</button>
        </div>
        <div className="space-y-3">
          {(dashboardStats.recentActivities || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activities.</p>
          ) : (
            dashboardStats.recentActivities.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">{a.message}</p>
                  <p className="text-xs text-gray-500">{new Date(a.time).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Health Alerts – link to full section */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              AI Health Alerts
            </h3>
            <p className="text-sm text-gray-600 mt-1">Pregnancy risk and child malnutrition alerts from field visit data. View and submit alerts in the Health Alerts section.</p>
          </div>
          <button onClick={() => setActiveTab('alerts')} className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 font-medium text-sm">View Health Alerts →</button>
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
        return awarenessView === 'form' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Awareness Session</h2>
              <button onClick={() => { setAwarenessView('list'); setAwarenessListRefreshKey(k => k + 1); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <UserCheck className="w-4 h-4" />
                View Sessions
              </button>
            </div>
            <AwarenessSessionForm onSuccess={() => { loadDashboardData(); setAwarenessView('list'); setAwarenessListRefreshKey(k => k + 1); }} />
          </div>
        ) : (
          <AwarenessSessionsList
            key="awareness-list"
            refreshTrigger={activeTab === 'awareness' ? awarenessListRefreshKey : null}
            onCreateNew={() => setAwarenessView('form')}
            onView={(s) => {}}
            onEdit={(s) => setAwarenessView('form')}
          />
        );
      case 'beneficiaries':
        return <BeneficiaryLookup />;
      case 'alerts':
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-900">Health Alerts</h2>
            </div>
            <ErrorBoundary>
              <Suspense fallback={
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
                  <span className="ml-3 text-gray-600">Loading Health Alerts…</span>
                </div>
              }>
                <HealthAlertsTab onSuccess={loadDashboardData} />
              </Suspense>
            </ErrorBoundary>
          </div>
        );
      case 'scheme':
        return <SchemeAwareness />;
      case 'reports':
        return <ReportsSection />;
      case 'chat':
        return <AdolescentChatInbox />;
      case 'notifications':
        return <NotificationsPanel notifications={notifications} onRefresh={loadDashboardData} />;
      case 'profile':
        return <ASHAProfile />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ASHA Worker Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900" onClick={() => setActiveTab('notifications')}>
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <span className="text-sm text-gray-600">Welcome, {localStorage.getItem('userName') || 'ASHA Worker'}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 min-w-max py-2">
            {menuTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'awareness') setAwarenessView('list');
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default ASHADashboard;
