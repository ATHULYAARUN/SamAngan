const mongoose = require('mongoose');

const ashaFieldVisitSchema = new mongoose.Schema({
  ashaArea: { type: String, required: true, trim: true },
  ashaName: { type: String, trim: true },
  visitDate: { type: Date, required: true, default: Date.now },
  personType: {
    type: String,
    required: true,
    enum: ['child', 'woman', 'adolescent']
  },
  personName: { type: String, required: true, trim: true },
  age: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  hemoglobin: { type: Number },
  bloodPressure: { type: String },
  temperature: { type: String },
  muac: { type: Number },
  location: { type: String, trim: true },
  healthNotes: { type: String },
  remarks: { type: String },
  vaccination: {
    type: { type: String },
    dose: { type: String },
    date: { type: Date },
    nextDue: { type: Date }
  },
  supplements: {
    iron: { type: Boolean, default: false },
    vitaminA: { type: Boolean, default: false },
    deworming: { type: Boolean, default: false },
    calcium: { type: Boolean, default: false },
    folicAcid: { type: Boolean, default: false }
  },
  healthIndicators: {
    anemia: { type: Boolean, default: false },
    malnutrition: { type: Boolean, default: false },
    highRiskPregnancy: { type: Boolean, default: false },
    immunizationDelay: { type: Boolean, default: false },
    developmentalDelays: { type: Boolean, default: false }
  },
  referrals: {
    referred: { type: Boolean, default: false },
    facility: { type: String },
    reason: { type: String },
    urgency: { type: String, enum: ['routine', 'urgent', 'emergency'] }
  },
  followUp: {
    required: { type: Boolean, default: false },
    date: { type: Date },
    notes: { type: String }
  },
  photos: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ashaFieldVisitSchema.index({ ashaArea: 1, visitDate: -1 });
ashaFieldVisitSchema.index({ personType: 1 });
ashaFieldVisitSchema.index({ personName: 'text' });

module.exports = mongoose.model('ASHAFieldVisit', ashaFieldVisitSchema);
