import express from 'express';
import userRoutes from './user.route.js';
import authRoutes from './auth.route.js';
import bookRoutes from './book.route.js'
// Create router instance for managing routes
const router = express.Router();

// Handle all user APIs with /users prefix
router.use('/users', userRoutes);

// Handle all auth APIs with /auth prefix
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);

// Export router for application use
export default router;
