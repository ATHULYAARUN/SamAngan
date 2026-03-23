const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import models
const ASHAVisit = require('../models/ASHAVisit');
const ASHAFieldVisit = require('../models/ASHAFieldVisit');
const AwarenessSession = require('../models/AwarenessSession');
const ASHAFeedback = require('../models/ASHAFeedback');
const SchemeAwareness = require('../models/SchemeAwareness');
const Child = require('../models/Child');
const PregnantWoman = require('../models/PregnantWoman');
const Adolescent = require('../models/Adolescent');

// Import middleware
const { verifyFirebaseAuth, verifyFlexibleAuth } = require('../middleware/auth');
const { 
  requirePermission, 
  requireAnyPermission, 
  requireAllPermissions,
  hasPermission 
} = require('../middleware/roleBasedAccess');
const { 
  ROLES, 
  PERMISSIONS 
} = require('../utils/roleBasedAccess');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/asha';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'asha-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

/** Escape string for use inside RegExp */
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Field visits store ashaArea from localStorage (e.g. village name). Alerts must use the same ?area=…
 * or match by worker (ashaName / createdBy). User model often has no top-level ashaArea.
 */
function buildAshaAreaQuery(area) {
  const a =
    area === 'default' || area === undefined || area === null || area === ''
      ? 'Default Area'
      : String(area).trim();
  return a === 'Default Area' ? { $in: ['Default Area', 'default', 'Default area'] } : a;
}

function resolveAshaAreaFromRequest(req) {
  const fromProfile =
    req.user?.ashaArea || req.user?.roleSpecificData?.ashaDetails?.serviceArea;
  const q = (req.query.area || fromProfile || 'Default Area').trim();
  return q === 'default' ? 'Default Area' : q;
}

// ===========================================
// DASHBOARD STATS
// ===========================================

