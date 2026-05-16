import express from 'express';
import { AuthController } from '../controllers/index.js';
import { validateMiddleware, authMiddleware } from '../middleware/index.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validators/index.js';
import { loginLimiter } from '../middleware/rate_limit_middleware.js';

const router = express.Router();

router.post('/login', loginLimiter, validateMiddleware(loginSchema, 'body'), AuthController.login);
router.post('/register', validateMiddleware(registerSchema, 'body'), AuthController.register);
router.post('/refresh-token', authMiddleware, validateMiddleware(refreshTokenSchema, 'body'), AuthController.refreshToken);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/logout-all', authMiddleware, AuthController.logoutAll);
router.post('/reset-password', AuthController.resetPassword);

export default router;
