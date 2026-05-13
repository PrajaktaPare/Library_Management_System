const express = require('express');
const { NotificationController } = require('../controllers');
const { authMiddleware } = require('../middleware');

const router = express.Router();

router.get('/', authMiddleware, NotificationController.getNotifications);
router.get('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.put('/:id/read', authMiddleware, NotificationController.markAsRead);
router.put('/mark-all-read', authMiddleware, NotificationController.markAllAsRead);
router.delete('/:id', authMiddleware, NotificationController.deleteNotification);

module.exports = router;
