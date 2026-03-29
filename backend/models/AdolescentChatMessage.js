const mongoose = require('mongoose');

const adolescentChatMessageSchema = new mongoose.Schema(
  {
    adolescentName: { type: String, required: true, trim: true, index: true },
    senderRole: { type: String, enum: ['adolescent', 'asha'], required: true },
    senderName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

adolescentChatMessageSchema.index({ adolescentName: 1, createdAt: -1 });

module.exports = mongoose.model('AdolescentChatMessage', adolescentChatMessageSchema);
