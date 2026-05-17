// book_routes.js

import express from 'express';

import {
  getAllBooks,
  getBookById,
  getCategories,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/book_controller.js';

import {
  verifyJWT,
  authorizeRoles,
  validateJson,
  validateParams,
} from '../middleware/index.js';

import {
  createBookValidator,
  updateBookValidator,
  bookIdValidator,
} from '../validators/book_validator.js';

const router = express.Router();

// GET /books
// Query params: category, status, search, sortBy, order, page, limit
router.get('/', getAllBooks);

// GET /books/categories
router.get('/categories', getCategories);

// GET /books/:id
router.get('/:id', validateParams(bookIdValidator), getBookById);

/* =========================================
   ADMIN ROUTES
   Require JWT + admin role (role_id = 1)
========================================= */

// POST /books
router.post(
  '/',
  verifyJWT,
  authorizeRoles('1'),
  validateJson(createBookValidator),
  createBook
);

// PATCH /books/:id
router.patch(
  '/:id',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(bookIdValidator),
  validateJson(updateBookValidator),
  updateBook
);

// DELETE /books/:id
router.delete(
  '/:id',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(bookIdValidator),
  deleteBook
);

export default router;
