const express = require('express');
const { UserController } = require('../controllers');
const { validateMiddleware, authMiddleware, roleMiddleware } = require('../middleware');
const { updateProfileSchema, changePasswordSchema } = require('../validators');

const router = express.Router();

// Protected routes
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, validateMiddleware(updateProfileSchema, 'body'), UserController.updateProfile);
router.put('/password', authMiddleware, validateMiddleware(changePasswordSchema, 'body'), UserController.changePassword);

// Admin only routes
router.get('/', authMiddleware, roleMiddleware(['admin']), UserController.getAllUsers);
router.post('/', authMiddleware, roleMiddleware(['admin']), UserController.createUser);
router.put('/:id/status', authMiddleware, roleMiddleware(['admin']), UserController.toggleUserStatus);

module.exports = router;
