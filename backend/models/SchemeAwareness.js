const mongoose = require('mongoose');

const schemeAwarenessSchema = new mongoose.Schema({
  ashaArea: { type: String, required: true, trim: true },
  beneficiaryType: {
    type: String,
    required: true,
    enum: ['child', 'pregnant_woman', 'adolescent']
  },
  beneficiaryId: { type: mongoose.Schema.Types.ObjectId, refPath: 'beneficiaryModel' },
  beneficiaryModel: { type: String, enum: ['Child', 'PregnantWoman', 'Adolescent'] },
  beneficiaryName: { type: String, required: true, trim: true },
  schemeCode: {
    type: String,
    required: true,
    enum: ['poshan', 'pmmvy', 'jsy', 'sukanya'],
    trim: true
  },
  schemeName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['aware', 'applied', 'benefiting'],
    default: 'aware'
  },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schemeAwarenessSchema.index({ ashaArea: 1, schemeCode: 1 });
schemeAwarenessSchema.index({ beneficiaryName: 'text' });

const SCHEME_NAMES = {
  poshan: 'POSHAN Abhiyaan',
  pmmvy: 'Pradhan Mantri Matru Vandana Yojana',
  jsy: 'Janani Suraksha Yojana',
  sukanya: 'Sukanya Samriddhi Yojana'
};
schemeAwarenessSchema.statics.getSchemeName = (code) => SCHEME_NAMES[code] || code;

module.exports = mongoose.model('SchemeAwareness', schemeAwarenessSchema);
