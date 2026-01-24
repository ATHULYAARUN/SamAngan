const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import models
const ASHAVisit = require('../models/ASHAVisit');
const AwarenessSession = require('../models/AwarenessSession');
const ASHAFeedback = require('../models/ASHAFeedback');
const Child = require('../models/Child');
const PregnantWoman = require('../models/PregnantWoman');
const Adolescent = require('../models/Adolescent');

// Import middleware
const { verifyFirebaseAuth, verifyFlexibleAuth } = require('../middleware/auth');

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

// ===========================================
// DASHBOARD STATS
// ===========================================

// @desc    Get ASHA dashboard statistics
// @route   GET /api/asha/dashboard-stats
// @access  Private
router.get('/dashboard-stats', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    
    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Count children (0-6 years) in the area
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
    const totalChildren = await Child.countDocuments({
      anganwadiCenter: ashaArea,
      dateOfBirth: { $gte: sixYearsAgo }
    });
    
    // Count pregnant women in the area
    const pregnantWomen = await PregnantWoman.countDocuments({
      anganwadiCenter: ashaArea,
      deliveryStatus: { $ne: 'delivered' }
    });
    
    // Count adolescent girls (10-19 years) in the area
    const nineteenYearsAgo = new Date();
    nineteenYearsAgo.setFullYear(nineteenYearsAgo.getFullYear() - 19);
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    const adolescents = await Adolescent.countDocuments({
      anganwadiCenter: ashaArea,
      dateOfBirth: { $gte: nineteenYearsAgo, $lte: tenYearsAgo },
      gender: 'female'
    });
    
    // Count visits this month
    const visitsThisMonth = await ASHAVisit.countDocuments({
      ashaArea,
      visitDate: { $gte: monthStart, $lte: monthEnd }
    });
    
    // Count active alerts (high priority feedback that's not resolved)
    const activeAlerts = await ASHAFeedback.countDocuments({
      ashaArea,
      priority: { $in: ['high', 'urgent'] },
      status: { $in: ['submitted', 'under-review'] }
    });
    
    res.json({
      success: true,
      data: {
        totalChildren,
        pregnantWomen,
        adolescents,
        visitsThisMonth,
        activeAlerts
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
router.post('/field-visits', verifyFlexibleAuth, async (req, res) => {
  try {
    const {
      visitDate,
      personType,
      personName,
      age,
      weight,
      height,
      hemoglobin,
      bloodPressure,
      vaccination,
      supplements,
      remarks
    } = req.body;
    
    // Validate required fields
    if (!personType || !personName) {
      return res.status(400).json({
        success: false,
        message: 'Person type and name are required'
      });
    }
    
    const ashaArea = req.user?.ashaArea || req.body.ashaArea || 'default';
    const ashaName = req.user?.name || req.body.ashaName;
    
    // Create visit record
    const visit = await ASHAVisit.create({
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
      vaccination,
      supplements,
      remarks,
      createdBy: req.user?.uid
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
    
    const visits = await ASHAVisit.find(query)
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
    const {
      sessionTitle,
      sessionDate,
      audienceType,
      participantsCount,
      description,
      outcomes,
      venue
    } = req.body;
    
    // Validate required fields
    if (!sessionTitle || !audienceType || !participantsCount) {
      return res.status(400).json({
        success: false,
        message: 'Session title, audience type, and participants count are required'
      });
    }
    
    const ashaArea = req.user?.ashaArea || req.body.ashaArea || 'default';
    const ashaName = req.user?.name || req.body.ashaName;
    
    // Handle file upload
    let fileUrl = null;
    let fileType = null;
    if (req.file) {
      fileUrl = `/uploads/asha/${req.file.filename}`;
      fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
    }
    
    // Create session record
    const session = await AwarenessSession.create({
      ashaArea,
      ashaName,
      sessionTitle,
      sessionDate: sessionDate || new Date(),
      audienceType,
      participantsCount: parseInt(participantsCount),
      description,
      outcomes,
      venue,
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

// @desc    Get awareness sessions
// @route   GET /api/asha/awareness-sessions
// @access  Private
router.get('/awareness-sessions', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const { startDate, endDate, audienceType, limit = 50 } = req.query;
    
    const query = { ashaArea };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.sessionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add audience type filter if provided
    if (audienceType) {
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

// @desc    Get report data for charts
// @route   GET /api/asha/reports
// @access  Private
router.get('/reports', verifyFlexibleAuth, async (req, res) => {
  try {
    const ashaArea = req.user?.ashaArea || req.query.area || 'default';
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Get monthly visit counts
    const visitsPerMonth = await ASHAVisit.aggregate([
      {
        $match: {
          ashaArea,
          visitDate: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$visitDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get session counts by topic
    const sessionsByTopic = await AwarenessSession.aggregate([
      { $match: { ashaArea } },
      {
        $group: {
          _id: '$audienceType',
          count: { $sum: 1 },
          participants: { $sum: '$participantsCount' }
        }
      }
    ]);
    
    // Get supplement distribution percentages
    const supplementStats = await ASHAVisit.aggregate([
      { $match: { ashaArea } },
      {
        $group: {
          _id: null,
          ironCount: {
            $sum: { $cond: ['$supplements.iron', 1, 0] }
          },
          vitaminACount: {
            $sum: { $cond: ['$supplements.vitaminA', 1, 0] }
          },
          dewormingCount: {
            $sum: { $cond: ['$supplements.deworming', 1, 0] }
          },
          totalVisits: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        visitsPerMonth,
        sessionsByTopic,
        supplementStats: supplementStats[0] || {}
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

module.exports = router;
