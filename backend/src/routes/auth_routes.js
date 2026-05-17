import express from 'express';

import {
  register,
  login,
  verifyEmail,
} from '../controllers/auth_controller.js';

import { validateJson } from '../middleware/validator_middleware.js';

import {
  registerValidator,
  loginValidator,
} from '../validators/auth_validator.js';

const router = express.Router();

/* =========================================
   AUTH ROUTES
========================================= */

// Register user
router.post('/register', validateJson(registerValidator), register);

// Login user
router.post('/login', validateJson(loginValidator), login);

// Verify email — no body, no validation needed
router.get('/verify-email', verifyEmail);

export default router;
