// profile routes — logged-in user's own profile
import { Router } from 'express';
import * as ctrl from '../controllers/profile_controller.js';
import { authenticate } from '../middleware/auth_middleware.js';
import { handleProfileUpload } from '../middleware/upload_middleware.js';
import validate from '../middleware/validate_middleware.js';
import { updateProfileValidator } from '../validators/user_validators.js';

const router = Router();

router.use(authenticate); // all profile routes require auth

router.get('/', ctrl.getProfile);
router.patch('/', handleProfileUpload, updateProfileValidator, validate, ctrl.updateProfile);

export default router;