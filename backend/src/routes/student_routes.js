// student routes — student-specific dashboard data
import { Router } from 'express';
import * as ctrl from '../controllers/student_controller.js';
import { authenticate } from '../middleware/auth_middleware.js';
import authorize from '../middleware/role_middleware.js';

const router = Router();

// student dashboard stats
router.get('/stats', authenticate, authorize('student'), ctrl.getStudentStats);

export default router;