const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  womanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Woman',
    required: true
  },
  
  // Appointment Details
  type: {
    type: String,
    enum: ['routine_checkup', 'ultrasound', 'blood_test', 'vaccination', 'emergency', 'follow_up', 'delivery'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  
  // Location
  location: {
    type: String,
    enum: ['hospital', 'primary_health_center', 'anganwadi', 'home', 'clinic'],
    required: true
  },
  locationDetails: {
    type: String
  },
  
  // Healthcare Provider
  healthcareProvider: {
    name: String,
    type: {
      type: String,
      enum: ['doctor', 'nurse', 'midwife', 'asha', 'anganwadi']
    },
    contact: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'missed', 'rescheduled'],
    default: 'scheduled'
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Visit Information
  visitType: {
    type: String,
    enum: ['in_person', 'phone', 'video'],
    default: 'in_person'
  },
  
  // Preparation Instructions
  preparationInstructions: [{
    type: String
  }],
  
  // What to bring
  whatToBring: [{
    type: String
  }],
  
  // Vaccination Details (if applicable)
  vaccination: {
    vaccine: {
      type: String,
      enum: ['TT1', 'TT2', 'TT3', 'TDAP', 'influenza', 'covid', 'other']
    },
    dose: String,
    administered: {
      type: Boolean,
      default: false
    },
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    batchNumber: String,
    nextDueDate: Date
  },
  
  // Lab Tests (if applicable)
  labTests: [{
    name: String,
    type: {
      type: String,
      enum: ['blood', 'urine', 'ultrasound', 'other']
    },
    ordered: {
      type: Boolean,
      default: false
    },
    completed: {
      type: Boolean,
      default: false
    },
    results: String,
    normalRange: String
  }],
  
  // Outcome (for completed appointments)
  outcome: {
    findings: String,
    diagnosis: String,
    treatment: String,
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    followUpDate: Date,
    nextAppointmentDate: Date,
    notes: String
  },
  
  // Cancellation/Rescheduling
  cancellationReason: String,
  rescheduledFrom: Date,
  rescheduledTo: Date,
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['sms', 'phone', 'email', 'whatsapp']
    },
    scheduled: Date,
    sent: {
      type: Boolean,
      default: false
    }
  }],
  
  // Who created/updated
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Attendance
  attended: {
    type: Boolean,
    default: false
  },
  attendanceMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Cost and Payment
  cost: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'free', 'insurance'],
    default: 'free'
  },
  
  // Risk Assessment
  riskFactors: [String],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  }
}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ womanId: 1, scheduledDate: -1 });
appointmentSchema.index({ scheduledDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ type: 1 });
appointmentSchema.index({ createdBy: 1 });

// Static methods
appointmentSchema.statics.getUpcomingByWoman = function(womanId, limit = 5) {
  const now = new Date();
  return this.find({
    womanId,
    scheduledDate: { $gte: now },
    status: { $in: ['scheduled', 'confirmed', 'rescheduled'] }
  })
  .sort({ scheduledDate: 1 })
  .limit(limit)
  .populate('createdBy', 'name email')
  .populate('healthcareProvider');
};

appointmentSchema.statics.getMissedAppointments = function(womanId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    womanId,
    scheduledDate: { $gte: startDate, $lte: new Date() },
    status: 'missed'
  })
  .sort({ scheduledDate: -1 })
  .populate('createdBy', 'name email');
};

appointmentSchema.statics.getAppointmentStats = function(womanId, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        womanId: new mongoose.Types.ObjectId(womanId),
        scheduledDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

appointmentSchema.statics.getVaccinationSchedule = function(womanId) {
  return this.find({
    womanId,
    type: 'vaccination',
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .sort({ scheduledDate: 1 })
  .populate('createdBy', 'name email');
};

// Instance methods
appointmentSchema.methods.isOverdue = function() {
  const now = new Date();
  return this.scheduledDate < now && this.status === 'scheduled';
};

appointmentSchema.methods.getDaysUntil = function() {
  const now = new Date();
  const appointmentDate = new Date(this.scheduledDate);
  const diffTime = appointmentDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

appointmentSchema.methods.getReminderAlerts = function() {
  const alerts = [];
  const daysUntil = this.getDaysUntil();
  
  if (this.status === 'missed') {
    alerts.push({
      type: 'missed_appointment',
      severity: 'high',
      message: `Missed appointment: ${this.title}`,
      recommendation: 'Reschedule immediately and follow up'
    });
  }
  
  if (this.isOverdue()) {
    alerts.push({
      type: 'overdue_appointment',
      severity: 'medium',
      message: `Overdue appointment: ${this.title}`,
      recommendation: 'Contact patient to reschedule'
    });
  }
  
  if (daysUntil <= 1 && this.status === 'scheduled') {
    alerts.push({
      type: 'upcoming_appointment',
      severity: 'low',
      message: `Appointment tomorrow: ${this.title}`,
      recommendation: 'Send reminder to patient'
    });
  }
  
  if (daysUntil <= 3 && daysUntil > 1 && this.status === 'scheduled') {
    alerts.push({
      type: 'appointment_reminder',
      severity: 'info',
      message: `Appointment in ${daysUntil} days: ${this.title}`,
      recommendation: 'Prepare patient for appointment'
    });
  }
  
  return alerts;
};

appointmentSchema.methods.calculateGestationalWeek = function(lmp) {
  if (!lmp) return null;
  
  const appointmentDate = new Date(this.scheduledDate);
  const lmpDate = new Date(lmp);
  const diffTime = appointmentDate - lmpDate;
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  return diffWeeks;
};

module.exports = mongoose.model('Appointment', appointmentSchema);
