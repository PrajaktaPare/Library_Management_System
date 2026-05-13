const { AuthService } = require('../services');
const { ApiResponse, asyncHandler, ApiError } = require('../utils');
const { loginSchema, registerSchema, refreshTokenSchema } = require('../validators');
const validateMiddleware = require('../middleware/validate_middleware');

class AuthController {
  static login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body.username, req.body.password, req.body.role);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(ApiResponse.ok('Login successful', {
      user: result.user,
      accessToken: result.accessToken
    }));
  });

  static register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);

    res.status(201).json(ApiResponse.created('Registration successful', {
      user: result
    }));
  });

  static refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      throw ApiError.unauthorized('Refresh token not provided');
    }

    const userId = req.user.id;
    const result = await AuthService.refreshAccessToken(userId, token);

    res.status(200).json(ApiResponse.ok('Token refreshed', {
      accessToken: result.accessToken
    }));
  });

  static logout = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    const userId = req.user.id;

    if (token) {
      await AuthService.logout(userId, token);
    }

    res.clearCookie('refreshToken');
    res.status(200).json(ApiResponse.ok('Logout successful'));
  });

  static logoutAll = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await AuthService.logoutAll(userId);

    res.clearCookie('refreshToken');
    res.status(200).json(ApiResponse.ok('Logged out from all devices'));
  });

  // Reset password — public endpoint (no auth required)
  static resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      throw ApiError.badRequest('Email and new password are required');
    }

    await AuthService.resetPassword(email, newPassword);

    res.status(200).json(ApiResponse.ok('Password reset successful'));
  });
}

module.exports = AuthController;
