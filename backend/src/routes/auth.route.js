import express from 'express';
import { login, verifyEmail, logout, forgotPassword, resetPassword } from '../controllers/auth.controller.js';

import {
  loginValidator,
  resetPasswordValidator,
  forgotPasswordValidator,
} from '../validators/auth.validator.js';

import { validateSchema } from '../middlewares/schema.validator.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// login user
router.post('/login', validateSchema(loginValidator), login);

// verify email
router.get('/verify-email', verifyEmail);

// forgot password
router.post('/forgot-password', validateSchema(forgotPasswordValidator), forgotPassword);

// reset password
router.post('/reset-password', validateSchema(resetPasswordValidator), resetPassword);

// logout user
router.post('/logout', verifyJWT, logout);

export default router;
