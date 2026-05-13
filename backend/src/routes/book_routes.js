const express = require('express');
const { BookController } = require('../controllers');
const { validateMiddleware, authMiddleware, roleMiddleware } = require('../middleware');
const { createBookSchema, updateBookSchema } = require('../validators');

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

module.exports = router;
