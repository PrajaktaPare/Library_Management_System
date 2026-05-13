// Import utility classes for errors, password handling, and email
const { query } = require('../database/connection');
const { ApiError, PasswordHelper, EmailHelper } = require('../utils');

// Service class containing business logic for user operations
class UserService {
  // ─── Database helpers (formerly in UserRepository + AuthRepository lookups) ───

  static async findAllUsers(offset, limit, filters = {}) {
    let sql = 'SELECT id, username, email, name, phone, role, is_active, created_at FROM users WHERE 1=1';
    const values = [];

    if (filters.role) {
      sql += ' AND role = ?';
      values.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      sql += ' AND is_active = ?';
      values.push(filters.isActive);
    }

    if (filters.search) {
      sql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    return await query(sql, values);
  }

  static async countUsers(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const values = [];

    if (filters.role) {
      sql += ' AND role = ?';
      values.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      sql += ' AND is_active = ?';
      values.push(filters.isActive);
    }

    if (filters.search) {
      sql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    const results = await query(sql, values);
    return results[0].count;
  }

  static async updateUserRecord(userId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return true;

    fields.push('updated_at = NOW()');
    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    return true;
  }

  static async updatePasswordHash(userId, passwordHash) {
    const sql = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?';
    await query(sql, [passwordHash, userId]);
  }

  static async toggleUserActive(userId, isActive) {
    const sql = 'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?';
    await query(sql, [isActive, userId]);
  }

  static async findUserById(userId) {
    const sql = 'SELECT id, username, email, name, phone, role, profile_image, is_active, last_login, created_at FROM users WHERE id = ?';
    const results = await query(sql, [userId]);
    return results.length > 0 ? results[0] : null;
  }

  static async usernameExists(username) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const results = await query(sql, [username]);
    return results[0].count > 0;
  }

  static async emailExists(email) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    return results[0].count > 0;
  }

  static async createUserRecord(username, email, passwordHash, name, phone, role) {
    const sql = `
      INSERT INTO users (username, email, password_hash, name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [username, email, passwordHash, name, phone, role]);
    return result.insertId;
  }

  // ─── Business logic (service layer) ───

  // Retrieve all users with pagination and filtering
  static async getAllUsers(pagination, filters = {}) {
    // Fetch paginated list of users matching the filters
    const users = await this.findAllUsers(pagination.offset, pagination.limit, filters);
    // Get total count for pagination metadata
    const total = await this.countUsers(filters);

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
    const user = await this.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  // Update a user's profile fields (name, email, phone)
  static async updateProfile(userId, updateData) {
    // Verify user exists before updating
    const user = await this.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if phone was changed — send notification email
    const phoneChanged = updateData.phone && updateData.phone !== user.phone;

    // Apply updates and return the refreshed user data
    await this.updateUserRecord(userId, updateData);

    // Send phone update notification email
    if (phoneChanged && user.email) {
      EmailHelper.sendPhoneUpdatedEmail(user.email, user.name, updateData.phone)
        .catch(err => console.error('Phone update email failed:', err.message));
    }

    return await this.findUserById(userId);
  }

  // Change a user's password after verifying the current one
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await this.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // We need the password_hash which findUserById doesn't return
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
    await this.updatePasswordHash(userId, passwordHash);

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
    const user = await this.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update the is_active flag and return updated user
    await this.toggleUserActive(userId, isActive);
    return await this.findUserById(userId);
  }

  // Admin: Create a new user
  static async createUser(userData) {
    // Check if username exists
    const usernameTaken = await this.usernameExists(userData.username);
    if (usernameTaken) {
      throw ApiError.conflict('Username already taken');
    }

    // Check if email exists
    if (userData.email) {
      const emailTaken = await this.emailExists(userData.email);
      if (emailTaken) {
        throw ApiError.conflict('Email already registered');
      }
    }

    // Hash password
    const passwordHash = await PasswordHelper.hashPassword(userData.password);

    // Create user
    const userId = await this.createUserRecord(
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

    return await this.findUserById(userId);
  }
}

// Export UserService for use in controllers
module.exports = UserService;
