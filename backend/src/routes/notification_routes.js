import express from 'express';
import { NotificationController } from '../controllers/index.js';
import { authMiddleware } from '../middleware/index.js';

const router = express.Router();

router.get('/', authMiddleware, NotificationController.getNotifications);
router.get('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.put('/:id/read', authMiddleware, NotificationController.markAsRead);
router.put('/mark-all-read', authMiddleware, NotificationController.markAllAsRead);
router.delete('/:id', authMiddleware, NotificationController.deleteNotification);

export default router;
