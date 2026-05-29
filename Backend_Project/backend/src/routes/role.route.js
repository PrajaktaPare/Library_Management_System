import express from 'express';

import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from '../controllers/role.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validateSchema } from '../middlewares/schema_validator.middleware.js';

import {
  roleIdValidator,
  createRoleValidator,
  patchRoleValidator,
  getRolesQueryValidator,
} from '../validators/role.validator.js';

const router = express.Router();

// create role
router.post('/', verifyJWT, authorizeRoles("admin"), validateSchema(createRoleValidator), createRole);

// get all roles
router.get('/', verifyJWT, authorizeRoles("admin"), validateSchema(getRolesQueryValidator, 'query'), getAllRoles);

// get role by id
router.get('/:id', verifyJWT, authorizeRoles("admin"), validateSchema(roleIdValidator, 'params'), getRoleById);

// update role
router.patch(
  '/:id',
  verifyJWT,
  authorizeRoles("admin"),
  validateSchema(roleIdValidator, 'params'),
  validateSchema(patchRoleValidator),
  updateRole
);

// delete role
router.delete('/:id', verifyJWT, authorizeRoles("admin"), validateSchema(roleIdValidator, 'params'), deleteRole);

export default router;
