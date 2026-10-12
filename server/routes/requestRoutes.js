import { Router } from 'express';
import * as c from '../controllers/borrowController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { createRequestSchema, rejectRequestSchema } from '../validators/borrowSchemas.js';
import { ROLES } from '../models/User.js';

const router = Router();
const staff = authorize(ROLES.ADMIN, ROLES.LIBRARIAN);
router.use(authenticate);

router.post('/', authorize(ROLES.STUDENT), validateBody(createRequestSchema), c.createRequest);
router.get('/my', authorize(ROLES.STUDENT), c.myRequests);
router.get('/', staff, c.allRequests);
router.get('/:id', validateObjectId(), c.getRequest); // ownership enforced in the service
router.patch('/:id/approve', staff, validateObjectId(), c.approveRequest);
router.patch('/:id/reject', staff, validateObjectId(), validateBody(rejectRequestSchema), c.rejectRequest);
router.patch('/:id/cancel', authorize(ROLES.STUDENT), validateObjectId(), c.cancelRequest);

export default router;
