import bcrypt from 'bcrypt';
import db from '../config/db.js';
import logger from '../services/logger.service.js';
import { generateToken } from '../services/jwt.service.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { generateVerificationToken } from '../services/verfication.token.service.js';

/*
function info:login user and generate jwt token
function parameter purpose:req.body contains email,password
function return:returns user data with jwt token
*/
export const login = async (req, res) => {
  try {
    logger.info('LOGIN REQUEST RECEIVED');

    const { email, password } = req.body;

    //fetch user with role
    const [rows] = await db.query(
      `SELECT users.id,users.first_name,users.last_name,users.email,
      users.password_hash,users.role_id,users.is_active,users.is_verified,roles.role_name
      FROM users
      LEFT JOIN roles ON users.role_id=roles.id
      WHERE users.email=?`,
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
    const token = generateToken({ id: user.id, role_id: user.role_id });

    //set cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    logger.info(`LOGIN SUCCESS:${user.email}`);

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
    logger.error('LOGIN ERROR', error);

    return res.status(401).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/*
function info:verify email using token
function parameter purpose:req.query contains uid and token
function return:returns email verification success response
*/
export const verifyEmail = async (req, res) => {
  try {
    logger.info('EMAIL VERIFY REQUEST');

    const { uid, token } = req.query;

    //validate query params
    if (!uid || !token) throw new Error('INVALID_VERIFICATION_LINK');

    //fetch user data
    const [rows] = await db.query(`SELECT id,is_verified,verification_token FROM users WHERE id=?`, [uid]);

    const user = rows[0];

    //check user status
    if (!user) throw new Error('USER_NOT_FOUND');
    if (user.is_verified === 1) throw new Error('USER_ALREADY_VERIFIED');

    //validate token
    const isValid = await bcrypt.compare(token, user.verification_token);

    if (!isValid) throw new Error('INVALID_VERIFICATION_LINK');

    //update verification status
    await db.query(`UPDATE users SET is_active=1,is_verified=1,verification_token=NULL WHERE id=?`, [uid]);

    logger.info(`EMAIL VERIFIED:${uid}`);

    return res.status(200).json({
      success_flag: true,
      message: 'EMAIL_VERIFIED_SUCCESSFULLY',
    });
  } catch (error) {
    logger.error('VERIFY EMAIL ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/*
function info:logout user
function parameter purpose:clear access token cookie
function return:returns logout success response
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

    logger.info('USER LOGOUT SUCCESS');

    return res.status(200).json({
      success_flag: true,
      message: 'LOGOUT_SUCCESSFUL',
    });
  } catch (error) {
    logger.error('LOGOUT ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};
