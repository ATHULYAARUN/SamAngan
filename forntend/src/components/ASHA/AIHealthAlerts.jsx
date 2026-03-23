import React, { useState, useEffect } from 'react';
import { AlertTriangle, Baby, Heart, RefreshCw, ChevronRight } from 'lucide-react';
import ashaService from '../../services/ashaService';

const AIHealthAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ashaService.getAiAlerts();
      const list = Array.isArray(res?.data) ? res.data : [];
      setAlerts(list);
    } catch (err) {
      console.error(err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const riskColor = (level) => {
    if (level === 'High') return 'bg-red-100 border-red-200 text-red-800';
    if (level === 'Moderate') return 'bg-amber-100 border-amber-200 text-amber-800';
    return 'bg-gray-100 border-gray-200 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            AI Health Alerts
          </h2>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Pregnancy risk and child malnutrition alerts derived from field visit data.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No AI health alerts at the moment. Alerts appear when visit data indicates pregnancy risk or child malnutrition.
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={alert.id ?? alert._id ?? `ai-alert-${idx}`}
              className={`bg-white rounded-xl border-2 p-5 ${riskColor(alert.riskLevel)}`}
            >
              <div className="flex items-start gap-4">
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
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor(alert.riskLevel)}`}>
                      {alert.riskLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700"><strong>Reason:</strong> {alert.reason}</p>
                  <p className="text-sm text-gray-700 mt-1"><strong>Action:</strong> {alert.action}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Beneficiary: {alert.beneficiaryName} • {new Date(alert.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIHealthAlerts;
