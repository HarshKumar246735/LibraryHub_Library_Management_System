import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 400 },
    isRead: { type: Boolean, default: false },
    // Used by scheduled jobs so re-running them never creates the same notification twice.
    dedupeKey: { type: String },
  },
  { timestamps: true }
);
schema.index({ recipient: 1, isRead: 1, createdAt: -1 });
schema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });

export const Notification = mongoose.model('Notification', schema);
