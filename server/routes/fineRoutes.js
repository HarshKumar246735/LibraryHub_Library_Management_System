import { Router } from 'express';
import * as c from '../controllers/financeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { recordPaymentSchema, waiveSchema } from '../validators/borrowSchemas.js';
import { ROLES } from '../models/User.js';

const router = Router();
const staff = authorize(ROLES.ADMIN, ROLES.LIBRARIAN);
router.use(authenticate);

router.get('/my', authorize(ROLES.STUDENT), c.myFines);
router.get('/', staff, c.allFines);
router.get('/:id', validateObjectId(), c.getFine); // ownership enforced in the service
router.post('/:id/payments', staff, validateObjectId(), validateBody(recordPaymentSchema), c.pay);
router.patch('/:id/waive', authorize(ROLES.ADMIN), validateObjectId(), validateBody(waiveSchema), c.waive); // admin only

export default router;
