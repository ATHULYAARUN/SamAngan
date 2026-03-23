import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Baby, 
  Users, 
  Calendar, 
  Heart, 
  BookOpen,
  Utensils,
  Activity,
  UserPlus,
  FileText,
  Clock,
  MapPin,
  Award,
  X
} from 'lucide-react';
import DashboardCard from '../Dashboard/DashboardCard';
import NewbornRegistrationForm from '../Registration/NewbornRegistrationForm';
import NewbornRegistrationsView from '../Anganwadi/NewbornRegistrationsView';

const AnganwadiWorkerModule = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isNewbornRegistrationModalOpen, setIsNewbornRegistrationModalOpen] = useState(false);

  // Handler functions
  const handleRegisterNewborn = () => {
    setIsNewbornRegistrationModalOpen(true);
  };

  const handleNewbornRegistrationSubmit = async (formData) => {
    try {
      console.log('Newborn registration data:', formData);
      // Here you would make an API call to save the data
      // await fetch('/api/anganwadi/newborn-registration', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      setIsNewbornRegistrationModalOpen(false);
      // Show success message or refresh data
      alert('Newborn registered successfully!');
    } catch (error) {
      console.error('Error registering newborn:', error);
      alert('Error registering newborn. Please try again.');
    }
  };

  const handleQuickAction = (actionName) => {
    switch (actionName) {
      case 'Register New Child':
        handleRegisterNewborn();
        break;
      case 'Mark Attendance':
        setActiveTab('attendance');
        break;
      case 'Health Checkup':
        setActiveTab('health');
        break;
      case 'Nutrition Record':
        setActiveTab('nutrition');
        break;
      case 'Generate Report':
        // Handle report generation
        console.log('Generate report clicked');
        break;
      default:
        console.log('Unknown action:', actionName);
    }
  };

  const workerStats = [
    {
      title: 'Enrolled Children',
      value: '87',
      icon: Baby,
      color: 'blue',
      trend: 'up',
      trendValue: '+5%'
    },
    {
      title: 'Daily Attendance',
      value: '78',
      icon: Users,
      color: 'green',
      trend: 'up',
      trendValue: '+12%'
    },
    {
      title: 'Health Checkups',
      value: '23',
      icon: Heart,
      color: 'red',
      trend: 'up',
      trendValue: '+8%'
    },
    {
      title: 'Nutrition Served',
      value: '156',
      icon: Utensils,
      color: 'orange',
      trend: 'up',
      trendValue: '+15%'
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'children', name: 'Children Management', icon: Baby },
    { id: 'newborn', name: 'Newborn Registrations', icon: UserPlus },
    { id: 'attendance', name: 'Attendance', icon: Calendar },
    { id: 'health', name: 'Health Records', icon: Heart },
    { id: 'nutrition', name: 'Nutrition', icon: Utensils },
    { id: 'activities', name: 'Learning Activities', icon: BookOpen }
  ];

  const recentChildren = [
    { id: 1, name: 'Aarav Kumar', age: '3 years', gender: 'Male', lastVisit: '2024-01-20', status: 'Active' },
    { id: 2, name: 'Priya Sharma', age: '4 years', gender: 'Female', lastVisit: '2024-01-19', status: 'Active' },
    { id: 3, name: 'Rohit Singh', age: '2 years', gender: 'Male', lastVisit: '2024-01-18', status: 'Absent' },
    { id: 4, name: 'Kavya Patel', age: '5 years', gender: 'Female', lastVisit: '2024-01-20', status: 'Active' }
  ];

  const todaySchedule = [
    { time: '09:00 AM', activity: 'Morning Assembly', status: 'completed' },
    { time: '09:30 AM', activity: 'Health Checkup - Group A', status: 'completed' },
    { time: '10:30 AM', activity: 'Learning Activities', status: 'in-progress' },
    { time: '12:00 PM', activity: 'Nutrition Distribution', status: 'pending' },
    { time: '02:00 PM', activity: 'Story Time', status: 'pending' },
    { time: '03:30 PM', activity: 'Parent Meeting', status: 'pending' }
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Anganwadi Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage children, activities, and daily operations
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {workerStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            transition={{ delay: index * 0.1 }}
          >
            <DashboardCard {...stat} />
          </motion.div>
        ))}
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {todaySchedule.map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'completed' ? 'bg-green-500' :
                          item.status === 'in-progress' ? 'bg-yellow-500' :
                          'bg-gray-300'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{item.activity}</h3>
                          <span className="text-sm text-gray-500">{item.time}</span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          item.status === 'completed' ? 'text-green-600' :
                          item.status === 'in-progress' ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>
                          {item.status === 'completed' ? 'Completed' :
                           item.status === 'in-progress' ? 'In Progress' :
                           'Pending'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  {[
                    { name: 'Register Newborn', icon: UserPlus, color: 'blue' },
                    { name: 'Mark Attendance', icon: Calendar, color: 'green' },
                    { name: 'Health Checkup', icon: Heart, color: 'red' },
                    { name: 'Nutrition Record', icon: Utensils, color: 'orange' },
                    { name: 'Generate Report', icon: FileText, color: 'purple' }
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action.name)}
                        className="w-full flex items-center p-3 text-left rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                      >
                        <Icon className={`w-5 h-5 mr-3 text-${action.color}-600`} />
                        <span className="font-medium text-gray-900">{action.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance System</h3>
              <p className="text-gray-600">Daily attendance tracking interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'children' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Children Management</h2>
              <button className="btn-primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Register Child
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Age</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Gender</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Last Visit</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChildren.map((child) => (
                    <motion.tr
                      key={child.id}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="border-b border-gray-100"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">{child.name}</td>
                      <td className="py-3 px-4 text-gray-600">{child.age}</td>
                      <td className="py-3 px-4 text-gray-600">{child.gender}</td>
                      <td className="py-3 px-4 text-gray-600">{child.lastVisit}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          child.status === 'Active' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {child.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'newborn' && (
          <NewbornRegistrationsView />
        )}

        {activeTab === 'attendance' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Attendance Management</h2>
              <button className="btn-primary">
                <Calendar className="w-4 h-4 mr-2" />
                Mark Today's Attendance
              </button>
            </div>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance System</h3>
              <p className="text-gray-600">Daily attendance tracking interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Health Records</h2>
              <button className="btn-primary">
                <Heart className="w-4 h-4 mr-2" />
                New Health Record
              </button>
            </div>
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Health Management</h3>
              <p className="text-gray-600">Health records and checkup management will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Nutrition Management</h2>
              <button className="btn-primary">
                <Utensils className="w-4 h-4 mr-2" />
                Record Nutrition
              </button>
            </div>
            <div className="text-center py-12">
              <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nutrition Tracking</h3>
              <p className="text-gray-600">Nutrition distribution and tracking system will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Learning Activities</h2>
              <button className="btn-primary">
                <BookOpen className="w-4 h-4 mr-2" />
                Plan Activity
              </button>
            </div>
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Planning</h3>
              <p className="text-gray-600">Learning activities and curriculum management will be implemented here.</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Newborn Registration Modal */}
      {isNewbornRegistrationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <NewbornRegistrationForm
              onSubmit={handleNewbornRegistrationSubmit}
              onCancel={() => setIsNewbornRegistrationModalOpen(false)}
              isLoading={false}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnganwadiWorkerModule;