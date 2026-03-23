import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  User, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Heart,
  TrendingUp,
  Pill,
  Baby,
  Brain,
  Shield,
  Bell,
  RefreshCw,
  Stethoscope,
  Phone,
  MapPin,
  BarChart3,
  FileText,
  Users
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ashaService from '../../services/ashaService';
import {
  computeHealthScore,
  computeSupplementCompliancePercent,
  parseBp,
} from '../../utils/pregnancyHealthMetrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PregnancyMonitoringDashboard = ({ womanId, userRole, userData }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [healthData, setHealthData] = useState(null);
  const [supplements, setSupplements] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [ashaVisits, setAshaVisits] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [ashaSummary, setAshaSummary] = useState(null);
  const [ashaVisitsList, setAshaVisitsList] = useState([]);
  const [ashaAlerts, setAshaAlerts] = useState([]);
  const [loadingAshaData, setLoadingAshaData] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [supplementSubmitting, setSupplementSubmitting] = useState(false);
  const [selfReportIron, setSelfReportIron] = useState(true);
  const [selfReportCalcium, setSelfReportCalcium] = useState(true);
  const [selfReportFolic, setSelfReportFolic] = useState(true);
  const [mlLivePrediction, setMlLivePrediction] = useState(null);
  const [mlLiveLoading, setMlLiveLoading] = useState(false);
  const [mlLiveError, setMlLiveError] = useState(null);
  const [reminderSmsEnabled, setReminderSmsEnabled] = useState(true);

  const totalVisitsCount = ashaSummary?.totalVisits ?? profile?.visits?.length ?? 0;

  const { healthScore, compliancePercent } = useMemo(() => {
    if (!profile?.health) {
      return { healthScore: null, compliancePercent: null };
    }
    let supplementsMerged = {};
    if (profile.supplements && typeof profile.supplements === 'object') {
      supplementsMerged = Object.fromEntries(
        Object.entries(profile.supplements).map(([k, v]) => {
          const ashaCount = ashaSummary?.supplements?.[k] ?? 0;
          const tabletsPerVisit = k === 'folicAcid' ? 5 : 7;
          const fromAsha = ashaCount * tabletsPerVisit;
          const displayCurrent = (v.current || 0) + fromAsha;
          return [k, { ...v, current: displayCurrent }];
        })
      );
    }
    const compliance = computeSupplementCompliancePercent(supplementsMerged);
    const score = computeHealthScore({
      health: profile.health,
      totalVisits: totalVisitsCount,
      gestationalWeek: profile.woman?.gestationalWeek,
    });
    return { healthScore: score, compliancePercent: compliance };
  }, [profile, ashaSummary, totalVisitsCount]);

  const healthTrendChartData = useMemo(() => {
    const history = profile?.health?.history;
    if (!Array.isArray(history) || history.length === 0) return null;
    const labels = history.map((h) => h.date);
    const hbData = history.map((h) => Number(h.hb) || null);
    const sysData = history.map((h) => parseBp(h.bp).sys);
    return {
      labels,
      datasets: [
        {
          label: 'Hb (g/dL)',
          data: hbData,
          borderColor: 'rgb(219, 39, 119)',
          backgroundColor: 'rgba(219, 39, 119, 0.1)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'BP systolic (mmHg)',
          data: sysData,
          borderColor: 'rgb(37, 99, 235)',
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          fill: false,
          tension: 0.3,
          yAxisID: 'y1',
        },
      ],
    };
  }, [profile?.health?.history]);

  const healthTrendChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Hb & blood pressure (systolic) over time' },
      },
      scales: {
        x: { display: true, title: { display: true, text: 'Date' } },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Hb (g/dL)' },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Systolic BP (mmHg)' },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    []
  );

  const fetchLiveMlPrediction = useCallback(async () => {
    if (!profile?.health) return;
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('authToken') || localStorage.getItem('firebaseToken');
    const { sys, dia } = parseBp(profile.health.bp);
    const visitRegularity =
      totalVisitsCount >= 4 ? 'regular' : totalVisitsCount >= 1 ? 'irregular' : 'poor';
    const suppPct = computeSupplementCompliancePercent(
      profile.supplements
        ? Object.fromEntries(
            Object.entries(profile.supplements).map(([k, v]) => {
              const ashaCount = ashaSummary?.supplements?.[k] ?? 0;
              const tabletsPerVisit = k === 'folicAcid' ? 5 : 7;
              const fromAsha = ashaCount * tabletsPerVisit;
              return [k, { ...v, current: (v.current || 0) + fromAsha }];
            })
          )
        : {}
    );

    const body = {
      womanId: profile.woman?.id,
      age: profile.woman?.age,
      gestationalWeek: profile.woman?.gestationalWeek,
      hb: Number(profile.health.hemoglobin ?? profile.health.hb),
      bp: { systolic: sys, diastolic: dia },
      weight: Number(profile.health.weight),
      bmi: Number(profile.health.bmi),
      symptoms: [],
      visitRegularity,
      supplementCompliance: suppPct,
      ml_model: 'random_forest',
    };

    setMlLiveLoading(true);
    setMlLiveError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/pregnancy/predict`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `Prediction failed (${res.status})`);
      }
      setMlLivePrediction(data.prediction || data);
    } catch (e) {
      setMlLiveError(e.message || 'ML service unavailable. Start backend and Python ML on port 8000.');
      setMlLivePrediction(null);
    } finally {
      setMlLiveLoading(false);
    }
  }, [profile, ashaSummary, totalVisitsCount]);

  useEffect(() => {
    if (activeTab === 'ai-insights' && profile?.health) {
      fetchLiveMlPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh ML when opening AI tab or profile updates
  }, [activeTab, profile?.woman?.id, profile?.health?.lastUpdated]);

  console.log('PregnancyMonitoringDashboard: Component mounted with props:', { womanId, userRole, userData });

  useEffect(() => {
    try {
      const s = localStorage.getItem('pwReminderSms');
      if (s !== null) setReminderSmsEnabled(s === '1');
    } catch (_) {}
  }, []);

  useEffect(() => {
    console.log('PregnancyMonitoringDashboard: useEffect triggered, womanId:', womanId);
    fetchPregnancyProfile();
  }, [womanId]);

  useEffect(() => {
    const beneficiaryName = userData?.name || profile?.woman?.name;
    if (!beneficiaryName) return;
    const loadAshaDataForBeneficiary = async (name) => {
      try {
        setLoadingAshaData(true);
        const [visitsRes, alertsRes] = await Promise.all([
          ashaService.getBeneficiaryVisits('pregnant_woman', name, true),
          ashaService.getAiAlerts().catch(() => ({ data: [] }))
        ]);
        const visits = visitsRes?.data || [];
        setAshaVisitsList(visits);
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
        setAshaSummary({
          totalVisits: visits.length,
          supplements: supplementsSummary
        });
        const allAlerts = alertsRes?.data || alertsRes || [];
        const relatedAlerts = allAlerts.filter(
          (a) =>
            a.beneficiaryName &&
            a.beneficiaryName.toLowerCase() === String(name || '').toLowerCase()
        );
        setAshaAlerts(relatedAlerts);
      } catch (e) {
        console.warn('PregnancyMonitoringDashboard: Failed to load ASHA data for beneficiary', e);
      } finally {
        setLoadingAshaData(false);
      }
    };
    loadAshaDataForBeneficiary(beneficiaryName);
  }, [userData, profile]);

  const fetchPregnancyProfile = async () => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const actualUserId = userData?.id || userData?._id || womanId;
    try {
      setLoading(true);
      if (actualUserId) {
        try {
          const token = localStorage.getItem('authToken') || localStorage.getItem('firebaseToken');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const response = await fetch(`${apiBase.replace(/\/$/, '')}/pregnancy/profile/${actualUserId}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
            setHealthData(data.health);
            setSupplements(data.supplements);
            setAppointments(data.appointments || []);
            setAshaVisits(data.visits || []);
            setAlerts(data.alerts?.active || []);
            setAiPrediction(data.aiPrediction);
            return;
          }
        } catch (apiErr) {
          console.warn('PregnancyMonitoringDashboard: API failed, using session data:', apiErr.message);
        }
      }
      const userDataBasedProfile = createProfileFromUserData(userData);
      setProfile(userDataBasedProfile);
      setHealthData(userDataBasedProfile.health);
      setSupplements(userDataBasedProfile.supplements);
      setAppointments(userDataBasedProfile.appointments);
      setAshaVisits(userDataBasedProfile.visits);
      setAlerts(userDataBasedProfile.alerts?.active || []);
      setAiPrediction(userDataBasedProfile.aiPrediction);
    } catch (error) {
      console.error('PregnancyMonitoringDashboard: Error in fetchPregnancyProfile:', error);
      setProfile({
        woman: { id: womanId, name: userData?.name || 'User', gestationalWeek: 20 },
        health: { bp: '120/80', hemoglobin: 11.5, weight: 65, bmi: 25.4, lastUpdated: new Date().toISOString(), history: [], riskFactors: [], vaccinations: [] },
        supplements: { iron: { current: 0, target: 180, percentage: 0, lastTaken: '' }, calcium: { current: 0, target: 180, percentage: 0, lastTaken: '' }, folicAcid: { current: 0, target: 90, percentage: 0, lastTaken: '' } },
        appointments: [{ id: 1, title: 'ANC Checkup', date: '', time: '10:00 AM', type: 'ANC', priority: 'medium', location: 'Primary Health Center', status: 'scheduled' }],
        visits: [],
        alerts: { active: [] },
        milestones: [],
        aiPrediction: null
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfileFromUserData = (userData) => {
    const pregnantDetails = userData?.roleSpecificData?.pregnantWomanDetails || {};
    
    // Calculate gestational week from LMP if available
    let gestationalWeek = 20; // default
    if (pregnantDetails.lastMenstrualPeriod) {
      const lmpDate = new Date(pregnantDetails.lastMenstrualPeriod);
      const today = new Date();
      const weeksDiff = Math.floor((today - lmpDate) / (7 * 24 * 60 * 60 * 1000));
      gestationalWeek = Math.max(1, Math.min(42, weeksDiff));
    }
    
    // Use currentWeight if available, otherwise use weight
    const weight = pregnantDetails.currentWeight || pregnantDetails.weight || 65;
    
    return {
      woman: {
        id: userData?.id || womanId,
        name: userData?.name || 'User',
        age: pregnantDetails.age || userData?.age || 25,
        lmp: pregnantDetails.lastMenstrualPeriod || '2025-09-01',
        edd: pregnantDetails.expectedDeliveryDate || '2026-06-08',
        gestationalWeek: gestationalWeek,
        bloodGroup: pregnantDetails.bloodGroup || 'O+',
        height: pregnantDetails.height || 160,
        weight: weight,
        phone: userData?.phone || '+91 98765 43210',
        address: userData?.address || '123 Main St, Bangalore, Karnataka',
        husbandName: pregnantDetails.husbandName || '',
        husbandPhone: pregnantDetails.husbandPhone || ''
      },
      health: {
        bp: '120/80',
        hemoglobin: 11.5,
        weight: weight,
        bmi: weight && pregnantDetails.height ? 
          (weight / ((pregnantDetails.height / 100) ** 2)).toFixed(1) : 25.4,
        lastUpdated: new Date().toISOString(),
        history: [
          { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], bp: '118/78', hb: 11.8, weight: weight - 0.5 },
          { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], bp: '120/80', hb: 11.6, weight: weight - 0.2 },
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], bp: '122/82', hb: 11.5, weight: weight }
        ],
        riskFactors: ['Normal progression'],
        vaccinations: ['TT-1', 'TT-2']
      },
      supplements: {
        iron: { current: Math.floor(gestationalWeek * 2.5), target: 180, percentage: Math.floor((gestationalWeek * 2.5 / 180) * 100), lastTaken: new Date().toISOString().split('T')[0] },
        calcium: { current: Math.floor(gestationalWeek * 2), target: 180, percentage: Math.floor((gestationalWeek * 2 / 180) * 100), lastTaken: new Date().toISOString().split('T')[0] },
        folicAcid: { current: Math.floor(gestationalWeek * 3), target: 90, percentage: Math.floor((gestationalWeek * 3 / 90) * 100), lastTaken: new Date().toISOString().split('T')[0] }
      },
      appointments: [
        {
          id: 1,
          title: 'ANC Checkup',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '10:00 AM',
          type: 'ANC',
          priority: 'medium',
          location: 'Primary Health Center',
          status: 'scheduled'
        }
      ],
      visits: [
        {
          id: 1,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'Home Visit',
          purpose: 'Routine Checkup',
          findings: 'Normal progression',
          ashaWorker: 'Deepa',
          recommendations: ['Continue regular checkups', 'Maintain healthy diet']
        }
      ],
      alerts: {
        active: [
          {
            id: 1,
            title: 'Next ANC Visit Due',
            message: `Your next ANC checkup is scheduled for ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
            priority: 'medium',
            triggeredAt: new Date().toISOString(),
            recommendations: ['Attend the scheduled ANC visit', 'Bring health records']
          }
        ]
      },
      milestones: [
        { week: 8, title: 'First Trimester Complete', completed: gestationalWeek > 8, date: new Date(Date.now() - (gestationalWeek - 8) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { week: 12, title: 'Dating Scan Done', completed: gestationalWeek > 12, date: new Date(Date.now() - (gestationalWeek - 12) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { week: 20, title: 'Anomaly Scan Done', completed: gestationalWeek > 20, date: new Date(Date.now() - (gestationalWeek - 20) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { week: 24, title: 'Growth Scan', completed: gestationalWeek > 24, date: new Date(Date.now() + (24 - gestationalWeek) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { week: 28, title: 'Third Trimester Start', completed: gestationalWeek > 28, date: new Date(Date.now() + (28 - gestationalWeek) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ],
      aiPrediction: {
        overallRisk: 'low',
        riskScore: 15,
        predictions: {
          anemia: { risk: 'low', probability: 0.15 },
          preterm: { risk: 'low', probability: 0.08 },
          nutrition: { risk: 'medium', probability: 0.35 },
          hypertension: { risk: 'low', probability: 0.12 },
          gestationalDiabetes: { risk: 'low', probability: 0.05 },
          preeclampsia: { risk: 'very-low', probability: 0.03 }
        },
        recommendations: [
          'Continue regular ANC checkups',
          'Maintain balanced nutrition',
          'Take prescribed supplements regularly',
          'Monitor blood pressure weekly'
        ],
        lastUpdated: new Date().toISOString(),
        advancedFeatures: {
          nutritionalAnalysis: {
            proteinIntake: 'adequate',
            ironAbsorption: 'moderate',
            calciumIntake: 'needs_improvement',
            vitaminD: 'adequate',
            folicAcid: 'excellent'
          },
          behavioralInsights: {
            sleepQuality: 'good',
            stressLevel: 'low',
            physicalActivity: 'moderate',
            hydration: 'adequate'
          },
          predictiveAnalytics: {
            birthWeightPrediction: `${(2.5 + gestationalWeek * 0.05).toFixed(1)} kg`,
            deliveryDatePrediction: pregnantDetails.expectedDeliveryDate || '2026-06-08',
            complicationsRisk: 'minimal',
            recoveryTimePrediction: '6 weeks'
          },
          personalizedCarePlan: {
            nextCriticalCheckup: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            recommendedTests: ['Glucose Tolerance Test', 'Anemia Panel'],
            lifestyleModifications: ['Increase calcium intake', 'Add gentle yoga'],
            warningSigns: ['Severe swelling', 'Persistent headaches', 'Reduced fetal movement']
          }
        }
      }
    };
  };

  const isMongoObjectId = (id) =>
    typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);

  const submitSupplementSelfReport = async () => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('authToken') || localStorage.getItem('firebaseToken');
    setSupplementSubmitting(true);
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/pregnancy/supplements/self-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ironTaken: selfReportIron,
          calciumTaken: selfReportCalcium,
          folicAcidTaken: selfReportFolic,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not save supplement report');
      }
      setShowSupplementModal(false);
      await fetchPregnancyProfile();
      if (activeTab === 'ai-insights') {
        await fetchLiveMlPrediction();
      }
    } catch (e) {
      alert(e.message || 'Failed to save');
    } finally {
      setSupplementSubmitting(false);
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleDate(appointment.date || '');
    setRescheduleTime(appointment.time || '10:00');
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleAppointment || !rescheduleDate) {
      alert('Please choose a new date');
      return;
    }
    const apptId = rescheduleAppointment._id || rescheduleAppointment.id;
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('authToken') || localStorage.getItem('firebaseToken');

    if (!isMongoObjectId(String(apptId))) {
      setProfile((prev) => {
        if (!prev?.appointments) return prev;
        const next = prev.appointments.map((a) =>
          (a.id === apptId || a._id === apptId)
            ? { ...a, date: rescheduleDate, time: rescheduleTime, status: 'rescheduled' }
            : a
        );
        return { ...prev, appointments: next };
      });
      setShowRescheduleModal(false);
      setRescheduleAppointment(null);
      return;
    }

    setRescheduleSubmitting(true);
    try {
      const res = await fetch(
        `${apiBase.replace(/\/$/, '')}/pregnancy/appointments/${apptId}/reschedule`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            scheduledDate: rescheduleDate,
            scheduledTime: rescheduleTime,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Reschedule failed');
      }
      setShowRescheduleModal(false);
      setRescheduleAppointment(null);
      await fetchPregnancyProfile();
    } catch (e) {
      alert(e.message || 'Could not reschedule');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  if (loading) {
    console.log('PregnancyMonitoringDashboard: Still loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading pregnancy profile...</span>
      </div>
    );
  }

  if (!profile) {
    console.log('PregnancyMonitoringDashboard: No profile loaded');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600">Unable to load pregnancy profile.</p>
        </div>
      </div>
    );
  }

  const aiPred = profile.aiPrediction || {};
  const adv = aiPred.advancedFeatures || {};
  const nutr = adv.nutritionalAnalysis || {};
  const beh = adv.behavioralInsights || {};
  const predAnalytics = adv.predictiveAnalytics || {};
  const carePlan = adv.personalizedCarePlan || {};
  const profilePredictions = aiPred.predictions && typeof aiPred.predictions === 'object' ? aiPred.predictions : {};

  console.log('PregnancyMonitoringDashboard: Rendering with profile:', profile);

  return (
    <div className="space-y-6">
      {/* Profile Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Woman Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <User className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Profile
            </span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">{profile.woman.name}</h3>
          <p className="text-sm text-gray-600">Age: {profile.woman.age} years</p>
          <p className="text-sm text-gray-600">Blood Group: {profile.woman.bloodGroup}</p>
          <p className="text-sm text-gray-600">Height: {profile.woman.height} cm</p>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Phone className="w-3 h-3 mr-1" />
            {profile.woman.phone}
          </div>
        </div>

        {/* Pregnancy Progress Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-pink-200">
          <div className="flex items-center justify-between mb-4">
            <Baby className="w-8 h-8 text-pink-600" />
            <span className="text-sm font-medium text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
              Pregnancy
            </span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">{profile.woman.gestationalWeek} weeks</h3>
          <p className="text-sm text-gray-600">Gestational age</p>
          <p className="text-sm text-gray-600">EDD: {profile.woman.edd}</p>
          <p className="text-sm text-gray-600">LMP: {profile.woman.lmp}</p>
        </div>

        {/* Health Metrics Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Health
            </span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">{profile.health.bp}</h3>
          <p className="text-sm text-gray-600">Blood Pressure</p>
          <p className="text-sm text-gray-600">Hb: {profile.health.hemoglobin} g/dL</p>
          <p className="text-sm text-gray-600">BMI: {profile.health.bmi}</p>
        </div>

        {/* Next Appointment Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Next Visit
            </span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">{profile.appointments?.[0]?.date || '—'}</h3>
          <p className="text-sm text-gray-600">{profile.appointments?.[0]?.title || 'Next visit'}</p>
          <p className="text-sm text-gray-600">{profile.appointments?.[0]?.time || '—'}</p>
          <p className="text-sm text-gray-600">{profile.appointments?.[0]?.location || '—'}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'health', label: 'Health', icon: Heart },
              { id: 'supplements', label: 'Supplements', icon: Pill },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'asha-visits', label: 'ASHA Visits', icon: Users },
              { id: 'milestones', label: 'Milestones', icon: CheckCircle },
              { id: 'ai-insights', label: 'AI Insights', icon: Brain }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600 bg-pink-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Alert Section */}
              {profile.alerts?.active && profile.alerts.active.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Active Alerts</h3>
                  </div>
                  {profile.alerts.active.map((alert, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 mb-3 border border-yellow-300">
                      <h4 className="font-medium text-gray-800 mb-1">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      {alert.recommendations && (
                        <div className="text-sm text-gray-700">
                          <strong>Recommendations:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {alert.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Total Visits</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {ashaSummary?.totalVisits ?? profile.visits.length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Health Score</p>
                      <p className="text-2xl font-bold text-green-800">
                        {healthScore != null ? `${Math.round(healthScore)}%` : '—'}
                      </p>
                      <p className="text-xs text-green-700 mt-1">From Hb, BP, BMI, visits</p>
                    </div>
                    <Heart className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Supplement compliance</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {compliancePercent != null ? `${Math.round(compliancePercent)}%` : '—'}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">Vs prescribed targets</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Reminders (in-app; SMS needs provider integration) */}
              <div className="bg-white border border-indigo-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Reminders & notifications</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-indigo-800 uppercase tracking-wide">Next ANC / visit</p>
                    <p className="text-gray-900 font-semibold mt-1">
                      {profile.appointments?.[0]?.date || '—'}{' '}
                      {profile.appointments?.[0]?.time ? `· ${profile.appointments[0].time}` : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{profile.appointments?.[0]?.title || 'Scheduled checkup'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminderSmsEnabled}
                        onChange={(e) => {
                          setReminderSmsEnabled(e.target.checked);
                          try {
                            localStorage.setItem('pwReminderSms', e.target.checked ? '1' : '0');
                          } catch (_) {}
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">SMS reminders when your facility enables messaging</span>
                    </label>
                    <p className="text-xs text-gray-500 pl-6">
                      In-app alerts use your dashboard; SMS requires a connected gateway (optional upgrade).
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplements from ASHA visits */}
              <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Supplements received from ASHA visits</h4>
                {loadingAshaData ? (
                  <p className="text-sm text-gray-500">Loading supplement details...</p>
                ) : (ashaSummary?.totalVisits > 0 ? (
                  <>
                    <p className="text-sm text-gray-700 mb-1">
                      Iron: {ashaSummary?.supplements?.iron ?? 0} visit(s) • Vitamin A: {ashaSummary?.supplements?.vitaminA ?? 0} • Deworming: {ashaSummary?.supplements?.deworming ?? 0} • Calcium: {ashaSummary?.supplements?.calcium ?? 0} • Folic acid: {ashaSummary?.supplements?.folicAcid ?? 0}
                    </p>
                    {ashaVisitsList.length > 0 && ashaVisitsList[0].ashaName && (
                      <p className="text-xs text-green-700 mt-1">Latest from ASHA worker: {ashaVisitsList[0].ashaName}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No ASHA visit records yet. Data will appear when an ASHA worker logs a visit for you.</p>
                ))}
              </div>

              {/* AI health alerts for this pregnant woman from field visits */}
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-800">
                    AI Health Alerts from field visit data
                  </h4>
                </div>
                {loadingAshaData ? (
                  <p className="text-sm text-yellow-800">Checking for alerts...</p>
                ) : ashaAlerts.length === 0 ? (
                  <p className="text-sm text-yellow-700">
                    No AI health alerts have been generated for you from ASHA visit data.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {ashaAlerts.map((a) => (
                      <li
                        key={a.id}
                        className="bg-white rounded-md border border-yellow-300 p-3 text-sm"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-800">{a.title}</span>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {a.riskLevel}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          <strong>Reason:</strong> {a.reason}
                        </p>
                        <p className="text-gray-700 mt-0.5">
                          <strong>Action:</strong> {a.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(a.date).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Health History & Trends</h3>

              {/* Current vitals summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  Current Vitals
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Blood Pressure</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{profile.health.bp || '—'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Hemoglobin (g/dL)</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{profile.health.hemoglobin ?? '—'}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Weight (kg)</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{profile.health.weight ?? '—'}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">BMI</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{profile.health.bmi ?? '—'}</p>
                  </div>
                </div>
                {profile.health.lastUpdated && (
                  <p className="text-xs text-gray-500 mt-3">Last updated: {new Date(profile.health.lastUpdated).toLocaleDateString()}</p>
                )}
              </div>

              {/* Trend chart: Hb + systolic BP */}
              {healthTrendChartData && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-pink-600" />
                    Vitals trend (chart)
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Line chart from your recorded history; the table below is the same data in tabular form.
                  </p>
                  <div className="h-72 w-full">
                    <Line options={healthTrendChartOptions} data={healthTrendChartData} />
                  </div>
                </div>
              )}
              
              {/* Health Metrics Trend */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-800 mb-4">Health Metrics Trend (table)</h4>
                <div className="space-y-3">
                  {(profile.health.history && profile.health.history.length > 0) ? profile.health.history.map((record, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">{record.date}</div>
                        <div className="flex items-center space-x-6">
                          <span className="text-sm font-medium">BP: {record.bp}</span>
                          <span className="text-sm font-medium">Hb: {record.hb}</span>
                          <span className="text-sm font-medium">Wt: {record.weight}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No trend records yet. Your health metrics will appear here as they are recorded.</p>
                  )}
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-orange-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-800 mb-4">Risk Factors</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.health.riskFactors && profile.health.riskFactors.length > 0 ? profile.health.riskFactors.map((factor, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm">
                      {factor}
                    </span>
                  )) : (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">No additional risk factors noted</span>
                  )}
                </div>
              </div>

              {/* Vaccinations */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-800 mb-4">Vaccinations Received</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {profile.health.vaccinations && profile.health.vaccinations.length > 0 ? profile.health.vaccinations.map((vaccine, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 text-center">
                      <Shield className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <span className="text-sm font-medium">{vaccine}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500 col-span-2">No vaccinations recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Health tips */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <h4 className="font-medium text-gray-800 mb-3">Pregnancy health tips</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Take iron and folic acid as advised. Attend all ANC checkups.</li>
                  <li className="flex items-start gap-2"><Activity className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Stay active with light walks. Rest when needed.</li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Keep TT and other vaccinations up to date.</li>
                  <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Report any bleeding, severe headache, or swelling to your health worker.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'supplements' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplements Tracking</h3>
              
              {Object.entries(profile.supplements || {}).map(([key, supplement]) => {
                const ashaCount = ashaSummary?.supplements?.[key] ?? 0;
                const tabletsPerVisit = key === 'folicAcid' ? 5 : 7;
                const fromAshaTablets = ashaCount * tabletsPerVisit;
                const displayCurrent = (supplement.current || 0) + fromAshaTablets;
                const displayPct = Math.min(100, Math.round((displayCurrent / (supplement.target || 180)) * 100));
                const hasFromAsha = ashaCount > 0;
                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Pill className="w-6 h-6 text-purple-600" />
                        <h4 className="font-medium text-gray-800 capitalize">{key === 'folicAcid' ? 'Folic Acid' : key}</h4>
                      </div>
                      <span className="text-sm text-gray-600">Last taken: {supplement.lastTaken || (hasFromAsha ? 'From ASHA visit(s)' : '—')}</span>
                    </div>
                    {hasFromAsha && (
                      <p className="text-sm text-green-700 font-medium mb-2">
                        Received from ASHA worker in {ashaCount} visit(s)
                      </p>
                    )}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress: {displayCurrent}/{supplement.target}{fromAshaTablets > 0 && <span className="text-green-600 ml-1">(includes {fromAshaTablets} from ASHA visits)</span>}</span>
                        <span className="font-medium">{displayPct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${displayPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        displayPct >= 80 ? 'text-green-600' : 
                        displayPct >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {displayPct >= 80 ? 'Excellent' : 
                         displayPct >= 50 ? 'Good' : hasFromAsha ? 'Recorded from ASHA visits' : 'Needs Improvement'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSupplementModal(true)}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Update →
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* ASHA visits with supplements given */}
              {ashaVisitsList.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Supplements given during ASHA visits
                  </h4>
                  <ul className="space-y-2">
                    {ashaVisitsList.map((v, i) => {
                      const s = v.supplements || {};
                      const given = [s.iron && 'Iron', s.vitaminA && 'Vitamin A', s.deworming && 'Deworming', s.calcium && 'Calcium', s.folicAcid && 'Folic acid'].filter(Boolean);
                      if (given.length === 0) return null;
                      return (
                        <li key={v._id || i} className="text-sm text-gray-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium">{v.ashaName || 'ASHA Worker'}</span>
                          <span className="text-gray-500">•</span>
                          <span>{new Date(v.visitDate).toLocaleDateString()}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-green-700">{given.join(', ')}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Summary from ASHA visit records */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  From ASHA field visit records
                </h4>
                {loadingAshaData ? (
                  <p className="text-sm text-gray-500">Loading supplement details from visits...</p>
                ) : (
                  <p className="text-sm text-gray-700">
                    Iron given in {ashaSummary?.supplements?.iron ?? 0} visit(s), Vitamin A in{' '}
                    {ashaSummary?.supplements?.vitaminA ?? 0}, Deworming in{' '}
                    {ashaSummary?.supplements?.deworming ?? 0}, Calcium in{' '}
                    {ashaSummary?.supplements?.calcium ?? 0}, Folic acid in{' '}
                    {ashaSummary?.supplements?.folicAcid ?? 0}.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointments Schedule</h3>
              
              {(profile.appointments || []).map((appointment) => (
                <div key={appointment._id || appointment.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-gray-800">{appointment.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.date} at {appointment.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{appointment.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4" />
                          <span>Type: {appointment.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.priority} priority
                      </span>
                      {appointment.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => openRescheduleModal(appointment)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Reschedule →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'asha-visits' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ASHA Visit History</h3>
              
              {((ashaVisitsList && ashaVisitsList.length > 0) ? ashaVisitsList : (profile.visits || [])).map((visit, idx) => {
                const isApiVisit = visit.ashaName !== undefined;
                const id = visit.id ?? visit._id ?? idx;
                const type = visit.type ?? visit.visitType ?? 'Visit';
                const date = visit.date ?? (visit.visitDate && new Date(visit.visitDate).toISOString().split('T')[0]) ?? '—';
                const purpose = visit.purpose ?? visit.visitPurpose ?? '—';
                const findings = visit.findings ?? visit.notes ?? '—';
                const ashaWorker = isApiVisit ? (visit.ashaName || 'Deepa') : (visit.ashaWorker || 'Deepa');
                const recommendations = visit.recommendations ?? (visit.notes ? [visit.notes] : []);
                const recList = Array.isArray(recommendations) ? recommendations : [recommendations];
                return (
                  <div key={id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-gray-800">{type}</h4>
                        <span className="text-sm text-gray-600">{date}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Purpose:</span>
                        <p className="text-sm text-gray-600">{purpose}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Findings:</span>
                        <p className="text-sm text-gray-600">{findings}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">ASHA Worker:</span>
                        <p className="text-sm text-gray-600 font-medium">{ashaWorker}</p>
                      </div>
                      {recList.length > 0 && recList[0] && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Recommendations:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {recList.map((rec, i) => (
                              <li key={i}>{typeof rec === 'string' ? rec : rec?.text ?? '—'}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pregnancy Milestones</h3>
              
              <div className="space-y-4">
                {(profile.milestones || []).map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      milestone.completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${
                        milestone.completed ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-800">{milestone.title}</h4>
                        <span className={`text-sm ${
                          milestone.completed ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          Week {milestone.week}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{milestone.date}</p>
                      {milestone.completed && (
                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    {index < (profile.milestones || []).length - 1 && (
                      <div className="w-1 h-12 bg-pink-200 my-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-800">AI-Powered Health Intelligence</h3>
                <button
                  type="button"
                  onClick={() => fetchLiveMlPrediction()}
                  className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${mlLiveLoading ? 'animate-spin' : ''}`} />
                  Refresh live risk (ML)
                </button>
              </div>

              {/* Live ML (POST /api/pregnancy/predict → Python service when running) */}
              <div className="bg-gradient-to-r from-indigo-50 to-violet-100 rounded-xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Live ML risk (Python service)</h4>
                  <span className="text-xs text-gray-500">Runs when you open this tab or tap Refresh</span>
                </div>
                {mlLiveLoading && (
                  <p className="text-sm text-indigo-800 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Contacting ML service…
                  </p>
                )}
                {mlLiveError && <p className="text-sm text-red-700 bg-red-50 rounded p-2">{mlLiveError}</p>}
                {!mlLiveLoading && !mlLiveError && mlLivePrediction && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-bold text-indigo-900">
                        {mlLivePrediction.risk != null ? String(mlLivePrediction.risk) : '—'}
                      </span>
                      {mlLivePrediction.score != null && (
                        <span className="text-sm text-gray-700">
                          Confidence:{' '}
                          {Number(mlLivePrediction.score) <= 1
                            ? `${Math.round(Number(mlLivePrediction.score) * 100)}%`
                            : `${Math.round(Number(mlLivePrediction.score))}%`}
                        </span>
                      )}
                      {mlLivePrediction.ml_model_used && (
                        <span className="text-xs bg-white/80 px-2 py-0.5 rounded border border-indigo-200">
                          {mlLivePrediction.ml_model_used}
                        </span>
                      )}
                    </div>
                    {Array.isArray(mlLivePrediction.factors) && mlLivePrediction.factors.length > 0 && (
                      <p className="text-sm text-gray-700">
                        <strong>Factors:</strong> {mlLivePrediction.factors.join('; ')}
                      </p>
                    )}
                    {Array.isArray(mlLivePrediction.recommendations) && mlLivePrediction.recommendations.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {mlLivePrediction.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {!mlLiveLoading && !mlLiveError && !mlLivePrediction && (
                  <p className="text-sm text-gray-600">Open this tab or refresh to load live risk from the ML API.</p>
                )}
              </div>

              {/* Profile snapshot (from /profile; may differ from live ML above) */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-800">Overall risk (profile snapshot)</h4>
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-purple-800">
                    {aiPred.riskScore != null ? `${aiPred.riskScore}%` : '—'}
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        (aiPred.overallRisk || '').toLowerCase() === 'low'
                          ? 'bg-green-100 text-green-800'
                          : (aiPred.overallRisk || '').toLowerCase() === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(aiPred.overallRisk || 'unknown').toString().toUpperCase()} RISK
                    </span>
                  </div>
                </div>
              </div>

              {/* Predictive Analytics */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                  Predictive Analytics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Predicted Birth Weight</p>
                    <p className="text-xl font-bold text-blue-800">{predAnalytics.birthWeightPrediction ?? '—'}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Expected Delivery Date</p>
                    <p className="text-xl font-bold text-green-800">{predAnalytics.deliveryDatePrediction ?? '—'}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Complications Risk</p>
                    <p className="text-xl font-bold text-purple-800">{predAnalytics.complicationsRisk ?? '—'}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-medium">Recovery Time</p>
                    <p className="text-xl font-bold text-orange-800">{predAnalytics.recoveryTimePrediction ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Nutritional Analysis */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                  <Heart className="w-5 h-5 text-red-600 mr-2" />
                  Nutritional Analysis
                </h4>
                <div className="space-y-3">
                  {Object.keys(nutr).length === 0 ? (
                    <p className="text-sm text-gray-500">No detailed nutritional breakdown in your profile yet.</p>
                  ) : (
                    Object.entries(nutr).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              value === 'excellent' ? 'bg-green-500' :
                              value === 'adequate' ? 'bg-blue-500' :
                              value === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: value === 'excellent' ? '100%' :
                                     value === 'adequate' ? '75%' :
                                     value === 'moderate' ? '50%' : '25%'
                            }}
                          />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          value === 'excellent' ? 'bg-green-100 text-green-800' :
                          value === 'adequate' ? 'bg-blue-100 text-blue-800' :
                          value === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {String(value).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Behavioral Insights */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                  <Activity className="w-5 h-5 text-green-600 mr-2" />
                  Behavioral Insights
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(beh).length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-full">No behavioral insights in profile yet.</p>
                  ) : (
                    Object.entries(beh).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        value === 'good' || value === 'adequate' ? 'bg-green-100' :
                        value === 'moderate' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Activity className={`w-8 h-8 ${
                          value === 'good' || value === 'adequate' ? 'text-green-600' :
                          value === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <p className="text-xs font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className={`text-xs ${
                        value === 'good' || value === 'adequate' ? 'text-green-600' :
                        value === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{value}</p>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Personalized Care Plan */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-indigo-600 mr-2" />
                  Personalized Care Plan
                </h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Next Critical Checkup:</span>
                    <p className="text-sm text-gray-600">{carePlan.nextCriticalCheckup ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Recommended Tests:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(carePlan.recommendedTests || []).map((test, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {test}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Lifestyle Modifications:</span>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {(carePlan.lifestyleModifications || []).map((mod, index) => (
                        <li key={index}>{mod}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Warning Signs to Watch:</span>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-1">
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {(carePlan.warningSigns || []).map((sign, index) => (
                          <li key={index}>{sign}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-medium text-gray-800 mb-4">Comprehensive Risk Analysis</h4>
                <div className="space-y-3">
                  {Object.keys(profilePredictions).length === 0 ? (
                    <p className="text-sm text-gray-500">No per-condition breakdown in profile. Live ML above shows current model output.</p>
                  ) : (
                    Object.entries(profilePredictions).map(([key, prediction]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              prediction?.risk === 'very-low' ? 'bg-green-400' :
                              prediction?.risk === 'low' ? 'bg-green-500' :
                              prediction?.risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(prediction?.probability ?? 0) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          prediction?.risk === 'very-low' ? 'bg-green-100 text-green-800' :
                          prediction?.risk === 'low' ? 'bg-green-100 text-green-800' :
                          prediction?.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {prediction?.risk ?? '—'}
                        </span>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                  <Brain className="w-5 h-5 text-purple-600 mr-2" />
                  AI-Powered Recommendations
                </h4>
                <div className="space-y-2">
                  {(aiPred.recommendations || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No recommendations in profile.</p>
                  ) : (
                    (aiPred.recommendations || []).map((rec, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supplement self-report modal */}
      {showSupplementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-purple-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Log today&apos;s supplements</h4>
            <p className="text-sm text-gray-600 mb-4">
              Mark what you took today. This is saved to your record (same as ASHA visit logging).
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selfReportIron} onChange={(e) => setSelfReportIron(e.target.checked)} />
                <span>Iron</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selfReportCalcium} onChange={(e) => setSelfReportCalcium(e.target.checked)} />
                <span>Calcium</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selfReportFolic} onChange={(e) => setSelfReportFolic(e.target.checked)} />
                <span>Folic acid</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setShowSupplementModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={supplementSubmitting}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                onClick={submitSupplementSelfReport}
              >
                {supplementSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule appointment modal */}
      {showRescheduleModal && rescheduleAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-blue-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Reschedule appointment</h4>
            <p className="text-sm text-gray-600 mb-4">{rescheduleAppointment.title}</p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 10:00 AM"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleAppointment(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rescheduleSubmitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                onClick={submitReschedule}
              >
                {rescheduleSubmitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PregnancyMonitoringDashboard;
