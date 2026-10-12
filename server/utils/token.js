import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'libraryhub_token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const signToken = (userId) => jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

const cookieBase = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite, // 'none' is required for Vercel -> Render (cross-site); it also needs secure=true
  path: '/',
});

export const setAuthCookie = (res, token) => res.cookie(COOKIE_NAME, token, { ...cookieBase(), maxAge: SEVEN_DAYS_MS });
export const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieBase());
