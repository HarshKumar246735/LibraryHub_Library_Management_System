import { Router } from 'express';
import * as c from '../controllers/financeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { createRenewalSchema, rejectRequestSchema } from '../validators/borrowSchemas.js';
import { ROLES } from '../models/User.js';

const router = Router();
const staff = authorize(ROLES.ADMIN, ROLES.LIBRARIAN);
router.use(authenticate);

router.post('/', authorize(ROLES.STUDENT), validateBody(createRenewalSchema), c.createRenewal);
router.get('/my', authorize(ROLES.STUDENT), c.myRenewals);
router.get('/', staff, c.allRenewals);
router.patch('/:id/approve', staff, validateObjectId(), c.approveRenewal);
router.patch('/:id/reject', staff, validateObjectId(), validateBody(rejectRequestSchema), c.rejectRenewal);

export default router;
