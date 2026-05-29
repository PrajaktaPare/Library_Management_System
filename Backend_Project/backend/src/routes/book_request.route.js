import express from 'express';

import {
  requestBook,
  getRequests,
  getRequestsCount,
  getRequestById,
  approveRequest,
  rejectRequest,
  cancelRequest,
} from '../controllers/book_request.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validateSchema } from '../middlewares/schema_validator.middleware.js';

import {
  createRequestValidator,
  requestIdValidator,
  rejectRequestValidator,
  getRequestsQueryValidator,
} from '../validators/book_request.validator.js';

const router = express.Router();

router.post('/', verifyJWT, authorizeRoles("student"), validateSchema(createRequestValidator, 'body'), requestBook);

router.get('/count', getRequestsCount);

router.get('/', verifyJWT, validateSchema(getRequestsQueryValidator, 'query'), getRequests);

router.get(
  '/:id',
  verifyJWT,
  authorizeRoles("admin"),
  validateSchema(requestIdValidator, 'params'),
  getRequestById
);

router.patch(
  '/:id/approve',
  verifyJWT,
  authorizeRoles("admin"),
  validateSchema(requestIdValidator, 'params'),
  approveRequest
);

router.patch(
  '/:id/reject',
  verifyJWT,
  authorizeRoles("admin"),
  validateSchema(requestIdValidator, 'params'),
  validateSchema(rejectRequestValidator, 'body'),
  rejectRequest
);

router.delete(
  '/:id/cancel',
  verifyJWT,
  authorizeRoles("student"),
  validateSchema(requestIdValidator, 'params'),
  cancelRequest
);

export default router;
