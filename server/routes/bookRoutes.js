import { Router } from 'express';
import * as ctrl from '../controllers/bookController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { bookBodySchema, bookUpdateSchema } from '../validators/bookSchemas.js';
import { ROLES } from '../models/User.js';

const router = Router();
const staff = [authenticate, authorize(ROLES.ADMIN, ROLES.LIBRARIAN)];

// Public catalogue
router.get('/', ctrl.list);
router.get('/categories', ctrl.categories);
router.get('/:id', ctrl.getOne);

// Staff-only management
router.post('/', ...staff, validateBody(bookBodySchema), ctrl.create);
router.put('/:id', ...staff, validateBody(bookUpdateSchema), ctrl.update);
router.delete('/:id', ...staff, ctrl.remove);

export default router;
