import express from 'express';
import authRoutes from './auth_routes.js';
import bookRoutes from './book_routes.js';
import requestRoutes from './request_routes.js';
import issueRoutes from './issue_routes.js';
import notificationRoutes from './notification_routes.js';
import userRoutes from './user_routes.js';
import adminRoutes from './admin_routes.js';
import studentRoutes from './student_routes.js';
import profileRoutes from './profile_routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/requests', requestRoutes);
router.use('/issues', issueRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/profile', profileRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
