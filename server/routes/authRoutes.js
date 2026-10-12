import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import * as s from '../validators/authSchemas.js';
import { profileSchema } from '../validators/memberSchemas.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later', errors: [] },
});

router.post('/register', authLimiter, validateBody(s.registerSchema), ctrl.register);
router.post('/login', authLimiter, validateBody(s.loginSchema), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.patch('/profile', authenticate, validateBody(profileSchema), ctrl.updateProfile);
router.post('/change-password', authenticate, validateBody(s.changePasswordSchema), ctrl.changePassword);
router.post('/forgot-password', authLimiter, validateBody(s.forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(s.resetPasswordSchema), ctrl.resetPassword);

export default router;
