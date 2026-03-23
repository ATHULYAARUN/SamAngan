const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const SanitationTask = require('../models/SanitationTask');
const WasteLog = require('../models/WasteLog');
const DrainageReport = require('../models/DrainageReport');
const SanitationIssue = require('../models/SanitationIssue');
const SanitationReport = require('../models/SanitationReport');

const { verifyFlexibleAuth, checkRole } = require('../middleware/auth');

const WARD_NUMBER = 9;
const DEFAULT_CENTER = 'Akkarakunnu Anganwadi';

// Multer for issue photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/sanitation');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `issue-${Date.now()}${path.extname(file.originalname) || '.jpg'}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

const sanitizeWorker = (req) => req.user?.name || req.user?.email || 'Sanitation Worker';

// ========== DASHBOARD STATS ==========
// @route   GET /api/sanitation/dashboard-stats
// @access  Private (sanitation-worker)
router.get('/dashboard-stats', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const workerName = sanitizeWorker(req);

    // Today range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Current week (Sunday–Saturday) for live weekly summary
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [
      totalWasteToday,
      pendingTasks,
      completedTasksToday,
      issuesReported,
      weeklyTasksCompleted,
      weeklyWasteAgg,
      weeklyDrainageIssues
    ] = await Promise.all([
      // Waste collected today (kg)
      WasteLog.aggregate([
        { $match: { date: { $gte: todayStart, $lt: todayEnd }, collectionStatus: 'Collected' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]).then(r => r[0]?.total ?? 0),
      // Pending cleaning tasks
      SanitationTask.countDocuments({ status: 'Pending', wardNumber: WARD_NUMBER }),
      // Cleaning tasks completed today
      SanitationTask.countDocuments({
        status: 'Completed',
        wardNumber: WARD_NUMBER,
        completedAt: { $gte: todayStart, $lt: todayEnd }
      }),
      // Open sanitation issues
      SanitationIssue.countDocuments({ status: 'Open' }),
      // Cleaning tasks completed this week
      SanitationTask.countDocuments({
        status: 'Completed',
        wardNumber: WARD_NUMBER,
        completedAt: { $gte: weekStart, $lte: weekEnd }
      }),
      // Waste collected this week (kg)
      WasteLog.aggregate([
        { $match: { date: { $gte: weekStart, $lte: weekEnd }, collectionStatus: 'Collected' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
      // Drainage / risk issues this week
      DrainageReport.countDocuments({
        wardNumber: WARD_NUMBER,
        reportedDate: { $gte: weekStart, $lte: weekEnd },
        $or: [{ blockageStatus: 'Yes' }, { mosquitoRiskLevel: 'High' }]
      })
    ]);

    const weeklyWasteCollectedKg = weeklyWasteAgg[0]?.total ?? 0;

    // Simple hygiene status based on live weekly data
    let weeklyHygieneStatus = 'Good';
    if (weeklyDrainageIssues > 5 || weeklyTasksCompleted < 3) weeklyHygieneStatus = 'Needs Improvement';
    if (weeklyDrainageIssues > 10) weeklyHygieneStatus = 'Poor';

    const weeklySummary = `Ward ${WARD_NUMBER}: ${weeklyTasksCompleted} cleaning tasks completed, ${weeklyWasteCollectedKg} kg waste collected, ${weeklyDrainageIssues} drainage/risk issues.`;

    res.json({
      totalWasteCollectedToday: totalWasteToday ?? 0,
      pendingCleaningTasks: pendingTasks,
      completedCleaningTasks: completedTasksToday,
      sanitationIssuesReported: issuesReported,
      weeklyHygieneStatus,
      weeklySummary,
      weeklyTasksCompleted,
      weeklyWasteCollectedKg,
      weeklyDrainageIssues
    });
  } catch (err) {
    console.error('Sanitation dashboard-stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== WARD CLEANING TASKS ==========
router.get('/tasks', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const { status, ward } = req.query;
    const filter = { wardNumber: ward ? parseInt(ward, 10) : WARD_NUMBER };
    if (status) filter.status = status;
    const tasks = await SanitationTask.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tasks', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const worker = sanitizeWorker(req);
    const { date, wardNumber, areaName, taskType, assignedWorker, status, remarks } = req.body;
    const taskId = `ST-${WARD_NUMBER}-${Date.now()}`;
    const task = await SanitationTask.create({
      taskId,
      date: date ? new Date(date) : new Date(),
      wardNumber: wardNumber ?? WARD_NUMBER,
      areaName: areaName || '',
      taskType: taskType || 'Garbage Removal',
      assignedWorker: assignedWorker || worker,
      status: status || 'Pending',
      remarks: remarks || '',
      createdBy: req.user?._id
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/tasks/:id', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const update = {};
    if (status) update.status = status;
    if (remarks !== undefined) update.remarks = remarks;
    if (status === 'Completed') update.completedAt = new Date();
    const task = await SanitationTask.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).lean();
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== WASTE COLLECTION LOG ==========
// Anganwadi workers: read-only waste logs for their center (from Sanitation Worker Dashboard)
router.get('/waste-logs/for-center', verifyFlexibleAuth, checkRole('anganwadi-worker'), async (req, res) => {
  try {
    let center = req.query.center || req.user?.roleSpecificData?.anganwadiCenter?.name || DEFAULT_CENTER;
    center = (center || DEFAULT_CENTER).trim();
    // Normalize so "Akkarakunnu Anganwadi Center" matches logs stored as "Akkarakunnu Anganwadi"
    const centerVariants = [center];
    if (center.includes('Akkarakunnu') || center === DEFAULT_CENTER) {
      if (!centerVariants.includes(DEFAULT_CENTER)) centerVariants.push(DEFAULT_CENTER);
      if (!centerVariants.includes('Akkarakunnu Anganwadi Center')) centerVariants.push('Akkarakunnu Anganwadi Center');
    }
    const filter = { anganwadiCenter: { $in: centerVariants } };
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
    const logs = await WasteLog.find(filter).sort({ date: -1, createdAt: -1 }).limit(limit).lean();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const todayLogs = logs.filter(l => l.date && new Date(l.date) >= todayStart && new Date(l.date) < todayEnd);
    const collectedToday = todayLogs.filter(l => l.collectionStatus === 'Collected').reduce((s, l) => s + (l.quantity || 0), 0);
    const pendingToday = todayLogs.filter(l => l.collectionStatus === 'Pending').length;
    res.json({
      logs,
      summary: {
        todayCollectedKg: collectedToday,
        todayPendingCount: pendingToday,
        todayTotalEntries: todayLogs.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/waste-logs', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const { date, wasteType, status } = req.query;
    const filter = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setDate(dEnd.getDate() + 1);
      filter.date = { $gte: d, $lt: dEnd };
    }
    if (wasteType) filter.wasteType = wasteType;
    if (status) filter.collectionStatus = status;
    const logs = await WasteLog.find(filter).sort({ date: -1 }).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/waste-logs', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const worker = sanitizeWorker(req);
    const { date, anganwadiCenter, wasteType, quantity, quantityUnit, collectionStatus, remarks } = req.body;
    const log = await WasteLog.create({
      date: date ? new Date(date) : new Date(),
      anganwadiCenter: anganwadiCenter || DEFAULT_CENTER,
      wasteType: wasteType || 'Organic Waste',
      quantity: Number(quantity) || 0,
      quantityUnit: quantityUnit || 'kg',
      collectionStatus: collectionStatus || 'Collected',
      remarks: remarks || '',
      recordedBy: worker,
      createdBy: req.user?._id
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== DRAINAGE MONITORING ==========
router.get('/drainage', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const { ward } = req.query;
    const filter = { wardNumber: ward ? parseInt(ward, 10) : WARD_NUMBER };
    const reports = await DrainageReport.find(filter).sort({ reportedDate: -1 }).lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/drainage', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const worker = sanitizeWorker(req);
    const { drainLocation, wardNumber, blockageStatus, waterStagnation, mosquitoRiskLevel, cleaningStatus, remarks } = req.body;
    const report = await DrainageReport.create({
      drainLocation: drainLocation || '',
      wardNumber: wardNumber ?? WARD_NUMBER,
      blockageStatus: blockageStatus || 'No',
      waterStagnation: waterStagnation || 'No',
      mosquitoRiskLevel: mosquitoRiskLevel || 'Low',
      cleaningStatus: cleaningStatus || '',
      remarks: remarks || '',
      reportedBy: worker,
      createdBy: req.user?._id
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/drainage/:id', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const { blockageStatus, waterStagnation, mosquitoRiskLevel, cleaningStatus, remarks } = req.body;
    const update = {};
    if (blockageStatus) update.blockageStatus = blockageStatus;
    if (waterStagnation) update.waterStagnation = waterStagnation;
    if (mosquitoRiskLevel) update.mosquitoRiskLevel = mosquitoRiskLevel;
    if (cleaningStatus !== undefined) update.cleaningStatus = cleaningStatus;
    if (remarks !== undefined) update.remarks = remarks;
    const report = await DrainageReport.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== SANITATION ISSUES (with optional photo) ==========
// Allow both sanitation-worker and super-admin to list issues
const allowSanitationOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'sanitation-worker' || role === 'super-admin') return next();
  return res.status(403).json({ success: false, message: 'Forbidden' });
};

router.get('/issues', verifyFlexibleAuth, allowSanitationOrAdmin, async (req, res) => {
  try {
    const { status, priority, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priorityLevel = priority;
    if (type) filter.issueType = type;
    const issues = await SanitationIssue.find(filter).sort({ createdAt: -1 }).lean();
    res.json(issues);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/issues', verifyFlexibleAuth, checkRole('sanitation-worker'), upload.single('photo'), async (req, res) => {
  try {
    const worker = sanitizeWorker(req);
    const { issueType, description, location, priorityLevel } = req.body;
    const photoUrl = req.file ? `/uploads/sanitation/${req.file.filename}` : null;
    const issue = await SanitationIssue.create({
      issueType: issueType || 'Waste Overflow',
      description: description || '',
      location: location || '',
      priorityLevel: priorityLevel || 'Medium',
      photoUrl,
      status: 'Open',
      reportedBy: req.user?._id?.toString?.() || worker,
      reportedByName: worker,
      createdBy: req.user?._id
    });
    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/issues/:id', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const { status } = req.body;
    const update = {};
    if (status) update.status = status;
    if (status === 'Resolved') {
      update.resolvedAt = new Date();
      update.resolvedBy = sanitizeWorker(req);
    }
    const issue = await SanitationIssue.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== WEEKLY REPORTS ==========
router.get('/reports', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const reports = await SanitationReport.find({ wardNumber: WARD_NUMBER }).sort({ weekStart: -1 }).limit(20).lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reports/generate', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const worker = sanitizeWorker(req);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [tasksCompleted, wasteAgg, drainageIssues] = await Promise.all([
      SanitationTask.countDocuments({
        wardNumber: WARD_NUMBER,
        status: 'Completed',
        completedAt: { $gte: weekStart, $lte: weekEnd }
      }),
      WasteLog.aggregate([
        { $match: { date: { $gte: weekStart, $lte: weekEnd }, collectionStatus: 'Collected' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
      DrainageReport.countDocuments({
        wardNumber: WARD_NUMBER,
        reportedDate: { $gte: weekStart, $lte: weekEnd },
        $or: [{ blockageStatus: 'Yes' }, { mosquitoRiskLevel: 'High' }]
      })
    ]);

    const totalWaste = wasteAgg[0]?.total ?? 0;
    let hygieneStatus = 'Good';
    if (drainageIssues > 5 || tasksCompleted < 3) hygieneStatus = 'Needs Improvement';
    if (drainageIssues > 10) hygieneStatus = 'Poor';

    const report = await SanitationReport.create({
      reportType: 'weekly',
      weekStart,
      weekEnd,
      wardNumber: WARD_NUMBER,
      totalCleaningTasksCompleted: tasksCompleted,
      totalWasteCollectedKg: totalWaste,
      drainageIssuesDetected: drainageIssues,
      hygieneStatus,
      summary: `Ward ${WARD_NUMBER}: ${tasksCompleted} cleaning tasks completed, ${totalWaste} kg waste collected, ${drainageIssues} drainage/risk issues.`,
      generatedBy: worker,
      createdBy: req.user?._id
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== AI SANITATION PREDICTIONS ==========
router.get('/ai-predictions', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const [
      wasteByArea,
      issuesRecent,
      drainageBlocked,
      overdueCollections
    ] = await Promise.all([
      WasteLog.aggregate([
        { $match: { date: { $gte: weekAgo } } },
        { $group: { _id: '$anganwadiCenter', total: { $sum: '$quantity' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      SanitationIssue.find({ status: 'Open', createdAt: { $gte: weekAgo } }).select('location issueType priorityLevel').lean(),
      DrainageReport.find({ wardNumber: WARD_NUMBER, blockageStatus: 'Yes', reportedDate: { $gte: weekAgo } }).select('drainLocation mosquitoRiskLevel').lean(),
      WasteLog.countDocuments({ date: { $lt: now }, collectionStatus: 'Pending' })
    ]);

    const alerts = [];

    if (drainageBlocked.length > 0) {
      const loc = drainageBlocked[0].drainLocation || 'Ward 9';
      const risk = drainageBlocked[0].mosquitoRiskLevel === 'High' ? ' High mosquito breeding risk.' : '';
      alerts.push({
        type: 'drainage',
        level: 'high',
        message: `Drainage blockage detected near ${loc} in Ward 9. Immediate cleaning required.${risk}`,
        location: loc
      });
    }

    if (issuesRecent.length > 0) {
      const high = issuesRecent.filter(i => i.priorityLevel === 'High');
      if (high.length > 0) {
        const loc = high[0].location || 'Ward 9';
        alerts.push({
          type: 'issue',
          level: 'high',
          message: `High sanitation risk reported: ${high[0].issueType} at ${loc}. Immediate attention required.`,
          location: loc
        });
      }
    }

    if (overdueCollections > 0) {
      alerts.push({
        type: 'waste',
        level: 'medium',
        message: `${overdueCollections} waste collection(s) overdue. Schedule pickup to avoid overflow.`,
        location: DEFAULT_CENTER
      });
    }

    const highRiskAreas = [];
    wasteByArea.forEach(a => {
      if (a.total > 50 || a.count > 10) {
        highRiskAreas.push({
          area: a._id,
          message: `High waste accumulation in ${a._id}. Consider more frequent collection.`
        });
      }
    });
    if (highRiskAreas.length > 0) {
      alerts.push({
        type: 'prediction',
        level: 'medium',
        message: highRiskAreas[0].message,
        location: highRiskAreas[0].area
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        level: 'low',
        message: 'No high-risk sanitation areas detected this week. Continue routine monitoring.',
        location: 'Ward 9'
      });
    }

    res.json({ predictions: alerts });
  } catch (err) {
    console.error('AI predictions error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== NOTIFICATIONS / ALERTS ==========
router.get('/notifications', verifyFlexibleAuth, checkRole('sanitation-worker'), async (req, res) => {
  try {
    const pendingTasks = await SanitationTask.countDocuments({ status: 'Pending', wardNumber: WARD_NUMBER });
    const overdueWaste = await WasteLog.countDocuments({ collectionStatus: 'Pending', date: { $lt: new Date() } });
    const openIssues = await SanitationIssue.countDocuments({ status: 'Open' });
    const blockedDrains = await DrainageReport.countDocuments({ wardNumber: WARD_NUMBER, blockageStatus: 'Yes', reportedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

    const notifications = [];
    if (pendingTasks > 0) {
      notifications.push({
        id: 'tasks',
        type: 'task',
        title: 'Pending cleaning tasks',
        message: `${pendingTasks} cleaning task(s) pending`,
        priority: 'high',
        actionRequired: true
      });
    }
    if (overdueWaste > 0) {
      notifications.push({
        id: 'waste',
        type: 'waste',
        title: 'Waste collection overdue',
        message: 'Waste collection overdue',
        priority: 'critical',
        actionRequired: true
      });
    }
    if (blockedDrains > 0) {
      notifications.push({
        id: 'drainage',
        type: 'drainage',
        title: 'Drainage blockage detected',
        message: 'Drainage blockage detected in Ward 9',
        priority: 'critical',
        actionRequired: true
      });
    }
    if (openIssues > 0) {
      notifications.push({
        id: 'issues',
        type: 'issue',
        title: 'Open sanitation issues',
        message: `${openIssues} sanitation issue(s) open`,
        priority: 'medium',
        actionRequired: true
      });
    }
    if (notifications.length === 0) {
      notifications.push({
        id: 'ok',
        type: 'info',
        title: 'All clear',
        message: 'No pending alerts',
        priority: 'low',
        actionRequired: false
      });
    }
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
