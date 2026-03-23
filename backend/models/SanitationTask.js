const mongoose = require('mongoose');

const sanitationTaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  wardNumber: { type: Number, required: true, default: 9 },
  areaName: { type: String, required: true, trim: true },
  taskType: {
    type: String,
    required: true,
    enum: ['Road Cleaning', 'Drain Cleaning', 'Garbage Removal', 'Public Area Cleaning']
  },
  assignedWorker: { type: String, required: true, trim: true },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  remarks: { type: String, trim: true },
  completedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

sanitationTaskSchema.index({ wardNumber: 1, date: -1 });
sanitationTaskSchema.index({ status: 1 });
sanitationTaskSchema.index({ assignedWorker: 1 });

module.exports = mongoose.model('SanitationTask', sanitationTaskSchema);
