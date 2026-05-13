// Import repositories for user and auth database operations
const { UserRepository, AuthRepository } = require('../repositories');
// Import utility classes for errors, password handling, and email
const { ApiError, PasswordHelper, EmailHelper } = require('../utils');

// Service class containing business logic for user operations
class UserService {
  // Retrieve all users with pagination and filtering
  static async getAllUsers(pagination, filters = {}) {
    // Fetch paginated list of users matching the filters
    const users = await UserRepository.findAllUsers(pagination.offset, pagination.limit, filters);
    // Get total count for pagination metadata
    const total = await UserRepository.countUsers(filters);

    return {
      users,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  // Get the profile of a specific user by their ID
  static async getProfile(userId) {
    // Look up user by their primary key
    const user = await AuthRepository.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  // Update a user's profile fields (name, email, phone)
  static async updateProfile(userId, updateData) {
    // Verify user exists before updating
    const user = await AuthRepository.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if phone was changed — send notification email
    const phoneChanged = updateData.phone && updateData.phone !== user.phone;

    // Apply updates and return the refreshed user data
    await UserRepository.updateUser(userId, updateData);

    // Send phone update notification email
    if (phoneChanged && user.email) {
      EmailHelper.sendPhoneUpdatedEmail(user.email, user.name, updateData.phone)
        .catch(err => console.error('Phone update email failed:', err.message));
    }

    return await AuthRepository.findUserById(userId);
  }

  // Change a user's password after verifying the current one
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await AuthRepository.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // We need the password_hash which findUserById doesn't return
    const { query } = require('../database/connection');
    const results = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (results.length === 0) {
      throw ApiError.notFound('User not found');
    }

    // Verify the current password matches the stored hash
    const passwordMatch = await PasswordHelper.comparePasswords(currentPassword, results[0].password_hash);

    if (!passwordMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Validate new password meets strength requirements
    const validation = PasswordHelper.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw ApiError.badRequest('Password does not meet requirements', validation.errors);
    }

    // Hash and save the new password
    const passwordHash = await PasswordHelper.hashPassword(newPassword);
    await UserRepository.updatePassword(userId, passwordHash);

    // Send password changed email
    if (user.email) {
      EmailHelper.sendPasswordChangedEmail(user.email, user.name)
        .catch(err => console.error('Password change email failed:', err.message));
    }

    return true;
  }

  // Toggle a user's active/inactive status (admin function)
  static async toggleUserStatus(userId, isActive) {
    // Verify user exists before toggling
    const user = await AuthRepository.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update the is_active flag and return updated user
    await UserRepository.toggleUserActive(userId, isActive);
    return await AuthRepository.findUserById(userId);
  }

  // Admin: Create a new user
  static async createUser(userData) {
    // Check if username exists
    const usernameTaken = await AuthRepository.usernameExists(userData.username);
    if (usernameTaken) {
      throw ApiError.conflict('Username already taken');
    }

    // Check if email exists
    if (userData.email) {
      const emailTaken = await AuthRepository.emailExists(userData.email);
      if (emailTaken) {
        throw ApiError.conflict('Email already registered');
      }
    }

    // Hash password
    const passwordHash = await PasswordHelper.hashPassword(userData.password);

    // Create user
    const userId = await AuthRepository.createUser(
      userData.username,
      userData.email || null,
      passwordHash,
      userData.name,
      userData.phone || null,
      userData.role || 'student'
    );

    // Send welcome email
    if (userData.email) {
      EmailHelper.sendWelcomeEmail(userData.email, userData.name, userData.username)
        .catch(err => console.error('Welcome email failed:', err.message));
    }

    return await AuthRepository.findUserById(userId);
  }
}

// Export UserService for use in controllers
module.exports = UserService;
