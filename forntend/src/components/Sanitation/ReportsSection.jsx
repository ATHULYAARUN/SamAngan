import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  BarChart3,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Printer,
  Share2,
  Eye
} from 'lucide-react';

const ReportsSection = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('all');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: 'daily-waste',
      name: 'Daily Waste Log',
      description: 'Detailed daily waste collection logs',
      icon: Trash2,
      color: 'green',
      format: 'PDF',
      frequency: 'daily'
    },
    {
      id: 'weekly-compliance',
      name: 'Weekly Compliance Report',
      description: 'Hygiene and sanitation compliance summary',
      icon: Shield,
      color: 'blue',
      format: 'PDF',
      frequency: 'weekly'
    },
    {
      id: 'monthly-audit',
      name: 'Monthly Sanitation Audit',
      description: 'Comprehensive monthly audit report',
      icon: BarChart3,
      color: 'purple',
      format: 'PDF',
      frequency: 'monthly'
    },
    {
      id: 'issue-tracking',
      name: 'Issue Tracking History',
      description: 'Complete issue resolution timeline',
      icon: AlertTriangle,
      color: 'orange',
      format: 'PDF',
      frequency: 'on-demand'
    }
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockReports = [
      {
        id: 1,
        type: 'daily-waste',
        name: 'Daily Waste Log - Jan 20, 2024',
        generatedAt: '2024-01-20 05:00 PM',
        generatedBy: 'SAN-001',
        period: '2024-01-20',
        status: 'completed',
        downloadUrl: '#',
        size: '2.4 MB',
        format: 'PDF'
      },
      {
        id: 2,
        type: 'weekly-compliance',
        name: 'Weekly Compliance Report - Jan 14-20, 2024',
        generatedAt: '2024-01-20 06:00 PM',
        generatedBy: 'SAN-001',
        period: '2024-01-14 to 2024-01-20',
        status: 'completed',
        downloadUrl: '#',
        size: '1.8 MB',
        format: 'PDF'
      },
      {
        id: 3,
        type: 'monthly-audit',
        name: 'Monthly Sanitation Audit - December 2023',
        generatedAt: '2024-01-01 10:00 AM',
        generatedBy: 'Admin-001',
        period: '2023-12-01 to 2023-12-31',
        status: 'completed',
        downloadUrl: '#',
        size: '5.2 MB',
        format: 'PDF'
      }
    ];
    setReports(mockReports);
  }, []);

  const handleGenerateReport = async (reportTypeId) => {
    setLoading(true);
    
    // Simulate report generation
    setTimeout(() => {
      const reportType = reportTypes.find(type => type.id === reportTypeId);
      const newReport = {
        id: reports.length + 1,
        type: reportTypeId,
        name: `${reportType.name} - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date().toLocaleString(),
        generatedBy: 'SAN-001',
        period: `${dateRange.startDate} to ${dateRange.endDate}`,
        status: 'completed',
        downloadUrl: '#',
        size: '1.5 MB',
        format: reportType.format
      };

      setReports(prev => [newReport, ...prev]);
      setLoading(false);
      alert(`${reportType.name} generated successfully!`);
    }, 2000);
  };

  const handleDownloadReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      alert(`Downloading ${report.name}...`);
      // In real implementation, this would trigger actual download
    }
  };

  const handleViewReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    setSelectedReport(report);
  };

  const filteredReports = reports.filter(report => {
    if (reportType !== 'all' && report.type !== reportType) return false;
    return true;
  });

  const getReportTypeInfo = (typeId) => {
    return reportTypes.find(type => type.id === typeId) || { name: typeId, color: 'gray' };
  };

  const getReportStats = () => {
    const totalReports = reports.length;
    const thisWeek = reports.filter(r => {
      const reportDate = new Date(r.generatedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reportDate >= weekAgo;
    }).length;
    const thisMonth = reports.filter(r => {
      const reportDate = new Date(r.generatedAt);
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return reportDate >= monthAgo;
    }).length;

    return { totalReports, thisWeek, thisMonth };
  };

  const stats = getReportStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Reports: {stats.totalReports}
          </div>
          <div className="text-sm text-gray-500">
            This Week: {stats.thisWeek}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600">Total Reports</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalReports}</div>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600">This Week</div>
              <div className="text-2xl font-bold text-green-900">{stats.thisWeek}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-600">This Month</div>
              <div className="text-2xl font-bold text-purple-900">{stats.thisMonth}</div>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Generate New Report */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            
            return (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Icon className={`w-6 h-6 text-${type.color}-500`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <p className="text-xs text-gray-500">{type.frequency}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{type.format}</span>
                  <button
                    onClick={() => handleGenerateReport(type.id)}
                    disabled={loading}
                    className="flex items-center px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Reports History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
          <div className="flex items-center space-x-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Reports</option>
              {reportTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Filter</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredReports.map((report) => {
            const typeInfo = getReportTypeInfo(report.type);
            const Icon = typeInfo.icon;
            
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <Icon className={`w-8 h-8 text-${typeInfo.color}-500`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Generated: {report.generatedAt}</span>
                      <span>By: {report.generatedBy}</span>
                      <span>Period: {report.period}</span>
                      <span>Size: {report.size}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewReport(report.id)}
                    className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadReport(report.id)}
                    className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                  <button className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </button>
                  <button className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Printer className="w-3 h-3 mr-1" />
                    Print
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Report Preview</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedReport.name}</h4>
                  <p className="text-gray-600">Period: {selectedReport.period}</p>
                  <p className="text-gray-600">Generated: {selectedReport.generatedAt}</p>
                  <p className="text-gray-600">By: {selectedReport.generatedBy}</p>
                </div>

                {/* Sample report content */}
                <div className="space-y-6">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Executive Summary</h5>
                    <p className="text-gray-700">
                      This report provides a comprehensive overview of sanitation activities 
                      during the specified period, including waste collection data, hygiene 
                      compliance metrics, and issue resolution status.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Key Metrics</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">Total Waste Collected</div>
                        <div className="text-xl font-semibold text-gray-900">156.8 kg</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">Hygiene Compliance</div>
                        <div className="text-xl font-semibold text-gray-900">87.5%</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">Issues Resolved</div>
                        <div className="text-xl font-semibold text-gray-900">12</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">Verification Rate</div>
                        <div className="text-xl font-semibold text-gray-900">95%</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Recommendations</h5>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Increase waste collection frequency during peak periods</li>
                      <li>Regular maintenance of drainage systems</li>
                      <li>Enhanced pest control measures</li>
                      <li>Staff training on waste segregation practices</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadReport(selectedReport.id)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsSection;
