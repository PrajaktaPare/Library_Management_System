import express from 'express';

import {
  getAllUsers,
  getUserByID,
  patchUser,
  postUser,
  putUser,
  deleteUser,
  getProfile,
  updateProfile,
} from '../controllers/user_controller.js';

import {
  verifyJWT,
  authorizeRoles,
} from '../middleware/auth_middleware.js';

import {
  validateJson,
  validateParams,
} from '../middleware/validator_middleware.js';

import {
  userIdValidator,
  createUserValidator,
  putUserValidator,
  patchUserValidator,
  updateProfileValidator,
} from '../validators/user_validator.js';

const router = express.Router();

/* =========================================
   PROFILE ROUTES
   Logged-in user manages their own profile
========================================= */

// Get own profile — no body, no params to validate
router.get(
  '/profile/me',
  verifyJWT,
  getProfile
);

// Update own profile — only name and phone allowed
router.patch(
  '/profile/me',
  verifyJWT,
  validateJson(updateProfileValidator),
  updateProfile
);

/* =========================================
   ADMIN ROUTES
   Only role = 'admin' can access these
========================================= */

// Get all users — filters/pagination handled in controller
router.get(
  '/',
  verifyJWT,
  authorizeRoles('1'),
  getAllUsers
);

// Get single user by id
router.get(
  '/:id',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(userIdValidator),
  getUserByID
);

// Create new user (admin sets is_active + is_verified = 1 directly)
router.post(
  '/',
  verifyJWT,
  authorizeRoles('1'),
  validateJson(createUserValidator),
  postUser
);

// Partial update — at least one field required
router.patch(
  '/:id',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(userIdValidator),
  validateJson(patchUserValidator),
  patchUser
);

// Full replacement — all fields required
router.put(
  '/:id',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(userIdValidator),
  validateJson(putUserValidator),
  putUser
);

// Delete user
router.delete(
  '/:id',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(userIdValidator),
  deleteUser
);

export default router;