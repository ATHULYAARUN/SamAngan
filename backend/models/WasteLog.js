const mongoose = require('mongoose');

const wasteLogSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  anganwadiCenter: { type: String, required: true, default: 'Akkarakunnu Anganwadi', trim: true },
  wasteType: {
    type: String,
    required: true,
    enum: ['Organic Waste', 'Plastic Waste', 'Dry Waste', 'Medical Waste']
  },
  quantity: { type: Number, required: true, min: 0 },
  quantityUnit: { type: String, default: 'kg', enum: ['kg', 'bags', 'liters'] },
  collectionStatus: {
    type: String,
    required: true,
    enum: ['Collected', 'Pending'],
    default: 'Pending'
  },
  remarks: { type: String, trim: true },
  recordedBy: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

wasteLogSchema.index({ date: -1 });
wasteLogSchema.index({ anganwadiCenter: 1, date: -1 });
wasteLogSchema.index({ wasteType: 1, date: -1 });

module.exports = mongoose.model('WasteLog', wasteLogSchema);
