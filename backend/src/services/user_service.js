import { query } from '../database/connection.js';
import { ApiError, PasswordHelper, EmailHelper } from '../utils/index.js';

class UserService {
  // ─── DB helpers (previously in AuthRepository + UserRepository) ─────
  static async _findUserById(userId) {
    const results = await query(
      'SELECT id, username, email, name, phone, role, profile_image, is_active, last_login, created_at FROM users WHERE id = ?',
      [userId]
    );
    return results.length > 0 ? results[0] : null;
  }

  static async _usernameExists(username) {
    const results = await query('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
    return results[0].count > 0;
  }

  static async _emailExists(email) {
    const results = await query('SELECT COUNT(*) as count FROM users WHERE email = ?', [email]);
    return results[0].count > 0;
  }

  // ─── Business logic ─────────────────────────────────────────────────
  static async getAllUsers(pagination, filters = {}) {
    let sql = 'SELECT id, username, email, name, phone, role, is_active, created_at FROM users WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const values = []; const countValues = [];

    if (filters.role) { sql += ' AND role = ?'; countSql += ' AND role = ?'; values.push(filters.role); countValues.push(filters.role); }
    if (filters.isActive !== undefined) { sql += ' AND is_active = ?'; countSql += ' AND is_active = ?'; values.push(filters.isActive); countValues.push(filters.isActive); }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      sql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
      countSql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
      values.push(searchTerm, searchTerm, searchTerm);
      countValues.push(searchTerm, searchTerm, searchTerm);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(pagination.limit, pagination.offset);

    const users = await query(sql, values);
    const countResult = await query(countSql, countValues);
    return { users, total: countResult[0].count, page: pagination.page, limit: pagination.limit };
  }

  static async getProfile(userId) {
    const user = await this._findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async updateProfile(userId, updateData) {
    const user = await this._findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');
    const phoneChanged = updateData.phone && updateData.phone !== user.phone;

    const fields = []; const values = [];
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') { fields.push(`${key} = ?`); values.push(updateData[key]); }
    });
    if (fields.length > 0) {
      fields.push('updated_at = NOW()'); values.push(userId);
      await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (phoneChanged && user.email) {
      EmailHelper.sendPhoneUpdatedEmail(user.email, user.name, updateData.phone)
        .catch(err => console.error('Phone update email failed:', err.message));
    }
    return await this._findUserById(userId);
  }

  static async updateOwnProfile(userId, profileData) {
    return await this.updateProfile(userId, profileData);
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await this._findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const results = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (results.length === 0) throw ApiError.notFound('User not found');

    const passwordMatch = await PasswordHelper.comparePasswords(currentPassword, results[0].password_hash);
    if (!passwordMatch) throw ApiError.badRequest('Current password is incorrect');

    const validation = PasswordHelper.validatePasswordStrength(newPassword);
    if (!validation.isValid) throw ApiError.badRequest('Password does not meet requirements', validation.errors);

    const passwordHash = await PasswordHelper.hashPassword(newPassword);
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId]);

    if (user.email) {
      EmailHelper.sendPasswordChangedEmail(user.email, user.name)
        .catch(err => console.error('Password change email failed:', err.message));
    }
    return true;
  }

  static async toggleUserStatus(userId, isActive) {
    const user = await this._findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');
    await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [isActive, userId]);
    return await this._findUserById(userId);
  }

  static async createUser(userData) {
    if (await this._usernameExists(userData.username)) throw ApiError.conflict('Username already taken');
    if (userData.email && await this._emailExists(userData.email)) throw ApiError.conflict('Email already registered');

    const passwordHash = await PasswordHelper.hashPassword(userData.password);
    const result = await query(
      'INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userData.username, userData.email || null, passwordHash, userData.name, userData.phone || null, userData.role || 'student']
    );

    if (userData.email) {
      EmailHelper.sendWelcomeEmail(userData.email, userData.name, userData.username)
        .catch(err => console.error('Welcome email failed:', err.message));
    }
    return await this._findUserById(result.insertId);
  }
}

export default UserService;
