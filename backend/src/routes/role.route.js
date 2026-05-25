import express from 'express';

import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from '../controllers/role.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validateSchema } from '../middlewares/schema.validator.middleware.js';

import {
  roleIdValidator,
  createRoleValidator,
  patchRoleValidator,
  getRolesQueryValidator,
} from '../validators/role.validator.js';

const router = express.Router();

// create role
router.post('/', verifyJWT, authorizeRoles(1), validateSchema(createRoleValidator), createRole);

// get all roles
router.get('/', verifyJWT, authorizeRoles(1), validateSchema(getRolesQueryValidator, 'query'), getAllRoles);

// get role by id
router.get('/:id', verifyJWT, authorizeRoles(1), validateSchema(roleIdValidator, 'params'), getRoleById);

// update role
router.patch(
  '/:id',
  verifyJWT,
  authorizeRoles(1),
  validateSchema(roleIdValidator, 'params'),
  validateSchema(patchRoleValidator),
  updateRole
);

// delete role
router.delete('/:id', verifyJWT, authorizeRoles(1), validateSchema(roleIdValidator, 'params'), deleteRole);

export default router;
