import express from 'express';

import userRoutes from './user.route.js';
import authRoutes from './auth.route.js';
import bookRoutes from './book.route.js';
import requestRoutes from './book.request.route.js';
import issueRoutes from './issue.route.js';
import roleRoutes from './role.route.js';

// create router
const router = express.Router();

// user routes
router.use('/users', userRoutes);

// auth routes
router.use('/auth', authRoutes);

// book routes
router.use('/books', bookRoutes);

// book request routes
router.use('/requests', requestRoutes);

// issue routes
router.use('/issues', issueRoutes);

// role routes
router.use('/roles', roleRoutes);

// export router
export default router;
