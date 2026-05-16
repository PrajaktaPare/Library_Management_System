import express from 'express';
import { RequestController } from '../controllers/index.js';
import { validateMiddleware, authMiddleware, roleMiddleware } from '../middleware/index.js';
import { createRequestSchema, approveRequestSchema } from '../validators/index.js';

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

export default router;
