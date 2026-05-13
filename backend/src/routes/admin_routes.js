// admin routes — dashboard stats (admin-only)
import { Router } from 'express';
import * as ctrl from '../controllers/admin_controller.js';
import { authenticate } from '../middleware/auth_middleware.js';
import authorize from '../middleware/role_middleware.js';

const router = Router();

// all admin routes require admin role
router.use(authenticate, authorize('admin'));

router.get('/stats', ctrl.getDashboardStats);
router.get('/recent-issues', ctrl.getRecentIssues);

export default router;