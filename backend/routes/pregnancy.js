const express = require('express');
const axios = require('axios');
const router = express.Router();
const { verifyFlexibleAuth } = require('../middleware/auth');
const PregnancyHealthLog = require('../models/PregnancyHealthLog');
const SupplementTracking = require('../models/SupplementTracking');
const Appointment = require('../models/Appointment');
const ASHAVisit = require('../models/ASHAVisit');
const Alert = require('../models/Alert');
const Woman = require('../models/PregnantWoman');
const User = require('../models/User');

// Helper function to calculate gestational weeks
const calculateGestationalWeeks = (lmp) => {
  if (!lmp) return null;
  const today = new Date();
  const lmpDate = new Date(lmp);
  const diffTime = today - lmpDate;
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
};

// Helper function to calculate EDD
const calculateEDD = (lmp) => {
  if (!lmp) return null;
  const lmpDate = new Date(lmp);
  const edd = new Date(lmpDate);
  edd.setDate(edd.getDate() + 280); // 280 days = 40 weeks
  return edd;
};

// Helper function to calculate days remaining
const calculateDaysRemaining = (lmp) => {
  if (!lmp) return null;
  const edd = calculateEDD(lmp);
  const today = new Date();
  const diffTime = edd - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// GET /api/pregnancy/profile/:id - Get complete pregnancy profile
router.get('/profile/:id', async (req, res) => {
  try {
    const womanId = req.params.id;
    console.log('🔍 Looking for PregnantWoman with womanId:', womanId);
    
    // Handle demo case
    if (womanId === 'demo-woman-id') {
      const demoProfile = {
        woman: {
          id: 'demo-woman-id',
          name: 'Demo User',
          age: 25,
          lmp: '2024-09-01',
          edd: '2025-06-08',
          gestationalWeek: 21,
          bloodGroup: 'O+',
          height: 160,
          weight: 65
        },
        health: {
          bp: '120/80',
          hemoglobin: 11.5,
          weight: 65,
          bmi: 25.4,
          lastUpdated: new Date().toISOString()
        },
        supplements: {
          iron: { current: 45, target: 180, percentage: 25 },
          calcium: { current: 30, target: 180, percentage: 17 },
          folicAcid: { current: 60, target: 90, percentage: 67 }
        },
        appointments: [
          {
            id: 1,
            title: 'ANC Checkup',
            date: '2025-02-15',
            time: '10:00 AM',
            type: 'ANC',
            priority: 'medium',
            location: 'Primary Health Center'
          }
        ],
        visits: [
          {
            id: 1,
            date: '2025-01-20',
            type: 'Home Visit',
            purpose: 'Routine Checkup',
            findings: 'Normal progression',
            ashaWorker: 'Lakshmi K.'
          }
        ],
        alerts: {
          active: [
            {
              id: 1,
              title: 'Next ANC Visit Due',
              message: 'Your next ANC checkup is scheduled for February 15th',
              priority: 'medium',
              triggeredAt: new Date().toISOString(),
              recommendations: ['Attend the scheduled ANC visit', 'Bring health records']
            }
          ]
        }
      };
      
      return res.json(demoProfile);
    }
    
    // First try to find PregnantWoman by userId (for newly registered users)
    console.log('🔍 Searching by userId...');
    console.log('🔍 Woman model:', Woman.modelName);
    console.log('🔍 Woman collection:', Woman.collection.name);
    
    // Convert string ID to ObjectId for proper comparison
    const mongoose = require('mongoose');
    const userIdObjectId = mongoose.Types.ObjectId.isValid(womanId) ? new mongoose.Types.ObjectId(womanId) : womanId;
    
    let woman = await Woman.findOne({ userId: userIdObjectId });
    console.log('📊 Found by userId:', woman ? 'YES' : 'NO');
    if (woman) {
      console.log('📋 Woman details:', { name: woman.name, id: woman._id, userId: woman.userId });
    } else {
      // Try to see if there are any records at all
      const allWomen = await Woman.find({});
      console.log('📊 Total women in collection:', allWomen.length);
      if (allWomen.length > 0) {
        console.log('📋 First woman record:', { name: allWomen[0].name, id: allWomen[0]._id, userId: allWomen[0].userId });
      }
    }
    
    // If not found, try direct ID lookup (for existing records)
    if (!woman) {
      console.log('🔍 Searching by direct ID...');
      woman = await Woman.findById(womanId);
      console.log('📊 Found by direct ID:', woman ? 'YES' : 'NO');
      if (woman) {
        console.log('📋 Woman details:', { name: woman.name, id: woman._id, userId: woman.userId });
      }
    }
    
    if (!woman) {
      console.log('❌ Woman not found for ID:', womanId);
      return res.status(404).json({ message: 'Woman not found' });
    }

    const pwId = woman._id.toString();
    const lmp = woman.lastMenstrualPeriod || woman.lmp;
    const gestationalWeeks = calculateGestationalWeeks(lmp);
    const edd = calculateEDD(lmp);
    const daysRemaining = calculateDaysRemaining(lmp);

    // Use PregnantWoman _id for related collections (health logs, visits, etc.)
    const latestHealthLog = await PregnancyHealthLog.getLatestByWoman(pwId);
    const latestSupplements = await SupplementTracking.getLatestByWoman(pwId);
    const upcomingAppointments = await Appointment.getUpcomingByWoman(pwId);
    const latestASHAVisit = await ASHAVisit.getLatestByWoman(pwId);
    const activeAlerts = await Alert.getActiveAlerts(pwId);

    const fullAddress = woman.address ? [
      woman.address.street,
      woman.address.village,
      woman.address.block,
      woman.address.district,
      woman.address.state,
      woman.address.pincode
    ].filter(Boolean).join(', ') : '';

    const bpStr = latestHealthLog && latestHealthLog.bp
      ? `${latestHealthLog.bp.systolic || 0}/${latestHealthLog.bp.diastolic || 0}`
      : '120/80';
    const gestationalWeek = gestationalWeeks != null ? gestationalWeeks : (woman.gestationalAge != null ? woman.gestationalAge : 20);

    const profile = {
      woman: {
        id: woman._id,
        name: woman.name,
        age: woman.age,
        lmp: lmp ? (typeof lmp.toISOString === 'function' ? lmp.toISOString().split('T')[0] : lmp) : '',
        edd: edd ? (typeof edd.toISOString === 'function' ? edd.toISOString().split('T')[0] : edd) : '',
        gestationalWeek,
        bloodGroup: woman.bloodGroup || 'O+',
        height: woman.height || 160,
        weight: woman.currentWeight || woman.prePregnancyWeight || 65,
        phone: woman.phone || '',
        address: fullAddress || woman.address,
        husbandName: woman.husbandName || '',
        husbandPhone: woman.husbandPhone || ''
      },
      health: {
        bp: bpStr,
        hemoglobin: latestHealthLog ? (latestHealthLog.hb || 11.5) : 11.5,
        weight: woman.currentWeight || woman.prePregnancyWeight || 65,
        bmi: latestHealthLog ? (latestHealthLog.bmi || 25) : 25,
        lastUpdated: latestHealthLog && latestHealthLog.date ? latestHealthLog.date : new Date().toISOString(),
        history: [],
        riskFactors: ['Normal progression'],
        vaccinations: woman.vaccinations && woman.vaccinations.length ? woman.vaccinations.map(v => v.vaccineName) : ['TT-1', 'TT-2']
      },
      supplements: {
        iron: latestSupplements && latestSupplements.iron != null ? { current: latestSupplements.iron, target: 180, percentage: Math.min(100, Math.floor((latestSupplements.iron / 180) * 100)), lastTaken: new Date().toISOString().split('T')[0] } : { current: 0, target: 180, percentage: 0, lastTaken: new Date().toISOString().split('T')[0] },
        calcium: latestSupplements && latestSupplements.calcium != null ? { current: latestSupplements.calcium, target: 180, percentage: Math.min(100, Math.floor((latestSupplements.calcium / 180) * 100)), lastTaken: new Date().toISOString().split('T')[0] } : { current: 0, target: 180, percentage: 0, lastTaken: new Date().toISOString().split('T')[0] },
        folicAcid: latestSupplements && latestSupplements.folicAcid != null ? { current: latestSupplements.folicAcid, target: 90, percentage: Math.min(100, Math.floor((latestSupplements.folicAcid / 90) * 100)), lastTaken: new Date().toISOString().split('T')[0] } : { current: 0, target: 90, percentage: 0, lastTaken: new Date().toISOString().split('T')[0] }
      },
      appointments: Array.isArray(upcomingAppointments) && upcomingAppointments.length
        ? upcomingAppointments.map((a, i) => {
            const sched = a.scheduledDate || a.date;
            return {
            id: a._id || i + 1,
            title: a.title || 'ANC Checkup',
            date: sched ? (typeof sched.toISOString === 'function' ? sched.toISOString().split('T')[0] : sched) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: a.scheduledTime || a.time || '10:00 AM',
            type: a.type || 'ANC',
            priority: a.priority || 'medium',
            location: typeof a.location === 'string' ? a.location : (a.locationDetails || 'Primary Health Center'),
            status: a.status || 'scheduled'
          }; })
        : [{ id: 1, title: 'ANC Checkup', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '10:00 AM', type: 'ANC', priority: 'medium', location: 'Primary Health Center', status: 'scheduled' }],
      visits: latestASHAVisit
        ? [{ id: 1, date: latestASHAVisit.visitDate ? (typeof latestASHAVisit.visitDate.toISOString === 'function' ? latestASHAVisit.visitDate.toISOString().split('T')[0] : latestASHAVisit.visitDate) : new Date().toISOString().split('T')[0], type: latestASHAVisit.visitType || 'Home Visit', purpose: latestASHAVisit.purpose || 'Routine Checkup', findings: latestASHAVisit.findings || 'Normal progression', ashaWorker: latestASHAVisit.visitedBy || 'ASHA Worker', recommendations: latestASHAVisit.recommendations || [] }]
        : [{ id: 1, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], type: 'Home Visit', purpose: 'Routine Checkup', findings: 'Normal progression', ashaWorker: 'ASHA Worker', recommendations: ['Continue regular checkups'] }],
      alerts: {
        active: Array.isArray(activeAlerts) ? activeAlerts.map(a => ({ id: a._id, title: a.title, message: a.message, priority: a.priority || 'medium', triggeredAt: a.triggeredAt, recommendations: a.recommendations || [] })) : []
      },
      milestones: [
        { week: 8, title: 'First Trimester Complete', completed: gestationalWeek > 8, date: '' },
        { week: 12, title: 'Dating Scan Done', completed: gestationalWeek > 12, date: '' },
        { week: 20, title: 'Anomaly Scan Done', completed: gestationalWeek > 20, date: '' },
        { week: 24, title: 'Growth Scan', completed: gestationalWeek > 24, date: '' },
        { week: 28, title: 'Third Trimester Start', completed: gestationalWeek > 28, date: '' }
      ],
      aiPrediction: {
        overallRisk: 'low',
        riskScore: 15,
        predictions: {},
        recommendations: ['Continue regular ANC checkups', 'Maintain balanced nutrition', 'Take prescribed supplements regularly'],
        lastUpdated: new Date().toISOString(),
        advancedFeatures: {
          nutritionalAnalysis: {},
          behavioralInsights: {},
          predictiveAnalytics: {
            birthWeightPrediction: `${(2.5 + gestationalWeek * 0.05).toFixed(1)} kg`,
            deliveryDatePrediction: edd ? (typeof edd.toISOString === 'function' ? edd.toISOString().split('T')[0] : edd) : '',
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

    res.json(profile);
  } catch (error) {
    console.error('Error fetching pregnancy profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/health/latest/:id - Get latest health metrics
router.get('/health/latest/:id', async (req, res) => {
  try {
    const womanId = req.params.id;
    const latestLog = await PregnancyHealthLog.getLatestByWoman(womanId);
    
    if (!latestLog) {
      return res.status(404).json({ message: 'No health records found' });
    }

    // Get previous 5 records for trend analysis
    const history = await PregnancyHealthLog.getHealthTrends(womanId, 30);
    
    // Calculate trends
    const trends = {
      bp: history.map(log => ({ 
        date: log.date, 
        systolic: log.bp.systolic, 
        diastolic: log.bp.diastolic 
      })),
      hb: history.map(log => ({ date: log.date, value: log.hb })),
      weight: history.map(log => ({ date: log.date, value: log.weight })),
      bmi: history.map(log => ({ date: log.date, value: log.bmi }))
    };

    // Get alerts from latest log
    const alerts = latestLog.getAlerts();

    res.json({
      current: latestLog,
      trends,
      alerts,
      riskScore: latestLog.riskScore,
      lastUpdated: latestLog.date
    });
  } catch (error) {
    console.error('Error fetching latest health metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/health/history/:id - Get health history
router.get('/health/history/:id', async (req, res) => {
  try {
    const womanId = req.params.id;
    const { limit = 10, startDate, endDate } = req.query;
    
    let query = { womanId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const history = await PregnancyHealthLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('updatedBy', 'name email role')
      .populate('verifiedBy', 'name email');

    res.json(history);
  } catch (error) {
    console.error('Error fetching health history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/pregnancy/visit - Add new health visit/record
router.post('/visit', async (req, res) => {
  try {
    const {
      womanId,
      date,
      bp,
      hb,
      weight,
      bmi,
      glucose,
      symptoms,
      symptomsDetails,
      supplements,
      visitType,
      notes,
      recommendations,
      followUpDate
    } = req.body;

    // Create new health log
    const healthLog = new PregnancyHealthLog({
      womanId,
      date: date || new Date(),
      bp,
      hb,
      weight,
      bmi,
      glucose,
      symptoms,
      symptomsDetails,
      supplements,
      visitType,
      notes,
      recommendations,
      followUpDate,
      updatedBy: req.user.id,
      updatedByRole: req.user.role
    });

    // Calculate risk score
    healthLog.calculateRiskScore();

    // Save the health log
    await healthLog.save();

    // Generate alerts if needed
    const alerts = healthLog.getAlerts();
    
    if (alerts.length > 0) {
      // Create alert records
      const alertPromises = alerts.map(alert => {
        const alertRecord = new Alert({
          type: alert.type,
          priority: alert.severity === 'critical' ? 'urgent' : 'high',
          severity: alert.severity,
          womanId,
          title: alert.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          message: alert.message,
          recommendations: [alert.recommendation],
          source: 'health_log',
          sourceId: healthLog._id,
          triggerData: {
            hb,
            bp,
            symptoms
          },
          currentValues: {
            hb,
            bp,
            symptoms
          },
          targetRoles: ['asha', 'anganwadi', 'doctor']
        });
        return alertRecord.save();
      });
      
      await Promise.all(alertPromises);
    }

    // Update AI prediction if ML service is available
    try {
      // Call ML service for prediction
      const mlResponse = await callMLService({
        age: req.body.age,
        gestationalWeek: calculateGestationalWeeks(req.body.lmp),
        hb,
        bp,
        weight,
        bmi,
        symptoms,
        visitRegularity: await getVisitRegularity(womanId)
      });

      if (mlResponse) {
        healthLog.aiPrediction = mlResponse;
        await healthLog.save();
      }
    } catch (mlError) {
      console.log('ML service unavailable:', mlError.message);
    }

    res.status(201).json({
      message: 'Health record saved successfully',
      healthLog,
      alerts: alerts.length > 0 ? alerts : null
    });
  } catch (error) {
    console.error('Error saving health record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/supplements/:id - Get supplement tracking
router.get('/supplements/:id', async (req, res) => {
  try {
    const womanId = req.params.id;
    const { days = 30 } = req.query;
    
    // Get compliance stats
    const complianceStats = await SupplementTracking.getComplianceStats(womanId, parseInt(days));
    
    // Get latest supplement record
    const latestRecord = await SupplementTracking.getLatestByWoman(womanId);
    
    // Get recent history
    const history = await SupplementTracking.find({ womanId })
      .sort({ date: -1 })
      .limit(30)
      .populate('recordedBy', 'name email');

    res.json({
      complianceStats: complianceStats[0] || {
        ironCompliance: 0,
        calciumCompliance: 0,
        folicAcidCompliance: 0,
        overallCompliance: 0
      },
      latest: latestRecord,
      history
    });
  } catch (error) {
    console.error('Error fetching supplement data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/pregnancy/supplements/self-report — logged-in pregnant woman records today’s supplements
router.post('/supplements/self-report', verifyFlexibleAuth, async (req, res) => {
  try {
    const pw = await Woman.findOne({ userId: req.user._id });
    if (!pw) {
      return res.status(404).json({
        message: 'No pregnancy record linked to this account. Contact your Anganwadi worker.',
      });
    }
    const { ironTaken = true, calciumTaken = true, folicAcidTaken = true, notes } = req.body;

    const supplementRecord = new SupplementTracking({
      womanId: pw._id,
      iron: { prescribed: true, taken: !!ironTaken, quantity: 1 },
      calcium: { prescribed: true, taken: !!calciumTaken, quantity: 1 },
      folicAcid: { prescribed: true, taken: !!folicAcidTaken, quantity: 1 },
      recordedBy: req.user._id,
      recordedByRole: 'self',
      visitType: 'self',
      notes: notes || 'Self-reported from pregnancy dashboard',
    });

    supplementRecord.calculateCompliance();
    await supplementRecord.save();

    return res.status(201).json({
      message: 'Supplement intake recorded',
      complianceScore: supplementRecord.complianceScore,
      supplementRecord,
    });
  } catch (error) {
    console.error('Self-report supplements error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/pregnancy/appointments/:id/reschedule — beneficiary requests new date/time
router.put('/appointments/:id/reschedule', verifyFlexibleAuth, async (req, res) => {
  try {
    const pw = await Woman.findOne({ userId: req.user._id });
    if (!pw) {
      return res.status(404).json({ message: 'No pregnancy record linked to this account.' });
    }
    const { scheduledDate, scheduledTime } = req.body;
    if (!scheduledDate) {
      return res.status(400).json({ message: 'scheduledDate is required' });
    }

    const appt = await Appointment.findOne({
      _id: req.params.id,
      womanId: pw._id,
    });
    if (!appt) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appt.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) appt.scheduledTime = scheduledTime;
    appt.status = 'rescheduled';
    await appt.save();

    return res.json({
      message: 'Appointment rescheduled',
      appointment: appt,
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/pregnancy/supplements - worker-recorded supplement tracking (auth required)
router.post('/supplements', verifyFlexibleAuth, async (req, res) => {
  try {
    const {
      womanId,
      iron,
      calcium,
      folicAcid,
      otherSupplements,
      visitType,
      notes,
      adherenceIssues
    } = req.body;

    const uid = req.user._id || req.user.id;
    const supplementRecord = new SupplementTracking({
      womanId,
      iron,
      calcium,
      folicAcid,
      otherSupplements,
      recordedBy: uid,
      recordedByRole: req.user.role || 'asha',
      visitType: visitType || 'center',
      notes,
      adherenceIssues
    });

    // Calculate compliance
    supplementRecord.calculateCompliance();

    await supplementRecord.save();

    // Check for adherence alerts
    const alerts = supplementRecord.getAdherenceAlerts();
    
    if (alerts.length > 0) {
      const alertPromises = alerts.map(alert => {
        const alertRecord = new Alert({
          type: alert.type,
          priority: alert.severity,
          severity: alert.severity,
          womanId,
          title: alert.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          message: alert.message,
          recommendations: [alert.recommendation],
          source: 'supplement_tracking',
          sourceId: supplementRecord._id,
          targetRoles: ['asha', 'anganwadi']
        });
        return alertRecord.save();
      });
      
      await Promise.all(alertPromises);
    }

    res.status(201).json({
      message: 'Supplement record saved successfully',
      supplementRecord,
      alerts: alerts.length > 0 ? alerts : null
    });
  } catch (error) {
    console.error('Error saving supplement record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/appointments/:id - Get appointments
router.get('/appointments/:id', async (req, res) => {
  try {
    const womanId = req.params.id;
    
    // Get upcoming appointments
    const upcoming = await Appointment.getUpcomingByWoman(womanId);
    
    // Get missed appointments
    const missed = await Appointment.getMissedAppointments(womanId);
    
    // Get vaccination schedule
    const vaccinations = await Appointment.getVaccinationSchedule(womanId);
    
    // Get appointment statistics
    const stats = await Appointment.getAppointmentStats(womanId);

    res.json({
      upcoming,
      missed,
      vaccinations,
      stats
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/asha-visits/:id - Get ASHA visit history
router.get('/asha-visits/:id', async (req, res) => {
  try {
    const womanId = req.params.id;
    const { limit = 10 } = req.query;
    
    const visitHistory = await ASHAVisit.getVisitHistory(womanId, parseInt(limit));
    const latestVisit = await ASHAVisit.getLatestByWoman(womanId);
    
    res.json({
      latest: latestVisit,
      history: visitHistory,
      totalVisits: await ASHAVisit.countDocuments({ womanId })
    });
  } catch (error) {
    console.error('Error fetching ASHA visits:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/alerts/:id - Get alerts for woman
router.get('/alerts/:id', async (req, res) => {
  try {
    const womanId = req.params.id;
    const { status = 'active', priority } = req.query;
    
    let query = { womanId };
    if (status !== 'all') query.status = status;
    if (priority) query.priority = priority;
    
    const alerts = await Alert.find(query)
      .sort({ priority: -1, triggeredAt: -1 })
      .populate('assignedTo', 'name email')
      .populate('acknowledgedBy', 'name email');

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/ml-metrics — proxy to ML service (LR / DT / RF comparison table)
router.get('/ml-metrics', async (req, res) => {
  try {
    const r = await axios.get('http://localhost:8000/models/metrics', { timeout: 5000 });
    return res.json(r.data);
  } catch (e) {
    return res.status(503).json({ message: 'ML service unavailable', error: e.message });
  }
});

// GET /api/pregnancy/follow-up/high-risk — follow-up list for workers / admin (seminar paper)
router.get('/follow-up/high-risk', verifyFlexibleAuth, async (req, res) => {
  try {
    const alerts = await Alert.find({
      type: 'high_risk_pregnancy',
      status: 'active',
    })
      .sort({ triggeredAt: -1 })
      .limit(200)
      .lean();

    const womanIds = [...new Set(alerts.map((a) => a.womanId).filter(Boolean))];
    const women = await Woman.find({ _id: { $in: womanIds } })
      .select('name phone anganwadiCenter')
      .lean();
    const byId = Object.fromEntries(women.map((w) => [String(w._id), w]));

    const list = alerts.map((a) => {
      const w = byId[String(a.womanId)];
      return {
        alertId: a._id,
        womanId: a.womanId,
        name: w?.name,
        phone: w?.phone,
        anganwadiCenter: w?.anganwadiCenter,
        title: a.title,
        message: a.message,
        priority: a.priority,
        triggeredAt: a.triggeredAt,
        recommendations: a.recommendations,
      };
    });

    return res.json({ count: list.length, followUps: list });
  } catch (error) {
    console.error('follow-up high-risk error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/pregnancy/ward-summary — ward / Anganwadi centre summaries for Panchayat-style dashboards
router.get('/ward-summary', verifyFlexibleAuth, async (req, res) => {
  try {
    const byCenter = await Woman.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$anganwadiCenter', pregnantWomenCount: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const alertCounts = await Alert.aggregate([
      {
        $match: {
          type: 'high_risk_pregnancy',
          status: 'active',
        },
      },
      {
        $lookup: {
          from: 'pregnantwomen',
          localField: 'womanId',
          foreignField: '_id',
          as: 'w',
        },
      },
      { $unwind: { path: '$w', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$w.anganwadiCenter',
          highRiskAlerts: { $sum: 1 },
        },
      },
    ]);
    const alertMap = Object.fromEntries(
      alertCounts.map((x) => [String(x._id || 'Unknown'), x.highRiskAlerts])
    );
    const centers = byCenter.map((row) => ({
      anganwadiCenter: row._id,
      pregnantWomenCount: row.pregnantWomenCount,
      activeHighRiskAlerts: alertMap[String(row._id)] || 0,
    }));
    return res.json({ centers });
  } catch (error) {
    console.error('ward-summary error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/pregnancy/predict - AI risk prediction
router.post('/predict', async (req, res) => {
  try {
    const {
      womanId,
      age,
      gestationalWeek,
      hb,
      bp,
      weight,
      bmi,
      symptoms,
      visitRegularity,
      supplementCompliance,
      modelType,
      ml_model,
    } = req.body;

    const mlModel = ml_model || modelType || 'random_forest';

    // Call ML service
    const prediction = await callMLService(
      {
        age,
        gestationalWeek,
        hb,
        bp,
        weight,
        bmi,
        symptoms,
        visitRegularity,
        supplementCompliance,
      },
      mlModel
    );

    if (!prediction) {
      return res.status(503).json({ message: 'ML service unavailable' });
    }

    // Save prediction to database
    const riskPrediction = {
      womanId,
      prediction,
      predictedAt: new Date(),
      inputData: {
        age,
        gestationalWeek,
        hb,
        bp,
        weight,
        bmi,
        symptoms,
        visitRegularity,
        supplementCompliance
      }
    };

    // Create alert if high risk
    if (prediction.risk === 'HIGH' || prediction.risk === 'CRITICAL') {
      const alert = new Alert({
        type: 'high_risk_pregnancy',
        priority: prediction.risk === 'CRITICAL' ? 'urgent' : 'high',
        severity: 'critical',
        womanId,
        title: 'AI Risk Prediction Alert',
        message: `AI predicts ${prediction.risk.toLowerCase()} risk pregnancy with ${Math.round(prediction.score * 100)}% confidence`,
        recommendations: prediction.recommendations,
        source: 'ai_prediction',
        aiPrediction: prediction,
        targetRoles: ['asha', 'anganwadi', 'doctor', 'admin']
      });
      
      await alert.save();
    }

    res.json({
      prediction,
      riskPrediction,
      alertCreated: prediction.risk === 'HIGH' || prediction.risk === 'CRITICAL'
    });
  } catch (error) {
    console.error('Error in AI prediction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to call ML service (Logistic Regression | Decision Tree | Random Forest)
async function callMLService(data, mlModel = 'random_forest') {
  try {
    const response = await axios.post(
      'http://localhost:8000/predict-risk',
      { ...data, ml_model: mlModel },
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    console.log('ML service call failed:', error.message);
    return null;
  }
}

// Helper function to get visit regularity
async function getVisitRegularity(womanId) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const visitCount = await PregnancyHealthLog.countDocuments({
      womanId,
      date: { $gte: thirtyDaysAgo }
    });
    
    return visitCount >= 4 ? 'regular' : visitCount >= 2 ? 'irregular' : 'poor';
  } catch (error) {
    return 'unknown';
  }
}

module.exports = router;
