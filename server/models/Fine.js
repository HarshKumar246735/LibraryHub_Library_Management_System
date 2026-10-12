import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'BookIssue', required: true, unique: true }, // one fine per loan
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    daysLate: { type: Number, required: true, min: 0 },
    chargeableDays: { type: Number, required: true, min: 0 },
    ratePerDay: { type: Number, required: true, min: 0 }, // snapshot of the policy used
    status: { type: String, enum: ['pending', 'paid', 'waived'], default: 'pending', index: true },
    waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    waivedAt: { type: Date },
    waiveReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

export const Fine = mongoose.model('Fine', schema);
