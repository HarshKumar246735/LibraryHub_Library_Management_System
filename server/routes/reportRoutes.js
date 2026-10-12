import { Router } from 'express';
import * as c from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../models/User.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/admin', authorize(ROLES.ADMIN), c.adminDashboard);
dashboardRouter.get('/librarian', authorize(ROLES.LIBRARIAN, ROLES.ADMIN), c.librarianDashboard);
dashboardRouter.get('/student', authorize(ROLES.STUDENT), c.studentDashboard);

export const reportRouter = Router();
reportRouter.use(authenticate, authorize(ROLES.ADMIN, ROLES.LIBRARIAN));
reportRouter.get('/borrowing', c.borrowing);
reportRouter.get('/inventory', c.inventory);
reportRouter.get('/fines', c.fines);
reportRouter.get('/categories', c.categories);

export const publicRouter = Router();
publicRouter.get('/stats', c.publicStats);
