import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  MapPin,
  User,
  Lock,
  Baby,
  Heart,
  Shield,
  UserCheck,
  GraduationCap,
  X,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import adminService from '../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [emailStatus, setEmailStatus] = useState('');

  // Form data for creating/editing users
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    location: '',
    anganwadiName: '',
    workerId: '',
    qualification: '',
    experience: '',
    department: ''
  });

  // Worker roles that admin can manage
  const workerRoles = [
    {
      id: 'anganwadi-worker',
      title: 'Anganwadi Worker',
      icon: Baby,
      color: 'primary'
    },
    {
      id: 'asha-volunteer',
      title: 'ASHA Worker/Volunteer',
      icon: Heart,
      color: 'secondary'
    },
    {
      id: 'sanitation-worker',
      title: 'Sanitation Worker',
      icon: Shield,
      color: 'accent'
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const pageSize = 100; // backend validatePagination max is 100
      let page = 1;
      let allUsers = [];
      let totalPages = 1;

      do {
        const response = await adminService.getUsers({
          role: roleFilter === 'all' ? '' : roleFilter,
          isActive: 'all',
          page,
          limit: pageSize
        });

        if (!response?.success) break;
        const batch = response?.data?.users || [];
        allUsers = allUsers.concat(batch);
        totalPages = response?.data?.pagination?.pages || 1;
        page += 1;
      } while (page <= totalPages);

      setUsers(allUsers);

      if (allUsers.length === 0) {
        console.warn('UserManagement: No users returned from API');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        location: formData.location,
        roleSpecificData: getRoleSpecificData()
      };

      const response = await adminService.createUser(userData);
      
      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        setEmailStatus('success');
        setTimeout(() => setEmailStatus(''), 3000);
        
        // Refresh users list
        fetchUsers();
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      setEmailStatus('error');
      setTimeout(() => setEmailStatus(''), 3000);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        roleSpecificData: getRoleSpecificData()
      };

      const response = await adminService.updateUser(selectedUser._id, userData);
      
      if (response.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        
        // Refresh users list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Helper function to extract role-specific data
  const getRoleSpecificData = () => {
    switch (formData.role) {
      case 'anganwadi-worker':
        return {
          anganwadiCenter: {
            name: formData.anganwadiName || '',
            code: formData.workerId || '',
            location: formData.location || '',
          },
          qualification: formData.qualification || '',
          experience: formData.experience || ''
        };
      case 'asha-volunteer':
        return {
          ashaDetails: {
            certificationNumber: formData.workerId || '',
            trainingCompleted: formData.qualification ? true : false,
            serviceArea: formData.location || '',
          },
          qualification: formData.qualification || ''
        };
      case 'sanitation-worker':
        return {
          sanitationDetails: {
            employeeId: formData.workerId || '',
            department: formData.department || '',
            assignedRoutes: [],
            vehicleNumber: '',
            workingHours: '',
          }
        };
      default:
        return {};
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await adminService.deleteUser(userId, false); // Soft delete
        
        if (response.success) {
          // Refresh users list
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };



  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      location: '',
      anganwadiName: '',
      workerId: '',
      qualification: '',
      experience: '',
      department: ''
    });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.address?.street || '',
      anganwadiName: user.roleSpecificData?.anganwadiCenter?.name || '',
      workerId: user.roleSpecificData?.anganwadiCenter?.code || 
                user.roleSpecificData?.ashaDetails?.certificationNumber || 
                user.roleSpecificData?.sanitationDetails?.employeeId || '',
      qualification: user.roleSpecificData?.qualification || '',
      experience: user.roleSpecificData?.experience || '',
      department: user.roleSpecificData?.sanitationDetails?.department || ''
    });
    setShowEditModal(true);
  };

  // Show all users in Admin > User Management
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    const roleData = workerRoles.find(r => r.id === role);
    return roleData ? roleData.icon : User;
  };

  const getRoleTitle = (role) => {
    const roleData = workerRoles.find(r => r.id === role);
    if (roleData) return roleData.title;
    const titles = {
      'super-admin': 'Super Admin',
      parent: 'Parent',
      'adolescent-girl': 'Adolescent Girl',
      'pregnant-woman': 'Pregnant Woman'
    };
    return titles[role] || role;
  };

  const renderRoleSpecificFields = () => {
    const inputClass = "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black";
    
    switch (formData.role) {
      case 'anganwadi-worker':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Worker ID
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="workerId"
                  value={formData.workerId}
                  onChange={(e) => setFormData({...formData, workerId: e.target.value})}
                  className={inputClass}
                  placeholder="Enter worker ID"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Qualification
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  className={inputClass}
                  required
                >
                  <option value="">Select qualification</option>
                  <option value="10th">10th Pass</option>
                  <option value="12th">12th Pass</option>
                  <option value="graduate">Graduate</option>
                  <option value="diploma">Diploma in Early Childhood</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Anganwadi Name
              </label>
              <div className="relative">
                <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="anganwadiName"
                  value={formData.anganwadiName}
                  onChange={(e) => setFormData({...formData, anganwadiName: e.target.value})}
                  className={inputClass}
                  placeholder="Enter anganwadi name"
                  required
                />
              </div>
            </div>
          </>
        );
      
      case 'asha-volunteer':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                ASHA ID
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="workerId"
                  value={formData.workerId}
                  onChange={(e) => setFormData({...formData, workerId: e.target.value})}
                  className={inputClass}
                  placeholder="Enter ASHA ID"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Training Status
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  className={inputClass}
                  required
                >
                  <option value="">Select training status</option>
                  <option value="basic">Basic ASHA Training</option>
                  <option value="advanced">Advanced Training</option>
                  <option value="specialized">Specialized Training</option>
                  <option value="ongoing">Training Ongoing</option>
                </select>
              </div>
            </div>
          </>
        );
      
      case 'sanitation-worker':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Worker ID
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="workerId"
                  value={formData.workerId}
                  onChange={(e) => setFormData({...formData, workerId: e.target.value})}
                  className={inputClass}
                  placeholder="Enter worker ID"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Department
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className={inputClass}
                  required
                >
                  <option value="">Select department</option>
                  <option value="municipal">Municipal Corporation</option>
                  <option value="panchayat">Panchayat</option>
                  <option value="private">Private Contractor</option>
                  <option value="ngo">NGO/Community</option>
                </select>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pr-2 sm:pr-3 lg:pr-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black">User Management</h2>
          <p className="text-gray-600">Manage all users</p>
        </div>
      </div>

      {/* Email Status */}
      {emailStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          emailStatus === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {emailStatus === 'success' ? (
            <>
              <CheckCircle className="w-5 h-5" />
              User created successfully! Login credentials have been sent via email.
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              Failed to send email. Please try again or contact the user manually.
            </>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All</option>
            <option value="super-admin">Super Admin</option>
            <option value="anganwadi-worker">Anganwadi Worker</option>
            <option value="asha-volunteer">ASHA Volunteer</option>
            <option value="parent">Parent</option>
            <option value="adolescent-girl">Adolescent Girl</option>
            <option value="pregnant-woman">Pregnant Woman</option>
            <option value="sanitation-worker">Sanitation Worker</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="pb-1">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[22%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="w-[20%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="w-[24%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="w-[8%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-[8%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  const workerId = user.roleSpecificData?.anganwadiCenter?.code || 
                                  user.roleSpecificData?.ashaDetails?.certificationNumber || 
                                  user.roleSpecificData?.sanitationDetails?.employeeId || '';
                  const anganwadiName = user.roleSpecificData?.anganwadiCenter?.name || '';
                  
                  return (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{workerId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <RoleIcon className="w-5 h-5 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900">{getRoleTitle(user.role)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 break-words">{user.email}</div>
                        <div className="text-sm text-gray-500 break-words">{user.phone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 break-words">{user.address?.street || ''}</div>
                        {anganwadiName && (
                          <div className="text-sm text-gray-500 break-words">{anganwadiName}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-black">Add New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      required
                    >
                      <option value="">Select role</option>
                      {workerRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                    placeholder="Enter location"
                    required
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {formData.role && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-md font-semibold text-black">Role-specific Information</h4>
                  {renderRoleSpecificFields()}
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Create User & Send Email
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-black">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              {/* Same form fields as create modal */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter location"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role-specific fields */}
              {formData.role && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-md font-semibold text-black">Role-specific Information</h4>
                  {renderRoleSpecificFields()}
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;