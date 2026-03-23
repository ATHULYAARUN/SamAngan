const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  // Alert Details
  type: {
    type: String,
    enum: [
      'anemia',
      'hypertension',
      'bleeding',
      'missed_appointment',
      'high_risk_pregnancy',
      'low_compliance',
      'overdue_visit',
      'medication_adherence',
      'vaccination_due',
      'weight_abnormal',
      'glucose_abnormal',
      'infection_risk',
      'nutritional_deficiency',
      'emergency_referral',
      'system_generated'
    ],
    required: true
  },
  
  // Priority and Severity
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'urgent'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    required: true
  },
  
  // Related Entities
  womanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Woman',
    required: true
  },
  pregnancyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pregnancy'
  },
  
  // Alert Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  
  // Clinical Data that triggered the alert
  triggerData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Threshold Values
  thresholds: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Current Values
  currentValues: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Recommendations
  recommendations: [{
    type: String
  }],
  
  // Actions Required
  actionsRequired: [{
    action: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    },
    deadline: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Alert Status
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'in_progress', 'resolved', 'closed', 'dismissed'],
    default: 'active'
  },
  
  // Acknowledgment
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  acknowledgmentNotes: String,
  
  // Resolution
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  resolutionMethod: {
    type: String,
    enum: ['automatic', 'manual', 'system', 'escalation']
  },
  
  // Escalation
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedAt: Date,
  escalationReason: String,
  
  // Recurrence
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom']
  },
  nextOccurrence: Date,
  parentAlert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  },
  childAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  
  // Notification Settings
  notifications: {
    sms: {
      sent: Boolean,
      sentAt: Date,
      phoneNumber: String,
      status: String
    },
    email: {
      sent: Boolean,
      sentAt: Date,
      emailAddress: String,
      status: String
    },
    whatsapp: {
      sent: Boolean,
      sentAt: Date,
      phoneNumber: String,
      status: String
    },
    push: {
      sent: Boolean,
      sentAt: Date,
      deviceToken: String,
      status: String
    }
  },
  
  // Target Audience
  targetRoles: [{
    type: String,
    enum: ['asha', 'anganwadi', 'doctor', 'nurse', 'admin', 'woman', 'family']
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Source Information
  source: {
    type: String,
    enum: ['system', 'manual', 'ai_prediction', 'health_log', 'visit', 'appointment', 'lab_result'],
    required: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  sourceDetails: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // AI Prediction Data (if applicable)
  aiPrediction: {
    riskLevel: String,
    confidence: Number,
    factors: [String],
    modelVersion: String,
    predictedAt: Date
  },
  
  // Geographic Information
  location: {
    type: String
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  
  // Time Information
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  
  // Metadata
  tags: [String],
  category: {
    type: String,
    enum: ['clinical', 'administrative', 'educational', 'emergency', 'preventive', 'follow_up']
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  
  // External References
  externalReferences: [{
    system: String,
    referenceId: String,
    url: String
  }],
  
  // Compliance and Audit
  complianceStatus: {
    type: String,
    enum: ['compliant', 'non_compliant', 'pending_review']
  },
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    changes: mongoose.Schema.Types.Mixed,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ womanId: 1, status: 1 });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ priority: 1, status: 1 });
alertSchema.index({ triggeredAt: -1 });
alertSchema.index({ expiresAt: 1 });
alertSchema.index({ 'actionsRequired.assignedTo': 1 });
alertSchema.index({ targetUsers: 1 });

// Static methods
alertSchema.statics.getActiveAlerts = function(womanId) {
  return this.find({
    womanId,
    status: { $in: ['active', 'acknowledged', 'in_progress'] }
  })
  .sort({ priority: -1, triggeredAt: -1 })
  .populate('womanId', 'name phone')
  .populate('assignedTo', 'name email');
};

alertSchema.statics.getAlertsByType = function(type, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    type,
    triggeredAt: { $gte: startDate }
  })
  .sort({ triggeredAt: -1 })
  .populate('womanId', 'name phone');
};

alertSchema.statics.getHighPriorityAlerts = function(priority = 'high') {
  return this.find({
    priority: { $in: ['high', 'critical', 'urgent'] },
    status: { $in: ['active', 'acknowledged', 'in_progress'] }
  })
  .sort({ priority: -1, triggeredAt: -1 })
  .populate('womanId', 'name phone')
  .populate('assignedTo', 'name email');
};

alertSchema.statics.getAlertStats = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        triggeredAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          priority: '$priority',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        priorities: {
          $push: {
            priority: '$_id.priority',
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

alertSchema.statics.getEscalatedAlerts = function() {
  return this.find({
    escalated: true,
    status: { $in: ['active', 'acknowledged', 'in_progress'] }
  })
  .sort({ escalatedAt: -1 })
  .populate('womanId', 'name phone')
  .populate('escalatedTo', 'name email');
};

// Instance methods
alertSchema.methods.acknowledge = function(userId, notes) {
  this.status = 'acknowledged';
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  this.acknowledgmentNotes = notes;
  
  this.auditTrail.push({
    action: 'acknowledged',
    performedBy: userId,
    performedAt: new Date(),
    notes: notes
  });
  
  return this.save();
};

alertSchema.methods.resolve = function(userId, notes, method = 'manual') {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  this.resolutionNotes = notes;
  this.resolutionMethod = method;
  
  this.auditTrail.push({
    action: 'resolved',
    performedBy: userId,
    performedAt: new Date(),
    notes: notes,
    changes: { status: 'resolved' }
  });
  
  return this.save();
};

alertSchema.methods.escalate = function(userId, escalateTo, reason) {
  this.escalated = true;
  this.escalatedTo = escalateTo;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  
  this.auditTrail.push({
    action: 'escalated',
    performedBy: userId,
    performedAt: new Date(),
    notes: reason,
    changes: { escalated: true, escalatedTo: escalateTo }
  });
  
  return this.save();
};

alertSchema.methods.addAction = function(action, priority, deadline, assignedTo) {
  this.actionsRequired.push({
    action,
    priority,
    deadline,
    assignedTo,
    completed: false
  });
  
  return this.save();
};

alertSchema.methods.completeAction = function(actionId, userId) {
  const action = this.actionsRequired.id(actionId);
  if (action) {
    action.completed = true;
    action.completedAt = new Date();
    action.completedBy = userId;
  }
  
  return this.save();
};

alertSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

alertSchema.methods.canEscalate = function() {
  return !this.escalated && 
         this.status !== 'resolved' && 
         this.status !== 'closed' &&
         ['high', 'critical', 'urgent'].includes(this.priority);
};

alertSchema.methods.getUrgencyLevel = function() {
  const urgencyMap = {
    'urgent': 1,
    'critical': 2,
    'high': 3,
    'medium': 4,
    'low': 5
  };
  
  return urgencyMap[this.priority] || 5;
};

// Pre-save middleware
alertSchema.pre('save', function(next) {
  // Update version
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  // Set expiration for certain alert types
  if (this.isNew && !this.expiresAt) {
    const expirationMap = {
      'missed_appointment': 7, // 7 days
      'medication_adherence': 3, // 3 days
      'vaccination_due': 14, // 14 days
      'system_generated': 1 // 1 day
    };
    
    const days = expirationMap[this.type];
    if (days) {
      this.expiresAt = new Date();
      this.expiresAt.setDate(this.expiresAt.getDate() + days);
    }
  }
  
  next();
});

module.exports = mongoose.model('Alert', alertSchema);
