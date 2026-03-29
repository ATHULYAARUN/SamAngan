import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Filter, 
  Calendar,
  MapPin,
  Bell,
  Eye,
  BarChart3,
  PieChart,
  Users,
  Baby,
  Syringe,
  Stethoscope,
  Brain,
  FileText,
  Clock,
  XCircle
} from 'lucide-react';

import HealthChartsWorking from './health/HealthChartsWorking';
import adminService from '../../services/adminService';

const HealthMonitoringSimple = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    ward: 'ward9',
    center: 'all',
    category: 'all'
  });
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [aiAlertsLoading, setAiAlertsLoading] = useState(true);
  const [aiAlertsError, setAiAlertsError] = useState(null);

  const loadHealthSummary = async () => {
    try {
      const response = await adminService.getHealthMonitoringSummary({
        center: filters.center,
        category: filters.category
      });
      setHealthData(response?.data || null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load health summary:', error);
      setHealthData({
        summary: {
          highRiskPregnancies: 0,
          anemiaCases: 0,
          growthMonitoring: 0,
          immunizationCoverage: 0,
          nutritionStatus: { normal: 0 },
          maternalCompliance: 0
        }
      });
    }
  };

  useEffect(() => {
    console.log('🏥 HealthMonitoringSimple: Component mounted');
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadHealthSummary();
        console.log('✅ Health data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading health data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    loadHealthSummary();
  }, [filters]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadHealthSummary();
    setIsRefreshing(false);
  };

  const loadAiAlerts = async () => {
    setAiAlertsLoading(true);
    setAiAlertsError(null);
    try {
      const res = await adminService.getAiHealthAlerts();
      setAiAlerts(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load AI health alerts:', err);
      setAiAlertsError(err?.message || 'Failed to load AI predictions');
      setAiAlerts([]);
    } finally {
      setAiAlertsLoading(false);
    }
  };

  useEffect(() => {
    loadAiAlerts();
  }, []);

  const aiAlertRiskColor = (level) => {
    if (level === 'High') return 'bg-red-100 border-red-200 text-red-800';
    if (level === 'Moderate') return 'bg-amber-100 border-amber-200 text-amber-800';
    return 'bg-gray-100 border-gray-200 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading health monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              Health Monitoring Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time health insights and monitoring across all Anganwadi centers
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
              <select 
                value={filters.ward}
                onChange={(e) => setFilters(prev => ({...prev, ward: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ward9">Ward 9</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Center</label>
              <select 
                value={filters.center}
                onChange={(e) => setFilters(prev => ({...prev, center: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Centers</option>
                <option value="akkarakunnu">Akkarakunnu Center</option>
                <option value="veliyanoor">Veliyanoor Center</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select 
                value={filters.category}
                onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="child">Child Health</option>
                <option value="pregnancy">Pregnancy</option>
                <option value="adolescent">Adolescent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Health Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">High Risk Pregnancies</h3>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600 mb-2">{healthData?.summary?.highRiskPregnancies || 0}</div>
            <div className="text-xs text-gray-500">Requiring immediate attention</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Anemia Cases</h3>
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-2">{healthData?.summary?.anemiaCases || 0}</div>
            <div className="text-xs text-gray-500">Under treatment</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Growth Monitoring</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">{healthData?.summary?.growthMonitoring || 0}</div>
            <div className="text-xs text-gray-500">Monitored records</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Immunization</h3>
              <Syringe className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">{healthData?.summary?.immunizationCoverage || 0}</div>
            <div className="text-xs text-gray-500">Immunization records</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Normal Nutrition</h3>
              <Baby className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">{healthData?.summary?.nutritionStatus?.normal || 0}</div>
            <div className="text-xs text-gray-500">Normal nutrition records</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Maternal Compliance</h3>
              <Heart className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-2">{healthData?.summary?.maternalCompliance || 0}</div>
            <div className="text-xs text-gray-500">Compliant maternal records</div>
          </div>
        </div>

        {/* Charts Section - Real Chart.js Components */}
        <div className="mb-8">
          <HealthChartsWorking filters={filters} />
        </div>

        {/* AI Health Predictions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Health Predictions</h3>
            </div>
            <button
              type="button"
              onClick={loadAiAlerts}
              disabled={aiAlertsLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${aiAlertsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Pregnancy risk, child malnutrition, and adolescent anemia alerts derived from ASHA field visit data across all areas.
          </p>
          {aiAlertsError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">{aiAlertsError}</div>
          )}
          {aiAlertsLoading ? (
            <div className="py-8 text-center text-gray-500">Loading AI health predictions...</div>
          ) : aiAlerts.length === 0 ? (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              No AI health predictions at the moment. Alerts appear when ASHA field visit data indicates pregnancy risk, child malnutrition, or adolescent anemia.
            </div>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto">
              {aiAlerts.map((alert) => (
                <div
                  key={alert.id?.toString() || Math.random()}
                  className={`rounded-lg border-2 p-4 ${aiAlertRiskColor(alert.riskLevel)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                      {alert.type === 'pregnancy_risk' ? (
                        <Heart className="w-5 h-5 text-red-600" />
                      ) : (
                        <Baby className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{alert.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${aiAlertRiskColor(alert.riskLevel)}`}>
                          {alert.riskLevel}
                        </span>
                        {alert.ashaArea && (
                          <span className="text-xs text-gray-600">• {alert.ashaArea}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700"><strong>Reason:</strong> {alert.reason}</p>
                      <p className="text-sm text-gray-700 mt-1"><strong>Action:</strong> {alert.action}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        Beneficiary: {alert.beneficiaryName} • {alert.date ? new Date(alert.date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default HealthMonitoringSimple;