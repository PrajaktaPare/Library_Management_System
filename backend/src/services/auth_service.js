import { query } from '../database/connection.js';
import { ApiError, PasswordHelper, JwtHelper, DateHelper, EmailHelper } from '../utils/index.js';

class AuthService {
  // ─── DB helpers (previously in AuthRepository) ──────────────────────
  static async _findUserByUsername(username) {
    const results = await query('SELECT * FROM users WHERE username = ?', [username]);
    return results.length > 0 ? results[0] : null;
  }

  static async _findUserByEmail(email) {
    const results = await query('SELECT * FROM users WHERE email = ?', [email]);
    return results.length > 0 ? results[0] : null;
  }

  static async _findUserById(userId) {
    const results = await query(
      'SELECT id, username, email, name, phone, role, profile_image, is_active, last_login, created_at FROM users WHERE id = ?',
      [userId]
    );
    return results.length > 0 ? results[0] : null;
  }

  static async _createUser(username, email, passwordHash, name, phone, role) {
    const result = await query(
      'INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, name, phone, role]
    );
    return result.insertId;
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
  static async login(usernameOrEmail, password, role) {
    let user = await this._findUserByUsername(usernameOrEmail);
    if (!user) user = await this._findUserByEmail(usernameOrEmail);
    if (!user) throw ApiError.badRequest('Invalid username/email or password');
    if (!user.is_active) throw ApiError.unauthorized('Account is inactive');
    if (user.role !== role) throw ApiError.badRequest(`User not registered as ${role}`);

    const passwordMatch = await PasswordHelper.comparePasswords(password, user.password_hash);
    if (!passwordMatch) throw ApiError.badRequest('Invalid username/email or password');

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const payload = { id: user.id, username: user.username, role: user.role, name: user.name };
    const { accessToken, refreshToken } = JwtHelper.generateTokenPair(payload);
    const expiresAt = DateHelper.addDays(new Date(), 7);
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, refreshToken, expiresAt]);

    return {
      user: { id: user.id, username: user.username, name: user.name, email: user.email, phone: user.phone, role: user.role, profile_image: user.profile_image },
      accessToken,
      refreshToken
    };
  }

  static async register(registerData) {
    if (await this._usernameExists(registerData.username)) throw ApiError.conflict('Username already taken');
    if (registerData.email && await this._emailExists(registerData.email)) throw ApiError.conflict('Email already registered');

    const validation = PasswordHelper.validatePasswordStrength(registerData.password);
    if (!validation.isValid) throw ApiError.badRequest('Password does not meet requirements', validation.errors);

    const passwordHash = await PasswordHelper.hashPassword(registerData.password);
    const userId = await this._createUser(registerData.username, registerData.email || null, passwordHash, registerData.name, registerData.phone || null, registerData.role);

    if (registerData.email) {
      EmailHelper.sendWelcomeEmail(registerData.email, registerData.name, registerData.username)
        .catch(err => console.error('Welcome email failed:', err.message));
    }
    return { id: userId, username: registerData.username, name: registerData.name, email: registerData.email, role: registerData.role };
  }

  static async refreshAccessToken(userId, refreshToken) {
    const tokens = await query(
      'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND revoked = FALSE AND expires_at > NOW()',
      [userId, refreshToken]
    );
    if (tokens.length === 0) throw ApiError.unauthorized('Invalid or expired refresh token');

    const user = await this._findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const payload = { id: user.id, username: user.username, role: user.role, name: user.name };
    const accessToken = JwtHelper.generateAccessToken(payload);
    return { accessToken, refreshToken };
  }

  static async logout(userId, refreshToken) {
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?', [refreshToken]);
  }

  static async logoutAll(userId) {
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?', [userId]);
  }

  static async resetPassword(email, newPassword) {
    const user = await this._findUserByEmail(email);
    if (!user) throw ApiError.notFound('No account found with this email');

    const validation = PasswordHelper.validatePasswordStrength(newPassword);
    if (!validation.isValid) throw ApiError.badRequest('Password does not meet requirements', validation.errors);

    const passwordHash = await PasswordHelper.hashPassword(newPassword);
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, user.id]);

    if (user.email) {
      EmailHelper.sendPasswordChangedEmail(user.email, user.name)
        .catch(err => console.error('Password change email failed:', err.message));
    }
    return true;
  }
}

export default AuthService;
