import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  UserCheck,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  BookOpen,
  Target
} from 'lucide-react';
import ashaService from '../../services/ashaService';

const AwarenessSessionsList = ({ onCreateNew, onEdit, onView, refreshTrigger }) => {
  const MotionDiv = motion.div;
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    audienceType: 'all',
    dateRange: 'all',
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  // Refetch when parent asks (e.g. switching back to list view) so created sessions always show
  useEffect(() => {
    if (refreshTrigger != null) loadSessions();
  }, [refreshTrigger]);

  useEffect(() => {
    filterSessions();
  }, [sessions, filters, searchTerm]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await ashaService.getAwarenessSessions();
      // Always set an array: backend returns { data: sessions[] }; support other shapes
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.sessions)
          ? response.sessions
          : Array.isArray(response)
            ? response
            : [];
      setSessions(list);
    } catch (error) {
      console.error('Error loading awareness sessions:', error);
      setSessions(getMockSessions());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockSessions = () => [
    {
      id: 1,
      sessionTitle: 'Nutrition and Hygiene',
      sessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      audienceType: 'parents',
      participantsCount: 25,
      description: 'Conducted awareness session on nutrition and hygiene practices for mothers and children',
      outcomes: 'Participants showed improved understanding of nutrition practices',
      venue: 'Community Center',
      duration: '2 hours',
      facilitator: 'Sunita Devi',
      topics: ['Nutrition', 'Hygiene', 'Child Care'],
      materials: ['Flip charts', 'Demonstration kit', 'Handouts'],
      status: 'completed',
      ashaArea: 'Default Area'
    },
    {
      id: 2,
      sessionTitle: 'Maternal Health',
      sessionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      audienceType: 'pregnant_women',
      participantsCount: 15,
      description: 'Awareness session on maternal health and ANC checkups for pregnant women',
      outcomes: 'Women understood importance of regular ANC checkups',
      venue: 'PHC Center',
      duration: '1.5 hours',
      facilitator: 'Sunita Devi',
      topics: ['Maternal Health', 'ANC', 'Nutrition'],
      materials: ['Presentation slides', 'Charts', 'Models'],
      status: 'completed',
      ashaArea: 'Default Area'
    },
    {
      id: 3,
      sessionTitle: 'Immunization Awareness',
      sessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      audienceType: 'parents',
      participantsCount: 30,
      description: 'Session on importance of timely immunization for children',
      outcomes: 'Parents committed to timely vaccination',
      venue: 'School Ground',
      duration: '2 hours',
      facilitator: 'Sunita Devi',
      topics: ['Immunization', 'Vaccine Schedule', 'Child Health'],
      materials: ['Vaccine schedule charts', 'Information brochures'],
      status: 'completed',
      ashaArea: 'Default Area'
    },
    {
      id: 4,
      sessionTitle: 'Adolescent Health',
      sessionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      audienceType: 'adolescents',
      participantsCount: 20,
      description: 'Health awareness session for adolescent girls on menstrual health and nutrition',
      outcomes: 'Girls gained confidence in discussing health issues',
      venue: 'School Classroom',
      duration: '1.5 hours',
      facilitator: 'Sunita Devi',
      topics: ['Menstrual Health', 'Nutrition', 'Personal Hygiene'],
      materials: ['Educational videos', 'Sanitary products samples'],
      status: 'completed',
      ashaArea: 'Default Area'
    },
    {
      id: 5,
      sessionTitle: 'Child Development',
      sessionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      audienceType: 'parents',
      participantsCount: 18,
      description: 'Session on child development milestones and early learning',
      outcomes: 'Parents learned about age-appropriate activities',
      venue: 'Anganwadi Center',
      duration: '2 hours',
      facilitator: 'Sunita Devi',
      topics: ['Child Development', 'Early Learning', 'Play Activities'],
      materials: ['Development charts', 'Learning toys', 'Handouts'],
      status: 'completed',
      ashaArea: 'Default Area'
    }
  ];

  const filterSessions = () => {
    let filtered = [...sessions];

    // Apply audience type filter
    if (filters.audienceType !== 'all') {
      filtered = filtered.filter(session => session.audienceType === filters.audienceType);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(session => session.status === filters.status);
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
    filtered = filtered.filter(session => {
      const d = session.sessionDate ? new Date(session.sessionDate) : new Date(0);
      return d >= cutoffDate;
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  };

  const getAudienceTypeLabel = (type) => {
    const labels = {
      parents: 'Parents',
      pregnant_women: 'Pregnant Women',
      adolescents: 'Adolescents',
      children: 'Children',
      community: 'Community'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'scheduled':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const SessionCard = ({ session }) => (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-black mb-2">{session.sessionTitle}</h3>
          <p className="text-sm text-gray-600 mb-3">{session.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {session.participantsCount} participants
            </span>
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {session.venue}
            </span>
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(session.sessionDate).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {session.duration}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${getStatusColor(session.status)}-100 text-${getStatusColor(session.status)}-800`}>
            {session.status}
          </span>
          <span className="text-xs text-gray-500">
            {getAudienceTypeLabel(session.audienceType)}
          </span>
        </div>
      </div>

      {session.topics && session.topics.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">Topics Covered:</p>
          <div className="flex flex-wrap gap-1">
            {session.topics.map((topic, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Facilitator: {session.facilitator}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView && onView(session)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit && onEdit(session)}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </MotionDiv>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Awareness Sessions</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadSessions}
            className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setFilters({ audienceType: 'all', dateRange: 'all', status: 'all' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audience Type</label>
            <select
              value={filters.audienceType}
              onChange={(e) => setFilters(prev => ({ ...prev, audienceType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="parents">Parents</option>
              <option value="pregnant_women">Pregnant Women</option>
              <option value="adolescents">Adolescents</option>
              <option value="children">Children</option>
              <option value="community">Community</option>
            </select>
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
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
                placeholder="Search sessions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <SessionCard key={session.id || session._id || session.sessionTitle} session={session} />
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Awareness Sessions Found</h3>
            <p className="text-gray-600 mb-4">No sessions match your current filters.</p>
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Session</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AwarenessSessionsList;
