import React from 'react';
import AlertsManagement from './AlertsManagement';
import FeedbackForm from './FeedbackForm';
import AIHealthAlerts from './AIHealthAlerts';

/**
 * Health Alerts tab content – loaded lazily so a failure here doesn’t blank the whole dashboard.
 */
const HealthAlertsTab = ({ onSuccess }) => {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <AlertsManagement />
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Submit new alert</h3>
        <FeedbackForm onSuccess={onSuccess} />
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Health Alerts</h3>
        <AIHealthAlerts />
      </div>
    </div>
  );
};

export default HealthAlertsTab;
