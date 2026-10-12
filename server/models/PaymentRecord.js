import mongoose from 'mongoose';

// Manual payment recording only (no payment gateway). One payment per fine; partial payments are not supported.
const schema = new mongoose.Schema(
  {
    fine: { type: mongoose.Schema.Types.ObjectId, ref: 'Fine', required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'upi', 'card', 'other'], required: true },
    reference: { type: String, trim: true, maxlength: 80 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PaymentRecord = mongoose.model('PaymentRecord', schema);
