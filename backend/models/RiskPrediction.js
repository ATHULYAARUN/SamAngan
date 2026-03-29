const mongoose = require('mongoose');

const riskPredictionSchema = new mongoose.Schema(
  {
    beneficiaryType: {
      type: String,
      enum: ['adolescent', 'child', 'pregnant_woman'],
      required: true,
      index: true
    },
    beneficiaryName: { type: String, required: true, trim: true, index: true },
    riskType: { type: String, default: 'anemia' },
    riskStatus: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    reasons: [{ type: String }],
    recommendations: [{ type: String }],
    sourceVisitId: { type: mongoose.Schema.Types.ObjectId, ref: 'ASHAFieldVisit' },
    predictedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

riskPredictionSchema.index({ beneficiaryType: 1, beneficiaryName: 1, predictedAt: -1 });

module.exports = mongoose.model('RiskPrediction', riskPredictionSchema);
