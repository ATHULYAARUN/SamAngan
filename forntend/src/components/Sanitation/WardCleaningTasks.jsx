import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  Filter
} from 'lucide-react';
import sanitationService from '../../services/sanitationService';

const TASK_TYPES = ['Road Cleaning', 'Drain Cleaning', 'Garbage Removal', 'Public Area Cleaning'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const WARD_NUMBER = 9;

const WardCleaningTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    wardNumber: WARD_NUMBER,
    areaName: '',
    taskType: 'Garbage Removal',
    assignedWorker: localStorage.getItem('userName') || '',
    status: 'Pending',
    remarks: ''
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const data = await sanitationService.getTasks(params);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await sanitationService.updateTask(editingId, { status: formData.status, remarks: formData.remarks });
        setEditingId(null);
      } else {
        await sanitationService.createTask(formData);
      }
      setFormData({
        date: new Date().toISOString().split('T')[0],
        wardNumber: WARD_NUMBER,
        areaName: '',
        taskType: 'Garbage Removal',
        assignedWorker: localStorage.getItem('userName') || '',
        status: 'Pending',
        remarks: ''
      });
      setShowForm(false);
      loadTasks();
      window.dispatchEvent(new CustomEvent('sanitation:updated'));
    } catch (err) {
      alert(err.message || 'Failed to save task');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await sanitationService.updateTask(id, { status });
      loadTasks();
      window.dispatchEvent(new CustomEvent('sanitation:updated'));
    } catch (err) {
      alert(err.message || 'Failed to update');
    }
  };

  const statusColor = (s) => {
    if (s === 'Completed') return 'bg-green-100 text-green-800';
    if (s === 'In Progress') return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ward Cleaning Tasks</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit Task' : 'Create Task'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
              <input
                type="text"
                value={formData.areaName}
                onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                placeholder="e.g. Market Road, Main Street"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Worker</label>
              <input
                type="text"
                value={formData.assignedWorker}
                onChange={(e) => setFormData({ ...formData, assignedWorker: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            {editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                {editingId ? 'Update' : 'Create'}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ward</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{task.taskId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.date ? new Date(task.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">Ward {task.wardNumber ?? WARD_NUMBER}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{task.areaName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{task.taskType}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{task.assignedWorker}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{task.remarks || '-'}</td>
                    <td className="px-4 py-3">
                      {task.status !== 'Completed' && (
                        <div className="flex gap-2">
                          {task.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(task._id, 'In Progress')}
                              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'In Progress' && (
                            <button
                              onClick={() => handleUpdateStatus(task._id, 'Completed')}
                              className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" /> Complete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && tasks.length === 0 && (
          <p className="text-center py-8 text-gray-500">No tasks found. Create one to get started.</p>
        )}
      </div>
    </div>
  );
};

export default WardCleaningTasks;
