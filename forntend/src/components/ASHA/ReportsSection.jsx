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
  ResponsiveContainer
} from 'recharts';
import { Download, FileText, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ashaService from '../../services/ashaService';

const ReportsSection = () => {
  const MotionDiv = motion.div;
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const data = await ashaService.getReportData();
      setReportData(data.data || data);
    } catch (error) {
      console.error('Error loading report data:', error);
      // Use mock data if API fails
      setReportData(getMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockData = () => ({
    visitsPerMonth: [
      { month: 'Jan', visits: 24 },
      { month: 'Feb', visits: 28 },
      { month: 'Mar', visits: 32 },
      { month: 'Apr', visits: 30 },
      { month: 'May', visits: 35 },
      { month: 'Jun', visits: 38 }
    ],
    awarenessTopics: [
      { topic: 'Hygiene', sessions: 8 },
      { topic: 'Nutrition', sessions: 6 },
      { topic: 'Menstrual Health', sessions: 4 },
      { topic: 'Child Care', sessions: 5 },
      { topic: 'Immunization', sessions: 3 }
    ],
    supplementDistribution: [
      { name: 'Iron Tablets', value: 85 },
      { name: 'Vitamin A', value: 72 },
      { name: 'Deworming', value: 68 }
    ]
  });

  const data = reportData || getMockData();

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Reports & Analytics</h2>
        <button
          onClick={downloadPDF}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Total Visits</h4>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-black">
            {data.visitsPerMonth.reduce((sum, item) => sum + item.visits, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Last 6 months</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Awareness Sessions</h4>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-black">
            {data.awarenessTopics.reduce((sum, item) => sum + item.sessions, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total conducted</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Avg. Supplement Coverage</h4>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-black">
            {Math.round(
              data.supplementDistribution.reduce((sum, item) => sum + item.value, 0) / 
              data.supplementDistribution.length
            )}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Distribution rate</p>
        </div>
      </div>

      {/* Visits Per Month Chart */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">Number of Visits Per Month</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.visitsPerMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="visits" fill="#10B981" name="Household Visits" />
          </BarChart>
        </ResponsiveContainer>
      </MotionDiv>

      {/* Awareness Topics Chart */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">Topics Covered in Awareness Sessions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.awarenessTopics} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="topic" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="sessions" fill="#F59E0B" name="Number of Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </MotionDiv>

      {/* Supplement Distribution Chart */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-black mb-4">
          Percentage of Children Receiving Supplements
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.supplementDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
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
