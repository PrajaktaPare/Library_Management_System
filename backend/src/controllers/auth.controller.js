import bcrypt from 'bcrypt';
import db from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { generateToken } from '../services/jwt.service.js';
import { sendForgotPasswordEmail, sendPasswordUpdatedEmail } from '../services/email.service.js';
import { generateVerificationToken } from '../services/verfication_token.service.js';

/**
 * Login user and generate JWT token.
 * @param {Request} req - Express request object containing email and password.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} User data with JWT token cookie.
 * @throws Error if user validation fails.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user with role details
    const [rows] = await db.query(
      `SELECT users.id, users.first_name, users.last_name, users.email,
              users.password_hash, users.role_id, users.is_active, users.is_verified, roles.role_name
       FROM users
       LEFT JOIN roles ON users.role_id = roles.id
       WHERE users.email=? AND users.is_deleted=0`,
      [email]
    );

    const user = rows[0];

    // Validate user existence
    if (!user) throw new Error('User not found.');

    // Check email verification status
    if (user.is_verified !== 1) throw new Error('Please verify your email address before logging in.');

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // Validate password
    if (!isMatch) throw new Error('Invalid password.');

    // Generate JWT token
    const token = generateToken({ id: user.id, role: user.role_name });

    // Set token in cookie
    res.cookie('access_token', token);

    logger.info(`LOGIN SUCCESS:${user.email}`);

    // Send response
    return res.status(200).json({
      success_flag: true,
      message: 'Logged in successfully.',
      data: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
      },
    });
  } catch (error) {
    logger.error('LOGIN ERROR', error);

    return res.status(401).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
    });
  }
};

/**
 * Verify email using verification token.
 * @param {Request} req - Express request object containing uid and token.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Email verification response.
 * @throws Error if token or user is invalid.
 */
export const verifyEmail = async (req, res) => {
  try {
    const { uid, token } = req.query;

    // Validate query params
    if (!uid || !token) throw new Error('Invalid or expired verification link.');

    // Fetch user verification data
    const [rows] = await db.query(
      `SELECT id, is_verified, verification_token 
       FROM users 
       WHERE id = ? AND is_deleted = 0`,
      [uid]
    );

    const user = rows[0];

    // Check user existence
    if (!user) throw new Error('User not found.');

    // Check already verified
    if (user.is_verified === 1) throw new Error('User is already verified.');

    // Validate token
    const isTokenValid = await bcrypt.compare(token, user.verification_token);

    if (!isTokenValid) throw new Error('Invalid token.');

    // Activate user account
    await db.query(
      `UPDATE users 
       SET is_active = 1,
           is_verified = 1,
           verification_token = NULL
       WHERE id = ?`,
      [uid]
    );

    logger.info('VERIFY EMAIL SUCCESS');

    return res.status(200).json({
      success_flag: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    logger.error('VERIFY EMAIL ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
    });
  }
};

/**
 * Logout authenticated user.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Logout success response.
 */
export const logout = async (req, res) => {
  try {
    // Clear authentication cookie
    res.clearCookie('access_token');

    // Return logout success response
    return res.status(200).json({
      success_flag: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    // log error
    logger.error('LOGOUT ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};

/**
 * Send forgot password reset email.
 * @param {Request} req - Express request object containing email.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Reset password email response.
 * @throws Error if user not found or email invalid.
 */
export const forgotPassword = async (req, res) => {
  try {
    // extract email from body
    const { email } = req.body;

    // Fetch user details
    const [rows] = await db.query(
      `
      SELECT id, email, first_name, is_verified
      FROM users
      WHERE email=? AND is_deleted=0
      `,
      [email]
    );

    // Extract user record
    const user = rows[0];

    // Check user existence
    if (!user) {
      throw new Error('User not found.');
    }

    // check user verified or not
    if (!user.is_verified) {
      throw new Error('Your account is not verified yet.');
    }

    // Generate password reset token
    const { rawToken, hashedToken } = await generateVerificationToken();

    // Store hashed reset token
    await db.query(
      `
      UPDATE users
      SET verification_token=?
      WHERE id=?
      `,
      [hashedToken, user.id]
    );

    // create reset password link
    const link = `${process.env.FRONTEND_BASE_URL}/auth/reset-password?uid=${user.id}&token=${rawToken}`;

    // send forgot password email
    await sendForgotPasswordEmail({
      email: user.email,
      firstName: user.first_name,
      resetLink: link,
    });
    logger.info(`RESET EMAIL SENT : ${user.email}`);

    // Return success response
    return res.status(200).json({
      success_flag: true,
      message: 'A password reset link has been sent to your email address.',
      token: rawToken,
    });
  } catch (error) {
    logger.error('FORGOT PASSWORD ERROR', error);

    // Return password reset request failure response
    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Reset user password using reset token.
 * @param {Request} req - Express request object containing email, token and password.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Password reset response.
 * @throws Error if token validation fails.
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;

    // fetch user
    const [rows] = await db.query(
      `
      SELECT 
        id,
        email,
        first_name,
        password_hash,
        is_verified,
        verification_token
      FROM users
      WHERE email=? AND is_deleted=0
      `,
      [email]
    );

    // get user
    const user = rows[0];

    // validate user
    if (!user) {
      throw new Error('User not found.');
    }

    //check token is present and valid
    if (!user.verification_token || !(await bcrypt.compare(token, user.verification_token))) {
      throw new Error('Invalid token.');
    }

    // compare old password
    const isSamePassword = await bcrypt.compare(password, user.password_hash);

    // validate new password
    if (isSamePassword) {
      throw new Error('The new password must be different from your current password.');
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update password and clear token
    await db.query(
      `
      UPDATE users
      SET 
        password_hash=?,
        verification_token=NULL
      WHERE email=?
      `,
      [hashedPassword, email]
    );
    // success log
    logger.info(`PASSWORD RESET SUCCESS : ${email}`);

    // send success email
    await sendPasswordUpdatedEmail({
      email: user.email,
      firstName: user.first_name,
    });

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    logger.error('RESET PASSWORD ERROR', error);

    // error response
    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};
