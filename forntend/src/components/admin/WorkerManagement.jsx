import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CreateWorkerModal from './CreateWorkerModal';
import ExportModal from './ExportModal';
import { 
  Users, 
  Plus, 
  Mail, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  Key,
  X,
  AlertCircle,
  EyeOff
} from 'lucide-react';

const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resendingCredentials, setResendingCredentials] = useState(null); // Track which worker's credentials are being resent
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedWorkerRole, setSelectedWorkerRole] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const workerRoles = [
    { 
      id: 'anganwadi-worker', 
      name: 'Anganwadi Worker', 
      icon: '👶',
      description: 'Manages child care, nutrition programs, and early childhood education',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      borderColor: 'border-pink-200'
    },
    { 
      id: 'asha-volunteer', 
      name: 'ASHA Volunteer', 
      icon: '🏥',
      description: 'Provides health services, maternal care, and community health programs',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'sanitation-worker', 
      name: 'Sanitation Worker', 
      icon: '🧹',
      description: 'Maintains hygiene, sanitation facilities, and waste management',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    }
  ];

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      // Fetch all pages so all worker roles are shown
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const pageSize = 100;
      let page = 1;
      let totalPages = 1;
      let allWorkers = [];

      do {
        const response = await fetch(`/api/admin/workers?page=${page}&limit=${pageSize}&role=all`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!data.success) break;

        const batch = Array.isArray(data.data) ? data.data : [];
        allWorkers = allWorkers.concat(batch);
        totalPages = data?.pagination?.pages || 1;
        page += 1;
      } while (page <= totalPages);

      setWorkers(allWorkers);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCredentials = async (workerId) => {
    // Show confirmation dialog
    const worker = workers.find(w => w._id === workerId);
    if (!worker) {
      alert('Worker not found');
      return;
    }

    const confirmResend = window.confirm(
      `Are you sure you want to resend credentials to ${worker.name} (${worker.email})?\n\n` +
      `This will generate a new temporary password if needed and send it via email.`
    );

    if (!confirmResend) return;

    try {
      setResendingCredentials(workerId);
      const response = await fetch(`/api/admin/workers/${workerId}/resend-credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Success!\n\nCredentials have been resent to ${worker.email}\n\nThe worker will receive an email with their login information.`);
      } else {
        alert(`❌ Failed to send credentials: ${data.message}`);
      }
    } catch (error) {
      console.error('Error resending credentials:', error);
      alert('❌ Error resending credentials. Please check your connection and try again.');
    } finally {
      setResendingCredentials(null);
    }
  };

  const handleToggleStatus = async (workerId) => {
    try {
      const response = await fetch(`/api/admin/workers/${workerId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchWorkers(); // Refresh the list
      } else {
        alert('Failed to update status: ' + data.message);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error updating worker status');
    }
  };

  const handleResetPassword = async (workerId, passwordData) => {
    try {
      const response = await fetch(`/api/admin/workers/${workerId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchWorkers(); // Refresh the list
      } else {
        alert('Failed to reset password: ' + data.message);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password');
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || worker.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
            <p className="text-gray-600 mt-1">Manage worker accounts and access permissions</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRoleSelection(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Worker Account
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workers</p>
                <p className="text-2xl font-bold text-green-600">
                  {workers.filter(w => w.isActive).length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Setup</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {workers.filter(w => w.tempPassword).length}
                </p>
              </div>
              <Key className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Workers</p>
                <p className="text-2xl font-bold text-red-600">
                  {workers.filter(w => !w.isActive).length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Roles</option>
                {workerRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              
              <button
                onClick={fetchWorkers}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Center
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary-600 mr-2" />
                      Loading workers...
                    </div>
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No workers found
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <WorkerRow 
                    key={worker._id} 
                    worker={worker} 
                    isResendingCredentials={resendingCredentials === worker._id}
                    onView={() => {
                      setSelectedWorker(worker);
                      setShowDetailsModal(true);
                    }}
                    onEdit={() => {
                      setSelectedWorker(worker);
                      setShowCreateModal(true);
                    }}
                    onResendCredentials={() => handleResendCredentials(worker._id)}
                    onResetPassword={() => {
                      setSelectedWorker(worker);
                      setShowPasswordModal(true);
                    }}
                    onToggleStatus={() => handleToggleStatus(worker._id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <RoleSelectionModal
          workerRoles={workerRoles}
          onClose={() => setShowRoleSelection(false)}
          onRoleSelect={(role) => {
            setSelectedWorkerRole(role);
            setShowRoleSelection(false);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Create/Edit Worker Modal */}
      {showCreateModal && (
        <CreateWorkerModal
          worker={selectedWorker}
          selectedRole={selectedWorkerRole}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedWorker(null);
            setSelectedWorkerRole(null);
          }}
          onSuccess={() => {
            fetchWorkers();
            setShowCreateModal(false);
            setSelectedWorker(null);
            setSelectedWorkerRole(null);
          }}
        />
      )}

      {/* Worker Details Modal */}
      {showDetailsModal && selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedWorker(null);
          }}
        />
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedWorker && (
        <PasswordResetModal
          worker={selectedWorker}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedWorker(null);
          }}
          onSuccess={(passwordData) => {
            handleResetPassword(selectedWorker._id, passwordData);
            setShowPasswordModal(false);
            setSelectedWorker(null);
          }}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        dataType="workers"
        title="Export Workers Data"
      />
    </div>
  );
};

// Worker Row Component
const WorkerRow = ({ worker, isResendingCredentials, onView, onEdit, onResendCredentials, onResetPassword, onToggleStatus }) => {
  const getRoleInfo = (role) => {
    const roleMap = {
      'anganwadi-worker': { name: 'Anganwadi Worker', icon: '👶', color: 'bg-blue-100 text-blue-800' },
      'asha-volunteer': { name: 'ASHA Volunteer', icon: '🏥', color: 'bg-green-100 text-green-800' },
      'sanitation-worker': { name: 'Sanitation Worker', icon: '🧹', color: 'bg-purple-100 text-purple-800' }
    };
    return roleMap[role] || { name: role, icon: '👤', color: 'bg-gray-100 text-gray-800' };
  };

  const roleInfo = getRoleInfo(worker.role);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {worker.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
            <div className="text-sm text-gray-500">{worker.email}</div>
            {worker.phone && (
              <div className="text-sm text-gray-500">{worker.phone}</div>
            )}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
            <span className="mr-1">{roleInfo.icon}</span>
            {roleInfo.name}
          </span>
          {worker.roleSpecificData?.anganwadiCenter?.name && (
            <div className="text-sm text-gray-500 mt-1">
              📍 {worker.roleSpecificData.anganwadiCenter.name}
            </div>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            worker.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {worker.isActive ? '✅ Active' : '❌ Inactive'}
          </span>
          {worker.tempPassword && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              🔑 Pending Setup
            </span>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-500">
        {worker.lastLogin ? (
          new Date(worker.lastLogin).toLocaleDateString()
        ) : (
          'Never'
        )}
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="text-blue-400 hover:text-blue-600 p-1"
            title="Edit Worker"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onResendCredentials}
            disabled={isResendingCredentials}
            className={`p-1 ${isResendingCredentials 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-green-400 hover:text-green-600'
            }`}
            title={isResendingCredentials ? "Sending..." : "Resend Credentials"}
          >
            {isResendingCredentials ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Mail className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onResetPassword}
            className="text-purple-400 hover:text-purple-600 p-1"
            title="Reset Password"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleStatus}
            className={`p-1 ${worker.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
            title={worker.isActive ? 'Deactivate' : 'Activate'}
          >
            {worker.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
};

const WorkerDetailsModal = ({ worker, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
        <h2 className="text-xl font-bold mb-4">Worker Details</h2>
        <p className="text-gray-600 mb-4">Worker details modal content goes here...</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordResetModal = ({ worker, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    useCustomPassword: false,
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (formData.useCustomPassword) {
      if (!formData.newPassword) {
        setError('Password is required');
        return false;
      }
      if (formData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    const passwordData = {
      useCustomPassword: formData.useCustomPassword,
      newPassword: formData.useCustomPassword ? formData.newPassword : undefined
    };

    onSuccess(passwordData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Reset Password</h2>
              <p className="text-purple-100 text-sm mt-1">
                Reset password for {worker.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="useCustomPassword"
                name="useCustomPassword"
                checked={formData.useCustomPassword}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="useCustomPassword" className="text-sm font-medium text-gray-700">
                Set custom password (otherwise auto-generate new password)
              </label>
            </div>

            {!formData.useCustomPassword && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <p className="text-blue-800 text-sm font-medium">Auto-Generated Password</p>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  A new secure password will be automatically generated and sent to the worker via email.
                </p>
              </div>
            )}

            {formData.useCustomPassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter new password"
                      required={formData.useCustomPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Confirm new password"
                      required={formData.useCustomPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// Role Selection Modal Component
const RoleSelectionModal = ({ workerRoles, onClose, onRoleSelect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Select Worker Type</h2>
              <p className="text-indigo-100 mt-1">Choose the type of worker account to create</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workerRoles.map((role) => (
              <motion.div
                key={role.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`${role.bgColor} ${role.borderColor} border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg group`}
                onClick={() => onRoleSelect(role)}
              >
                {/* Role Icon */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${role.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {role.icon}
                </div>

                {/* Role Information */}
                <div>
                  <h3 className={`text-lg font-bold ${role.textColor} mb-2`}>
                    {role.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {role.description}
                  </p>
                  
                  {/* Action Button */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${role.color} text-white rounded-lg text-sm font-medium group-hover:shadow-md transition-shadow duration-200`}>
                    <Plus className="w-4 h-4" />
                    Create {role.name}
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-xl" />
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Important Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Each worker type has specific form fields and requirements</li>
                  <li>• Anganwadi Workers require additional qualifications and gender verification</li>
                  <li>• All workers will receive login credentials via email</li>
                  <li>• You can modify worker details after account creation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkerManagement;