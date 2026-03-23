import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  Edit2,
  Filter
} from 'lucide-react';
import sanitationService from '../../services/sanitationService';

const WARD_NUMBER = 9;

const DrainageMonitoring = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    drainLocation: '',
    wardNumber: WARD_NUMBER,
    blockageStatus: 'No',
    waterStagnation: 'No',
    mosquitoRiskLevel: 'Low',
    cleaningStatus: '',
    remarks: ''
  });

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await sanitationService.getDrainageReports({ ward: WARD_NUMBER });
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await sanitationService.updateDrainageReport(editingId, {
          blockageStatus: formData.blockageStatus,
          waterStagnation: formData.waterStagnation,
          mosquitoRiskLevel: formData.mosquitoRiskLevel,
          cleaningStatus: formData.cleaningStatus,
          remarks: formData.remarks
        });
        setEditingId(null);
      } else {
        await sanitationService.createDrainageReport(formData);
      }
      setFormData({
        drainLocation: '',
        wardNumber: WARD_NUMBER,
        blockageStatus: 'No',
        waterStagnation: 'No',
        mosquitoRiskLevel: 'Low',
        cleaningStatus: '',
        remarks: ''
      });
      setShowForm(false);
      loadReports();
      window.dispatchEvent(new CustomEvent('sanitation:updated'));
    } catch (err) {
      alert(err.message || 'Failed to save');
    }
  };

  const riskColor = (level) => {
    if (level === 'High') return 'bg-red-100 text-red-800';
    if (level === 'Medium') return 'bg-amber-100 text-amber-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Drainage Monitoring</h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Report
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Update Drainage' : 'New Drainage Report'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Drain Location</label>
              <input
                type="text"
                value={formData.drainLocation}
                onChange={(e) => setFormData({ ...formData, drainLocation: e.target.value })}
                placeholder="e.g. Near Market Road, Ward 9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blockage Status</label>
              <select
                value={formData.blockageStatus}
                onChange={(e) => setFormData({ ...formData, blockageStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water Stagnation</label>
              <select
                value={formData.waterStagnation}
                onChange={(e) => setFormData({ ...formData, waterStagnation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mosquito Risk Level</label>
              <select
                value={formData.mosquitoRiskLevel}
                onChange={(e) => setFormData({ ...formData, mosquitoRiskLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Status</label>
              <input
                type="text"
                value={formData.cleaningStatus}
                onChange={(e) => setFormData({ ...formData, cleaningStatus: e.target.value })}
                placeholder="e.g. Cleaned, Pending"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                {editingId ? 'Update' : 'Submit'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blockage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stagnation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mosquito Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cleaning Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.drainLocation}</td>
                    <td className="px-4 py-3">
                      <span className={r.blockageStatus === 'Yes' ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {r.blockageStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.waterStagnation}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${riskColor(r.mosquitoRiskLevel)}`}>
                        {r.mosquitoRiskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.cleaningStatus || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {r.reportedDate ? new Date(r.reportedDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setEditingId(r._id);
                          setFormData({
                            drainLocation: r.drainLocation,
                            wardNumber: r.wardNumber ?? WARD_NUMBER,
                            blockageStatus: r.blockageStatus,
                            waterStagnation: r.waterStagnation,
                            mosquitoRiskLevel: r.mosquitoRiskLevel,
                            cleaningStatus: r.cleaningStatus || '',
                            remarks: r.remarks || ''
                          });
                          setShowForm(true);
                        }}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" /> Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && reports.length === 0 && (
          <p className="text-center py-8 text-gray-500">No drainage reports. Add one to track conditions.</p>
        )}
      </div>
    </div>
  );
};

export default DrainageMonitoring;
