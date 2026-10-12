import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', schema);
