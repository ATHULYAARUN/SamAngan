import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle, Send, Award, RefreshCw } from 'lucide-react';
import ashaService from '../../services/ashaService';

const SCHEMES = [
  { code: 'poshan', name: 'POSHAN Abhiyaan' },
  { code: 'pmmvy', name: 'Pradhan Mantri Matru Vandana Yojana' },
  { code: 'jsy', name: 'Janani Suraksha Yojana' },
  { code: 'sukanya', name: 'Sukanya Samriddhi Yojana' }
];

const STATUS_OPTIONS = [
  { value: 'aware', label: 'Aware', icon: BookOpen },
  { value: 'applied', label: 'Applied', icon: Send },
  { value: 'benefiting', label: 'Benefiting', icon: Award }
];

const SchemeAwareness = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    beneficiaryType: 'child',
    beneficiaryName: '',
    schemeCode: 'poshan',
    status: 'aware',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [filterScheme, setFilterScheme] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await ashaService.getSchemeAwareness(filterScheme ? { schemeCode: filterScheme } : {});
      setList(res.data || []);
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterScheme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.beneficiaryName.trim()) return;
    setSaving(true);
    try {
      await ashaService.postSchemeAwareness(form);
      setForm({ beneficiaryType: 'child', beneficiaryName: '', schemeCode: 'poshan', status: 'aware', notes: '' });
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
      alert('Failed to save. ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" />
            Scheme Awareness Tracking
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={filterScheme}
              onChange={(e) => setFilterScheme(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">All schemes</option>
              {SCHEMES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            <button onClick={load} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add / Update
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Mark scheme awareness for beneficiary</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary type</label>
              <select
                value={form.beneficiaryType}
                onChange={(e) => setForm((f) => ({ ...f, beneficiaryType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="child">Child</option>
                <option value="pregnant_woman">Pregnant Woman</option>
                <option value="adolescent">Adolescent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary name *</label>
              <input
                type="text"
                value={form.beneficiaryName}
                onChange={(e) => setForm((f) => ({ ...f, beneficiaryName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheme</label>
              <select
                value={form.schemeCode}
                onChange={(e) => setForm((f) => ({ ...f, schemeCode: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {SCHEMES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-4">
                {STATUS_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={opt.value}
                      checked={form.status === opt.value}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="text-green-600"
                    />
                    <opt.icon className="w-4 h-4 text-gray-500" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Remarks"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheme</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No records. Add using the button above.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.beneficiaryName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{row.beneficiaryType?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.schemeName || row.schemeCode}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row.status === 'benefiting' ? 'bg-green-100 text-green-800' :
                        row.status === 'applied' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{row.notes || '–'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchemeAwareness;
