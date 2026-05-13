const express = require('express');

const authRoutes = require('./auth_routes');
const bookRoutes = require('./book_routes');
const requestRoutes = require('./request_routes');
const issueRoutes = require('./issue_routes');
const notificationRoutes = require('./notification_routes');
const userRoutes = require('./user_routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/requests', requestRoutes);
router.use('/issues', issueRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
