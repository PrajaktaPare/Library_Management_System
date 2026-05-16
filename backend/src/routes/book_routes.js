import express from 'express';
import { BookController } from '../controllers/index.js';
import { validateMiddleware, authMiddleware, roleMiddleware } from '../middleware/index.js';
import { createBookSchema, updateBookSchema } from '../validators/index.js';

const router = express.Router();

// Public routes
router.get('/', BookController.getBooks);
router.get('/categories', BookController.getCategories);
router.get('/search', BookController.searchBooks);
router.get('/:id', BookController.getBookById);

// Admin only routes
router.post('/', authMiddleware, roleMiddleware(['admin']), validateMiddleware(createBookSchema, 'body'), BookController.createBook);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), validateMiddleware(updateBookSchema, 'body'), BookController.updateBook);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), BookController.deleteBook);

export default router;
