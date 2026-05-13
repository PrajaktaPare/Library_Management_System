const { query } = require('../database/connection');

class UserRepository {
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

  static async updateUser(userId, updateData) {
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

  static async updatePassword(userId, passwordHash) {
    const sql = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?';
    await query(sql, [passwordHash, userId]);
  }

  static async toggleUserActive(userId, isActive) {
    const sql = 'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?';
    await query(sql, [isActive, userId]);
  }

  static async deleteUser(userId) {
    const sql = 'UPDATE users SET is_active = FALSE WHERE id = ?';
    await query(sql, [userId]);
  }
}

module.exports = UserRepository;
