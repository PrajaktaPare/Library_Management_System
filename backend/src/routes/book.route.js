import express from 'express';
import {
  createBook,
  getAllBooks,
  getBookById,
  patchBook,
  deleteBook,
  getBooksCount,
} from '../controllers/book.controller.js';

import {
  getBooksValidator,
  createBookValidator,
  patchBookValidator,
  bookIdValidator,
} from '../validators/book.validator.js';

import { validateSchema } from '../middlewares/schema_validator.middleware.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

const admin = [verifyJWT, authorizeRoles('admin')];

// GET books count
router.get('/count', getBooksCount);

// GET all books (filter enabled)
router.get('/', verifyJWT, validateSchema(getBooksValidator, 'query'), getAllBooks);

// GET book by id
router.get('/:id', verifyJWT, validateSchema(bookIdValidator, 'params'), getBookById);

// CREATE book
router.post('/', ...admin, validateSchema(createBookValidator, 'body'), createBook);

// UPDATE book
router.patch('/:id', ...admin, validateSchema(patchBookValidator, 'body'), patchBook);

// DELETE book
router.delete('/:id', ...admin, validateSchema(bookIdValidator, 'params'), deleteBook);

export default router;