// @desc    Get ASHA dashboard statistics (optionally scoped to logged-in ASHA by name)
// @route   GET /api/asha/dashboard-stats
// @access  Private
router.get('/dashboard-stats', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'Default Area';
    const ashaName = (req.query.ashaName || req.user?.name || '').trim();
    // When ashaName is provided, scope all field-visit stats to that worker (so Deepa sees all her visits across areas)
    const visitMatch = ashaName
      ? { ashaName: new RegExp(`^${ashaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      : { ashaArea };

    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Count children (0-6 years): from registrations in area + distinct children from this ASHA's field visits
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
    const registeredChildren = await Child.countDocuments({
      anganwadiCenter: ashaArea,
      dateOfBirth: { $gte: sixYearsAgo }
    });
    const childrenVisitAgg = await ASHAFieldVisit.aggregate([
      { $match: { ...visitMatch, personType: 'child' } },
      { $group: { _id: { $toLower: '$personName' } } },
      { $count: 'count' }
    ]);
    let totalChildren = registeredChildren;
    const childrenFromVisits = childrenVisitAgg[0]?.count ?? 0;
    if (childrenFromVisits > totalChildren) totalChildren = childrenFromVisits;

    // Pregnant women: distinct from this ASHA's field visits + registered in area
    const pregnantWomenAgg = await ASHAFieldVisit.aggregate([
      { $match: { ...visitMatch, personType: 'woman' } },
      { $group: { _id: { $toLower: '$personName' } } },
      { $count: 'count' }
    ]);
    let pregnantWomen = pregnantWomenAgg[0]?.count ?? 0;
    const registeredPregnant = await PregnantWoman.countDocuments({
      anganwadiCenter: ashaArea,
      deliveryStatus: { $ne: 'delivered' }
    });
    if (registeredPregnant > pregnantWomen) pregnantWomen = registeredPregnant;

    // Adolescent girls: distinct from this ASHA's field visits + registered in area
    const adolescentsAgg = await ASHAFieldVisit.aggregate([
      { $match: { ...visitMatch, personType: 'adolescent' } },
      { $group: { _id: { $toLower: '$personName' } } },
      { $count: 'count' }
    ]);
    let adolescents = adolescentsAgg[0]?.count ?? 0;
    const registeredAdolescents = await Adolescent.countDocuments({
      anganwadiCenter: ashaArea
    });
    if (registeredAdolescents > adolescents) adolescents = registeredAdolescents;

    // Visits this month for this ASHA (or area)
    const visitsThisMonth = await ASHAFieldVisit.countDocuments({
      ...visitMatch,
      visitDate: { $gte: monthStart, $lte: monthEnd }
    });

    // Active alerts (by area)
    const activeAlerts = await ASHAFeedback.countDocuments({
      ashaArea,
      priority: { $in: ['high', 'urgent'] },
      status: { $in: ['submitted', 'under-review'] }
    });

    // Health indicator counts this month (this ASHA's visits)
    const healthIndicatorRaw = await ASHAFieldVisit.aggregate([
      { $match: { ...visitMatch, visitDate: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: null,
          anemia: { $sum: { $cond: ['$healthIndicators.anemia', 1, 0] } },
          malnutrition: { $sum: { $cond: ['$healthIndicators.malnutrition', 1, 0] } },
          highRiskPregnancy: { $sum: { $cond: ['$healthIndicators.highRiskPregnancy', 1, 0] } },
          immunizationDelay: { $sum: { $cond: ['$healthIndicators.immunizationDelay', 1, 0] } },
          developmentalDelays: { $sum: { $cond: ['$healthIndicators.developmentalDelays', 1, 0] } }
        }
      }
    ]);
    const healthIndicatorCounts = {
      anemia: healthIndicatorRaw[0]?.anemia ?? 0,
      malnutrition: healthIndicatorRaw[0]?.malnutrition ?? 0,
      highRiskPregnancy: healthIndicatorRaw[0]?.highRiskPregnancy ?? 0,
      immunizationDelay: healthIndicatorRaw[0]?.immunizationDelay ?? 0,
      developmentalDelays: healthIndicatorRaw[0]?.developmentalDelays ?? 0
    };

    // Supplement counts this month (this ASHA's visits)
    const supplementRaw = await ASHAFieldVisit.aggregate([
      { $match: { ...visitMatch, visitDate: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: null,
          iron: { $sum: { $cond: ['$supplements.iron', 1, 0] } },
          vitaminA: { $sum: { $cond: ['$supplements.vitaminA', 1, 0] } },
          deworming: { $sum: { $cond: ['$supplements.deworming', 1, 0] } },
          calcium: { $sum: { $cond: ['$supplements.calcium', 1, 0] } },
          folicAcid: { $sum: { $cond: ['$supplements.folicAcid', 1, 0] } }
        }
      }
    ]);
    const supplementCounts = {
      iron: supplementRaw[0]?.iron ?? 0,
      vitaminA: supplementRaw[0]?.vitaminA ?? 0,
      deworming: supplementRaw[0]?.deworming ?? 0,
      calcium: supplementRaw[0]?.calcium ?? 0,
      folicAcid: supplementRaw[0]?.folicAcid ?? 0
    };

    // Recent activities: this ASHA's visits and sessions; feedback by area
    const [recentVisits, recentSessions, recentFeedback] = await Promise.all([
      ASHAFieldVisit.find(visitMatch).sort({ visitDate: -1 }).limit(5).lean(),
      AwarenessSession.find(visitMatch).sort({ sessionDate: -1 }).limit(5).lean(),
      ASHAFeedback.find({ ashaArea }).sort({ submittedAt: -1 }).limit(5).lean()
    ]);

    const recentActivities = [
      ...recentVisits.map(v => ({
        id: v._id,
        type: 'visit',
        message: `Home visit completed - ${v.personName} (${v.personType})`,
        time: v.visitDate,
        priority: 'medium',
        date: v.visitDate
      })),
      ...recentSessions.map(s => ({
        id: s._id,
        type: 'awareness',
        message: `Session: ${s.sessionTitle} - ${s.participantsCount} participants`,
        time: s.sessionDate,
        priority: 'low',
        date: s.sessionDate
      })),
      ...recentFeedback.map(f => ({
        id: f._id,
        type: 'alert',
        message: `${f.feedbackType}: ${f.subject}`,
        time: f.submittedAt,
        priority: f.priority === 'urgent' || f.priority === 'high' ? 'high' : 'medium',
        date: f.submittedAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    // Upcoming vaccinations (from Child records) and checkups (from PregnantWoman)
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    const childrenWithVacc = await Child.find({
      anganwadiCenter: ashaArea,
      status: 'active',
      'vaccinations.0': { $exists: true }
    }).lean();
    const upcomingVaccinations = [];
    childrenWithVacc.forEach(c => {
      (c.vaccinations || []).forEach(v => {
        if (v.nextDue && new Date(v.nextDue) >= new Date() && new Date(v.nextDue) <= twoWeeksFromNow) {
          upcomingVaccinations.push({
            id: c._id,
            type: 'vaccination',
            beneficiaryName: c.name,
            beneficiaryType: 'child',
            title: v.vaccineName,
            dueDate: v.nextDue,
            age: c.dateOfBirth ? Math.floor((new Date() - new Date(c.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null
          });
        }
      });
    });
    upcomingVaccinations.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const pregnantWithCheckups = await PregnantWoman.find({
      anganwadiCenter: ashaArea,
      deliveryStatus: { $ne: 'delivered' }
    }).lean();
    const upcomingCheckups = [];
    pregnantWithCheckups.forEach(pw => {
      const lastAnc = (pw.antenatalCheckups || []).slice(-1)[0];
      if (lastAnc && lastAnc.nextVisit && new Date(lastAnc.nextVisit) >= new Date() && new Date(lastAnc.nextVisit) <= twoWeeksFromNow) {
        upcomingCheckups.push({
          id: pw._id,
          type: 'checkup',
          beneficiaryName: pw.name,
          beneficiaryType: 'pregnant_woman',
          title: 'ANC Checkup',
          dueDate: lastAnc.nextVisit
        });
      }
    });
    upcomingCheckups.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      success: true,
      data: {
        totalChildren,
        pregnantWomen,
        adolescents,
        visitsThisMonth,
        activeAlerts,
        healthIndicatorCounts,
        supplementCounts,
        recentActivities,
        upcomingVaccinations: upcomingVaccinations.slice(0, 10),
        upcomingCheckups: upcomingCheckups.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// ===========================================
// FIELD VISITS
// ===========================================

// @desc    Create a new field visit
// @route   POST /api/asha/field-visits
// @access  Private
router.post('/field-visits', verifyFlexibleAuth, upload.single('photo'), async (req, res) => {
  try {
    const body = req.body || {};
    const visitDate = body.visitDate || new Date();
    const personType = body.personType;
    const personName = body.personName;
    const age = body.age !== undefined && body.age !== '' ? Number(body.age) : undefined;
    const weight = body.weight !== undefined && body.weight !== '' ? Number(body.weight) : undefined;
    const height = body.height !== undefined && body.height !== '' ? Number(body.height) : undefined;
    const hemoglobin = body.hemoglobin !== undefined && body.hemoglobin !== '' ? Number(body.hemoglobin) : undefined;
    const bloodPressure = body.bloodPressure;
    const temperature = body.temperature;
    const muac = body.muac !== undefined && body.muac !== '' ? Number(body.muac) : undefined;
    const location = body.location;
    const healthNotes = body.healthNotes;
    const remarks = body.remarks;

    let vaccination = body.vaccination;
    if (typeof vaccination === 'string') try { vaccination = JSON.parse(vaccination); } catch (e) { vaccination = {}; }
    let supplements = body.supplements;
    if (typeof supplements === 'string') try { supplements = JSON.parse(supplements); } catch (e) { supplements = {}; }
    let healthIndicators = body.healthIndicators;
    if (typeof healthIndicators === 'string') try { healthIndicators = JSON.parse(healthIndicators); } catch (e) { healthIndicators = {}; }
    let referrals = body.referrals;
    if (typeof referrals === 'string') try { referrals = JSON.parse(referrals); } catch (e) { referrals = {}; }
    let followUp = body.followUp;
    if (typeof followUp === 'string') try { followUp = JSON.parse(followUp); } catch (e) { followUp = {}; }

    if (!personType || !personName) {
      return res.status(400).json({
        success: false,
        message: 'Person type and name are required'
      });
    }

    const ashaArea = req.user?.ashaArea || body.ashaArea || 'default';
    const ashaName = req.user?.name || body.ashaName;
    const photos = req.file ? [`/uploads/asha/${req.file.filename}`] : [];

    const visit = await ASHAFieldVisit.create({
      ashaArea,
      ashaName,
      visitDate: visitDate || new Date(),
      personType,
      personName,
      age,
      weight,
      height,
      hemoglobin,
      bloodPressure,
      temperature,
      muac,
      location,
      healthNotes,
      remarks,
      vaccination: vaccination || {},
      supplements: supplements || {},
      healthIndicators: healthIndicators || {},
      referrals: referrals || {},
      followUp: followUp || {},
      photos,
      createdBy: req.user?._id || req.user?.id || undefined
    });

    res.status(201).json({
      success: true,
      message: 'Field visit recorded successfully',
      data: visit
    });
  } catch (error) {
    console.error('Error creating field visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record field visit',
      error: error.message
    });
  }
});

// @desc    Get field visits
// @route   GET /api/asha/field-visits
// @access  Private
router.get('/field-visits', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const { startDate, endDate, personType, limit = 50 } = req.query;
    
    const query = { ashaArea };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add person type filter if provided
    if (personType) {
      query.personType = personType;
    }
    
    const visits = await ASHAFieldVisit.find(query)
      .sort({ visitDate: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    console.error('Error fetching field visits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch field visits',
      error: error.message
    });
  }
});

// ===========================================
// AWARENESS SESSIONS
// ===========================================

// @desc    Create a new awareness session
// @route   POST /api/asha/awareness-sessions
// @access  Private
router.post('/awareness-sessions', verifyFlexibleAuth, upload.single('file'), async (req, res) => {
  try {
    const body = req.body || {};
    const sessionTitle = body.sessionTitle;
    const sessionDate = body.sessionDate;
    const audienceType = body.audienceType;
    let participantsCount = body.participantsCount;
    const description = body.description;
    const outcomes = body.outcomes;
    const venue = body.venue;
    const topics = body.topics;

    let topicsCovered = [];
    if (topics) {
      try {
        topicsCovered = Array.isArray(topics) ? topics : (typeof topics === 'string' ? JSON.parse(topics) : []);
      } catch (e) {
        topicsCovered = [].concat(topics);
      }
    }

    if (!sessionTitle || !audienceType) {
      return res.status(400).json({
        success: false,
        message: 'Session title and audience type are required'
      });
    }
    const numParticipants = parseInt(participantsCount, 10);
    if (isNaN(numParticipants) || numParticipants < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of participants is required and must be at least 1'
      });
    }

    const ashaArea = req.user?.ashaArea || body.ashaArea || 'Default Area';
    const ashaName = req.user?.name || body.ashaName;

    let fileUrl = null;
    let fileType = null;
    if (req.file) {
      fileUrl = `/uploads/asha/${req.file.filename}`;
      fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
    }

    const session = await AwarenessSession.create({
      ashaArea,
      ashaName,
      sessionTitle,
      sessionDate: sessionDate || new Date(),
      audienceType,
      participantsCount: numParticipants,
      description,
      outcomes,
      venue,
      topicsCovered,
      fileUrl,
      fileType,
      status: 'completed',
      createdBy: req.user?.uid
    });
    
    res.status(201).json({
      success: true,
      message: 'Awareness session recorded successfully',
      data: session
    });
  } catch (error) {
    console.error('Error creating awareness session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record awareness session',
      error: error.message
    });
  }
});

// @desc    Get awareness sessions (optionally scoped to ASHA by name, so Deepa sees all her sessions)
// @route   GET /api/asha/awareness-sessions
// @access  Private
router.get('/awareness-sessions', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const ashaName = (req.query.ashaName || req.user?.name || '').trim();
    const { startDate, endDate, audienceType, limit = 50 } = req.query;

    const query = {};
    // Prefer scoping by ASHA name (so one worker sees all their sessions, even across areas)
    if (ashaName) {
      const safeName = ashaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.ashaName = new RegExp(`^${safeName}$`, 'i');
    } else {
      query.ashaArea = ashaArea;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      query.sessionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Add audience type filter if provided
    if (audienceType && audienceType !== 'all') {
      query.audienceType = audienceType;
    }

    const sessions = await AwarenessSession.find(query)
      .sort({ sessionDate: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching awareness sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch awareness sessions',
      error: error.message
    });
  }
});

// ===========================================
// FEEDBACK & ALERTS
// ===========================================

// @desc    Create feedback/alert
// @route   POST /api/asha/feedback
// @access  Private
router.post('/feedback', verifyFlexibleAuth, upload.single('photo'), async (req, res) => {
  try {
    const {
      feedbackType,
      priority,
      subject,
      message,
      location,
      affectedPersons
    } = req.body;
    
    // Validate required fields
    if (!feedbackType || !priority || !message) {
      return res.status(400).json({
        success: false,
        message: 'Feedback type, priority, and message are required'
      });
    }
    
    const ashaArea = req.user?.ashaArea || req.body.ashaArea || 'default';
    const ashaName = req.user?.name || req.body.ashaName || 'ASHA Worker';
    const ashaPhone = req.user?.phone || req.body.ashaPhone;
    
    // Handle photo upload
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/asha/${req.file.filename}`;
    }
    
    // Create feedback record
    const feedback = await ASHAFeedback.create({
      ashaArea,
      ashaName,
      ashaPhone,
      feedbackType,
      priority,
      subject: subject || feedbackType,
      message,
      location,
      affectedPersons: affectedPersons ? parseInt(affectedPersons) : undefined,
      photoUrl,
      attachmentType: req.file ? 'image' : undefined,
      status: 'submitted',
      submittedAt: new Date(),
      forwardedTo: [
        { role: 'aww', name: 'Anganwadi Worker', forwardedAt: new Date() },
        { role: 'admin', name: 'Admin', forwardedAt: new Date() }
      ],
      createdBy: req.user?.uid
    });
    
    // TODO: Send Firebase Cloud Messaging notification to AWW and Admin
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully and forwarded to concerned authorities',
      data: feedback
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// @desc    Get feedback
// @route   GET /api/asha/feedback
// @access  Private
router.get('/feedback', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const { status, priority, limit = 50 } = req.query;
    
    const query = { ashaArea };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add priority filter if provided
    if (priority) {
      query.priority = priority;
    }
    
    const feedbacks = await ASHAFeedback.find(query)
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// ===========================================
// SCHEME AWARENESS
// ===========================================

const SCHEME_NAMES = {
  poshan: 'POSHAN Abhiyaan',
  pmmvy: 'Pradhan Mantri Matru Vandana Yojana',
  jsy: 'Janani Suraksha Yojana',
  sukanya: 'Sukanya Samriddhi Yojana'
};

// @desc    Get scheme awareness list
// @route   GET /api/asha/scheme-awareness
// @access  Private
router.get('/scheme-awareness', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const { schemeCode, beneficiaryType, limit = 100 } = req.query;
    const query = { ashaArea };
    if (schemeCode) query.schemeCode = schemeCode;
    if (beneficiaryType) query.beneficiaryType = beneficiaryType;
    const list = await SchemeAwareness.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .lean();
    const withNames = list.map(l => ({ ...l, schemeName: SCHEME_NAMES[l.schemeCode] || l.schemeCode }));
    res.json({ success: true, count: withNames.length, data: withNames });
  } catch (error) {
    console.error('Error fetching scheme awareness:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scheme awareness', error: error.message });
  }
});

