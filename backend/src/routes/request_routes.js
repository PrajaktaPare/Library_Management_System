const express = require('express');
const { RequestController } = require('../controllers');
const { validateMiddleware, authMiddleware, roleMiddleware } = require('../middleware');
const { createRequestSchema, approveRequestSchema } = require('../validators');

const router = express.Router();

// Student routes
router.post('/', authMiddleware, roleMiddleware(['student']), validateMiddleware(createRequestSchema, 'body'), RequestController.requestBook);
router.get('/my-requests', authMiddleware, roleMiddleware(['student']), RequestController.getMyRequests);

// Admin routes
router.get('/', authMiddleware, roleMiddleware(['admin']), RequestController.getAllRequests);
router.get('/:id', authMiddleware, RequestController.getRequestById);
router.put('/:id/approve', authMiddleware, roleMiddleware(['admin']), validateMiddleware(approveRequestSchema, 'body'), RequestController.approveRequest);
router.put('/:id/reject', authMiddleware, roleMiddleware(['admin']), RequestController.rejectRequest);
router.put('/:id/issue', authMiddleware, roleMiddleware(['admin']), RequestController.issueBook);
router.put('/:id/return', authMiddleware, roleMiddleware(['admin']), RequestController.returnBook);
router.get('/admin/overdue', authMiddleware, roleMiddleware(['admin']), RequestController.getOverdueBooks);

module.exports = router;
