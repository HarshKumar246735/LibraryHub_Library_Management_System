import mongoose from 'mongoose';

// "Overdue" is NOT stored: it is derived (status === 'issued' && dueDate < now),
// so an overdue loan stays an active record and no contradictory field can exist.
const bookIssueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    returnDate: { type: Date },
    status: { type: String, enum: ['issued', 'returned', 'lost'], default: 'issued', index: true },
    renewalCount: { type: Number, default: 0, min: 0 },
    borrowRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest' },
  },
  { timestamps: true }
);

// A student can hold only one active loan of the same book.
bookIssueSchema.index({ book: 1, student: 1 }, { unique: true, partialFilterExpression: { status: 'issued' } });

export const BookIssue = mongoose.model('BookIssue', bookIssueSchema);
