const mongoose = require('mongoose');

const ashaVisitSchema = new mongoose.Schema({
  womanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Woman',
    required: true
  },
  
  // Visit Details
  visitDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  visitType: {
    type: String,
    enum: ['home', 'center', 'phone', 'emergency'],
    required: true
  },
  visitPurpose: {
    type: String,
    enum: ['routine', 'follow_up', 'emergency', 'health_check', 'education', 'supplement_delivery', 'vaccination_reminder'],
    required: true
  },
  
  // Location Details
  location: {
    type: String,
    required: true
  },
  gpsCoordinates: {
    latitude: Number,
    longitude: Number
  },
  
  // ASHA Worker Information
  ashaWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ashaWorkerName: {
    type: String,
    required: true
  },
  
  // Visit Duration
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  },
  
  // Health Assessment
  healthAssessment: {
    generalCondition: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      required: true
    },
    vitalSigns: {
      bp: {
        systolic: Number,
        diastolic: Number
      },
      pulse: Number,
      temperature: Number,
      weight: Number,
      height: Number
    },
    symptoms: [{
      type: String,
      enum: ['headache', 'dizziness', 'swelling', 'bleeding', 'pain', 'fever', 'nausea', 'vomiting', 'fatigue', 'breathing_difficulty', 'other']
    }],
    symptomsDetails: String,
    
    // Specific pregnancy assessments
    fetalMovement: {
      type: String,
      enum: ['normal', 'decreased', 'absent', 'not_assessed']
    },
    fundalHeight: Number,
    fetalHeartRate: Number,
    
    // Risk assessment
    riskFactors: [{
      type: String,
      enum: ['anemia', 'hypertension', 'diabetes', 'obesity', 'underweight', 'advanced_age', 'previous_complications', 'multiple_pregnancy', 'bleeding', 'infection']
    }],
    riskScore: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  
  // Education and Counseling
  educationProvided: [{
    topic: {
      type: String,
      enum: ['nutrition', 'hygiene', 'family_planning', 'breastfeeding', 'newborn_care', 'danger_signs', 'immunization', 'supplements', 'exercise', 'rest']
    },
    duration: Number, // in minutes
    understanding: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    notes: String
  }],
  
  // Supplements and Medications
  supplementsProvided: {
    iron: {
      provided: Boolean,
      quantity: Number,
      dosage: String
    },
    calcium: {
      provided: Boolean,
      quantity: Number,
      dosage: String
    },
    folicAcid: {
      provided: Boolean,
      quantity: Number,
      dosage: String
    },
    other: [{
      name: String,
      quantity: Number,
      dosage: String
    }]
  },
  
  // Referrals
  referrals: [{
    to: {
      type: String,
      enum: ['doctor', 'hospital', 'primary_health_center', 'specialist', 'lab']
    },
    reason: String,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'emergency']
    },
    appointmentDate: Date,
    followUpRequired: Boolean,
    followUpDate: Date
  }],
  
  // Actions Taken
  actionsTaken: [{
    action: String,
    completed: Boolean,
    notes: String
  }],
  
  // Patient Feedback
  patientFeedback: {
    satisfaction: {
      type: String,
      enum: ['very_satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very_dissatisfied']
    },
    concerns: String,
    suggestions: String
  },
  
  // Next Visit Planning
  nextVisit: {
    planned: Boolean,
    date: Date,
    purpose: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    }
  },
  
  // Field Notes
  fieldNotes: {
    type: String,
    required: true
  },
  
  // Photos and Evidence
  photos: [{
    type: String, // URL or file path
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Weather and Environmental Conditions
  weatherConditions: {
    temperature: String,
    rainfall: String,
    roadConditions: {
      type: String,
      enum: ['good', 'fair', 'poor']
    },
    transportMode: {
      type: String,
      enum: ['walking', 'bicycle', 'motorcycle', 'car', 'public_transport']
    }
  },
  
  // Travel Information
  travelDistance: {
    type: Number // in kilometers
  },
  travelTime: {
    type: Number // in minutes
  },
  
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
  },
  
  // Digital Signature
  digitalSignature: {
    type: String
  },
  
  // Sync Status
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'synced'
  }
}, {
  timestamps: true
});

// Indexes
ashaVisitSchema.index({ womanId: 1, visitDate: -1 });
ashaVisitSchema.index({ ashaWorkerId: 1, visitDate: -1 });
ashaVisitSchema.index({ visitDate: -1 });
ashaVisitSchema.index({ status: 1 });
ashaVisitSchema.index({ 'healthAssessment.riskScore': 1 });

// Static methods
ashaVisitSchema.statics.getLatestByWoman = function(womanId) {
  return this.findOne({ womanId })
    .sort({ visitDate: -1 })
    .populate('ashaWorkerId', 'name email phone')
    .populate('verifiedBy', 'name email');
};

