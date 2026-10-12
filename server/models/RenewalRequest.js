import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'BookIssue', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 300 },
    previousDueDate: { type: Date },
    newDueDate: { type: Date },
  },
  { timestamps: true }
);

schema.index({ issue: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export const RenewalRequest = mongoose.model('RenewalRequest', schema);
