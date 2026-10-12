import mongoose from 'mongoose';

// Request status and loan status are separate. Approval = 'fulfilled' and links the BookIssue it created.
const schema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'rejected', 'cancelled', 'fulfilled'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 300 },
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'BookIssue' },
  },
  { timestamps: true }
);

schema.index({ book: 1, student: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export const BorrowRequest = mongoose.model('BorrowRequest', schema);
