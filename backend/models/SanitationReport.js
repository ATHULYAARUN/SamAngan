const mongoose = require('mongoose');

const sanitationReportSchema = new mongoose.Schema({
  reportType: { type: String, required: true, default: 'weekly', enum: ['weekly', 'monthly'] },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  wardNumber: { type: Number, default: 9 },
  totalCleaningTasksCompleted: { type: Number, default: 0 },
  totalWasteCollectedKg: { type: Number, default: 0 },
  drainageIssuesDetected: { type: Number, default: 0 },
  hygieneStatus: { type: String, trim: true }, // e.g. "Good", "Needs Improvement"
  summary: { type: String, trim: true },
  generatedBy: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

sanitationReportSchema.index({ weekStart: -1 });
sanitationReportSchema.index({ wardNumber: 1, weekStart: -1 });

module.exports = mongoose.model('SanitationReport', sanitationReportSchema);
