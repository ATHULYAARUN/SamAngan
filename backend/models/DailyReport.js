const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema(
  {
    anganwadiCenter: { type: String, required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerName: { type: String, required: true },
    date: { type: Date, required: true, default: () => new Date().setHours(0, 0, 0, 0) },
    // Summary fields (optional, can be expanded later)
    attendancePresent: { type: Number, default: 0 },
    attendanceTotal: { type: Number, default: 0 },
    nutritionDistributed: { type: Number, default: 0 },
    healthCheckups: { type: Number, default: 0 },
    vaccinations: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    // Optional uploaded file
    filePath: { type: String },
    originalFilename: { type: String },
  },
  { timestamps: true }
);

// Ensure one report per center per day per worker
DailyReportSchema.index({ workerId: 1, date: 1 }, { unique: false });
DailyReportSchema.index({ anganwadiCenter: 1, date: 1 });

module.exports = mongoose.model('DailyReport', DailyReportSchema);
