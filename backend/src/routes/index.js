// routes/index.js

import express from 'express';
import logger from '../utils/logger.js';
import userRoutes from './user_routes.js';
import authRoutes from './auth_routes.js';
import bookRoutes from './book_routes.js';
import bookRequestRoutes from './book_request_routes.js';
import issueRoutes from './issue_routes.js';

const router = express.Router();

/* =========================================
   USER ROUTES
========================================= */
router.use('/users', userRoutes);

/* =========================================
   AUTH ROUTES
========================================= */
router.use('/auth', authRoutes);

/* =========================================
   BOOK ROUTES
========================================= */
router.use('/books', bookRoutes);

/* =========================================
   BOOK REQUEST ROUTES
========================================= */
router.use('/book-requests', bookRequestRoutes);

/* =========================================
   ISSUE ROUTES
========================================= */
router.use('/issues', issueRoutes);

/* =========================================
   TEST ROUTE
========================================= */
router.get('/test', async (req, res) => {
  try {
    logger.info('TEST ROUTE HIT');

    return res.status(200).json({
      success_flag: true,
      message: 'ROUTE_WORKING_SUCCESSFULLY',
    });
  } catch (error) {
    logger.error('TEST ROUTE ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
});

export default router;
