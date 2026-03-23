import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  TrendingUp,
  FileText,
  Bell,
  Clock,
  MapPin,
  Droplets,
  Wind,
  Shield,
  BarChart3
} from 'lucide-react';
import DashboardCard from '../Common/DashboardCard';
import WasteCollectionLogging from './WasteCollectionLogging';
import HygieneChecklist from './HygieneChecklist';
import IssueReporting from './IssueReporting';
import ReportsSection from './ReportsSection';
import RecentActivities from './RecentActivities';

const SanitationWorkerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState({
    dailyCollection: { done: 12, pending: 3 },
    wasteSegregation: { compliance: 85 },
    hygieneScore: 78,
    openIssues: 4,
    verifiedLogs: 23,
    weeklySummary: { totalWaste: 156, issues: 8, compliance: 82 }
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'waste-logging', name: 'Waste Collection', icon: Trash2 },
    { id: 'hygiene-checklist', name: 'Hygiene Checklist', icon: Shield },
    { id: 'issue-reporting', name: 'Issue Reporting', icon: AlertTriangle },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'activities', name: 'Activities', icon: Clock }
  ];

  const statsCards = [
    {
      title: 'Daily Collection',
      value: `${dashboardStats.dailyCollection.done}/${dashboardStats.dailyCollection.done + dashboardStats.dailyCollection.pending}`,
      icon: Trash2,
      color: 'green',
      trend: 'up',
      trendValue: '+8%',
      subtitle: 'Done/Pending'
    },
    {
      title: 'Waste Segregation',
      value: `${dashboardStats.wasteSegregation.compliance}%`,
      icon: Droplets,
      color: 'blue',
      trend: 'up',
      trendValue: '+5%',
      subtitle: 'Compliance Rate'
    },
    {
      title: 'Hygiene Score',
      value: dashboardStats.hygieneScore,
      icon: Shield,
      color: 'purple',
      trend: 'stable',
      trendValue: '0%',
      subtitle: 'Out of 100'
    },
    {
      title: 'Open Issues',
      value: dashboardStats.openIssues,
      icon: AlertTriangle,
      color: 'red',
      trend: 'down',
      trendValue: '-2',
      subtitle: 'Need Attention'
    },
    {
      title: 'Verified Logs',
      value: dashboardStats.verifiedLogs,
      icon: CheckCircle,
      color: 'green',
      trend: 'up',
      trendValue: '+12',
      subtitle: 'This Month'
    },
    {
      title: 'Weekly Summary',
      value: `${dashboardStats.weeklySummary.compliance}%`,
      icon: TrendingUp,
      color: 'orange',
      trend: 'up',
      trendValue: '+3%',
      subtitle: 'Overall Compliance'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statsCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <DashboardCard {...stat} />
                </motion.div>
              ))}
            </div>

            {/* Today's Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Tasks</h3>
                <div className="space-y-3">
                  {[
                    { task: 'Morning Waste Collection', status: 'completed', time: '08:00 AM' },
                    { task: 'Hygiene Inspection', status: 'in-progress', time: '10:00 AM' },
                    { task: 'Afternoon Waste Collection', status: 'pending', time: '02:00 PM' },
                    { task: 'Daily Report Submission', status: 'pending', time: '04:00 PM' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'completed' ? 'bg-green-500' :
                          item.status === 'in-progress' ? 'bg-yellow-500' :
                          'bg-gray-300'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">{item.task}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Issues</h3>
                <div className="space-y-3">
                  {[
                    { issue: 'Drainage Blockage', severity: 'High', time: '2 hours ago' },
                    { issue: 'Waste Bin Overflow', severity: 'Medium', time: '4 hours ago' },
                    { issue: 'Water Contamination', severity: 'High', time: '1 day ago' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`w-4 h-4 ${
                          item.severity === 'High' ? 'text-red-500' :
                          item.severity === 'Medium' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{item.issue}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'waste-logging':
        return <WasteCollectionLogging />;

      case 'hygiene-checklist':
        return <HygieneChecklist />;

      case 'issue-reporting':
        return <IssueReporting />;

      case 'reports':
        return <ReportsSection />;

      case 'activities':
        return <RecentActivities />;

      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">
              Sanitation Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage waste collection, hygiene compliance, and sanitation issues
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>Akkarakkunnu Center</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </motion.div>
  );
};

export default SanitationWorkerDashboard;
