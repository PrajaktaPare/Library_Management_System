const { query } = require('../database/connection');

class AuthRepository {
  static async findUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const results = await query(sql, [username]);
    return results.length > 0 ? results[0] : null;
  }

  static async findUserById(userId) {
    const sql = 'SELECT id, username, email, name, phone, role, profile_image, is_active, last_login, created_at FROM users WHERE id = ?';
    const results = await query(sql, [userId]);
    return results.length > 0 ? results[0] : null;
  }

  static async findUserByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    return results.length > 0 ? results[0] : null;
  }

  static async createUser(username, email, passwordHash, name, phone, role) {
    const sql = `
      INSERT INTO users (username, email, password_hash, name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [username, email, passwordHash, name, phone, role]);
    return result.insertId;
  }

  static async updateLastLogin(userId) {
    const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    await query(sql, [userId]);
  }

  static async saveRefreshToken(userId, token, expiresAt) {
    const sql = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    await query(sql, [userId, token, expiresAt]);
  }

  static async findRefreshToken(userId, token) {
    const sql = `
      SELECT * FROM refresh_tokens
      WHERE user_id = ? AND token = ? AND revoked = FALSE AND expires_at > NOW()
    `;
    const results = await query(sql, [userId, token]);
    return results.length > 0 ? results[0] : null;
  }

  static async revokeRefreshToken(token) {
    const sql = 'UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?';
    await query(sql, [token]);
  }

  static async revokeAllUserTokens(userId) {
    const sql = 'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?';
    await query(sql, [userId]);
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
}

module.exports = AuthRepository;
