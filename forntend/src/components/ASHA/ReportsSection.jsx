import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Download, FileText, TrendingUp, Calendar, Users, Activity, Heart, AlertTriangle, Filter, RefreshCw, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ashaService from '../../services/ashaService';

const ReportsSection = () => {
  const MotionDiv = motion.div;
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('6months');
  const [reportType, setReportType] = useState('overview');
  const [filters, setFilters] = useState({
    area: 'all',
    priority: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange, reportType, filters]);

  const dateRangeToMonths = () => {
    switch (dateRange) {
      case '1month': return 1;
      case '3months': return 3;
      case '6months': return 6;
      case '1year': return 12;
      default: return 6;
    }
  };

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const area = typeof window !== 'undefined' ? (localStorage.getItem('ashaArea') || 'Default Area') : 'Default Area';
      const months = dateRangeToMonths();
      const year = new Date().getFullYear();
      const response = await ashaService.getReportData(area, months, year);
      const payload = response?.data ?? response;
      setReportData(payload || null);
    } catch (error) {
      console.error('Error loading report data:', error);
      setReportData(getMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockData = () => ({
    visitsPerMonth: [
      { month: 'Jan', visits: 24, alerts: 5, sessions: 8 },
      { month: 'Feb', visits: 28, alerts: 3, sessions: 6 },
      { month: 'Mar', visits: 32, alerts: 7, sessions: 9 },
      { month: 'Apr', visits: 30, alerts: 4, sessions: 7 },
      { month: 'May', visits: 35, alerts: 6, sessions: 8 },
      { month: 'Jun', visits: 38, alerts: 8, sessions: 10 }
    ],
    healthIndicators: [
      { month: 'Jan', anemia: 15, malnutrition: 8, highRisk: 5 },
      { month: 'Feb', anemia: 12, malnutrition: 6, highRisk: 4 },
      { month: 'Mar', anemia: 18, malnutrition: 9, highRisk: 6 },
      { month: 'Apr', anemia: 14, malnutrition: 7, highRisk: 5 },
      { month: 'May', anemia: 16, malnutrition: 8, highRisk: 7 },
      { month: 'Jun', anemia: 13, malnutrition: 5, highRisk: 4 }
    ],
    awarenessTopics: [
      { topic: 'Nutrition', sessions: 8, participants: 156 },
      { topic: 'Hygiene', sessions: 6, participants: 98 },
      { topic: 'Menstrual Health', sessions: 4, participants: 67 },
      { topic: 'Child Care', sessions: 5, participants: 89 },
      { topic: 'Immunization', sessions: 3, participants: 45 },
      { topic: 'Maternal Health', sessions: 7, participants: 134 }
    ],
    supplementDistribution: [
      { name: 'Iron Tablets', value: 85, trend: '+5%' },
      { name: 'Vitamin A', value: 72, trend: '+3%' },
      { name: 'Deworming', value: 68, trend: '+8%' },
      { name: 'Calcium', value: 45, trend: '+12%' },
      { name: 'Folic Acid', value: 78, trend: '+6%' }
    ],
    pregnancyTracking: [
      { trimester: '1st', count: 8, highRisk: 2 },
      { trimester: '2nd', count: 10, highRisk: 3 },
      { trimester: '3rd', count: 5, highRisk: 1 }
    ],
    ageDistribution: [
      { age: '0-1', count: 45 },
      { age: '1-3', count: 67 },
      { age: '3-6', count: 44 },
      { age: '10-14', count: 28 },
      { age: '14-19', count: 17 }
    ],
    performanceMetrics: {
      avgVisitDuration: 25, // minutes
      followUpCompliance: 78, // percentage
      alertResolutionTime: 48, // hours
      sessionAttendance: 85, // percentage
      referralCompliance: 92 // percentage
    }
  });

  const mock = getMockData();
  const raw = reportData || mock;
  const data = {
    visitsPerMonth: Array.isArray(raw.visitsPerMonth) ? raw.visitsPerMonth : mock.visitsPerMonth,
    healthIndicators: Array.isArray(raw.healthIndicators) ? raw.healthIndicators : mock.healthIndicators,
    awarenessTopics: Array.isArray(raw.awarenessTopics) ? raw.awarenessTopics : mock.awarenessTopics,
    supplementDistribution: Array.isArray(raw.supplementDistribution) ? raw.supplementDistribution : mock.supplementDistribution,
    pregnancyTracking: Array.isArray(raw.pregnancyTracking) ? raw.pregnancyTracking : mock.pregnancyTracking,
    ageDistribution: Array.isArray(raw.ageDistribution) ? raw.ageDistribution : mock.ageDistribution,
    performanceMetrics: raw.performanceMetrics && typeof raw.performanceMetrics === 'object' ? raw.performanceMetrics : mock.performanceMetrics
  };
  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  const downloadPDF = () => {
    const doc = new jsPDF();
    const ashaName = localStorage.getItem('userName') || 'ASHA Worker';
    const ashaArea = localStorage.getItem('ashaArea') || 'Default Area';
    const currentDate = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('ASHA Worker Monthly Activity Report', 14, 20);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`ASHA Worker: ${ashaName}`, 14, 30);
    doc.text(`Area: ${ashaArea}`, 14, 36);
    doc.text(`Report Date: ${currentDate}`, 14, 42);
    
    doc.line(14, 46, 196, 46);

    // Visits Data
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Monthly Visits Summary', 14, 56);
    
    const visitsData = data.visitsPerMonth.map(item => [item.month, item.visits]);
    doc.autoTable({
      startY: 60,
      head: [['Month', 'Number of Visits']],
      body: visitsData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Awareness Sessions
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Awareness Sessions by Topic', 14, finalY);
    
    const awarenessData = data.awarenessTopics.map(item => [item.topic, item.sessions]);
    doc.autoTable({
      startY: finalY + 4,
      head: [['Topic', 'Number of Sessions']],
      body: awarenessData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Supplement Distribution
    finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Nutrition Supplement Distribution', 14, finalY);
    
    const supplementData = data.supplementDistribution.map(item => [
      item.name, 
      `${item.value}%`
    ]);
    doc.autoTable({
      startY: finalY + 4,
      head: [['Supplement Type', 'Distribution Rate']],
      body: supplementData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`ASHA_Monthly_Report_${currentDate.replace(/\//g, '-')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Reports & Analytics</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Report Type:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="overview">Overview</option>
              <option value="health">Health Indicators</option>
              <option value="performance">Performance</option>
              <option value="demographics">Demographics</option>
            </select>
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Avg Visit Duration</h4>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-black">{data.performanceMetrics?.avgVisitDuration || 25}</p>
          <p className="text-sm text-gray-500 mt-1">minutes</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Follow-up Compliance</h4>
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-black">{data.performanceMetrics?.followUpCompliance || 78}%</p>
          <p className="text-sm text-gray-500 mt-1">completion rate</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Alert Resolution</h4>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-black">{data.performanceMetrics?.alertResolutionTime || 48}</p>
          <p className="text-sm text-gray-500 mt-1">average hours</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Session Attendance</h4>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-black">{data.performanceMetrics?.sessionAttendance || 85}%</p>
          <p className="text-sm text-gray-500 mt-1">participation rate</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Referral Compliance</h4>
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-black">{data.performanceMetrics?.referralCompliance || 92}%</p>
          <p className="text-sm text-gray-500 mt-1">follow-through rate</p>
        </div>
      </div>

      {/* Comprehensive Charts */}
      {reportType === 'overview' && (
        <>
          {/* Visits, Alerts, and Sessions Trend */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-black mb-4">Monthly Activity Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.visitsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke="#10B981" name="Household Visits" strokeWidth={2} />
                <Line type="monotone" dataKey="sessions" stroke="#F59E0B" name="Awareness Sessions" strokeWidth={2} />
                <Line type="monotone" dataKey="alerts" stroke="#EF4444" name="Health Alerts" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </MotionDiv>

          {/* Health Indicators Trend */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-black mb-4">Health Indicators Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.healthIndicators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="anemia" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Anemia Cases" />
                <Area type="monotone" dataKey="malnutrition" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Malnutrition" />
                <Area type="monotone" dataKey="highRisk" stackId="1" stroke="#DC2626" fill="#DC2626" fillOpacity={0.6} name="High Risk" />
              </AreaChart>
            </ResponsiveContainer>
          </MotionDiv>
        </>
      )}

      {reportType === 'health' && (
        <>
          {/* Pregnancy Tracking */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-black mb-4">Pregnancy Tracking by Trimester</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.pregnancyTracking}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trimester" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#EC4899" name="Total Pregnancies" />
                <Bar dataKey="highRisk" fill="#DC2626" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          </MotionDiv>

          {/* Age Distribution */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-black mb-4">Age Distribution of Beneficiaries</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.ageDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="age" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" name="Number of Beneficiaries" />
              </BarChart>
            </ResponsiveContainer>
          </MotionDiv>
        </>
      )}

      {/* Awareness Sessions with Participants */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">Awareness Sessions Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.awarenessTopics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sessions" fill="#F59E0B" name="Sessions Conducted" />
            <Bar dataKey="participants" fill="#10B981" name="Total Participants" />
          </BarChart>
        </ResponsiveContainer>
      </MotionDiv>

      {/* Enhanced Supplement Distribution */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">
          Nutrition Supplement Distribution with Trends
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.supplementDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, trend }) => `${name}: ${value}% (${trend})`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.supplementDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </MotionDiv>
    </div>
  );
};

export default ReportsSection;
