const express = require('express');
const { AuthController } = require('../controllers');
const { validateMiddleware, authMiddleware } = require('../middleware');
const { loginSchema, registerSchema, refreshTokenSchema } = require('../validators');
const { loginLimiter } = require('../middleware/rate_limit_middleware');

const router = express.Router();

router.post('/login', loginLimiter, validateMiddleware(loginSchema, 'body'), AuthController.login);
router.post('/register', validateMiddleware(registerSchema, 'body'), AuthController.register);
router.post('/refresh-token', authMiddleware, validateMiddleware(refreshTokenSchema, 'body'), AuthController.refreshToken);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/logout-all', authMiddleware, AuthController.logoutAll);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;
