import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Heart,
  LogOut,
  MessageCircle,
  Pill,
  ShieldAlert,
  User
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import authService from '../services/authService';
import sessionManager from '../utils/sessionManager';
import adolescentService from '../services/adolescentService';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'health', label: 'My Health', icon: Heart },
  { id: 'ifa', label: 'IFA Tracking', icon: Pill },
  { id: 'risk', label: 'AI Risk Status', icon: ShieldAlert },
  { id: 'schemes', label: 'Schemes', icon: FileText },
  { id: 'awareness', label: 'Awareness', icon: BookOpen },
  { id: 'chat', label: 'Chat with ASHA', icon: MessageCircle },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User }
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '--');

const AdolescentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chartRef = useRef(null);

  const currentUserName = useMemo(() => {
    const user = sessionManager.getUserData ? sessionManager.getUserData() : null;
    return user?.name || localStorage.getItem('userName') || '';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        if (!currentUserName) throw new Error('User name not found in session');
        const response = await adolescentService.getDashboardData(currentUserName);
        setDashboardData(response?.data || null);
      } catch (e) {
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserName]);

  useEffect(() => {
    const loadChat = async () => {
      try {
        if (!currentUserName) return;
        setChatLoading(true);
        const response = await adolescentService.getChatMessages(currentUserName);
        setChatMessages(response?.data || []);
      } catch {
        setChatMessages([]);
      } finally {
        setChatLoading(false);
      }
    };
    loadChat();
  }, [currentUserName]);

  const handleLogout = async () => {
    try {
      sessionManager.destroySession();
      await authService.logout();
      navigate('/login', { replace: true });
    } catch {
      sessionManager.destroySession();
      navigate('/login', { replace: true });
    }
  };

  const downloadHealthReport = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Adolescent Health Report', 14, 16);
    doc.setFontSize(11);
    doc.text(`Name: ${profile.name || '--'}`, 14, 26);
    doc.text(`Age: ${profile.age ?? '--'}`, 14, 33);
    doc.text(`Anganwadi Center: ${profile.anganwadiCenter || '--'}`, 14, 40);
    doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 14, 47);

    doc.setFontSize(12);
    doc.text('Overview', 14, 58);
    doc.setFontSize(10);
    doc.text(`BMI Status: ${overview.bmiStatus || '--'}`, 14, 66);
    doc.text(`Hemoglobin: ${overview.hemoglobinLevel != null ? `${overview.hemoglobinLevel} g/dL` : '--'}`, 14, 72);
    doc.text(`Anemia Status: ${overview.anemiaStatus || '--'}`, 14, 78);
    doc.text(`Last Checkup: ${fmtDate(overview.lastHealthCheckup)}`, 14, 84);
    doc.text(`Next Checkup: ${fmtDate(overview.nextCheckupDate)}`, 14, 90);

    doc.setFontSize(12);
    doc.text('AI Risk', 14, 102);
    doc.setFontSize(10);
    doc.text(`Status: ${aiRisk.status || '--'}`, 14, 110);
    doc.text(`Confidence: ${aiRisk.confidence != null ? `${aiRisk.confidence}%` : '--'}`, 14, 116);
    doc.text(`Recommendation: ${(aiRisk.recommendation || []).join('; ') || '--'}`, 14, 122, { maxWidth: 180 });

    let y = 142;
    doc.setFontSize(12);
    doc.text('Recent Health History', 14, y);
    y += 8;
    doc.setFontSize(10);
    (healthMonitoring.history || []).slice(0, 6).forEach((r) => {
      const row = `${fmtDate(r.date)} | H: ${r.height ?? '--'} cm | W: ${r.weight ?? '--'} kg | BMI: ${r.bmi ?? '--'} | Hb: ${r.hemoglobin ?? '--'}`;
      doc.text(row, 14, y, { maxWidth: 180 });
      y += 7;
    });

    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const imageData = canvas.toDataURL('image/png');
      doc.addPage();
      doc.setFontSize(14);
      doc.text('BMI and Hemoglobin Trend Chart', 14, 18);
      doc.addImage(imageData, 'PNG', 10, 25, 190, 100);
    }

    doc.save(`adolescent_health_report_${(profile.name || 'user').replace(/\s+/g, '_')}.pdf`);
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message || !currentUserName) return;
    try {
      await adolescentService.sendChatMessage(currentUserName, message);
      setChatInput('');
      const response = await adolescentService.getChatMessages(currentUserName);
      setChatMessages(response?.data || []);
    } catch {
      // no-op
    }
  };

  const overview = dashboardData?.overview || {};
  const profile = dashboardData?.profile || {};
  const healthMonitoring = dashboardData?.healthMonitoring || { history: [], trends: [] };
  const ifaTracking = dashboardData?.ifaTracking || {};
  const aiRisk = dashboardData?.aiRisk || { reason: [], recommendation: [] };
  const awareness = dashboardData?.awareness || { content: [], sessions: [] };
  const alerts = dashboardData?.alerts || [];
  const schemes = dashboardData?.schemes || [];
  const visitLogs = dashboardData?.ashaVisitLogs || [];
  const menstrualHealth = dashboardData?.menstrualHealth || {};
  const nutrition = dashboardData?.nutrition || {};

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Age" value={overview.age ?? '--'} />
        <Card title="BMI Status" value={overview.bmiStatus || '--'} />
        <Card title="Hemoglobin (Hb)" value={overview.hemoglobinLevel != null ? `${overview.hemoglobinLevel} g/dL` : '--'} />
        <Card title="Anemia Status" value={overview.anemiaStatus || '--'} />
        <Card title="Last Health Checkup" value={fmtDate(overview.lastHealthCheckup)} />
        <Card title="Next Checkup Date" value={fmtDate(overview.nextCheckupDate)} />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900">
        <strong>Read-only access:</strong> You can view health data, alerts, schemes, and awareness content.
        Medical values cannot be edited in this dashboard.
      </div>
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Latest Values">
          <InfoRow label="Height" value={healthMonitoring.latest?.height != null ? `${healthMonitoring.latest.height} cm` : '--'} />
          <InfoRow label="Weight" value={healthMonitoring.latest?.weight != null ? `${healthMonitoring.latest.weight} kg` : '--'} />
          <InfoRow label="BMI" value={healthMonitoring.latest?.bmi ?? '--'} />
          <InfoRow label="Hemoglobin" value={healthMonitoring.latest?.hemoglobin != null ? `${healthMonitoring.latest.hemoglobin} g/dL` : '--'} />
        </Panel>
        <Panel title="Menstrual Health">
          <InfoRow label="Last Menstrual Date" value={fmtDate(menstrualHealth.lastMenstrualDate)} />
          <InfoRow label="Cycle Regularity" value={menstrualHealth.cycleRegularity || '--'} />
          <InfoRow label="Issues" value={(menstrualHealth.issues || []).length ? menstrualHealth.issues.join(', ') : 'None reported'} />
        </Panel>
      </div>

      <Panel title="BMI & Hb Trends">
        <div className="h-72" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={(healthMonitoring.trends || []).map((r) => ({ ...r, dateLabel: fmtDate(r.date) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bmi" name="BMI" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="hemoglobin" name="Hemoglobin" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Health History">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Height</th>
                <th className="px-3 py-2 text-left">Weight</th>
                <th className="px-3 py-2 text-left">BMI</th>
                <th className="px-3 py-2 text-left">Hemoglobin</th>
              </tr>
            </thead>
            <tbody>
              {(healthMonitoring.history || []).map((r, i) => (
                <tr key={`${r.date}-${i}`} className="border-t border-gray-100">
                  <td className="px-3 py-2">{fmtDate(r.date)}</td>
                  <td className="px-3 py-2">{r.height != null ? `${r.height} cm` : '--'}</td>
                  <td className="px-3 py-2">{r.weight != null ? `${r.weight} kg` : '--'}</td>
                  <td className="px-3 py-2">{r.bmi ?? '--'}</td>
                  <td className="px-3 py-2">{r.hemoglobin != null ? `${r.hemoglobin} g/dL` : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Nutrition & Diet">
        <p className="text-sm text-gray-700">{nutrition.recommendedDietPlan || '--'}</p>
        <div className="mt-3 text-sm">
          <p><strong>Iron-rich foods:</strong> {(nutrition.ironRichFoods || []).join(', ') || '--'}</p>
          <p className="mt-1"><strong>Protein suggestions:</strong> {(nutrition.proteinSuggestions || []).join(', ') || '--'}</p>
          <p className="mt-1"><strong>AI diet recommendations:</strong> {(nutrition.aiDietRecommendations || []).join(' | ') || '--'}</p>
        </div>
      </Panel>
    </div>
  );

  const renderIFA = () => (
    <div className="space-y-6">
      <Panel title="IFA Compliance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Tablets Distributed" value={ifaTracking.distributed ?? '--'} />
          <Card title="Consumption Status" value={ifaTracking.consumed ?? '--'} />
          <Card title="Missed Doses" value={ifaTracking.missedDoses ?? '--'} />
          <Card title="Compliance %" value={ifaTracking.compliancePercentage != null ? `${ifaTracking.compliancePercentage}%` : '--'} />
        </div>
        <p className="text-sm text-gray-600 mt-3">Last distribution date: {fmtDate(ifaTracking.lastDistributionDate)}</p>
      </Panel>
    </div>
  );

  const renderRisk = () => (
    <div className="space-y-6">
      <Panel title="Anemia Risk Detection (AI)">
        <p className="text-lg font-semibold text-red-700">AI Risk Status: {aiRisk.status || '--'}</p>
        <p className="text-sm text-gray-700 mt-1">Confidence: {aiRisk.confidence != null ? `${aiRisk.confidence}%` : '--'}</p>
        <div className="mt-4">
          <p className="font-medium">Reason</p>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {(aiRisk.reason || []).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
        <div className="mt-4">
          <p className="font-medium">Recommendation</p>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {(aiRisk.recommendation || []).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </Panel>
    </div>
  );

  const renderSchemes = () => (
    <Panel title="Welfare Scheme Benefits">
      <div className="space-y-3">
        {schemes.map((s, i) => (
          <div key={`${s.schemeCode}-${i}`} className="p-3 border border-gray-200 rounded-lg">
            <p className="font-medium text-black">{s.schemeName}</p>
            <p className="text-sm text-gray-600">Eligibility: {s.eligibility}</p>
            <p className="text-sm mt-1"><strong>Status:</strong> {s.status}</p>
          </div>
        ))}
      </div>
    </Panel>
  );

  const renderAwareness = () => (
    <div className="space-y-6">
      <Panel title="Educational Content">
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {(awareness.content || []).map((content, i) => <li key={i}>{content}</li>)}
        </ul>
      </Panel>
      <Panel title="Awareness Sessions">
        {(awareness.sessions || []).map((s, i) => (
          <div key={`${s.title}-${i}`} className="p-3 border-b border-gray-100 text-sm">
            <p className="font-medium">{s.title}</p>
            <p className="text-gray-600">{fmtDate(s.date)} | {s.venue || 'N/A'}</p>
          </div>
        ))}
      </Panel>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <Panel title="Alerts & Notifications">
        {(alerts || []).map((a, i) => (
          <div key={`${a.title}-${i}`} className="p-3 mb-3 rounded-lg border border-red-200 bg-red-50">
            <p className="font-medium text-red-800">{a.title}</p>
            <p className="text-sm text-red-700 mt-1">{a.message}</p>
            <p className="text-sm text-red-700"><strong>Action:</strong> {a.action}</p>
            <p className="text-xs text-red-600 mt-1">{fmtDate(a.date)} | {a.riskLevel || a.type}</p>
          </div>
        ))}
      </Panel>
      <Panel title="ASHA Interaction / Visit Logs">
        {(visitLogs || []).map((v, i) => (
          <div key={`${v.visitDate}-${i}`} className="p-3 border-b border-gray-100 text-sm">
            <p className="font-medium">{fmtDate(v.visitDate)} - {v.ashaWorkerName}</p>
            <p className="text-gray-700 mt-1">{v.adviceGiven}</p>
            <p className="text-gray-600 mt-1">{v.healthUpdates}</p>
          </div>
        ))}
      </Panel>
    </div>
  );

  const renderChat = () => (
    <Panel title="Chat with ASHA">
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
        {chatLoading ? (
          <p className="text-sm text-gray-500">Loading chat...</p>
        ) : chatMessages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet. You can ask health questions here.</p>
        ) : (
          chatMessages.map((m) => (
            <div
              key={m._id}
              className={`mb-2 p-2 rounded-lg text-sm ${m.senderRole === 'adolescent' ? 'bg-blue-100 ml-8' : 'bg-green-100 mr-8'}`}
            >
              <p className="font-medium">{m.senderName}</p>
              <p>{m.message}</p>
              <p className="text-xs text-gray-500 mt-1">{fmtDate(m.createdAt)}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message to ASHA worker..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={handleSendChat}
          className="px-4 py-2 rounded-lg bg-secondary-600 text-white text-sm"
        >
          Send
        </button>
      </div>
    </Panel>
  );

  const renderProfile = () => (
    <Panel title="Profile Information (Read-only)">
      <InfoRow label="Name" value={profile.name || '--'} />
      <InfoRow label="Age" value={profile.age ?? '--'} />
      <InfoRow label="School / Status" value={profile.schoolOrStatus || '--'} />
      <InfoRow label="Address" value={profile.address || '--'} />
      <InfoRow label="Assigned ASHA Worker" value={profile.assignedAshaWorker || '--'} />
      <InfoRow label="Anganwadi Center" value={profile.anganwadiCenter || '--'} />
    </Panel>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'health': return renderHealth();
      case 'ifa': return renderIFA();
      case 'risk': return renderRisk();
      case 'schemes': return renderSchemes();
      case 'awareness': return renderAwareness();
      case 'chat': return renderChat();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button
                onClick={downloadHealthReport}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <span className="text-sm text-gray-600">Welcome, {currentUserName || 'Adolescent'}</span>
              <button onClick={handleLogout} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-black">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id ? 'border-secondary-500 text-secondary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-gray-600">Loading dashboard data...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {renderContent()}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const Panel = ({ title, children }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-black mb-4">{title}</h3>
    {children}
  </div>
);

const Card = ({ title, value }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-2xl font-bold text-black mt-1">{value}</p>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
    <span className="text-gray-600">{label}</span>
    <span className="text-black font-medium text-right ml-4">{value}</span>
  </div>
);

export default AdolescentDashboard;