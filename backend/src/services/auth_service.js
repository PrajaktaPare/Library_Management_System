import bcrypt from 'bcryptjs'; 

import crypto from 'crypto';

import db from '../config/db.js';

import logger from '../utils/logger.js';

import { generateToken } from './jwt_service.js';

import { sendVerificationEmail } from './email_service.js';

/* =========================================
   FUNCTION: hashPassword

   PURPOSE:
   Hash password using bcrypt

   PARAMETER:
   - password

   RETURN:
   - hashed password
========================================= */
export const hashPassword = async password => {

  try {

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    return hashedPassword;

  } catch (error) {

    logger.error(
      'HASH PASSWORD ERROR',
      error
    );

    throw new Error(
      'PASSWORD_HASH_FAILED'
    );
  }
};

/* =========================================
   FUNCTION: registerService

   PURPOSE:
   Register new student user
   and send verification email

   PARAMETER:
   - name
   - username
   - email
   - password
   - phone

   RETURN:
   - inserted user data
========================================= */
export const registerService = async ({
  name,
  username,
  email,
  password,
  phone,
}) => {

  try {

    // Validate required fields
    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !phone
    ) {

      throw new Error(
        'MISSING_REQUIRED_FIELDS'
      );
    }

    // Check existing user
    const [existingUsers] = await db.query(
      `
      SELECT id
      FROM users
      WHERE
        username = ?
        OR email = ?
        OR phone = ?
      `,
      [
        username,
        email,
        phone,
      ]
    );

    // User already exists
    if (existingUsers.length > 0) {

      throw new Error(
        'USER_ALREADY_EXISTS'
      );
    }

    // Hash password
    const hashedPassword =
      await hashPassword(password);

    // Generate random verification token
    const rawVerificationToken =
      crypto.randomBytes(10).toString('hex');

    // Hash verification token
    const hashedVerificationToken =
      await bcrypt.hash(
        rawVerificationToken,
        10
      );

    // Insert user into database
    const [result] = await db.query(
      `
      INSERT INTO users
      (
        username,
        email,
        password_hash,
        name,
        phone,
        role_id,
        is_active,
        is_verified,
        verification_token
      )

      VALUES
      (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      `,
      [
        username,
        email,
        hashedPassword,
        name,
        phone,
        2,
        null,
        null,
        hashedVerificationToken,
      ]
    );

    // Create verification link
    // FIXED
const verificationLink =
  `${process.env.FRONTEND_BASE_URL}/auth/verify-email?uid=${result.insertId}&token=${rawVerificationToken}`;

    // Send verification email
    await sendVerificationEmail(
      email,
      verificationLink
    );

    logger.info(
      `USER REGISTERED: ${username}`
    );

    // Return response
    return {
      user_id: result.insertId,
      verification_link:
        verificationLink,
    };

  } catch (error) {

    logger.error(
      'REGISTER SERVICE ERROR',
      error
    );

    throw error;
  }
};

/* =========================================
   FUNCTION: loginService

   PURPOSE:
   Authenticate user login

   PARAMETER:
   - username
   - password

   RETURN:
   - jwt token
   - user data
========================================= */
export const loginService = async ({
  username,
  password,
}) => {

  try {

    // Validate required fields
    if (!username || !password) {

      throw new Error(
        'USERNAME_AND_PASSWORD_REQUIRED'
      );
    }

    // Find user
    const [rows] = await db.query(
      `
      SELECT
        users.id,
        users.username,
        users.email,
        users.password_hash,
        users.role_id,
        roles.role_name,
        users.is_active,
        users.is_verified

      FROM users

      LEFT JOIN roles
      ON users.role_id = roles.id

      WHERE users.username = ?
      `,
      [username]
    );

    const user = rows[0];

    // User not found
    if (!user) {

      throw new Error(
        'USER_NOT_FOUND'
      );
    }

    // Account inactive
    if (user.is_active !== 1) {

      throw new Error(
        'ACCOUNT_NOT_ACTIVE'
      );
    }

    // Email not verified
    if (user.is_verified !== 1) {

      throw new Error(
        'EMAIL_NOT_VERIFIED'
      );
    }

    // Compare password
    const isPasswordMatched =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    // Invalid password
    if (!isPasswordMatched) {

      throw new Error(
        'INVALID_PASSWORD'
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role_id: user.role_id,
    });

    logger.info(
      `LOGIN SUCCESS: ${username}`
    );

    // Return response
    return {
      token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
      },
    };

  } catch (error) {

    logger.error(
      'LOGIN SERVICE ERROR',
      error
    );

    throw error;
  }
};