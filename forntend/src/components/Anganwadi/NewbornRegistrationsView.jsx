import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Baby, 
  Calendar, 
  Users, 
  MapPin, 
  Phone, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
  Clock,
  Heart,
  Activity
} from 'lucide-react';

const NewbornRegistrationsView = () => {
  const MotionDiv = motion.div;
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    gender: 'all',
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, filters, searchTerm]);

  const loadRegistrations = async () => {
    try {
      setIsLoading(true);
      // Mock API call - replace with actual API
      const mockData = getMockRegistrations();
      setRegistrations(mockData);
    } catch (error) {
      console.error('Error loading registrations:', error);
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockRegistrations = () => [
    {
      id: 1,
      name: 'Aarav Kumar',
      dateOfBirth: '2024-01-15',
      timeOfBirth: '14:30',
      gender: 'male',
      motherName: 'Priya Kumar',
      motherAge: '28',
      motherPhone: '9876543210',
      fatherName: 'Rahul Kumar',
      fatherAge: '32',
      fatherPhone: '8765432109',
      address: {
        street: '123 Main Street',
        village: 'Shantinagar',
        block: 'North Block',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      birthDetails: {
        placeOfBirth: 'Government Hospital',
        deliveryType: 'Normal',
        attendedBy: 'Dr. Smith',
        complications: [],
        gestationalAge: '38 weeks'
      },
      measurements: {
        birthWeight: '3.2 kg',
        birthLength: '50 cm',
        headCircumference: '34 cm',
        chestCircumference: '32 cm'
      },
      healthAssessment: {
        apgarScore: { oneMinute: '8', fiveMinute: '9' },
        bloodGroup: 'O+',
        congenitalAnomalies: [],
        birthDefects: [],
        respiratoryDistress: false,
        feedingDifficulties: false,
        jaundice: false
      },
      feedingDetails: {
        breastfeedingInitiated: true,
        timeToFirstFeed: '30 minutes',
        feedingType: 'exclusive-breastfeeding',
        feedingProblems: []
      },
      anganwadiCenter: 'Anganwadi Center 1',
      specialNeeds: '',
      notes: 'Healthy baby, good feeding response',
      registrationDate: '2024-01-16',
      status: 'active'
    },
    {
      id: 2,
      name: 'Ananya Sharma',
      dateOfBirth: '2024-01-18',
      timeOfBirth: '09:15',
      gender: 'female',
      motherName: 'Sunita Sharma',
      motherAge: '26',
      motherPhone: '9876543211',
      fatherName: 'Amit Sharma',
      fatherAge: '30',
      fatherPhone: '8765432108',
      address: {
        street: '456 Park Avenue',
        village: 'Gandhinagar',
        block: 'South Block',
        district: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      birthDetails: {
        placeOfBirth: 'Private Hospital',
        deliveryType: 'C-section',
        attendedBy: 'Dr. Johnson',
        complications: ['Maternal diabetes'],
        gestationalAge: '37 weeks'
      },
      measurements: {
        birthWeight: '2.8 kg',
        birthLength: '48 cm',
        headCircumference: '33 cm',
        chestCircumference: '31 cm'
      },
      healthAssessment: {
        apgarScore: { oneMinute: '7', fiveMinute: '8' },
        bloodGroup: 'A+',
        congenitalAnomalies: [],
        birthDefects: [],
        respiratoryDistress: true,
        feedingDifficulties: false,
        jaundice: true
      },
      feedingDetails: {
        breastfeedingInitiated: true,
        timeToFirstFeed: '45 minutes',
        feedingType: 'exclusive-breastfeeding',
        feedingProblems: ['Initial latch issues']
      },
      anganwadiCenter: 'Anganwadi Center 2',
      specialNeeds: '',
      notes: 'Required oxygen support for first 24 hours, now stable',
      registrationDate: '2024-01-19',
      status: 'active'
    },
    {
      id: 3,
      name: 'Rohan Singh',
      dateOfBirth: '2024-01-20',
      timeOfBirth: '16:45',
      gender: 'male',
      motherName: 'Meera Singh',
      motherAge: '24',
      motherPhone: '9876543212',
      fatherName: 'Vikram Singh',
      fatherAge: '28',
      fatherPhone: '8765432107',
      address: {
        street: '789 Garden Road',
        village: 'Kalyanpur',
        block: 'East Block',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411001'
      },
      birthDetails: {
        placeOfBirth: 'Home Birth',
        deliveryType: 'Normal',
        attendedBy: 'Midwife',
        complications: [],
        gestationalAge: '40 weeks'
      },
      measurements: {
        birthWeight: '3.5 kg',
        birthLength: '52 cm',
        headCircumference: '35 cm',
        chestCircumference: '33 cm'
      },
      healthAssessment: {
        apgarScore: { oneMinute: '9', fiveMinute: '9' },
        bloodGroup: 'B+',
        congenitalAnomalies: [],
        birthDefects: [],
        respiratoryDistress: false,
        feedingDifficulties: false,
        jaundice: false
      },
      feedingDetails: {
        breastfeedingInitiated: true,
        timeToFirstFeed: '20 minutes',
        feedingType: 'exclusive-breastfeeding',
        feedingProblems: []
      },
      anganwadiCenter: 'Anganwadi Center 1',
      specialNeeds: '',
      notes: 'Excellent health parameters, strong feeding reflex',
      registrationDate: '2024-01-21',
      status: 'active'
    }
  ];

  const filterRegistrations = () => {
    let filtered = [...registrations];

    // Apply gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(reg => reg.gender === filters.gender);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(reg => reg.status === filters.status);
    }

    // Apply date range filter
    const now = new Date();
    let cutoffDate;
    switch (filters.dateRange) {
      case '1week':
        cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        cutoffDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }
    filtered = filtered.filter(reg => new Date(reg.registrationDate) >= cutoffDate);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.anganwadiCenter.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRegistrations(filtered);
  };

  const getGenderLabel = (gender) => {
    return gender === 'male' ? 'Male' : 'Female';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'transferred':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const diffTime = Math.abs(today - birthDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} months`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years}y ${months}m`;
    }
  };

  const RegistrationCard = ({ registration }) => (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-black">{registration.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(registration.status)}-100 text-${getStatusColor(registration.status)}-800`}>
              {registration.status}
            </span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {getGenderLabel(registration.gender)}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>DOB: {new Date(registration.dateOfBirth).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Age: {calculateAge(registration.dateOfBirth)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Mother: {registration.motherName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>{registration.motherPhone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{registration.address.village}, {registration.address.district}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Weight: {registration.measurements.birthWeight}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Center: {registration.anganwadiCenter} | Registered: {new Date(registration.registrationDate).toLocaleDateString()}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedRegistration(registration)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </MotionDiv>
  );

  const RegistrationDetailModal = ({ registration, onClose }) => {
    if (!registration) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{registration.name} - Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">{new Date(registration.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time of Birth</p>
                    <p className="font-medium">{registration.timeOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{getGenderLabel(registration.gender)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Age</p>
                    <p className="font-medium">{calculateAge(registration.dateOfBirth)}</p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Parent Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mother Name</p>
                    <p className="font-medium">{registration.motherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mother Age</p>
                    <p className="font-medium">{registration.motherAge} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mother Phone</p>
                    <p className="font-medium">{registration.motherPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Father Name</p>
                    <p className="font-medium">{registration.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Father Age</p>
                    <p className="font-medium">{registration.fatherAge} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Father Phone</p>
                    <p className="font-medium">{registration.fatherPhone}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Street</p>
                    <p className="font-medium">{registration.address.street}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Village</p>
                    <p className="font-medium">{registration.address.village}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Block</p>
                    <p className="font-medium">{registration.address.block}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">District</p>
                    <p className="font-medium">{registration.address.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-medium">{registration.address.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pincode</p>
                    <p className="font-medium">{registration.address.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Birth Details */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Birth Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Place of Birth</p>
                    <p className="font-medium">{registration.birthDetails.placeOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Type</p>
                    <p className="font-medium">{registration.birthDetails.deliveryType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attended By</p>
                    <p className="font-medium">{registration.birthDetails.attendedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gestational Age</p>
                    <p className="font-medium">{registration.birthDetails.gestationalAge}</p>
                  </div>
                </div>
              </div>

              {/* Measurements */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Measurements at Birth</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Birth Weight</p>
                    <p className="font-medium">{registration.measurements.birthWeight}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Birth Length</p>
                    <p className="font-medium">{registration.measurements.birthLength}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Head Circumference</p>
                    <p className="font-medium">{registration.measurements.headCircumference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chest Circumference</p>
                    <p className="font-medium">{registration.measurements.chestCircumference}</p>
                  </div>
                </div>
              </div>

              {/* Health Assessment */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">APGAR Score (1 min)</p>
                    <p className="font-medium">{registration.healthAssessment.apgarScore.oneMinute}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">APGAR Score (5 min)</p>
                    <p className="font-medium">{registration.healthAssessment.apgarScore.fiveMinute}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Blood Group</p>
                    <p className="font-medium">{registration.healthAssessment.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Respiratory Distress</p>
                    <p className="font-medium">{registration.healthAssessment.respiratoryDistress ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Anganwadi Center</p>
                    <p className="font-medium">{registration.anganwadiCenter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration Date</p>
                    <p className="font-medium">{new Date(registration.registrationDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{registration.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Newborn Registrations</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadRegistrations}
            className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setFilters({ dateRange: 'all', gender: 'all', status: 'all' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="1week">Last Week</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, parent, center..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
            </div>
            <Baby className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter(r => new Date(r.registrationDate).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Male</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter(r => r.gender === 'male').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Female</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter(r => r.gender === 'female').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-pink-600" />
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((registration) => (
            <RegistrationCard key={registration.id} registration={registration} />
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
            <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Registrations Found</h3>
            <p className="text-gray-600">No newborn registrations match your current filters.</p>
          </div>
        )}
      </div>

      {/* Registration Detail Modal */}
      <RegistrationDetailModal 
        registration={selectedRegistration} 
        onClose={() => setSelectedRegistration(null)} 
      />
    </div>
  );
};

export default NewbornRegistrationsView;
