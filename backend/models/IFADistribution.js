const mongoose = require('mongoose');

const ifaDistributionSchema = new mongoose.Schema(
  {
    beneficiaryType: {
      type: String,
      enum: ['adolescent', 'child', 'pregnant_woman'],
      required: true,
      index: true
    },
    beneficiaryName: { type: String, required: true, trim: true, index: true },
    distributedCount: { type: Number, default: 0 },
    consumedCount: { type: Number, default: 0 },
    missedDoses: { type: Number, default: 0 },
    compliancePercentage: { type: Number, default: 0 },
    lastDistributionDate: { type: Date },
    source: { type: String, default: 'asha-field-visit' },
    snapshotDate: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

ifaDistributionSchema.index({ beneficiaryType: 1, beneficiaryName: 1, snapshotDate: -1 });

module.exports = mongoose.model('IFADistribution', ifaDistributionSchema);
