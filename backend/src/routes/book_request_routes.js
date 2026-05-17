// book_request_routes.js

import express from 'express';

import {
  requestBook,
  issueBook,
  rejectBookRequest,
  getAllRequests,
  getMyRequests,
  cancelRequest,
} from '../controllers/book_request_controller.js';

import {
  verifyJWT,
  authorizeRoles,
  validateJson,
  validateParams,
} from '../middleware/index.js';

import {
  requestBookValidator,
  rejectRequestValidator,
  requestIdValidator,
} from '../validators/book_request_validator.js';

const router = express.Router();

/* =========================================
   STUDENT ROUTES
   Require JWT (any authenticated user)
========================================= */

// POST /book-requests
// Student submits a book request
router.post('/', verifyJWT, validateJson(requestBookValidator), requestBook);

// GET /book-requests/my
// Student views their own requests
router.get('/my', verifyJWT, getMyRequests);

// DELETE /book-requests/:request_id/cancel
// Student cancels their own pending request
router.delete(
  '/:request_id/cancel',
  verifyJWT,
  validateParams(requestIdValidator),
  cancelRequest
);

/* =========================================
   ADMIN ROUTES
   Require JWT + admin role
========================================= */

// GET /book-requests
// Admin views all requests with optional status filter
router.get('/', verifyJWT, authorizeRoles('1'), getAllRequests);

// PATCH /book-requests/:request_id/issue
// Admin issues a book
router.patch(
  '/:request_id/issue',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(requestIdValidator),
  issueBook
);

// PATCH /book-requests/:request_id/reject
// Admin rejects a book request
router.patch(
  '/:request_id/reject',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(requestIdValidator),
  validateJson(rejectRequestValidator),
  rejectBookRequest
);

export default router;
