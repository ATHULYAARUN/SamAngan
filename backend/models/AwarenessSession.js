const mongoose = require('mongoose');

const awarenessSessionSchema = new mongoose.Schema({
  // ASHA Worker Information
  ashaArea: {
    type: String,
    required: [true, 'ASHA area is required'],
    trim: true,
  },
  
  ashaName: {
    type: String,
    trim: true,
  },
  
  // Session Details
  sessionTitle: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  
  sessionDate: {
    type: Date,
    required: [true, 'Session date is required'],
    default: Date.now,
  },
  
  audienceType: {
    type: String,
    required: [true, 'Audience type is required'],
    enum: {
      values: ['parents', 'adolescents', 'general', 'women', 'elderly'],
      message: 'Audience type must be parents, adolescents, general, women, or elderly'
    }
  },
  
  participantsCount: {
    type: Number,
    required: [true, 'Number of participants is required'],
    min: [1, 'At least 1 participant is required'],
    max: [1000, 'Participants count seems too high'],
  },
  
  // Session Content
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  
  topicsCovered: {
    type: [String],
    default: [],
  },
  
  outcomes: {
    type: String,
    trim: true,
    maxlength: [500, 'Outcomes cannot exceed 500 characters'],
  },
  
  // Location
  venue: {
    type: String,
    trim: true,
    maxlength: [200, 'Venue cannot exceed 200 characters'],
  },
  
  // File Upload
  fileUrl: {
    type: String,
    trim: true,
  },
  
  fileType: {
    type: String,
    enum: ['image', 'pdf', 'document'],
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['planned', 'completed', 'cancelled'],
    default: 'completed',
  },
  
  // Feedback
  feedback: {
    type: String,
    trim: true,
    maxlength: [500, 'Feedback cannot exceed 500 characters'],
  },
  
  rating: {
    type: Number,
    min: 1,
    max: 5,
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
awarenessSessionSchema.index({ ashaArea: 1, sessionDate: -1 });
awarenessSessionSchema.index({ audienceType: 1 });
awarenessSessionSchema.index({ status: 1 });
awarenessSessionSchema.index({ createdAt: -1 });

// Virtual for session month/year
awarenessSessionSchema.virtual('sessionMonth').get(function() {
  return this.sessionDate.toLocaleString('default', { month: 'long', year: 'numeric' });
});

// Method to check if session is upcoming
awarenessSessionSchema.methods.isUpcoming = function() {
  return this.sessionDate > new Date() && this.status === 'planned';
};

// Static method to get sessions by area and date range
awarenessSessionSchema.statics.getByAreaAndDateRange = function(area, startDate, endDate) {
  return this.find({
    ashaArea: area,
    sessionDate: { $gte: startDate, $lte: endDate }
  }).sort({ sessionDate: -1 });
};

// Static method to get session statistics
awarenessSessionSchema.statics.getStatsByArea = async function(area, startDate, endDate) {
  const match = { ashaArea: area };
  if (startDate && endDate) {
    match.sessionDate = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$audienceType',
        totalSessions: { $sum: 1 },
        totalParticipants: { $sum: '$participantsCount' },
        avgParticipants: { $avg: '$participantsCount' },
        avgRating: { $avg: '$rating' },
      }
    }
  ]);
  return stats;
};

// Static method to get monthly session count
awarenessSessionSchema.statics.getMonthlyCount = async function(area, year) {
  const stats = await this.aggregate([
    {
      $match: {
        ashaArea: area,
        sessionDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$sessionDate' },
        count: { $sum: 1 },
        participants: { $sum: '$participantsCount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  return stats;
};

const AwarenessSession = mongoose.model('AwarenessSession', awarenessSessionSchema);

module.exports = AwarenessSession;