ashaVisitSchema.statics.getVisitHistory = function(womanId, limit = 10) {
  return this.find({ womanId })
    .sort({ visitDate: -1 })
    .limit(limit)
    .populate('ashaWorkerId', 'name email phone')
    .populate('verifiedBy', 'name email');
};

ashaVisitSchema.statics.getVisitStats = function(ashaWorkerId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        ashaWorkerId: new mongoose.Types.ObjectId(ashaWorkerId),
        visitDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$visitDate" } },
          visitType: "$visitType"
        },
        count: { $sum: 1 },
        avgDuration: { $avg: "$duration" },
        totalRiskScore: { $sum: "$healthAssessment.riskScore" }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        visits: {
          $push: {
            type: "$_id.visitType",
            count: "$count"
          }
        },
        totalVisits: { $sum: "$count" },
        avgDuration: { $avg: "$avgDuration" },
        avgRiskScore: { $avg: "$totalRiskScore" }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);
};

ashaVisitSchema.statics.getHighRiskWomen = function(ashaWorkerId, riskThreshold = 5) {
  return this.aggregate([
    {
      $match: {
        ashaWorkerId: new mongoose.Types.ObjectId(ashaWorkerId),
        'healthAssessment.riskScore': { $gte: riskThreshold }
      }
    },
    {
      $sort: { visitDate: -1 }
    },
    {
      $group: {
        _id: "$womanId",
        latestVisit: { $first: "$$ROOT" },
        maxRiskScore: { $max: "$healthAssessment.riskScore" },
        visitCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'women',
        localField: '_id',
        foreignField: '_id',
        as: 'woman'
      }
    },
    {
      $unwind: '$woman'
    },
    {
      $project: {
        womanId: '$_id',
        name: '$woman.name',
        age: '$woman.age',
        lmp: '$woman.lmp',
        phone: '$woman.phone',
        address: '$woman.address',
        latestVisitDate: '$latestVisit.visitDate',
        maxRiskScore: '$maxRiskScore',
        visitCount: '$visitCount',
        riskFactors: '$latestVisit.healthAssessment.riskFactors'
      }
    }
  ]);
};

// Instance methods
ashaVisitSchema.methods.calculateDuration = function() {
  if (this.endTime && this.startTime) {
    const diffMs = this.endTime - this.startTime;
    this.duration = Math.round(diffMs / (1000 * 60)); // Convert to minutes
    return this.duration;
  }
  return null;
};

ashaVisitSchema.methods.getVisitAlerts = function() {
  const alerts = [];
  
  // High risk alerts
  if (this.healthAssessment.riskScore >= 7) {
    alerts.push({
      type: 'high_risk',
      severity: 'critical',
      message: `High risk pregnancy detected (Score: ${this.healthAssessment.riskScore})`,
      recommendation: 'Immediate medical referral required'
    });
  } else if (this.healthAssessment.riskScore >= 5) {
    alerts.push({
      type: 'moderate_risk',
      severity: 'high',
      message: `Moderate risk pregnancy (Score: ${this.healthAssessment.riskScore})`,
      recommendation: 'Close monitoring and follow-up needed'
    });
  }
  
  // Symptom alerts
  if (this.healthAssessment.symptoms.includes('bleeding')) {
    alerts.push({
      type: 'bleeding',
      severity: 'critical',
      message: 'Bleeding reported during visit',
      recommendation: 'Emergency medical evaluation required'
    });
  }
  
  if (this.healthAssessment.symptoms.includes('breathing_difficulty')) {
    alerts.push({
      type: 'respiratory_distress',
      severity: 'high',
      message: 'Breathing difficulty reported',
      recommendation: 'Immediate medical attention needed'
    });
  }
  
  // Referral alerts
  if (this.referrals.length > 0) {
    const urgentReferrals = this.referrals.filter(r => r.urgency === 'emergency');
    if (urgentReferrals.length > 0) {
      alerts.push({
        type: 'emergency_referral',
        severity: 'critical',
        message: `${urgentReferrals.length} emergency referral(s) made`,
        recommendation: 'Ensure immediate follow-up on referrals'
      });
    }
  }
  
  return alerts;
};

ashaVisitSchema.methods.getVisitSummary = function() {
  return {
    visitId: this._id,
    date: this.visitDate,
    type: this.visitType,
    purpose: this.visitPurpose,
    duration: this.duration,
    location: this.location,
    ashaWorker: this.ashaWorkerName,
    generalCondition: this.healthAssessment.generalCondition,
    riskScore: this.healthAssessment.riskScore,
    symptomsCount: this.healthAssessment.symptoms.length,
    educationTopics: this.educationProvided.map(e => e.topic),
    supplementsProvided: Object.keys(this.supplementsProvided).filter(key => 
      this.supplementsProvided[key].provided
    ),
    referralsCount: this.referrals.length,
    nextVisitPlanned: this.nextVisit.planned,
    nextVisitDate: this.nextVisit.date
  };
};

module.exports = mongoose.model('ASHAVisit', ashaVisitSchema);
