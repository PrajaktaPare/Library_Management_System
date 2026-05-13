const { query } = require('../database/connection');
const { ApiError, PasswordHelper, JwtHelper, DateHelper, EmailHelper } = require('../utils');

class AuthService {
  // ─── Database helpers (formerly in AuthRepository) ───

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

  // ─── Business logic (service layer) ───

  static async login(usernameOrEmail, password, role) {
    // Try to find user by username first, then by email
    let user = await this.findUserByUsername(usernameOrEmail);
    if (!user) {
      user = await this.findUserByEmail(usernameOrEmail);
    }

    if (!user) {
      throw ApiError.badRequest('Invalid username/email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw ApiError.unauthorized('Account is inactive');
    }

    // Check role
    if (user.role !== role) {
      throw ApiError.badRequest(`User not registered as ${role}`);
    }

    // Verify password
    const passwordMatch = await PasswordHelper.comparePasswords(password, user.password_hash);
    if (!passwordMatch) {
      throw ApiError.badRequest('Invalid username/email or password');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    // Generate tokens
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    const { accessToken, refreshToken } = JwtHelper.generateTokenPair(payload);

    // Save refresh token
    const expiresAt = DateHelper.addDays(new Date(), 7);
    await this.saveRefreshToken(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image
      },
      accessToken,
      refreshToken
    };
  }

  static async register(registerData) {
    // Check if username exists
    const usernameTaken = await this.usernameExists(registerData.username);
    if (usernameTaken) {
      throw ApiError.conflict('Username already taken');
    }

    // Check if email exists (required now)
    if (registerData.email) {
      const emailTaken = await this.emailExists(registerData.email);
      if (emailTaken) {
        throw ApiError.conflict('Email already registered');
      }
    }

    // Validate password strength
    const validation = PasswordHelper.validatePasswordStrength(registerData.password);
    if (!validation.isValid) {
      throw ApiError.badRequest('Password does not meet requirements', validation.errors);
    }

    // Hash password
    const passwordHash = await PasswordHelper.hashPassword(registerData.password);

    // Create user
    const userId = await this.createUser(
      registerData.username,
      registerData.email || null,
      passwordHash,
      registerData.name,
      registerData.phone || null,
      registerData.role
    );

    // Send welcome email if email is provided
    if (registerData.email) {
      EmailHelper.sendWelcomeEmail(registerData.email, registerData.name, registerData.username)
        .catch(err => console.error('Welcome email failed:', err.message));
    }

    return {
      id: userId,
      username: registerData.username,
      name: registerData.name,
      email: registerData.email,
      role: registerData.role
    };
  }

  static async refreshAccessToken(userId, refreshToken) {
    // Verify refresh token exists and is not revoked
    const tokenRecord = await this.findRefreshToken(userId, refreshToken);

    if (!tokenRecord) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Get user data
    const user = await this.findUserById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Generate new access token
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    const accessToken = JwtHelper.generateAccessToken(payload);

    return {
      accessToken,
      refreshToken
    };
  }

  static async logout(userId, refreshToken) {
    await this.revokeRefreshToken(refreshToken);
  }

  static async logoutAll(userId) {
    await this.revokeAllUserTokens(userId);
  }

  // Reset password (for forgot password flow — sets new password directly)
  static async resetPassword(email, newPassword) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw ApiError.notFound('No account found with this email');
    }

    const validation = PasswordHelper.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw ApiError.badRequest('Password does not meet requirements', validation.errors);
    }

    const passwordHash = await PasswordHelper.hashPassword(newPassword);
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, user.id]);

    // Send password changed email
    if (user.email) {
      EmailHelper.sendPasswordChangedEmail(user.email, user.name)
        .catch(err => console.error('Password change email failed:', err.message));
    }

    return true;
  }
}

module.exports = AuthService;
