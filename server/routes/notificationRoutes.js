import { Router } from 'express';
import * as c from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();
router.use(authenticate);
router.get('/', c.list);
router.patch('/read-all', c.readAll); // before '/:id/read'
router.patch('/:id/read', validateObjectId(), c.read);
export default router;
