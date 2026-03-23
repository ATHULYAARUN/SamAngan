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
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import anganwadiService from '../../services/anganwadiService';

const AwarenessSessionsView = () => {
  const MotionDiv = motion.div;
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    audienceType: 'all',
    dateRange: 'all',
    status: 'all',
    source: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, filters, searchTerm]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await anganwadiService.getCrossDashboardAwarenessSessions();
      setSessions(response.data || response);
    } catch (error) {
      console.error('Error loading awareness sessions:', error);
      // Use mock data if API fails
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
      source: 'asha',
      sourceWorker: 'Sunita Devi',
      ashaArea: 'Default Area',
      crossDashboardStatus: {
        awwVerified: false,
        adminVerified: false,
        awwComments: null,
        adminComments: null
      }
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
      source: 'asha',
      sourceWorker: 'Sunita Devi',
      ashaArea: 'Default Area',
      crossDashboardStatus: {
        awwVerified: true,
        adminVerified: false,
        awwComments: 'Good session coverage, well organized',
        adminComments: null
      }
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
      source: 'asha',
      sourceWorker: 'Sunita Devi',
      ashaArea: 'Default Area',
      crossDashboardStatus: {
        awwVerified: true,
        adminVerified: true,
        awwComments: 'Excellent community participation',
        adminComments: 'Approved - Good impact on immunization rates'
      }
    },
    {
      id: 4,
      sessionTitle: 'Child Development',
      sessionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
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
      source: 'asha',
      sourceWorker: 'Sunita Devi',
      ashaArea: 'Default Area',
      crossDashboardStatus: {
        awwVerified: false,
        adminVerified: false,
        awwComments: null,
        adminComments: null
      }
    }
  ];

  const filterSessions = () => {
    let filtered = [...sessions];

    // Apply audience type filter
    if (filters.audienceType !== 'all') {
      filtered = filtered.filter(session => session.audienceType === filters.audienceType);
    }

    // Apply source filter
    if (filters.source !== 'all') {
      filtered = filtered.filter(session => session.source === filters.source);
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
    filtered = filtered.filter(session => session.sessionDate >= cutoffDate);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.sourceWorker.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getSourceLabel = (source) => {
    const labels = {
      asha: 'ASHA Worker',
      anganwadi: 'Anganwadi Worker',
      admin: 'Administrator'
    };
    return labels[source] || source;
  };

  const getVerificationStatus = (session) => {
    if (session.crossDashboardStatus.awwVerified && session.crossDashboardStatus.adminVerified) {
      return { color: 'green', icon: CheckCircle, text: 'Fully Verified' };
    } else if (session.crossDashboardStatus.awwVerified) {
      return { color: 'yellow', icon: AlertTriangle, text: 'AWW Verified' };
    } else {
      return { color: 'gray', icon: XCircle, text: 'Pending Verification' };
    }
  };

  const verifySession = async (sessionId, verificationData) => {
    try {
      await anganwadiService.verifyASHAData(sessionId, verificationData);
      loadSessions(); // Refresh the data
    } catch (error) {
      console.error('Error verifying session:', error);
    }
  };

  const SessionCard = ({ session }) => {
    const verificationStatus = getVerificationStatus(session);
    const StatusIcon = verificationStatus.icon;

    return (
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-black">{session.sessionTitle}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${verificationStatus.color}-100 text-${verificationStatus.color}-800 flex items-center`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {verificationStatus.text}
              </span>
            </div>
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
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center">
                <UserCheck className="w-3 h-3 mr-1" />
                {getSourceLabel(session.source)}: {session.sourceWorker}
              </span>
              <span className="flex items-center">
                <Target className="w-3 h-3 mr-1" />
                {getAudienceTypeLabel(session.audienceType)}
              </span>
            </div>
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

        {session.outcomes && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-1">Outcomes:</p>
            <p className="text-xs text-gray-700">{session.outcomes}</p>
          </div>
        )}

        {/* Verification Comments */}
        {(session.crossDashboardStatus.awwComments || session.crossDashboardStatus.adminComments) && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            {session.crossDashboardStatus.awwComments && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-700">AWW Comments:</p>
                <p className="text-xs text-gray-600">{session.crossDashboardStatus.awwComments}</p>
              </div>
            )}
            {session.crossDashboardStatus.adminComments && (
              <div>
                <p className="text-xs font-medium text-gray-700">Admin Comments:</p>
                <p className="text-xs text-gray-600">{session.crossDashboardStatus.adminComments}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Area: {session.ashaArea}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedSession(session)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
            </button>
            {!session.crossDashboardStatus.awwVerified && (
              <button
                onClick={() => verifySession(session.id, { 
                  verified: true, 
                  comments: 'Verified by Anganwadi Worker',
                  verifiedBy: localStorage.getItem('userName') || 'Anganwadi Worker'
                })}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </MotionDiv>
    );
  };

  const SessionDetailModal = ({ session, onClose }) => {
    if (!session) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{session.sessionTitle}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(session.sessionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{session.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-medium">{session.participantsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Audience Type</p>
                  <p className="font-medium">{getAudienceTypeLabel(session.audienceType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Venue</p>
                  <p className="font-medium">{session.venue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Facilitator</p>
                  <p className="font-medium">{session.facilitator}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900">{session.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Outcomes</p>
                <p className="text-gray-900">{session.outcomes}</p>
              </div>

              {session.topics && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Topics Covered</p>
                  <div className="flex flex-wrap gap-2">
                    {session.topics.map((topic, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {session.materials && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Materials Used</p>
                  <div className="flex flex-wrap gap-2">
                    {session.materials.map((material, index) => (
                      <span key={index} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="font-medium">{getSourceLabel(session.source)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source Worker</p>
                  <p className="font-medium">{session.sourceWorker}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Verification Status</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">AWW Verification</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.crossDashboardStatus.awwVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.crossDashboardStatus.awwVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Admin Verification</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.crossDashboardStatus.adminVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.crossDashboardStatus.adminVerified ? 'Verified' : 'Pending'}
                    </span>
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
        <h2 className="text-2xl font-bold text-black">Awareness Sessions from ASHA Workers</h2>
        <button
          onClick={loadSessions}
          className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setFilters({ audienceType: 'all', dateRange: 'all', status: 'all', source: 'all' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="asha">ASHA Workers</option>
              <option value="anganwadi">Anganwadi Workers</option>
              <option value="admin">Administrators</option>
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
            <SessionCard key={session.id} session={session} />
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Awareness Sessions Found</h3>
            <p className="text-gray-600">No sessions match your current filters.</p>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)} 
      />
    </div>
  );
};

export default AwarenessSessionsView;
