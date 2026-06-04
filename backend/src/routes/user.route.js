import express from 'express';
import {
  getUsersCount,
  getAllUsers,
  getUserByID,
  postUser,
  patchUser,
  deleteUser,
  getProfile,
  updateProfile,
} from '../controllers/user.controller.js';

import {
  userIdValidator,
  createUserValidator,
  patchUserValidator,
  updateProfileValidator,
  getUsersValidator,
} from '../validators/user.validator.js';

import { validateSchema } from '../middlewares/schema_validator.middleware.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// admin middleware
const admin = [verifyJWT, authorizeRoles('admin')];

router.get('/count', getUsersCount);

// get own profile
router.get('/profile', verifyJWT, getProfile);

// update own profile
router.patch('/profile', verifyJWT, validateSchema(updateProfileValidator, 'body'), updateProfile);

// get users list
router.get('/', ...admin, validateSchema(getUsersValidator, 'query'), getAllUsers);

// get user by id
router.get('/:id', ...admin, validateSchema(userIdValidator, 'params'), getUserByID);

// create user
router.post('/', ...admin, validateSchema(createUserValidator, 'body'), postUser);

// update user
router.patch('/:id', ...admin, validateSchema(patchUserValidator, 'body'), patchUser);

// delete user
router.delete('/:id', ...admin, validateSchema(userIdValidator, 'params'), deleteUser);

export default router;
