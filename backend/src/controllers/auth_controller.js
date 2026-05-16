import bcrypt from 'bcrypt';

import logger from '../utils/logger.js';

import db from '../config/db.js';

import {
  registerService,
  loginService,
} from '../services/auth_service.js';

/* =========================================
   FUNCTION: register

   PURPOSE:
   Register user

   PARAMETER:
   - req
   - res

   RETURN:
   - json response
========================================= */
export const register = async (
  req,
  res
) => {

  try {

    const result =
      await registerService(req.body);

    return res.status(201).json({
      success_flag: true,
      message:
        'Registration successful. Please verify your email.',
      data: result,
    });

  } catch (error) {

    logger.error(
      'REGISTER CONTROLLER ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/* =========================================
   FUNCTION: login

   PURPOSE:
   Login user

   PARAMETER:
   - req
   - res

   RETURN:
   - json response
========================================= */
export const login = async (
  req,
  res
) => {

  try {

    const result =
      await loginService(req.body);

    return res.status(200).json({
      success_flag: true,
      message: 'Login successful',
      data: result,
    });

  } catch (error) {

    logger.error(
      'LOGIN CONTROLLER ERROR',
      error
    );

    return res.status(401).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/* =========================================
   FUNCTION: verifyEmail

   PURPOSE:
   Verify email link

   PARAMETER:
   - req
   - res

   RETURN:
   - json response
========================================= */
export const verifyEmail = async (req, res) => {

  try {

    const { uid, token } = req.query;

    if (!uid || !token) {
      return res.status(400).json({
        success_flag: false,
        message: 'INVALID_VERIFICATION_LINK',
      });
    }

    // Fetch user
    const [rows] = await db.query(
      `SELECT * FROM users WHERE id = ?`,
      [uid]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        success_flag: false,
        message: 'USER_NOT_FOUND',
      });
    }

    // Already verified — 2nd click lands here
    if (user.is_verified === 1) {
      return res.status(400).json({
        success_flag: false,
        message: 'USER_ALREADY_VERIFIED',
      });
    }

    // Check expiry using created_at + 10 mins
    const expiresAt = new Date(user.created_at.getTime() + 10 * 60 * 1000);

    if (new Date() > expiresAt) {
      return res.status(400).json({
        success_flag: false,
        message: 'VERIFICATION_LINK_EXPIRED',
      });
    }

    // Validate token
    const isValid = await bcrypt.compare(token, user.verification_token);

    if (!isValid) {
      return res.status(400).json({
        success_flag: false,
        message: 'INVALID_VERIFICATION_TOKEN',
      });
    }

    // Activate user and clear token
    await db.query(
      `UPDATE users
       SET is_active = 1,
           is_verified = 1,
           verification_token = NULL
       WHERE id = ?`,
      [uid]
    );

    return res.status(200).json({
      success_flag: true,
      message: 'EMAIL_VERIFIED_SUCCESSFULLY',
    });

  } catch (error) {

    logger.error('VERIFY EMAIL ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};