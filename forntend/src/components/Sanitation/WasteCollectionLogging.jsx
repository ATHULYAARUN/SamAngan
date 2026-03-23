import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Camera,
  Clock,
  CheckCircle,
  Calendar,
  Save,
  Filter,
  Loader2
} from 'lucide-react';
import sanitationService from '../../services/sanitationService';

const DEFAULT_CENTER = 'Akkarakunnu Anganwadi';

const WasteCollectionLogging = () => {
  const [wasteLogs, setWasteLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    anganwadiCenter: DEFAULT_CENTER,
    wasteType: '',
    quantity: '',
    quantityUnit: 'kg',
    collectionStatus: 'Collected',
    remarks: '',
    photo: null
  });
  const [filter, setFilter] = useState({
    date: '',
    category: '',
    status: ''
  });

  const wasteCategories = [
    { id: 'Organic Waste', name: 'Organic Waste', color: 'green' },
    { id: 'Plastic Waste', name: 'Plastic Waste', color: 'blue' },
    { id: 'Dry Waste', name: 'Dry Waste', color: 'yellow' },
    { id: 'Medical Waste', name: 'Medical Waste', color: 'red' }
  ];

  const collectionStatuses = [
    { id: 'Collected', name: 'Collected', color: 'green', icon: CheckCircle },
    { id: 'Pending', name: 'Pending', color: 'yellow', icon: Clock }
  ];

  const loadLogs = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const params = {};
      if (filter.date) params.date = filter.date;
      if (filter.category) params.wasteType = filter.category;
      if (filter.status) params.status = filter.status;
      const data = await sanitationService.getWasteLogs(params);
      setWasteLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setWasteLogs([]);
      if (err?.message?.includes('reach') || err?.message === 'Failed to fetch') {
        setLoadError('Cannot reach the server. Ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter.date, filter.category, filter.status]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sanitationService.createWasteLog({
        date: formData.date,
        anganwadiCenter: formData.anganwadiCenter || DEFAULT_CENTER,
        wasteType: formData.wasteType,
        quantity: Number(formData.quantity) || 0,
        quantityUnit: formData.quantityUnit || 'kg',
        collectionStatus: formData.collectionStatus || 'Collected',
        remarks: formData.remarks
      });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        anganwadiCenter: DEFAULT_CENTER,
        wasteType: '',
        quantity: '',
        quantityUnit: 'kg',
        collectionStatus: 'Collected',
        remarks: '',
        photo: null
      });
      loadLogs();
      window.dispatchEvent(new CustomEvent('sanitation:updated'));
      alert('Waste collection logged successfully!');
    } catch (err) {
      const msg = err?.message || 'Failed to log collection';
      alert(msg.includes('fetch') || msg.includes('reach') ? 'Cannot reach the server. Please ensure the backend is running and try again.' : msg);
    }
  };

  const getCategoryInfo = (id) => wasteCategories.find(cat => cat.id === id) || { name: id, color: 'gray' };
  const getStatusInfo = (id) => collectionStatuses.find(s => s.id === id) || { name: id, color: 'gray' };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{loadError}</span>
          <button
            type="button"
            onClick={() => { setLoadError(null); loadLogs(); }}
            className="text-amber-700 font-medium text-sm hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Waste Collection Logging</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Logs: {wasteLogs.length}
          </div>
        </div>
      </div>

      {/* New Log Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Log New Collection</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Waste Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waste Type
              </label>
              <select
                name="wasteType"
                value={formData.wasteType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Type</option>
                {wasteCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <select
                  name="quantityUnit"
                  value={formData.quantityUnit}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="kg">Kg</option>
                  <option value="bags">Bags</option>
                  <option value="liters">Liters</option>
                </select>
              </div>
            </div>

            {/* Collection Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Status
              </label>
              <select
                name="collectionStatus"
                value={formData.collectionStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {collectionStatuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Log Collection
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Collection Logs</h3>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filters</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Filter by date"
          />
          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {wasteCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {collectionStatuses.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Center</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {wasteLogs.map((log) => {
                  const categoryInfo = getCategoryInfo(log.wasteType);
                  const statusInfo = getStatusInfo(log.collectionStatus);
                  const StatusIcon = statusInfo.icon || CheckCircle;
                  return (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {log.date ? new Date(log.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{log.anganwadiCenter || DEFAULT_CENTER}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${categoryInfo.color}-100 text-${categoryInfo.color}-800`}>
                          {categoryInfo.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{log.quantity} {log.quantityUnit}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 text-${statusInfo.color}-500`} />
                          <span className="text-sm text-gray-900">{statusInfo.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{log.remarks || '-'}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && wasteLogs.length === 0 && (
          <p className="text-center py-6 text-gray-500">No waste logs found.</p>
        )}
      </div>
    </div>
  );
};

export default WasteCollectionLogging;
