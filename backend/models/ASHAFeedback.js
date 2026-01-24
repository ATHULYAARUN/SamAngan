const mongoose = require('mongoose');

const ashaFeedbackSchema = new mongoose.Schema({
  // ASHA Worker Information
  ashaArea: {
    type: String,
    required: [true, 'ASHA area is required'],
    trim: true,
  },
  
  ashaName: {
    type: String,
    required: [true, 'ASHA name is required'],
    trim: true,
  },
  
  ashaPhone: {
    type: String,
    trim: true,
  },
  
  // Feedback Details
  feedbackType: {
    type: String,
    required: [true, 'Feedback type is required'],
    enum: {
      values: ['health', 'sanitation', 'nutrition', 'infrastructure', 'other'],
      message: 'Invalid feedback type'
    }
  },
  
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be low, medium, high, or urgent'
    },
    default: 'medium',
  },
  
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  
  // Location Details
  location: {
    type: String,
    trim: true,
  },
  
  affectedPersons: {
    type: Number,
    min: [0, 'Affected persons cannot be negative'],
  },
  
  // File Attachment
  photoUrl: {
    type: String,
    trim: true,
  },
  
  attachmentType: {
    type: String,
    enum: ['image', 'document'],
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'in-progress', 'resolved', 'closed'],
    default: 'submitted',
  },
  
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  
  reviewedAt: {
    type: Date,
  },
  
  resolvedAt: {
    type: Date,
  },
  
  // Response & Actions
  response: {
    type: String,
    trim: true,
  },
  
  actionTaken: {
    type: String,
    trim: true,
  },
  
  respondedBy: {
    name: String,
    role: String,
    date: Date,
  },
  
  // Forwarding Information
  forwardedTo: [{
    role: {
      type: String,
      enum: ['aww', 'admin', 'supervisor', 'cdpo'],
    },
    name: String,
    forwardedAt: {
      type: Date,
      default: Date.now,
    },
    notified: {
      type: Boolean,
      default: false,
    }
  }],
  
  // Follow-up
  requiresFollowUp: {
    type: Boolean,
    default: false,
  },
  
  followUpDate: {
    type: Date,
  },
  
  followUpNotes: {
    type: String,
    trim: true,
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ashaFeedbackSchema.index({ ashaArea: 1, submittedAt: -1 });
ashaFeedbackSchema.index({ status: 1 });
ashaFeedbackSchema.index({ priority: 1 });
ashaFeedbackSchema.index({ feedbackType: 1 });
ashaFeedbackSchema.index({ createdAt: -1 });

// Virtual for days since submission
ashaFeedbackSchema.virtual('daysSinceSubmission').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.submittedAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
ashaFeedbackSchema.virtual('isOverdue').get(function() {
  if (this.status === 'resolved' || this.status === 'closed') {
    return false;
  }
  
  const daysSince = this.daysSinceSubmission;
  switch (this.priority) {
    case 'urgent':
      return daysSince > 1;
    case 'high':
      return daysSince > 3;
    case 'medium':
      return daysSince > 7;
    case 'low':
      return daysSince > 14;
    default:
      return false;
  }
});

// Method to mark as reviewed
ashaFeedbackSchema.methods.markAsReviewed = function() {
  this.status = 'under-review';
  this.reviewedAt = new Date();
  return this.save();
};

// Method to mark as resolved
ashaFeedbackSchema.methods.markAsResolved = function(actionTaken, respondedBy) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.actionTaken = actionTaken;
  this.respondedBy = respondedBy;
  return this.save();
};

// Method to forward feedback
ashaFeedbackSchema.methods.forwardTo = function(role, name) {
  this.forwardedTo.push({
    role,
    name,
    forwardedAt: new Date(),
    notified: false,
  });
  return this.save();
};

// Static method to get feedback by area and status
ashaFeedbackSchema.statics.getByAreaAndStatus = function(area, status) {
  return this.find({ ashaArea: area, status })
    .sort({ submittedAt: -1 });
};

// Static method to get feedback statistics
ashaFeedbackSchema.statics.getStatsByArea = async function(area) {
  const stats = await this.aggregate([
    { $match: { ashaArea: area } },
    {
      $group: {
        _id: {
          type: '$feedbackType',
          status: '$status'
        },
        count: { $sum: 1 },
      }
    }
  ]);
  return stats;
};

// Static method to get pending high-priority feedback
ashaFeedbackSchema.statics.getPendingHighPriority = function(area) {
  return this.find({
    ashaArea: area,
    priority: { $in: ['high', 'urgent'] },
    status: { $in: ['submitted', 'under-review'] }
  }).sort({ priority: -1, submittedAt: 1 });
};

const ASHAFeedback = mongoose.model('ASHAFeedback', ashaFeedbackSchema);

module.exports = ASHAFeedback;
