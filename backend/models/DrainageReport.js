const mongoose = require('mongoose');

const drainageReportSchema = new mongoose.Schema({
  drainLocation: { type: String, required: true, trim: true },
  wardNumber: { type: Number, default: 9 },
  blockageStatus: { type: String, required: true, enum: ['Yes', 'No'] },
  waterStagnation: { type: String, required: true, enum: ['Yes', 'No'] },
  mosquitoRiskLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High']
  },
  cleaningStatus: { type: String, trim: true },
  remarks: { type: String, trim: true },
  reportedDate: { type: Date, default: Date.now },
  reportedBy: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

drainageReportSchema.index({ wardNumber: 1, reportedDate: -1 });
drainageReportSchema.index({ blockageStatus: 1, mosquitoRiskLevel: 1 });

module.exports = mongoose.model('DrainageReport', drainageReportSchema);
