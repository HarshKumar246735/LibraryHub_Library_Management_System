import { Router } from 'express';
import { dbState } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
  const database = dbState();
  res.status(database === 'connected' ? 200 : 503).json({
    success: database === 'connected',
    message: 'LibraryHub API health',
    data: { status: database === 'connected' ? 'ok' : 'degraded', database, uptimeSeconds: Math.round(process.uptime()) },
  });
});

export default router;
