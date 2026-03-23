const mongoose = require('mongoose');

const sanitationIssueSchema = new mongoose.Schema({
  issueType: {
    type: String,
    required: true,
    enum: [
      'Waste Overflow',
      'Blocked Drain',
      'Garbage Dumping',
      'Mosquito Breeding Area',
      'Dirty Public Area'
    ]
  },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  priorityLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  photoUrl: { type: String, trim: true },
  status: {
    type: String,
    required: true,
    enum: ['Open', 'Resolved'],
    default: 'Open'
  },
  reportedBy: { type: String, trim: true },
  reportedByName: { type: String, trim: true },
  resolvedAt: { type: Date },
  resolvedBy: { type: String, trim: true },
  adminNotes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

sanitationIssueSchema.index({ status: 1, createdAt: -1 });
sanitationIssueSchema.index({ issueType: 1 });
sanitationIssueSchema.index({ priorityLevel: 1 });

module.exports = mongoose.model('SanitationIssue', sanitationIssueSchema);
