import bcrypt from 'bcrypt';
import db from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { generateToken } from '../services/jwt.service.js';
import { sendEmail } from '../services/email.service.js';
import { generateVerificationToken } from '../services/verfication_token.service.js';

/**
 * Login user and generate JWT token.
 * @param {Request} req - Express request object containing email and password.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} User data with JWT token cookie.
 * @throws Error if user validation fails.
 */

// cookie first_name last_name both, userid
export const login = async (req, res) => {
  try {
    // extract request body
    const { email, password } = req.body;

    //fetch user with role
    const [rows] = await db.query(
      `SELECT users.id,users.first_name,users.last_name,users.email,
      users.password_hash,users.role_id,users.is_active,users.is_verified,roles.role_name
      FROM users
      LEFT JOIN roles ON users.role_id=roles.id
      WHERE users.email=? AND users.is_deleted=0`,
      [email]
    );

    const user = rows[0];

    //validate user status
    if (!user) throw new Error('USER_NOT_FOUND');
    if (user.is_active !== 1) throw new Error('ACCOUNT_NOT_ACTIVE');
    if (user.is_verified !== 1) throw new Error('EMAIL_NOT_VERIFIED');

    //check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) throw new Error('INVALID_PASSWORD');

    //generate token
    const token = generateToken({ id: user.id, role: user.role_name });

    //set cookie
    res.cookie('access_token', token, {
      httpOnly: true, // Prevent JavaScript cookie access
      secure: false, // Allow HTTP and HTTPS
      sameSite: 'lax', //Restricts cookie sharing across sites
      maxAge: 24 * 60 * 60 * 1000, // Cookie expires after 24 hours
      path: '/', // Accessible across all routes
    });
    // log success
    logger.info(`LOGIN SUCCESS:${user.email}`);

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'LOGIN_SUCCESSFUL',
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
    // log error
    logger.error('LOGIN ERROR', error);

    // return error response
    return res.status(401).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
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
    // extract query params
    const { uid, token } = req.query;

    // validate input
    if (!uid || !token) {
      throw new Error('INVALID_VERIFICATION_LINK');
    }

    // fetch user
    const [rows] = await db.query(
      `SELECT id, is_verified, verification_token 
       FROM users 
       WHERE id = ? AND is_deleted = 0`,
      [uid]
    );

    const user = rows[0];

    // validate user
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // check already verified
    if (user.is_verified === 1) {
      throw new Error('USER_ALREADY_VERIFIED');
    }

    //bcrypt comparison
    const isTokenValid = await bcrypt.compare(token, user.verification_token);

    // validate token
    if (!isTokenValid) {
      throw new Error('INVALID_TOKEN');
    }

    // update user verification
    await db.query(
      `UPDATE users 
       SET is_active = 1,
           is_verified = 1,
           verification_token = NULL
       WHERE id = ?`,
      [uid]
    );

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'EMAIL_VERIFIED_SUCCESSFULLY',
    });
  } catch (error) {
    // log error
    logger.error('VERIFY EMAIL ERROR', error);

    // return error response
    return res.status(400).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
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
    //clear auth cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'LOGOUT_SUCCESSFUL',
    });
  } catch (error) {
    // log error
    logger.error('LOGOUT ERROR', error);

    // return error response
    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
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

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    // extract email from body
    const { email } = req.body;

    // fetch user from database
    const [rows] = await db.query(
      `
      SELECT id, email, first_name, is_verified
      FROM users
      WHERE email=? AND is_deleted=0
      `,
      [email]
    );

    // get first user
    const user = rows[0];

    // check user exists or not
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // check user verified or not
    if (!user.is_verified) {
      throw new Error('USER_NOT_VERIFIED');
    }

    // generate raw token + hashed token
    const { rawToken, hashedToken } = await generateVerificationToken();

    // store hashed token in is_verified column
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
    await sendEmail({
      type: 'forgot_password',
      to: user.email,
      variables: {
        first_name: user.first_name,
        link,
      },
    });

    // success log
    logger.info(`RESET EMAIL SENT : ${user.email}`);

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'RESET_PASSWORD_EMAIL_SENT',
      token: rawToken,
    });
  } catch (error) {
    // error log
    logger.error('FORGOT PASSWORD ERROR', error);

    // error response
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

// reset password
export const resetPassword = async (req, res) => {
  try {
    // extract request body
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
      throw new Error('USER_NOT_FOUND');
    }

    // validate verification status
    if (!user.is_verified) {
      throw new Error('USER_NOT_VERIFIED');
    }

    // validate token exists
    if (!token || !user.verification_token) {
      throw new Error('INVALID_TOKEN');
    }

    // compare token
    const isTokenValid = await bcrypt.compare(token, user.verification_token);

    // validate token
    if (!isTokenValid) {
      throw new Error('INVALID_TOKEN');
    }

    // compare old password
    const samePassword = await bcrypt.compare(password, user.password_hash);

    // validate new password
    if (samePassword) {
      throw new Error('NEW_PASSWORD_MUST_BE_DIFFERENT');
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

    // send success email
    await sendEmail({
      type: 'password_updated',
      to: user.email,
      variables: {
        first_name: user.first_name,
      },
    });

    // success log
    logger.info(`PASSWORD RESET SUCCESS : ${email}`);

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'PASSWORD_RESET_SUCCESS',
    });
  } catch (error) {
    // error log
    logger.error('RESET PASSWORD ERROR', error);

    // error response
    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};
