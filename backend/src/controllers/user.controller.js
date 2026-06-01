import bcrypt from 'bcrypt';
import db from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { generateVerificationToken } from '../services/verfication_token.service.js';
import { sendEmail } from '../services/email.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';

/**
 * Returns total users count and total pages.
 * @param {Request} req - Express request object containing filters and limit.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Total users count response.
 */
export const getUsersCount = async (req, res) => {
  try {
    // extract limit
    const limit = Number(req.query.limit) || 10;

    // build count query
    const { sql, values } = buildFilterQuery({
      query: req.query,

      // count users
      baseSql: `
        SELECT COUNT(*) AS total_records

        FROM users u

        LEFT JOIN roles r
          ON u.role_id = r.id
      `,

      // alias for filtering
      tableAlias: 'u',
    });

    // execute query
    const [rows] = await db.query(sql, values);

    // extract count
    const totalRecords = rows[0]?.total_records || 0;

    // return response
    return res.status(200).json({
      success_flag: true,

      data: {
        total_records: totalRecords,
        limit,

        // calculate pages
        total_pages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    // log error
    logger.error('GET USERS COUNT ERROR', error);

    // return error
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Fetches all users with optional filters, joins role data, and returns paginated results.
 * @param {Request} req - Express request object containing query filters.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} List of users.
 * @throws Error when no users are found or database query fails.
 */
export const getAllUsers = async (req, res) => {
  try {
    // base sql query
    const baseSql = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role_id,
        r.role_name,
        u.is_active,
        u.is_verified,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r
      ON u.role_id = r.id
    `;

    // build filter query
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql,
      tableAlias: 'u',
    });

    // fetch users
    const [rows] = await db.query(sql, values);

    // check records
    if (rows.length === 0) {
      throw new Error('NO_USERS_FOUND');
    }

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'USERS_FETCHED_SUCCESSFULLY',
      data: rows,
    });
  } catch (error) {
    // log error
    logger.error(error);

    // return error response
    return res.status(error.message?.includes('NOT_FOUND') ? 404 : 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Fetch a single user by ID.
 * @param {Request} req - Express request object containing user ID.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} User object if found.
 * @throws Error if user not found or query fails.
 */
export const getUserByID = async (req, res) => {
  try {
    // fetch user
    const [rows] = await db.execute(`SELECT * FROM users WHERE id=?`, [req.params.id]);

    // validate user
    if (!rows.length) {
      return res.status(404).json({
        success_flag: false,
        message: 'USER_NOT_FOUND',
      });
    }

    // return response
    return res.json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    // log error
    logger.error(error);

    // return error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Creates a new user and sends verification email.
 * @param {Request} req - Express request object containing user data.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Created user ID and success message.
 * @throws Error if email or phone already exists.
 */
export const postUser = async (req, res) => {
  try {
    // extract request body
    const { email, password, first_name, last_name, phone, role_id } = req.body;

    // hash password
    const password_hash = await bcrypt.hash(password, 10);

    // generate verification token
    const { rawToken, hashedToken } = await generateVerificationToken();

    // create user
    const [result] = await db.execute(
      `INSERT INTO users(email,password_hash,first_name,last_name,phone,role_id,is_active,is_verified,is_deleted,verification_token)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [email, password_hash, first_name, last_name, phone, role_id, 0, 0, 0, hashedToken]
    );

    // generate verification link
    const verificationLink = `${process.env.FRONTEND_BASE_URL}/auth/verify-email?uid=${result.insertId}&token=${rawToken}`;

    // send verification email
    await sendEmail({
      type: 'verification',
      to: email,
      variables: {
        first_name,
        link: verificationLink,
      },
    });
    // log success
    logger.info(`USER REGISTERED : ${email}`);

    // return response
    return res.status(201).json({
      success_flag: true,
      message: 'USER_REGISTERED_SUCCESSFULLY_VERIFY_EMAIL_TO_ACTIVATE_ACCOUNT',
      data: { user_id: result.insertId, email },
    });
  } catch (error) {
    // log error
    logger.error('CREATE USER ERROR', error);

    // handle duplicate entry
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success_flag: false,
        message: error.sqlMessage?.includes('email') ? 'EMAIL_ALREADY_EXISTS' : 'PHONE_ALREADY_EXISTS',
      });
    }

    // return error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Updates user data based on provided fields.
 * @param {Request} req - Express request object containing update data.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Success message.
 */
export const patchUser = async (req, res) => {
  try {
    // extract id
    const { id } = req.params;

    // validate request body
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_DATA_TO_UPDATE',
      });
    }

    // initialize arrays
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
      fields.push(`${key}=?`);
      values.push(value);
    }

    // validate filtered fields
    if (!fields.length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_VALID_FIELDS_TO_UPDATE',
      });
    }

    // append id
    values.push(id);

    // update user
    await db.execute(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values);

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'USER_UPDATED',
    });
  } catch (error) {
    // log error
    logger.error('PATCH USER ERROR', error);

    // return error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Deletes a user (soft delete if active + verified, otherwise hard delete).
 * @param {Request} req - Express request object containing user ID.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Deletion status.
 */
export const deleteUser = async (req, res) => {
  try {
    // extract id
    const { id } = req.params;

    // fetch user
    const [rows] = await db.execute(`SELECT is_active, is_verified FROM users WHERE id=?`, [id]);

    // validate user
    if (!rows.length) {
      return res.status(404).json({
        success_flag: false,
        message: 'USER_NOT_FOUND',
      });
    }
    // extract user
    const user = rows[0];

    // soft delete user
    if (user.is_active && user.is_verified) {
      await db.execute(`UPDATE users SET is_deleted=1, is_active=0 WHERE id=?`, [id]);
    } else {
      // hard delete user
      await db.execute(`DELETE FROM users WHERE id=?`, [id]);
    }

    // return response
    return res.json({
      success_flag: true,
      message: 'USER_DELETED',
    });
  } catch (error) {
    // log error
    logger.error(error);

    // return error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Fetches logged-in user's profile.
 * @param {Request} req - Express request object with authenticated user.
 * @param {Response} res - Express response object.
 */
export const getProfile = async (req, res) => {
  try {
    // fetch profile
    const [rows] = await db.execute(`SELECT * FROM users WHERE id=?`, [req.user.id]);

    // return response
    return res.json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    // log error
    logger.error(error);

    // return error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Updates logged-in user's profile (including password hashing if provided).
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const updateProfile = async (req, res) => {
  try {
    // extract user id
    const userId = req.user.id;
    // validate request body
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_DATA_TO_UPDATE',
      });
    }

    // initialize arrays
    const fields = [];
    const values = [];

    // build dynamic query with whitelisted fields only
    for (const [key, value] of Object.entries(req.body)) {

      if (key === 'password') {
        // hash password
        const hash = await bcrypt.hash(value, 10);
        fields.push('password_hash=?');
        values.push(hash);
      } else {
        fields.push(`${key}=?`);
        values.push(value);
      }
    }

    // validate filtered fields
    if (!fields.length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_VALID_FIELDS_TO_UPDATE',
      });
    }

    // append user id
    values.push(userId);

    // update profile
    await db.execute(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values);

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'PROFILE_UPDATED',
    });
  } catch (error) {
    // log error
    logger.error('UPDATE PROFILE ERROR', error);

    // return error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};
