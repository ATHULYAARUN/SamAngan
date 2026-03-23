import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Clock,
  Save,
  FileText,
  TrendingUp,
  Droplets,
  Wind,
  Home,
  Utensils,
  Baby,
  Package,
  AlertCircle
} from 'lucide-react';

const HygieneChecklist = () => {
  const [checklists, setChecklists] = useState([]);
  const [currentChecklist, setCurrentChecklist] = useState({
    date: new Date().toISOString().split('T')[0],
    frequency: 'daily',
    items: {},
    issuesFound: '',
    nextAction: '',
    photos: []
  });
  const [showHistory, setShowHistory] = useState(false);

  const checklistItems = [
    {
      id: 'classroom',
      name: 'Clean Classroom',
      description: 'Floors, desks, chairs, and learning materials',
      icon: Home,
      category: 'learning'
    },
    {
      id: 'kitchen',
      name: 'Kitchen Area Clean',
      description: 'Food preparation area, utensils, storage',
      icon: Utensils,
      category: 'food'
    },
    {
      id: 'playarea',
      name: 'Play Area Clean',
      description: 'Outdoor/indoor play equipment and surfaces',
      icon: Baby,
      category: 'recreation'
    },
    {
      id: 'storage',
      name: 'Storage Clean',
      description: 'Supply storage, food storage, equipment storage',
      icon: Package,
      category: 'storage'
    },
    {
      id: 'water',
      name: 'Water Availability',
      description: 'Clean drinking water, hand washing facilities',
      icon: Droplets,
      category: 'utilities'
    },
    {
      id: 'toilet',
      name: 'Toilet Condition',
      description: 'Cleanliness, water supply, sanitation supplies',
      icon: AlertCircle,
      category: 'sanitation'
    },
    {
      id: 'waste',
      name: 'Waste Segregation',
      description: 'Proper waste bins, segregation practices',
      icon: AlertTriangle,
      category: 'waste'
    },
    {
      id: 'drainage',
      name: 'Drainage Clean',
      description: 'Clear drainage systems, no blockages',
      icon: Wind,
      category: 'infrastructure'
    }
  ];

  const frequencies = [
    { id: 'daily', name: 'Daily', recommended: true },
    { id: 'weekly', name: 'Weekly', recommended: false },
    { id: 'monthly', name: 'Monthly', recommended: false }
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockChecklists = [
      {
        id: 1,
        date: '2024-01-20',
        frequency: 'daily',
        items: {
          classroom: true,
          kitchen: true,
          playarea: true,
          storage: true,
          water: true,
          toilet: false,
          waste: true,
          drainage: true
        },
        complianceScore: 87.5,
        issuesFound: 'Toilet area needs cleaning supplies restocked',
        nextAction: 'Restock cleaning supplies by tomorrow',
        verificationStatus: 'verified',
        verifiedBy: 'AWW-001',
        verifiedAt: '2024-01-20 11:30 AM'
      },
      {
        id: 2,
        date: '2024-01-19',
        frequency: 'daily',
        items: {
          classroom: true,
          kitchen: true,
          playarea: true,
          storage: true,
          water: true,
          toilet: true,
          waste: true,
          drainage: true
        },
        complianceScore: 100,
        issuesFound: '',
        nextAction: '',
        verificationStatus: 'approved',
        verifiedBy: 'Admin-001',
        verifiedAt: '2024-01-19 04:15 PM'
      }
    ];
    setChecklists(mockChecklists);
  }, []);

  const handleItemChange = (itemId, value) => {
    setCurrentChecklist(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: value
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentChecklist(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateComplianceScore = () => {
    const items = currentChecklist.items;
    const totalItems = checklistItems.length;
    const completedItems = Object.values(items).filter(value => value === true).length;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newChecklist = {
      id: checklists.length + 1,
      ...currentChecklist,
      complianceScore: calculateComplianceScore(),
      verificationStatus: 'submitted',
      verifiedBy: null,
      verifiedAt: null
    };

    setChecklists(prev => [newChecklist, ...prev]);
    
    // Reset form
    setCurrentChecklist({
      date: new Date().toISOString().split('T')[0],
      frequency: 'daily',
      items: {},
      issuesFound: '',
      nextAction: '',
      photos: []
    });

    alert('Hygiene checklist submitted successfully!');
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 75) return 'yellow';
    if (score >= 60) return 'orange';
    return 'red';
  };

  const getVerificationBadge = (status) => {
    const badges = {
      submitted: { color: 'yellow', text: 'Submitted' },
      verified: { color: 'green', text: 'Verified (AWW)' },
      approved: { color: 'blue', text: 'Approved (Admin)' },
      rejected: { color: 'red', text: 'Rejected' }
    };
    return badges[status] || { color: 'gray', text: status };
  };

  const currentScore = calculateComplianceScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hygiene & Sanitation Checklist</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Current Score: 
            <span className={`ml-2 font-semibold text-${getComplianceColor(currentScore)}-600`}>
              {currentScore}%
            </span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
      </div>

      {/* Current Checklist Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">New Checklist</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Frequency:</label>
              <select
                name="frequency"
                value={currentChecklist.frequency}
                onChange={handleInputChange}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {frequencies.map(freq => (
                  <option key={freq.id} value={freq.id}>
                    {freq.name} {freq.recommended && '(Recommended)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="date"
                value={currentChecklist.date}
                onChange={handleInputChange}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Checklist Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklistItems.map((item) => {
              const Icon = item.icon;
              const isChecked = currentChecklist.items[item.id] || false;
              
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isChecked 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleItemChange(item.id, !isChecked)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isChecked 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {isChecked && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Issues and Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issues Found (Optional)
              </label>
              <textarea
                name="issuesFound"
                value={currentChecklist.issuesFound}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe any hygiene or sanitation issues found..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Action (Optional)
              </label>
              <textarea
                name="nextAction"
                value={currentChecklist.nextAction}
                onChange={handleInputChange}
                rows={3}
                placeholder="What actions need to be taken..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <TrendingUp className={`w-5 h-5 text-${getComplianceColor(currentScore)}-500`} />
              <span className="text-sm text-gray-600">
                Compliance Score: <span className={`font-semibold text-${getComplianceColor(currentScore)}-600`}>{currentScore}%</span>
              </span>
            </div>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Submit Checklist
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      {showHistory && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Checklist History</h3>
          <div className="space-y-4">
            {checklists.map((checklist) => {
              const verificationBadge = getVerificationBadge(checklist.verificationStatus);
              
              return (
                <motion.div
                  key={checklist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900">{checklist.date}</div>
                      <div className="text-sm text-gray-500">{checklist.frequency}</div>
                      <div className={`flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${getComplianceColor(checklist.complianceScore)}-100 text-${getComplianceColor(checklist.complianceScore)}-800`}>
                        {checklist.complianceScore}% Compliance
                      </div>
                    </div>
                    <div className={`flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${verificationBadge.color}-100 text-${verificationBadge.color}-800`}>
                      {verificationBadge.text}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {checklistItems.map((item) => {
                      const Icon = item.icon;
                      const isCompleted = checklist.items[item.id];
                      
                      return (
                        <div key={item.id} className="flex items-center space-x-2 text-sm">
                          <Icon className={`w-3 h-3 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className={isCompleted ? 'text-gray-900' : 'text-gray-400 line-through'}>
                            {item.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {checklist.issuesFound && (
                    <div className="mb-2">
                      <div className="text-sm font-medium text-gray-700">Issues Found:</div>
                      <div className="text-sm text-gray-600">{checklist.issuesFound}</div>
                    </div>
                  )}

                  {checklist.nextAction && (
                    <div className="mb-2">
                      <div className="text-sm font-medium text-gray-700">Next Action:</div>
                      <div className="text-sm text-gray-600">{checklist.nextAction}</div>
                    </div>
                  )}

                  {checklist.verifiedBy && (
                    <div className="text-xs text-gray-500">
                      Verified by {checklist.verifiedBy} at {checklist.verifiedAt}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HygieneChecklist;
