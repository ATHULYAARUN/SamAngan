const mongoose = require('mongoose');

const supplementTrackingSchema = new mongoose.Schema({
  womanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Woman',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Iron Supplements
  iron: {
    prescribed: {
      type: Boolean,
      default: false
    },
    dosage: {
      type: String, // e.g., "100mg", "200mg"
      default: "100mg"
    },
    frequency: {
      type: String,
      enum: ['daily', 'twice_daily', 'weekly'],
      default: 'daily'
    },
    taken: {
      type: Boolean,
      default: false
    },
    quantity: {
      type: Number,
      default: 1
    },
    sideEffects: [{
      type: String,
      enum: ['constipation', 'nausea', 'stomach_pain', 'dark_stools', 'other']
    }],
    notes: String
  },
  
  // Calcium Supplements
  calcium: {
    prescribed: {
      type: Boolean,
      default: false
    },
    dosage: {
      type: String,
      default: "500mg"
    },
    frequency: {
      type: String,
      enum: ['daily', 'twice_daily'],
      default: 'daily'
    },
    taken: {
      type: Boolean,
      default: false
    },
    quantity: {
      type: Number,
      default: 1
    },
    sideEffects: [{
      type: String,
      enum: ['constipation', 'kidney_stones', 'other']
    }],
    notes: String
  },
  
  // Folic Acid
  folicAcid: {
    prescribed: {
      type: Boolean,
      default: false
    },
    dosage: {
      type: String,
      default: "5mg"
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily'
    },
    taken: {
      type: Boolean,
      default: false
    },
    quantity: {
      type: Number,
      default: 1
    },
    notes: String
  },
  
  // Other Supplements
  otherSupplements: [{
    name: String,
    dosage: String,
    frequency: String,
    taken: Boolean,
    notes: String
  }],
  
  // Compliance Tracking
  complianceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Who recorded this
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedByRole: {
    type: String,
    enum: ['asha', 'anganwadi', 'doctor', 'nurse', 'self'],
    required: true
  },
  
  // Visit Information
  visitType: {
    type: String,
    enum: ['home', 'center', 'hospital', 'phone', 'self'],
    required: true
  },
  
  // Notes
  notes: {
    type: String
  },
  
  // Next refill reminder
  nextRefillDate: {
    type: Date
  },
  
  // Adherence Issues
  adherenceIssues: [{
    type: String,
    enum: ['forgot', 'side_effects', 'cost', 'availability', 'lack_of_understanding', 'other']
  }],
  
  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
supplementTrackingSchema.index({ womanId: 1, date: -1 });
supplementTrackingSchema.index({ date: -1 });
supplementTrackingSchema.index({ recordedBy: 1 });

// Static methods
supplementTrackingSchema.statics.getLatestByWoman = function(womanId) {
  return this.findOne({ womanId }).sort({ date: -1 }).populate('recordedBy', 'name email');
};

supplementTrackingSchema.statics.getComplianceStats = function(womanId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        womanId: new mongoose.Types.ObjectId(womanId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        ironTaken: { $sum: { $cond: ['$iron.taken', 1, 0] } },
        calciumTaken: { $sum: { $cond: ['$calcium.taken', 1, 0] } },
        folicAcidTaken: { $sum: { $cond: ['$folicAcid.taken', 1, 0] } }
      }
    },
    {
      $project: {
        ironCompliance: { $multiply: [{ $divide: ['$ironTaken', '$totalDays'] }, 100] },
        calciumCompliance: { $multiply: [{ $divide: ['$calciumTaken', '$totalDays'] }, 100] },
        folicAcidCompliance: { $multiply: [{ $divide: ['$folicAcidTaken', '$totalDays'] }, 100] },
        overallCompliance: {
          $multiply: [
            { $divide: [
              { $add: ['$ironTaken', '$calciumTaken', '$folicAcidTaken'] },
              { $multiply: ['$totalDays', 3] }
            ]},
            100
          ]
        }
      }
    }
  ]);
};

// Instance methods
supplementTrackingSchema.methods.calculateCompliance = function() {
  let totalPrescribed = 0;
  let totalTaken = 0;
  
  if (this.iron.prescribed) {
    totalPrescribed += 1;
    if (this.iron.taken) totalTaken += 1;
  }
  
  if (this.calcium.prescribed) {
    totalPrescribed += 1;
    if (this.calcium.taken) totalTaken += 1;
  }
  
  if (this.folicAcid.prescribed) {
    totalPrescribed += 1;
    if (this.folicAcid.taken) totalTaken += 1;
  }
  
  this.complianceScore = totalPrescribed > 0 ? Math.round((totalTaken / totalPrescribed) * 100) : 0;
  return this.complianceScore;
};

supplementTrackingSchema.methods.getAdherenceAlerts = function() {
  const alerts = [];
  
  if (this.complianceScore < 50) {
    alerts.push({
      type: 'low_compliance',
      severity: 'high',
      message: `Very low supplement compliance: ${this.complianceScore}%`,
      recommendation: 'Immediate counseling and support needed'
    });
  } else if (this.complianceScore < 75) {
    alerts.push({
      type: 'moderate_compliance',
      severity: 'medium',
      message: `Low supplement compliance: ${this.complianceScore}%`,
      recommendation: 'Counseling on importance of supplements'
    });
  }
  
  if (this.iron.prescribed && !this.iron.taken) {
    alerts.push({
      type: 'missed_iron',
      severity: 'medium',
      message: 'Iron supplement missed',
      recommendation: 'Iron is crucial for preventing anemia'
    });
  }
  
  if (this.adherenceIssues.length > 0) {
    alerts.push({
      type: 'adherence_issues',
      severity: 'medium',
      message: `Adherence issues reported: ${this.adherenceIssues.join(', ')}`,
      recommendation: 'Address specific barriers to adherence'
    });
  }
  
  return alerts;
};

module.exports = mongoose.model('SupplementTracking', supplementTrackingSchema);
