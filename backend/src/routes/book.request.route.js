import express from 'express';

import {
  requestBook,
  getAllRequests,
  getRequestsCount,
  getRequestById,
  approveRequest,
  rejectRequest,
  cancelRequest,
} from '../controllers/book.request.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validateSchema } from '../middlewares/schema.validator.middleware.js';

import {
  createRequestValidator,
  requestIdValidator,
  rejectRequestValidator,
  getRequestsQueryValidator,
} from '../validators/book.request.validator.js';

const router = express.Router();

router.post('/', verifyJWT, authorizeRoles(2), validateSchema(createRequestValidator, 'body'), requestBook);

router.get('/count', getRequestsCount);

router.get(
  '/',
  verifyJWT,
  authorizeRoles(1),
  validateSchema(getRequestsQueryValidator, 'query'),
  getAllRequests
);

router.get(
  '/:id',
  verifyJWT,
  authorizeRoles(1),
  validateSchema(requestIdValidator, 'params'),
  getRequestById
);

router.patch(
  '/:id/approve',
  verifyJWT,
  authorizeRoles(1),
  validateSchema(requestIdValidator, 'params'),
  approveRequest
);

router.patch(
  '/:id/reject',
  verifyJWT,
  authorizeRoles(1),
  validateSchema(requestIdValidator, 'params'),
  validateSchema(rejectRequestValidator, 'body'),
  rejectRequest
);

router.delete(
  '/:id/cancel',
  verifyJWT,
  authorizeRoles(2),
  validateSchema(requestIdValidator, 'params'),
  cancelRequest
);

export default router;
