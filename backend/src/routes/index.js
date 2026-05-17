// routes/index.js

import express from 'express';
import logger from '../utils/logger.js';
import userRoutes from './user_routes.js';
import authRoutes from './auth_routes.js';
import bookRoutes from './book_routes.js';
import bookRequestRoutes from './book_request_routes.js';
import issueRoutes from './issue_routes.js';

const router = express.Router();

router.use('/users', userRoutes);

router.use('/auth', authRoutes);

router.use('/books', bookRoutes);

router.use('/book-requests', bookRequestRoutes);

router.use('/issues', issueRoutes);

export default router;
