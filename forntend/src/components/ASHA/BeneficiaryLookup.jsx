import React, { useState } from 'react';
import { Search, Users, Baby, Heart, UserCheck, FileText, Calendar, RefreshCw, AlertTriangle, Pill } from 'lucide-react';
import ashaService from '../../services/ashaService';

const SUPPLEMENT_OPTIONS = [
  { value: 'iron', label: 'Iron tablets' },
  { value: 'vitaminA', label: 'Vitamin A' },
  { value: 'deworming', label: 'Deworming' },
  { value: 'calcium', label: 'Calcium' },
  { value: 'folicAcid', label: 'Folic acid' }
];

const BeneficiaryLookup = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState({ children: [], pregnantWomen: [], adolescents: [] });
  const [supplementList, setSupplementList] = useState([]);
  const [listMode, setListMode] = useState('search');
  const [selectedSupplement, setSelectedSupplement] = useState('iron');
  const [loading, setLoading] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [summary, setSummary] = useState(null);
  const [beneficiaryAlerts, setBeneficiaryAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setListMode('search');
    try {
      const res = await ashaService.searchBeneficiaries(query.trim(), type);
      setResults(res.data || { children: [], pregnantWomen: [], adolescents: [] });
      setSupplementList([]);
      setSelectedBeneficiary(null);
      setVisitHistory([]);
    } catch (err) {
      console.error(err);
      setResults({ children: [], pregnantWomen: [], adolescents: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadBySupplement = async () => {
    setLoading(true);
    setListMode('supplement');
    try {
      const res = await ashaService.getBeneficiariesBySupplement(selectedSupplement);
      const list = Array.isArray(res?.data) ? res.data : [];
      setSupplementList(list);
      setResults({ children: [], pregnantWomen: [], adolescents: [] });
      setSelectedBeneficiary(null);
      setVisitHistory([]);
    } catch (err) {
      console.error(err);
      setSupplementList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVisitHistory = async (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setLoadingVisits(true);
    setLoadingAlerts(true);
    setVisitHistory([]);
    setSummary(null);
    setBeneficiaryAlerts([]);
    try {
      const t = beneficiary.type === 'pregnant_woman' ? 'pregnant_woman' : beneficiary.type === 'adolescent' ? 'adolescent' : 'child';
      const [visitsRes, alertsRes] = await Promise.all([
        ashaService.getBeneficiaryVisits(t, beneficiary.name),
        ashaService.getAiAlerts().catch(() => ({ data: [] }))
      ]);

      const visits = visitsRes.data || [];
      setVisitHistory(visits);

      // Aggregate supplements across all visits for this beneficiary
      const supplementsSummary = visits.reduce(
        (acc, v) => {
          const s = v.supplements || {};
          if (s.iron) acc.iron += 1;
          if (s.vitaminA) acc.vitaminA += 1;
          if (s.deworming) acc.deworming += 1;
          if (s.calcium) acc.calcium += 1;
          if (s.folicAcid) acc.folicAcid += 1;
          return acc;
        },
        { iron: 0, vitaminA: 0, deworming: 0, calcium: 0, folicAcid: 0 }
      );

      setSummary({
        totalVisits: visits.length,
        supplements: supplementsSummary
      });

      const allAlerts = alertsRes?.data || alertsRes || [];
      const relatedAlerts = allAlerts.filter(
        (a) =>
          a.beneficiaryName &&
          a.beneficiaryName.toLowerCase() === String(beneficiary.name || '').toLowerCase()
      );
      setBeneficiaryAlerts(relatedAlerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVisits(false);
      setLoadingAlerts(false);
    }
  };

  const typeLabel = (t) => ({ child: 'Child (0-6)', pregnant_woman: 'Pregnant Woman', adolescent: 'Adolescent' }[t] || t);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-green-600" />
          Beneficiary Records – Search
        </h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All</option>
            <option value="child">Children</option>
            <option value="pregnant_woman">Pregnant Women</option>
            <option value="adolescent">Adolescents</option>
          </select>
          <button
            onClick={search}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">List by supplement received</p>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedSupplement}
              onChange={(e) => setSelectedSupplement(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {SUPPLEMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={loadBySupplement}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
              Load list
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Results</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {listMode === 'supplement' &&
              supplementList.map((b) => (
                <div
                  key={b.id}
                  onClick={() => loadVisitHistory({ id: b.id, name: b.name, type: b.type })}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 ${selectedBeneficiary?.id === b.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  {b.type === 'child' && <Baby className="w-5 h-5 text-blue-500" />}
                  {b.type === 'pregnant_woman' && <Heart className="w-5 h-5 text-pink-500" />}
                  {(b.type === 'adolescent' || !['child', 'pregnant_woman'].includes(b.type)) && <UserCheck className="w-5 h-5 text-purple-500" />}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="text-sm text-gray-500">
                      {typeLabel(b.type)} • {b.visitCount ?? 0} visit(s)
                      {b.lastVisit && ` • Last: ${new Date(b.lastVisit).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            {listMode === 'search' && results.children.map((c) => (
              <div
                key={c.id}
                onClick={() => loadVisitHistory(c)}
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 ${selectedBeneficiary?.id === c.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Baby className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{typeLabel('child')} • Age {c.age ?? '–'}</p>
                </div>
              </div>
            ))}
            {listMode === 'search' && results.pregnantWomen.map((p) => (
              <div
                key={p.id}
                onClick={() => loadVisitHistory(p)}
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 ${selectedBeneficiary?.id === p.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-sm text-gray-500">{typeLabel('pregnant_woman')}</p>
                </div>
              </div>
            ))}
            {listMode === 'search' && results.adolescents.map((a) => (
              <div
                key={a.id}
                onClick={() => loadVisitHistory(a)}
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 ${selectedBeneficiary?.id === a.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <UserCheck className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900">{a.name}</p>
                  <p className="text-sm text-gray-500">{typeLabel('adolescent')} • Age {a.age ?? '–'}</p>
                </div>
              </div>
            ))}
            {!loading && listMode === 'search' && query && results.children.length === 0 && results.pregnantWomen.length === 0 && results.adolescents.length === 0 && (
              <p className="text-gray-500 text-center py-4">No beneficiaries found.</p>
            )}
            {!loading && listMode === 'supplement' && supplementList.length === 0 && (
              <p className="text-gray-500 text-center py-4">No beneficiaries received this supplement.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Visit History
            {selectedBeneficiary && <span className="text-gray-500 font-normal"> – {selectedBeneficiary.name}</span>}
          </h3>
          {!selectedBeneficiary && (
            <p className="text-gray-500 text-sm">Select a beneficiary to view visit history.</p>
          )}
          {selectedBeneficiary && (
            <div className="space-y-4 max-h-[360px] overflow-y-auto">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <p className="text-gray-600">Total visits recorded</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {summary?.totalVisits ?? visitHistory.length}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <p className="text-gray-600">Supplements across all visits</p>
                  <p className="text-xs text-gray-700 mt-1">
                    Iron: {summary?.supplements?.iron ?? 0} • Vit A: {summary?.supplements?.vitaminA ?? 0}{' '}
                    • Deworming: {summary?.supplements?.deworming ?? 0}
                    <br />
                    Calcium: {summary?.supplements?.calcium ?? 0} • Folic acid:{' '}
                    {summary?.supplements?.folicAcid ?? 0}
                  </p>
                </div>
              </div>

              {/* Visit list */}
              <div className="space-y-2">
                {loadingVisits ? (
                  <p className="text-gray-500">Loading visits...</p>
                ) : visitHistory.length === 0 ? (
                  <p className="text-gray-500">No visits recorded yet.</p>
                ) : (
                  visitHistory.map((v) => {
                    const supp = v.supplements || {};
                    const given = [
                      supp.iron && 'Iron',
                      supp.vitaminA && 'Vit A',
                      supp.deworming && 'Deworming',
                      supp.calcium && 'Calcium',
                      supp.folicAcid && 'Folic acid'
                    ].filter(Boolean);
                    return (
                      <div key={v._id} className="p-3 border border-gray-200 rounded-lg text-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-gray-900">
                            {new Date(v.visitDate).toLocaleDateString()}
                          </span>
                          <span className="text-gray-500 capitalize">{v.personType}</span>
                        </div>
                        {(v.hemoglobin != null || v.weight != null || v.bloodPressure) && (
                          <p className="text-gray-600 mt-1">
                            {[
                              v.hemoglobin != null && `HB: ${v.hemoglobin}`,
                              v.weight != null && `Wt: ${v.weight} kg`,
                              v.bloodPressure && `BP: ${v.bloodPressure}`
                            ]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        )}
                        {given.length > 0 && (
                          <p className="text-gray-600 mt-1 flex flex-wrap gap-1">
                            <span className="text-gray-500">Supplements:</span>
                            {given.map((s) => (
                              <span key={s} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {s}
                              </span>
                            ))}
                          </p>
                        )}
                        {v.remarks && <p className="text-gray-500 mt-1">{v.remarks}</p>}
                      </div>
                    );
                  })
                )}
              </div>

              {/* AI health alerts for this beneficiary */}
              <div className="border-t border-gray-200 pt-3 mt-2">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  AI health alerts for {selectedBeneficiary.name}
                </h4>
                {loadingAlerts ? (
                  <p className="text-gray-500 text-sm">Loading alerts...</p>
                ) : beneficiaryAlerts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No AI alerts for this beneficiary.</p>
                ) : (
                  <div className="space-y-2">
                    {beneficiaryAlerts.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 border border-amber-200 rounded-lg text-xs bg-amber-50"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-900">{a.title}</span>
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {a.riskLevel}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          <strong>Reason:</strong> {a.reason}
                        </p>
                        <p className="text-gray-700 mt-0.5">
                          <strong>Action:</strong> {a.action}
                        </p>
                        <p className="text-gray-500 mt-0.5">
                          {new Date(a.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryLookup;
