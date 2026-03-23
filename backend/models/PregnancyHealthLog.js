const mongoose = require('mongoose');

const pregnancyHealthLogSchema = new mongoose.Schema({
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
  // Vital Signs
  bp: {
    systolic: {
      type: Number,
      required: true
    },
    diastolic: {
      type: Number,
      required: true
    }
  },
  hb: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  bmi: {
    type: Number,
    required: true
  },
  glucose: {
    fasting: Number,
    postprandial: Number
  },
  
  // Symptoms and Conditions
  symptoms: [{
    type: String,
    enum: ['swelling', 'headache', 'dizziness', 'bleeding', 'pain', 'fever', 'nausea', 'vomiting', 'other']
  }],
  symptomsDetails: {
    type: String
  },
  
  // Medications and Supplements
  supplements: {
    iron: {
      taken: Boolean,
      dosage: String
    },
    calcium: {
      taken: Boolean,
      dosage: String
    },
    folicAcid: {
      taken: Boolean,
      dosage: String
    }
  },
  
  // Visit Information
  visitType: {
    type: String,
    enum: ['home', 'center', 'hospital', 'phone'],
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedByRole: {
    type: String,
    enum: ['asha', 'anganwadi', 'doctor', 'nurse'],
    required: true
  },
  
  // Risk Assessment
  riskFactors: [{
    type: String,
    enum: ['anemia', 'hypertension', 'diabetes', 'obesity', 'underweight', 'advanced_age', 'previous_complications', 'multiple_pregnancy']
  }],
  riskScore: {
    type: Number,
    min: 0,
    max: 10
  },
  
  // Notes and Recommendations
  notes: {
    type: String
  },
  recommendations: [{
    type: String
  }],
  followUpDate: {
    type: Date
  },
  
  // AI Prediction Results
  aiPrediction: {
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 1
    },
    riskFactors: [String],
    recommendations: [String],
    predictedAt: {
      type: Date
    }
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
  }
}, {
  timestamps: true
});

// Indexes for better performance
pregnancyHealthLogSchema.index({ womanId: 1, date: -1 });
pregnancyHealthLogSchema.index({ date: -1 });
pregnancyHealthLogSchema.index({ updatedBy: 1 });
pregnancyHealthLogSchema.index({ 'aiPrediction.riskLevel': 1 });

// Static methods
pregnancyHealthLogSchema.statics.getLatestByWoman = function(womanId) {
  return this.findOne({ womanId }).sort({ date: -1 }).populate('updatedBy', 'name email');
};

pregnancyHealthLogSchema.statics.getHistoryByWoman = function(womanId, limit = 10) {
  return this.find({ womanId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('updatedBy', 'name email');
};

pregnancyHealthLogSchema.statics.getHealthTrends = function(womanId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    womanId,
    date: { $gte: startDate }
  }).sort({ date: 1 });
};

// Instance methods
pregnancyHealthLogSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Anemia risk
  if (this.hb < 11) score += 2;
  if (this.hb < 9) score += 2;
  
  // Hypertension risk
  if (this.bp.systolic > 140 || this.bp.diastolic > 90) score += 2;
  if (this.bp.systolic > 160 || this.bp.diastolic > 100) score += 2;
  
  // BMI risk
  if (this.bmi < 18.5) score += 1;
  if (this.bmi > 30) score += 2;
  
  // Glucose risk
  if (this.glucose.fasting > 95) score += 1;
  if (this.glucose.postprandial > 140) score += 1;
  
  // Symptoms risk
  if (this.symptoms.includes('bleeding')) score += 3;
  if (this.symptoms.includes('swelling')) score += 1;
  if (this.symptoms.includes('dizziness')) score += 1;
  
  this.riskScore = Math.min(score, 10);
  return this.riskScore;
};

pregnancyHealthLogSchema.methods.getAlerts = function() {
  const alerts = [];
  
  if (this.hb < 11) {
    alerts.push({
      type: 'anemia',
      severity: this.hb < 9 ? 'high' : 'medium',
      message: `Low hemoglobin level: ${this.hb} g/dL`,
      recommendation: 'Increase iron supplements and diet'
    });
  }
  
  if (this.bp.systolic > 140 || this.bp.diastolic > 90) {
    alerts.push({
      type: 'hypertension',
      severity: this.bp.systolic > 160 || this.bp.diastolic > 100 ? 'high' : 'medium',
      message: `High blood pressure: ${this.bp.systolic}/${this.bp.diastolic} mmHg`,
      recommendation: 'Immediate medical consultation required'
    });
  }
  
  if (this.symptoms.includes('bleeding')) {
    alerts.push({
      type: 'bleeding',
      severity: 'critical',
      message: 'Bleeding detected - requires immediate attention',
      recommendation: 'Emergency medical evaluation needed'
    });
  }
  
  if (this.bmi > 30) {
    alerts.push({
      type: 'obesity',
      severity: 'medium',
      message: `High BMI: ${this.bmi}`,
      recommendation: 'Nutrition counseling and weight management'
    });
  }
  
  return alerts;
};

module.exports = mongoose.model('PregnancyHealthLog', pregnancyHealthLogSchema);
