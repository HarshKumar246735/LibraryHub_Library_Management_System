import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = Object.freeze({ ADMIN: 'ADMIN', LIBRARIAN: 'LIBRARIAN', STUDENT: 'STUDENT' });
const BCRYPT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.STUDENT, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    phone: { type: String, trim: true, maxlength: 20 },
    studentId: { type: String, trim: true, maxlength: 40 },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Unique only when supplied.
userSchema.index({ studentId: 1 }, { unique: true, partialFilterExpression: { studentId: { $type: 'string' } } });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpires;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
