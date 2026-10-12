import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import fineRoutes from './routes/fineRoutes.js';
import renewalRoutes from './routes/renewalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import { dashboardRouter, reportRouter, publicRouter } from './routes/reportRoutes.js';
import { requireCsrfHeader } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render sits behind a proxy

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin tools (no Origin header) and the configured frontends only.
        if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
        return cb(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));

  app.use('/api', requireCsrfHeader);
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/fines', fineRoutes);
  app.use('/api/renewals', renewalRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/public', publicRouter);
  // Feature routers are mounted here as each phase is added.

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
