import { Router } from 'express';
import * as c from '../controllers/borrowController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { issueBookSchema } from '../validators/borrowSchemas.js';
import { ROLES } from '../models/User.js';

const router = Router();
const staff = authorize(ROLES.ADMIN, ROLES.LIBRARIAN);
router.use(authenticate);

router.get('/my', authorize(ROLES.STUDENT), c.myIssues);
router.get('/', staff, c.allIssues);
router.post('/', staff, validateBody(issueBookSchema), c.issueBook);
router.get('/:id', validateObjectId(), c.getIssue); // ownership enforced in the service
router.patch('/:id/return', staff, validateObjectId(), c.returnBook);

export default router;
