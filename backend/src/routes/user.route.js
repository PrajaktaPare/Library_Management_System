import express from 'express';
import {
  getAllUsers,
  getUserByID,
  postUser,
  patchUser,
  putUser,
  deleteUser,
  getProfile,
  updateProfile,
} from '../controllers/user.controller.js';
import {
  userIdValidator,
  createUserValidator,
  patchUserValidator,
  updateProfileValidator,
} from '../validators/user.validator.js';
import { validateSchema } from '../middlewares/schema.validator.middleware.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

const admin = [verifyJWT, authorizeRoles(1)];

// profile routes
router.get('/profile/me', verifyJWT, getProfile);
router.patch('/profile/me', verifyJWT, validateSchema(updateProfileValidator, 'body'), updateProfile);

// user routes
router.get('/', ...admin, getAllUsers);
router.get('/:id', ...admin, validateSchema(userIdValidator, 'params'), getUserByID);
router.post('/', ...admin, validateSchema(createUserValidator, 'body'), postUser);
router.patch('/:id', ...admin, validateSchema(patchUserValidator, 'body'), patchUser);
router.put('/:id', ...admin, validateSchema(userIdValidator, 'params'), putUser);
router.delete('/:id', ...admin, validateSchema(userIdValidator, 'params'), deleteUser);

export default router;