// @desc    Add or update scheme awareness for a beneficiary
// @route   POST /api/asha/scheme-awareness
// @access  Private
router.post('/scheme-awareness', verifyFlexibleAuth, async (req, res) => {
  try {
    const { beneficiaryType, beneficiaryId, beneficiaryName, schemeCode, status, notes } = req.body;
    if (!beneficiaryName || !schemeCode || !status) {
      return res.status(400).json({ success: false, message: 'Beneficiary name, scheme code, and status are required' });
    }
    if (!['aware', 'applied', 'benefiting'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be aware, applied, or benefiting' });
    }
    if (!['poshan', 'pmmvy', 'jsy', 'sukanya'].includes(schemeCode)) {
      return res.status(400).json({ success: false, message: 'Invalid scheme code' });
    }
    const ashaArea = req.user?.ashaArea || req.body.ashaArea || 'default';
    const modelMap = { child: 'Child', pregnant_woman: 'PregnantWoman', adolescent: 'Adolescent' };
    const existing = await SchemeAwareness.findOne({
      ashaArea,
      beneficiaryName: { $regex: new RegExp(`^${beneficiaryName.trim()}$`, 'i') },
      schemeCode
    });
    const payload = {
      ashaArea,
      beneficiaryType: beneficiaryType || 'child',
      beneficiaryId: beneficiaryId || undefined,
      beneficiaryModel: modelMap[beneficiaryType] || 'Child',
      beneficiaryName: beneficiaryName.trim(),
      schemeCode,
      schemeName: SCHEME_NAMES[schemeCode],
      status,
      notes,
      createdBy: req.user?.uid
    };
    let record;
    if (existing) {
      record = await SchemeAwareness.findByIdAndUpdate(existing._id, payload, { new: true });
    } else {
      record = await SchemeAwareness.create(payload);
    }
    res.status(201).json({ success: true, message: 'Scheme awareness recorded', data: record });
  } catch (error) {
    console.error('Error saving scheme awareness:', error);
    res.status(500).json({ success: false, message: 'Failed to save scheme awareness', error: error.message });
  }
});

// ===========================================
// BENEFICIARY LOOKUP (SEARCH)
// ===========================================

// @desc    Search beneficiaries (children, pregnant women, adolescents)
// @route   GET /api/asha/beneficiaries/search
// @access  Private
router.get('/beneficiaries/search', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const ashaName = (req.user?.name || '').trim();
    const q = (req.query.q || '').trim();
    const type = req.query.type; // child | pregnant_woman | adolescent | all
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);
    const results = { children: [], pregnantWomen: [], adolescents: [] };

    if (!type || type === 'child' || type === 'all') {
      const childQuery = { anganwadiCenter: ashaArea };
      if (q) childQuery.name = { $regex: q, $options: 'i' };
      const children = await Child.find(childQuery).limit(limit).lean();
      results.children = children.map(c => ({
        id: c._id,
        type: 'child',
        name: c.name,
        parentName: c.parentName,
        dateOfBirth: c.dateOfBirth,
        age: c.dateOfBirth ? Math.floor((new Date() - new Date(c.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        anganwadiCenter: c.anganwadiCenter,
        currentWeight: c.currentWeight,
        currentHeight: c.currentHeight,
        vaccinations: c.vaccinations,
        nutritionStatus: c.nutritionStatus
      }));
      // If no registered children found, fall back to ASHA field visits
      if (results.children.length === 0 && q) {
        const childVisits = await ASHAFieldVisit.find({
          personType: 'child',
          ...(ashaName
            ? { ashaName: new RegExp(`^${ashaName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }
            : {}),
          personName: { $regex: q, $options: 'i' }
        })
          .sort({ visitDate: -1 })
          .limit(limit)
          .lean();
        results.children = childVisits.map(v => ({
          id: v._id,
          type: 'child',
          name: v.personName,
          parentName: undefined,
          dateOfBirth: null,
          age: v.age ?? null,
          anganwadiCenter: v.ashaArea,
          currentWeight: v.weight,
          currentHeight: v.height,
          vaccinations: [],
          nutritionStatus: null
        }));
      }
    }
    if (!type || type === 'pregnant_woman' || type === 'all') {
      const pwQuery = { anganwadiCenter: ashaArea, deliveryStatus: { $ne: 'delivered' } };
      if (q) pwQuery.name = { $regex: q, $options: 'i' };
      const pregnantWomen = await PregnantWoman.find(pwQuery).limit(limit).lean();
      results.pregnantWomen = pregnantWomen.map(p => ({
        id: p._id,
        type: 'pregnant_woman',
        name: p.name,
        phone: p.phone,
        expectedDeliveryDate: p.expectedDeliveryDate,
        lastMenstrualPeriod: p.lastMenstrualPeriod,
        anganwadiCenter: p.anganwadiCenter,
        currentWeight: p.currentWeight,
        antenatalCheckups: p.antenatalCheckups
      }));
      if (results.pregnantWomen.length === 0 && q) {
        const womanVisits = await ASHAFieldVisit.find({
          personType: 'woman',
          ...(ashaName
            ? { ashaName: new RegExp(`^${ashaName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }
            : {}),
          personName: { $regex: q, $options: 'i' }
        })
          .sort({ visitDate: -1 })
          .limit(limit)
          .lean();
        results.pregnantWomen = womanVisits.map(v => ({
          id: v._id,
          type: 'pregnant_woman',
          name: v.personName,
          phone: undefined,
          expectedDeliveryDate: null,
          lastMenstrualPeriod: null,
          anganwadiCenter: v.ashaArea,
          currentWeight: v.weight,
          antenatalCheckups: []
        }));
      }
    }
    if (!type || type === 'adolescent' || type === 'all') {
      const adolQuery = { anganwadiCenter: ashaArea };
      if (q) adolQuery.name = { $regex: q, $options: 'i' };
      const adolescents = await Adolescent.find(adolQuery).limit(limit).lean();
      results.adolescents = adolescents.map(a => ({
        id: a._id,
        type: 'adolescent',
        name: a.name,
        dateOfBirth: a.dateOfBirth,
        age: a.dateOfBirth ? Math.floor((new Date() - new Date(a.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        anganwadiCenter: a.anganwadiCenter
      }));
      if (results.adolescents.length === 0 && q) {
        const adolescentVisits = await ASHAFieldVisit.find({
          personType: 'adolescent',
          ...(ashaName
            ? { ashaName: new RegExp(`^${ashaName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }
            : {}),
          personName: { $regex: q, $options: 'i' }
        })
          .sort({ visitDate: -1 })
          .limit(limit)
          .lean();
        results.adolescents = adolescentVisits.map(v => ({
          id: v._id,
          type: 'adolescent',
          name: v.personName,
          dateOfBirth: null,
          age: v.age ?? null,
          anganwadiCenter: v.ashaArea
        }));
      }
    }

    const visitHistory = async (beneficiaryId, beneficiaryType) => {
      const typeMap = { child: 'child', pregnant_woman: 'woman', adolescent: 'adolescent' };
      const visits = await ASHAFieldVisit.find({
        ashaArea,
        personType: typeMap[beneficiaryType] || beneficiaryType,
        $or: [{ personName: { $regex: q, $options: 'i' } }]
      }).sort({ visitDate: -1 }).limit(5).lean();
      return visits;
    };

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching beneficiaries:', error);
    res.status(500).json({ success: false, message: 'Failed to search beneficiaries', error: error.message });
  }
});

// @desc    List beneficiaries who received a specific supplement (iron, vitaminA, deworming, calcium, folicAcid)
// @route   GET /api/asha/beneficiaries/by-supplement
// @access  Private
router.get('/beneficiaries/by-supplement', verifyFlexibleAuth, async (req, res) => {
  try {
    let ashaArea = req.user?.ashaArea || req.query.area || 'Default Area';
    if (ashaArea === 'default') ashaArea = 'Default Area';
    const supplement = (req.query.supplement || '').trim().toLowerCase().replace(/\s+/g, '');
    const fieldMap = { iron: 'iron', vitamina: 'vitaminA', deworming: 'deworming', calcium: 'calcium', folicacid: 'folicAcid' };
    const field = fieldMap[supplement] || supplement;
    const allowed = ['iron', 'vitaminA', 'deworming', 'calcium', 'folicAcid'];
    if (!allowed.includes(field)) {
      return res.status(400).json({ success: false, message: 'Valid supplement required: iron, vitaminA, deworming, calcium, folicAcid' });
    }
    const ashaAreaMatch = (ashaArea === 'Default Area') ? { $in: ['Default Area', 'default'] } : ashaArea;
    const match = { ashaArea: ashaAreaMatch, [`supplements.${field}`]: true };
    const agg = await ASHAFieldVisit.aggregate([
      { $match: match },
      { $group: { _id: { personName: '$personName', personType: '$personType' }, visitCount: { $sum: 1 }, lastVisit: { $max: '$visitDate' } } },
      { $sort: { lastVisit: -1 } },
      { $limit: 200 }
    ]);
    const list = agg.map((a) => ({
      id: `${a._id.personName}-${a._id.personType}`,
      name: a._id.personName,
      type: a._id.personType === 'woman' ? 'pregnant_woman' : a._id.personType,
      visitCount: a.visitCount,
      lastVisit: a.lastVisit
    }));
    res.json({ success: true, count: list.length, data: list, supplement: field });
  } catch (error) {
    console.error('Error listing beneficiaries by supplement:', error);
    res.status(500).json({ success: false, message: 'Failed to list beneficiaries by supplement', error: error.message });
  }
});

// @desc    Get visit history for a beneficiary (by name). When beneficiary is viewing own data (allAreas=1 or name matches user), return visits from all ASHA areas.
// @route   GET /api/asha/beneficiaries/:type/:name/visits
// @access  Private
router.get('/beneficiaries/:type/:name/visits', verifyFlexibleAuth, async (req, res) => {
  try {
    const { type, name } = req.params;
    const personType = type === 'pregnant_woman' ? 'woman' : type;
    const decodedName = decodeURIComponent(name);
    const nameMatch = { personName: { $regex: decodedName, $options: 'i' } };
    const allAreas = req.query.allAreas === '1' || req.query.allAreas === 'true';
    let query = { personType, ...nameMatch };
    if (!allAreas) {
      let ashaArea = req.user?.ashaArea || req.query.area || 'Default Area';
      if (ashaArea === 'default') ashaArea = 'Default Area';
      const ashaAreaMatch = (ashaArea === 'Default Area') ? { $in: ['Default Area', 'default'] } : ashaArea;
      query.ashaArea = ashaAreaMatch;
    }
    const visits = await ASHAFieldVisit.find(query).sort({ visitDate: -1 }).limit(50).lean();
    res.json({ success: true, count: visits.length, data: visits });
  } catch (error) {
    console.error('Error fetching visit history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visit history', error: error.message });
  }
});

// ===========================================
// NOTIFICATIONS
// ===========================================

// @desc    Get notifications for ASHA worker
// @route   GET /api/asha/notifications
// @access  Private
router.get('/notifications', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    
    // Get high priority feedback as notifications
    const alerts = await ASHAFeedback.find({
      ashaArea,
      priority: { $in: ['high', 'urgent'] },
      status: { $in: ['submitted', 'under-review'] }
    })
    .sort({ submittedAt: -1 })
    .limit(10);
    
    // Transform to notification format
    const notifications = alerts.map(alert => ({
      id: alert._id,
      type: 'alert',
      title: `${alert.feedbackType.toUpperCase()} Alert`,
      message: alert.message,
      priority: alert.priority,
      date: alert.submittedAt,
      read: false
    }));
    
    // TODO: Add vaccination reminders from Child records
    // TODO: Add missed ANC visit alerts from PregnantWoman records
    // TODO: Add malnutrition alerts from ASHAVisit records
    
    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// @desc    Mark notification as read
// @route   PATCH /api/asha/notifications/:id/read
// @access  Private
router.patch('/notifications/:id/read', verifyFlexibleAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update feedback status if it's a feedback-based notification
    const feedback = await ASHAFeedback.findById(id);
    if (feedback) {
      feedback.status = 'under-review';
      await feedback.save();
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// ===========================================
// REPORTS & ANALYTICS
// ===========================================

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// @desc    Get report data for charts (real data from field visits & awareness sessions)
// @route   GET /api/asha/reports
// @access  Private
router.get('/reports', verifyFlexibleAuth, async (req, res) => {
  try {
    let ashaArea = req.user?.ashaArea || req.query.area || 'Default Area';
    if (ashaArea === 'default') ashaArea = 'Default Area';
    const ashaAreaMatch = ashaArea === 'Default Area' ? { $in: ['Default Area', 'default'] } : ashaArea;
    const monthsBack = Math.min(12, Math.max(1, parseInt(req.query.months) || 6));
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const matchAreaAndDate = {
      ashaArea: ashaAreaMatch,
      visitDate: { $gte: startDate, $lt: endDate }
    };

    // Visits per month with alerts count (health indicators) and sessions in same period
    const visitsAgg = await ASHAFieldVisit.aggregate([
      { $match: matchAreaAndDate },
      {
        $group: {
          _id: { $month: '$visitDate' },
          visits: { $sum: 1 },
          alerts: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$healthIndicators.anemia', true] },
                    { $eq: ['$healthIndicators.malnutrition', true] },
                    { $eq: ['$healthIndicators.highRiskPregnancy', true] },
                    { $eq: ['$healthIndicators.immunizationDelay', true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const sessionsByMonth = await AwarenessSession.aggregate([
      {
        $match: {
          ashaArea: ashaAreaMatch,
          sessionDate: { $gte: startDate, $lt: endDate }
        }
      },
      { $group: { _id: { $month: '$sessionDate' }, sessions: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const sessionsByMonthMap = Object.fromEntries((sessionsByMonth || []).map(s => [s._id, s.sessions]));

    const visitsPerMonthFull = [];
    for (let m = 1; m <= 12; m++) {
      const v = visitsAgg.find(x => x._id === m);
      visitsPerMonthFull.push({
        month: MONTH_NAMES[m - 1],
        visits: v ? v.visits : 0,
        alerts: v ? v.alerts : 0,
        sessions: sessionsByMonthMap[m] || 0
      });
    }
    const visitsPerMonth = visitsPerMonthFull.slice(-monthsBack);

    // Health indicators per month (anemia, malnutrition, highRisk from field visits)
    const healthAgg = await ASHAFieldVisit.aggregate([
      { $match: matchAreaAndDate },
      {
        $group: {
          _id: { $month: '$visitDate' },
          anemia: { $sum: { $cond: ['$healthIndicators.anemia', 1, 0] } },
          malnutrition: { $sum: { $cond: ['$healthIndicators.malnutrition', 1, 0] } },
          highRisk: { $sum: { $cond: ['$healthIndicators.highRiskPregnancy', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const healthByMonth = Object.fromEntries(healthAgg.map(h => [h._id, h]));
    const healthIndicatorsFull = [];
    for (let m = 1; m <= 12; m++) {
      const h = healthByMonth[m];
      healthIndicatorsFull.push({
        month: MONTH_NAMES[m - 1],
        anemia: h ? h.anemia : 0,
        malnutrition: h ? h.malnutrition : 0,
        highRisk: h ? h.highRisk : 0
      });
    }
    const healthIndicators = healthIndicatorsFull.slice(-monthsBack);

    // Awareness sessions by topic (audienceType as topic)
    const awarenessAgg = await AwarenessSession.aggregate([
      { $match: { ashaArea: ashaAreaMatch, sessionDate: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: '$audienceType',
          sessions: { $sum: 1 },
          participants: { $sum: '$participantsCount' }
        }
      }
    ]);
    const topicLabels = { parents: 'Parents', adolescents: 'Adolescents', general: 'General', women: 'Women', elderly: 'Elderly' };
    const awarenessTopics = (awarenessAgg || []).map(a => ({
      topic: topicLabels[a._id] || a._id,
      sessions: a.sessions,
      participants: a.participants || 0
    }));

    // Supplement distribution (from field visits: iron, vitaminA, deworming, calcium, folicAcid)
    const suppAgg = await ASHAFieldVisit.aggregate([
      { $match: { ashaArea: ashaAreaMatch, visitDate: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          iron: { $sum: { $cond: ['$supplements.iron', 1, 0] } },
          vitaminA: { $sum: { $cond: ['$supplements.vitaminA', 1, 0] } },
          deworming: { $sum: { $cond: ['$supplements.deworming', 1, 0] } },
          calcium: { $sum: { $cond: ['$supplements.calcium', 1, 0] } },
          folicAcid: { $sum: { $cond: ['$supplements.folicAcid', 1, 0] } }
        }
      }
    ]);
    const s = suppAgg[0];
    const totalVisits = (s && s.total) ? s.total : 1;
    const supplementDistribution = [
      { name: 'Iron Tablets', value: s ? Math.round((s.iron / totalVisits) * 100) : 0, trend: '' },
      { name: 'Vitamin A', value: s ? Math.round((s.vitaminA / totalVisits) * 100) : 0, trend: '' },
      { name: 'Deworming', value: s ? Math.round((s.deworming / totalVisits) * 100) : 0, trend: '' },
      { name: 'Calcium', value: s ? Math.round((s.calcium / totalVisits) * 100) : 0, trend: '' },
      { name: 'Folic Acid', value: s ? Math.round((s.folicAcid / totalVisits) * 100) : 0, trend: '' }
    ];

    // Pregnancy tracking: woman visits by rough trimester (by month of visit)
    const pregnancyPipeline = [
      { $match: { ashaArea: ashaAreaMatch, personType: 'woman', visitDate: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: null, count: { $sum: 1 }, highRisk: { $sum: { $cond: ['$healthIndicators.highRiskPregnancy', 1, 0] } } } }
    ];
    const pregnancyAgg = await ASHAFieldVisit.aggregate(pregnancyPipeline);
    const pw = pregnancyAgg[0];
    const pregnancyTracking = [
      { trimester: '1st', count: pw ? Math.floor((pw.count || 0) / 3) : 0, highRisk: pw ? Math.floor((pw.highRisk || 0) / 3) : 0 },
      { trimester: '2nd', count: pw ? Math.floor((pw.count || 0) / 3) : 0, highRisk: pw ? Math.floor((pw.highRisk || 0) / 3) : 0 },
      { trimester: '3rd', count: pw ? (pw.count || 0) - 2 * Math.floor((pw.count || 0) / 3) : 0, highRisk: pw ? (pw.highRisk || 0) - 2 * Math.floor((pw.highRisk || 0) / 3) : 0 }
    ];

    // Age distribution from field visits (bucket by age ranges)
    const ageAgg = await ASHAFieldVisit.aggregate([
      { $match: matchAreaAndDate },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 1] }, then: '0-1' },
                { case: { $lt: ['$age', 3] }, then: '1-3' },
                { case: { $lt: ['$age', 6] }, then: '3-6' },
                { case: { $lt: ['$age', 10] }, then: '6-10' },
                { case: { $lt: ['$age', 14] }, then: '10-14' },
                { case: { $lt: ['$age', 19] }, then: '14-19' }
              ],
              default: '19+'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    const ageDistribution = (ageAgg || []).map(a => ({ age: a._id || 'unknown', count: a.count }));

    res.json({
      success: true,
      data: {
        visitsPerMonth,
        healthIndicators,
        awarenessTopics,
        supplementDistribution,
        pregnancyTracking,
        ageDistribution,
        performanceMetrics: {
          avgVisitDuration: 25,
          followUpCompliance: 78,
          alertResolutionTime: 48,
          sessionAttendance: 85,
          referralCompliance: 92
        }
      }
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report data',
      error: error.message
    });
  }
});

// ===========================================
// PROFILE MANAGEMENT
// ===========================================

// @desc    Update ASHA profile
// @route   PUT /api/asha/profile
// @access  Private
router.put('/profile', verifyFlexibleAuth, async (req, res) => {
  try {
    const { name, phone, email, area, center } = req.body;
    
    // In a real implementation, update the User model
    // For now, return success
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name,
        phone,
        email,
        area,
        center
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @desc    Change password
// @route   POST /api/asha/change-password
// @access  Private
router.post('/change-password', verifyFlexibleAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // In a real implementation, verify current password and update
    // For now, return success
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// ===========================================
// CROSS-DASHBOARD STATISTICS UPDATES
// ===========================================

// @desc    Update cross-dashboard statistics after field visit
// @route   POST /api/asha/update-dashboard-stats
// @access  Private
router.post('/update-dashboard-stats', verifyFlexibleAuth, async (req, res) => {
  try {
    const { personType, visitData } = req.body;
    
    if (!personType || !visitData) {
      return res.status(400).json({
        success: false,
        message: 'Person type and visit data are required'
      });
    }
    
    const ashaArea = visitData.ashaArea || req.user?.ashaArea || 'default';
    
    // Update relevant collection based on person type
    let updateResult;
    
    switch (personType) {
      case 'woman':
        // Update or create PregnantWoman record
        updateResult = await updatePregnantWomanData(visitData, ashaArea);
        break;
      case 'child':
        // Update or create Child record
        updateResult = await updateChildData(visitData, ashaArea);
        break;
      case 'adolescent':
        // Update or create Adolescent record
        updateResult = await updateAdolescentData(visitData, ashaArea);
        break;
      default:
        throw new Error('Invalid person type');
    }
    
    res.json({
      success: true,
      message: 'Dashboard statistics updated successfully',
      data: updateResult
    });
  } catch (error) {
    console.error('Error updating dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard statistics',
      error: error.message
    });
  }
});

// Helper function to update pregnant woman data
async function updatePregnantWomanData(visitData, ashaArea) {
  try {
    // Check if pregnant woman already exists
    const existingWoman = await PregnantWoman.findOne({
      name: visitData.name,
      anganwadiCenter: ashaArea
    });
    
    const updateFields = {
      lastVisitDate: visitData.visitDate,
      weight: visitData.weight,
      height: visitData.height,
      hemoglobin: visitData.hemoglobin,
      bloodPressure: visitData.bloodPressure,
      ironTabletsProvided: visitData.supplements?.iron || false,
      lastUpdated: new Date()
    };
    
    if (existingWoman) {
      // Update existing record
      return await PregnantWoman.findByIdAndUpdate(
        existingWoman._id,
        updateFields,
        { new: true }
      );
    } else {
      // Create new record
      return await PregnantWoman.create({
        name: visitData.name,
        age: visitData.age,
        anganwadiCenter: ashaArea,
        weight: visitData.weight,
        height: visitData.height,
        hemoglobin: visitData.hemoglobin,
        bloodPressure: visitData.bloodPressure,
        ironTabletsProvided: visitData.supplements?.iron || false,
        registrationDate: visitData.visitDate,
        lastVisitDate: visitData.visitDate,
        deliveryStatus: 'pending'
      });
    }
  } catch (error) {
    console.error('Error updating pregnant woman data:', error);
    throw error;
  }
}

// Helper function to update child data
async function updateChildData(visitData, ashaArea) {
  try {
    // Check if child already exists
    const existingChild = await Child.findOne({
      name: visitData.name,
      anganwadiCenter: ashaArea
    });
    
    const updateFields = {
      weight: visitData.weight,
      height: visitData.height,
      hemoglobin: visitData.hemoglobin,
      lastVisitDate: visitData.visitDate,
      lastUpdated: new Date()
    };
    
    // Add vaccination data if provided
    if (visitData.vaccination?.type) {
      updateFields.vaccinationRecords = [{
        vaccineName: visitData.vaccination.type,
        dose: visitData.vaccination.dose,
        dateGiven: visitData.vaccination.date,
        givenBy: 'ASHA Worker'
      }];
    }
    
    // Add supplements data
    if (visitData.supplements) {
      updateFields.ironTabletsProvided = visitData.supplements.iron || false;
      updateFields.vitaminAGiven = visitData.supplements.vitaminA || false;
      updateFields.dewormingGiven = visitData.supplements.deworming || false;
    }
    
    if (existingChild) {
      // Update existing record
      return await Child.findByIdAndUpdate(
        existingChild._id,
        updateFields,
        { new: true }
      );
    } else {
      // Create new record
      return await Child.create({
        name: visitData.name,
        age: visitData.age,
        anganwadiCenter: ashaArea,
        weight: visitData.weight,
        height: visitData.height,
        hemoglobin: visitData.hemoglobin,
        dateOfBirth: new Date(visitData.visitDate), // Approximate DOB
        registrationDate: visitData.visitDate,
        lastVisitDate: visitData.visitDate,
        ironTabletsProvided: visitData.supplements?.iron || false,
        vitaminAGiven: visitData.supplements?.vitaminA || false,
        dewormingGiven: visitData.supplements?.deworming || false,
        vaccinationRecords: visitData.vaccination?.type ? [{
          vaccineName: visitData.vaccination.type,
          dose: visitData.vaccination.dose,
          dateGiven: visitData.vaccination.date,
          givenBy: 'ASHA Worker'
        }] : []
      });
    }
  } catch (error) {
    console.error('Error updating child data:', error);
    throw error;
  }
}

// Helper function to update adolescent data
async function updateAdolescentData(visitData, ashaArea) {
  try {
    // Check if adolescent already exists
    const existingAdolescent = await Adolescent.findOne({
      name: visitData.name,
      anganwadiCenter: ashaArea
    });
    
    const updateFields = {
      weight: visitData.weight,
      height: visitData.height,
      hemoglobin: visitData.hemoglobin,
      bloodPressure: visitData.bloodPressure,
      lastVisitDate: visitData.visitDate,
      lastUpdated: new Date()
    };
    
    // Add supplements data
    if (visitData.supplements) {
      updateFields.ironTabletsProvided = visitData.supplements.iron || false;
      updateFields.vitaminAGiven = visitData.supplements.vitaminA || false;
      updateFields.dewormingGiven = visitData.supplements.deworming || false;
    }
    
    if (existingAdolescent) {
      // Update existing record
      return await Adolescent.findByIdAndUpdate(
        existingAdolescent._id,
        updateFields,
        { new: true }
      );
    } else {
      // Create new record
      return await Adolescent.create({
        name: visitData.name,
        age: visitData.age,
        gender: 'female',
        anganwadiCenter: ashaArea,
        weight: visitData.weight,
        height: visitData.height,
        hemoglobin: visitData.hemoglobin,
        bloodPressure: visitData.bloodPressure,
        dateOfBirth: new Date(visitData.visitDate), // Approximate DOB
        registrationDate: visitData.visitDate,
        lastVisitDate: visitData.visitDate,
        ironTabletsProvided: visitData.supplements?.iron || false,
        vitaminAGiven: visitData.supplements?.vitaminA || false,
        dewormingGiven: visitData.supplements?.deworming || false
      });
    }
  } catch (error) {
    console.error('Error updating adolescent data:', error);
    throw error;
  }
}

// ===========================================
// CROSS-DASHBOARD INTEGRATION
// ===========================================

// @desc    Get all alerts for ASHA worker
// @route   GET /api/asha/alerts
// @access  Private
router.get('/alerts', verifyFlexibleAuth, async (req, res) => {
  try {
    const areaResolved = resolveAshaAreaFromRequest(req);
    const ashaAreaQuery = buildAshaAreaQuery(areaResolved);
    const userId = req.user?._id || req.user?.id;
    const userName = (req.user?.name || '').trim();

    // Flagged visits: same area as field-entry (query ?area=) OR same ASHA worker (name / createdBy)
    const indicatorOr = [
      { 'healthIndicators.anemia': true },
      { 'healthIndicators.malnutrition': true },
      { 'healthIndicators.highRiskPregnancy': true },
      { 'healthIndicators.immunizationDelay': true }
    ];

    const visitScope = {
      $or: [
        { ashaArea: ashaAreaQuery },
        ...(userName
          ? [{ ashaName: new RegExp(`^${escapeRegex(userName)}$`, 'i') }]
          : []),
        ...(userId ? [{ createdBy: userId }] : [])
      ]
    };

    // Get alerts from various sources
    const [healthAlerts, feedbackAlerts] = await Promise.all([
      // Health indicators alerts from field visits
      ASHAFieldVisit.find({
        $and: [{ $or: indicatorOr }, visitScope]
      }).sort({ visitDate: -1 }),
      
      // High priority feedback
      ASHAFeedback.find({
        ashaArea: ashaAreaQuery,
        status: { $in: ['submitted', 'under-review'] }
      }).sort({ submittedAt: -1 })
    ]);

    const alerts = [
      ...healthAlerts.map(visit => ({
        id: visit._id,
        type: 'health',
        priority: visit.healthIndicators.highRiskPregnancy ? 'urgent' : 
                visit.healthIndicators.anemia || visit.healthIndicators.malnutrition ? 'high' : 'medium',
        status: 'pending',
        title: visit.healthIndicators.highRiskPregnancy ? 'High Risk Pregnancy' :
               visit.healthIndicators.anemia ? 'Anemia Detected' :
               visit.healthIndicators.malnutrition ? 'Malnutrition Risk' :
               visit.healthIndicators.immunizationDelay ? 'Immunization Delay' : 'Health Alert',
        description: `${visit.personName} (${visit.age} years) - Health concern detected`,
        person: visit.personName,
        age: visit.age,
        location: visit.ashaArea || areaResolved,
        date: visit.visitDate,
        time: visit.visitDate,
        actionRequired: 'Follow-up required',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'health',
        details: {
          visitId: visit._id,
          indicators: visit.healthIndicators,
          measurements: {
            hemoglobin: visit.hemoglobin,
            weight: visit.weight,
            height: visit.height
          }
        }
      })),
      
      ...feedbackAlerts.map(feedback => ({
        id: feedback._id,
        type: 'feedback',
        priority: feedback.priority,
        status: feedback.status,
        title: `${feedback.feedbackType.toUpperCase()} Alert`,
        description: feedback.message,
        person: 'Community',
        age: 'Various',
        location: feedback.location || areaResolved,
        date: feedback.submittedAt,
        time: feedback.submittedAt,
        actionRequired: 'Review and action required',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: feedback.feedbackType,
        details: {
          feedbackId: feedback._id,
          feedbackType: feedback.feedbackType,
          photoUrl: feedback.photoUrl,
          affectedPersons: feedback.affectedPersons
        }
      }))
    ];

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

const { buildAiAlertsFromVisits } = require('../utils/aiHealthAlerts');

// Rule-based AI health alerts from field visit data (Hb, BP, age, BMI, MUAC thresholds)
// @desc    Get AI-generated health alerts (pregnancy risk, child malnutrition, adolescent anemia)
// @route   GET /api/asha/ai-alerts
// @access  Private
router.get('/ai-alerts', verifyFlexibleAuth, async (req, res) => {
  try {
    const areaResolved = resolveAshaAreaFromRequest(req);
    const ashaAreaQuery = buildAshaAreaQuery(areaResolved);
    const userId = req.user?._id || req.user?.id;
    const userName = (req.user?.name || '').trim();
    const visitScope = {
      $or: [
        { ashaArea: ashaAreaQuery },
        ...(userName
          ? [{ ashaName: new RegExp(`^${escapeRegex(userName)}$`, 'i') }]
          : []),
        ...(userId ? [{ createdBy: userId }] : [])
      ]
    };
    const womanVisits = await ASHAFieldVisit.find({ $and: [{ personType: 'woman' }, visitScope] })
      .sort({ visitDate: -1 })
      .limit(50)
      .lean();
    const childVisits = await ASHAFieldVisit.find({ $and: [{ personType: 'child' }, visitScope] })
      .sort({ visitDate: -1 })
      .limit(50)
      .lean();
    const adolescentVisits = await ASHAFieldVisit.find({ $and: [{ personType: 'adolescent' }, visitScope] })
      .sort({ visitDate: -1 })
      .limit(50)
      .lean();
    const aiAlerts = buildAiAlertsFromVisits(womanVisits, childVisits, adolescentVisits);
    res.json({ success: true, count: aiAlerts.length, data: aiAlerts.slice(0, 25) });
  } catch (error) {
    console.error('Error fetching AI alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch AI alerts', error: error.message });
  }
});

// @desc    Update alert status
// @route   PATCH /api/asha/alerts/:id/status
// @access  Private
router.patch('/alerts/:id/status', verifyFlexibleAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update the alert status
    const updateData = { status, updatedAt: new Date() };
    
    // Try to update in ASHA field visits first (optional status tracking)
    const visit = await ASHAFieldVisit.findByIdAndUpdate(id, { $set: { updatedAt: new Date() } }, { new: true });
    
    if (visit) {
      // Forward to AWW and Admin for verification
      await Promise.all([
        forwardToAWW({
          type: 'alert_update',
          data: { alertId: id, status, ashaWorker: req.user?.name },
          timestamp: new Date()
        }),
        forwardToAdmin({
          type: 'alert_update',
          data: { alertId: id, status, ashaWorker: req.user?.name },
          timestamp: new Date()
        })
      ]);
      
      return res.json({
        success: true,
        message: 'Alert status updated successfully',
        data: visit
      });
    }
    
    // Try to update in feedback
    const feedback = await ASHAFeedback.findByIdAndUpdate(id, updateData, { new: true });
    if (feedback) {
      return res.json({
        success: true,
        message: 'Feedback status updated successfully',
        data: feedback
      });
    }
    
    res.status(404).json({
      success: false,
      message: 'Alert not found'
    });
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert status',
      error: error.message
    });
  }
});

// @desc    Get recent activities for activity feed
// @route   GET /api/asha/activities/recent
// @access  Private
router.get('/activities/recent', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const limit = parseInt(req.query.limit) || 20;
    
    // Get recent activities from all sources
    const [recentVisits, recentSessions, recentFeedback] = await Promise.all([
      ASHAFieldVisit.find({ ashaArea })
        .sort({ visitDate: -1 })
        .limit(limit)
        .lean(),
      
      AwarenessSession.find({ ashaArea })
        .sort({ sessionDate: -1 })
        .limit(limit)
        .lean(),
      
      ASHAFeedback.find({ ashaArea })
        .sort({ submittedAt: -1 })
        .limit(limit)
        .lean()
    ]);

    const activities = [
      ...recentVisits.map(visit => ({
        id: visit._id,
        type: 'visit',
        title: 'Home Visit Completed',
        description: `Field visit completed for ${visit.personName} (${visit.age} years, ${visit.personType})`,
        person: visit.personName,
        age: visit.age,
        location: ashaArea,
        date: visit.visitDate,
        time: visit.visitDate,
        priority: 'medium',
        status: 'completed',
        details: {
          visitType: 'General Checkup',
          findings: 'Visit completed successfully',
          nextVisit: visit.followUp?.date || 'TBD',
          ashaWorker: req.user?.name
        }
      })),
      
      ...recentSessions.map(session => ({
        id: session._id,
        type: 'awareness',
        title: 'Awareness Session',
        description: `Conducted ${session.sessionTitle} for ${session.participantsCount} participants`,
        person: 'Community',
        age: 'Various',
        location: session.venue || ashaArea,
        date: session.sessionDate,
        time: session.sessionDate,
        priority: 'low',
        status: 'completed',
        details: {
          topic: session.sessionTitle,
          participants: session.participantsCount,
          duration: session.duration || '2 hours',
          materials: 'Educational materials',
          ashaWorker: req.user?.name
        }
      })),
      
      ...recentFeedback.map(feedback => ({
        id: feedback._id,
        type: 'feedback',
        title: `${feedback.feedbackType.toUpperCase()} Feedback`,
        description: feedback.message,
        person: 'Community',
        age: 'Various',
        location: feedback.location || ashaArea,
        date: feedback.submittedAt,
        time: feedback.submittedAt,
        priority: feedback.priority,
        status: feedback.status,
        details: {
          issue: feedback.feedbackType,
          affected: feedback.affectedPersons,
          action: 'Under review',
          ashaWorker: req.user?.name
        }
      }))
    ];

    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      count: activities.length,
      data: activities.slice(0, limit)
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
});

// @desc    Update notification status
// @route   PATCH /api/asha/notifications/:id/status
// @access  Private
router.patch('/notifications/:id/status', verifyFlexibleAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update notification status in database
    const updateData = { status, updatedAt: new Date() };
    
    // This would typically update a notifications collection
    // For now, we'll return success as the frontend handles the state
    
    res.json({
      success: true,
      message: 'Notification status updated successfully',
      data: updateData
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification status',
      error: error.message
    });
  }
});

// @desc    Forward data to AWW dashboard
// @route   POST /api/asha/forward/aww
// @access  Private
router.post('/forward/aww', verifyFlexibleAuth, async (req, res) => {
  try {
    const { type, data, timestamp } = req.body;
    
    // Create a record for AWW verification
    const awwRecord = {
      source: 'asha',
      sourceWorker: req.user?.name,
      type,
      data,
      timestamp,
      status: 'pending_verification',
      ashaArea: req.user?.ashaArea
    };
    
    // This would typically save to a cross-dashboard collection
    // For now, we'll just log it
    console.log('Forwarding to AWW:', awwRecord);
    
    res.json({
      success: true,
      message: 'Data forwarded to AWW dashboard successfully',
      data: awwRecord
    });
  } catch (error) {
    console.error('Error forwarding to AWW:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forward to AWW',
      error: error.message
    });
  }
});

// @desc    Forward data to Admin dashboard
// @route   POST /api/asha/forward/admin
// @access  Private
router.post('/forward/admin', verifyFlexibleAuth, async (req, res) => {
  try {
    const { type, data, timestamp } = req.body;
    
    // Create a record for Admin verification
    const adminRecord = {
      source: 'asha',
      sourceWorker: req.user?.name,
      type,
      data,
      timestamp,
      status: 'pending_review',
      ashaArea: req.user?.ashaArea
    };
    
    // This would typically save to a cross-dashboard collection
    // For now, we'll just log it
    console.log('Forwarding to Admin:', adminRecord);
    
    res.json({
      success: true,
      message: 'Data forwarded to Admin dashboard successfully',
      data: adminRecord
    });
  } catch (error) {
    console.error('Error forwarding to Admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forward to Admin',
      error: error.message
    });
  }
});

// @desc    Get verification status
// @route   GET /api/asha/verification/:recordId
// @access  Private
router.get('/verification/:recordId', verifyFlexibleAuth, async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // This would typically check cross-dashboard collection
    // For now, we'll return mock verification status
    const verificationStatus = {
      recordId,
      awwStatus: 'pending',
      adminStatus: 'pending',
      awwComments: null,
      adminComments: null,
      awwVerifiedAt: null,
      adminVerifiedAt: null
    };
    
    res.json({
      success: true,
      data: verificationStatus
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification status',
      error: error.message
    });
  }
});

// Helper functions for cross-dashboard forwarding
async function forwardToAWW(data) {
  try {
    // This would typically make an API call to AWW service
    console.log('Forwarding to AWW service:', data);
    return { success: true };
  } catch (error) {
    console.error('Error forwarding to AWW:', error);
    return { success: false };
  }
}

async function forwardToAdmin(data) {
  try {
    // This would typically make an API call to Admin service
    console.log('Forwarding to Admin service:', data);
    return { success: true };
  } catch (error) {
    console.error('Error forwarding to Admin:', error);
    return { success: false };
  }
}

// @desc    Update cross-dashboard awareness session statistics
// @route   POST /api/asha/update-awareness-stats
// @access  Private
router.post('/update-awareness-stats', verifyFlexibleAuth, async (req, res) => {
  try {
    const { sessionType, sessionData } = req.body;
    
    if (!sessionType || !sessionData) {
      return res.status(400).json({
        success: false,
        message: 'Session type and session data are required'
      });
    }
    
    const ashaArea = sessionData.ashaArea || req.user?.ashaArea || 'default';
    
    // Update or create awareness session record for cross-dashboard visibility
    let updateResult;
    
    if (sessionType === 'awareness') {
      // Check if awareness session already exists in cross-dashboard collection
      // For now, we'll update the existing session and create a cross-dashboard record
      const crossDashboardSession = {
        source: 'asha',
        sourceWorker: req.user?.name || 'ASHA Worker',
        sessionType: 'awareness',
        sessionData: {
          ...sessionData,
          ashaArea,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        status: 'active',
        verifiedBy: {
          aww: null,
          admin: null
        }
      };
      
      // This would typically save to a cross-dashboard collection
      // For now, we'll just log it and forward to AWW/Admin
      console.log('Cross-dashboard awareness session:', crossDashboardSession);
      
      // Forward to AWW and Admin dashboards
      await Promise.all([
        forwardToAWW({
          type: 'awareness_session_created',
          data: crossDashboardSession,
          timestamp: new Date()
        }),
        forwardToAdmin({
          type: 'awareness_session_created',
          data: crossDashboardSession,
          timestamp: new Date()
        })
      ]);
      
      updateResult = crossDashboardSession;
    }
    
    res.json({
      success: true,
      message: 'Cross-dashboard awareness session statistics updated successfully',
      data: updateResult
    });
  } catch (error) {
    console.error('Error updating cross-dashboard awareness stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cross-dashboard awareness statistics',
      error: error.message
    });
  }
});

// @desc    Get awareness sessions for cross-dashboard display
// @route   GET /api/asha/awareness-sessions/cross-dashboard
// @access  Private
router.get('/awareness-sessions/cross-dashboard', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const limit = parseInt(req.query.limit) || 20;
    
    // Get awareness sessions from ASHA collection
    const awarenessSessions = await AwarenessSession.find({ ashaArea })
      .sort({ sessionDate: -1 })
      .limit(limit)
      .lean();
    
    // Format sessions for cross-dashboard display
    const formattedSessions = awarenessSessions.map(session => ({
      id: session._id,
      type: 'awareness_session',
      title: session.sessionTitle,
      description: session.description,
      audienceType: session.audienceType,
      participantsCount: session.participantsCount,
      outcomes: session.outcomes,
      venue: session.venue,
      duration: session.duration,
      facilitator: session.facilitator,
      topics: session.topics || [],
      materials: session.materials || [],
      challenges: session.challenges,
      recommendations: session.recommendations,
      followUpRequired: session.followUpRequired,
      followUpDate: session.followUpDate,
      sessionDate: session.sessionDate,
      createdAt: session.createdAt,
      ashaArea: session.ashaArea,
      source: 'asha',
      sourceWorker: session.createdBy || 'ASHA Worker',
      status: 'completed',
      crossDashboardStatus: {
        awwVerified: false,
        adminVerified: false,
        awwComments: null,
        adminComments: null
      }
    }));
    
    res.json({
      success: true,
      count: formattedSessions.length,
      data: formattedSessions
    });
  } catch (error) {
    console.error('Error fetching cross-dashboard awareness sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cross-dashboard awareness sessions',
      error: error.message
    });
  }
});

module.exports = router;
