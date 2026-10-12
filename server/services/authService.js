import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User, ROLES } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
// Pre-computed hash so login takes similar time whether or not the email exists.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO5y1m5Xo1o8mP8kqk1b3m2k8y3f9yQ6a';

export async function registerStudent({ fullName, email, password, phone, studentId }) {
  // Role is fixed here; the validation schema never accepts one.
  return User.create({ fullName, email, password, phone, studentId, role: ROLES.STUDENT });
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH).then(() => false);
  if (!passwordMatches) throw new ApiError(401, 'Invalid email or password');
  if (user.status !== 'active') throw new ApiError(403, 'This account has been deactivated');
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
}

// Returns the raw token only so the caller can deliver it. Only a hash is stored.
export async function createPasswordReset(email) {
  const user = await User.findOne({ email, status: 'active' });
  if (!user) return null;
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = sha256(rawToken);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();
  return { user, rawToken };
}

export async function resetPassword({ token, newPassword }) {
  const user = await User.findOne({
    passwordResetTokenHash: sha256(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');
  user.password = newPassword;
  user.passwordResetTokenHash = undefined; // single use
  user.passwordResetExpires = undefined;
  await user.save();
}

export const devResetLink = (rawToken) => `${env.clientUrls[0]}/reset-password?token=${rawToken}`;
