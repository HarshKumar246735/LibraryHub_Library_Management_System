import mongoose from 'mongoose';

// Single document (key = 'default'). Fines snapshot these values when created, so changing them
// later never rewrites historical fines.
const schema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    finePerDay: { type: Number, required: true, min: 0 },
    graceDays: { type: Number, default: 0, min: 0 },
    maxFine: { type: Number, default: null, min: 0 },
    borrowDays: { type: Number, required: true, min: 1 },
    maxBorrowedBooks: { type: Number, required: true, min: 1 },
    maxRenewals: { type: Number, default: 2, min: 0 },
    blockIfOverdue: { type: Boolean, default: true },
    blockIfUnpaidFines: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LibrarySettings = mongoose.model('LibrarySettings', schema);
