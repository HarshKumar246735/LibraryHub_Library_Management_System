import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { env } from '../config/env.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import * as authService from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerStudent(req.body);
  setAuthCookie(res, signToken(user._id));
  sendSuccess(res, { status: 201, message: 'Account created successfully', data: user });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req.body);
  setAuthCookie(res, signToken(user._id));
  sendSuccess(res, { message: 'Logged in successfully', data: user });
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logged out' });
};

export const me = (req, res) => sendSuccess(res, { message: 'Current user', data: req.user });

export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  sendSuccess(res, { message: 'Profile updated', data: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  sendSuccess(res, { message: 'Password changed successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.createPasswordReset(req.body.email);
  // No email provider is integrated. In development only, the link is printed to the server console.
  if (result && !env.isProduction) console.log(`[dev] Password reset link for ${result.user.email}: ${authService.devResetLink(result.rawToken)}`);
  // Same response whether or not the account exists, so emails cannot be enumerated.
  sendSuccess(res, { message: 'If an account exists for that email, a reset link has been generated' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, { message: 'Password reset successfully. You can now log in' });
});
