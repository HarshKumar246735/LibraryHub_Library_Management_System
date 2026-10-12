import { Router } from 'express';
import * as c from '../controllers/memberController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { createMemberSchema, updateMemberSchema, statusSchema, roleSchema } from '../validators/memberSchemas.js';
import { ROLES } from '../models/User.js';

const router = Router();
const admin = authorize(ROLES.ADMIN);
router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN, ROLES.LIBRARIAN), c.list);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.LIBRARIAN), validateObjectId(), c.getOne);
router.post('/', admin, validateBody(createMemberSchema), c.create); // only admins create staff accounts
router.patch('/:id', admin, validateObjectId(), validateBody(updateMemberSchema), c.update);
router.patch('/:id/status', admin, validateObjectId(), validateBody(statusSchema), c.status);
router.patch('/:id/role', admin, validateObjectId(), validateBody(roleSchema), c.role);

export default router;
