const { AuthRepository } = require('../repositories');
const { ApiError, PasswordHelper, JwtHelper, DateHelper, EmailHelper } = require('../utils');

class AuthService {
  static async login(usernameOrEmail, password, role) {
    // Try to find user by username first, then by email
    let user = await AuthRepository.findUserByUsername(usernameOrEmail);
    if (!user) {
      user = await AuthRepository.findUserByEmail(usernameOrEmail);
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
    await AuthRepository.updateLastLogin(user.id);

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
    await AuthRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

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
    const usernameTaken = await AuthRepository.usernameExists(registerData.username);
    if (usernameTaken) {
      throw ApiError.conflict('Username already taken');
    }

    // Check if email exists (required now)
    if (registerData.email) {
      const emailTaken = await AuthRepository.emailExists(registerData.email);
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
    const userId = await AuthRepository.createUser(
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
    const tokenRecord = await AuthRepository.findRefreshToken(userId, refreshToken);

    if (!tokenRecord) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Get user data
    const user = await AuthRepository.findUserById(userId);

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
    await AuthRepository.revokeRefreshToken(refreshToken);
  }

  static async logoutAll(userId) {
    await AuthRepository.revokeAllUserTokens(userId);
  }

  // Reset password (for forgot password flow — sets new password directly)
  static async resetPassword(email, newPassword) {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw ApiError.notFound('No account found with this email');
    }

    const validation = PasswordHelper.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw ApiError.badRequest('Password does not meet requirements', validation.errors);
    }

    const passwordHash = await PasswordHelper.hashPassword(newPassword);
    const { query } = require('../database/connection');
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
