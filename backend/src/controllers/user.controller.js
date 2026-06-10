import bcrypt from 'bcrypt';
import db from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { generateVerificationToken } from '../services/verfication_token.service.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';
/**
 * Retrieves the total count of user records.
 *
 * @param {Request} req - Express request object containing where condition.
 * @param {Response} res - Express response object used to return the user count.
 * @returns {Promise<Response>}
 */
export const getUsersCount = async (req, res) => {
  try {
    // Generate count query with where condition
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql: `
        SELECT COUNT(*) AS total_records
        FROM users u
      `,
      tableAlias: 'u',
      includePagination: false,
    });

    // Execute count query
    const [rows] = await db.query(sql, values);

    // Extract total user count
    const totalRecords = rows[0]?.total_records || 0;

    // Return user count
    return res.status(200).json({
      success_flag: true,
      data: {
        total_records: totalRecords,
      },
    });
  } catch (error) {
    logger.error('GET USERS COUNT ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
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
    // Base query to fetch user details along with role information
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

    // Generate dynamic query with filtering, sorting, and pagination
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql,
      tableAlias: 'u',
    });

    // Execute query
    const [rows] = await db.query(sql, values);

    // check that user records exist
    if (rows.length === 0) {
      throw new Error('User not found.');
    }

    // Return user records
    return res.status(200).json({
      success_flag: true,
      message: 'Users fetched successfully.',
      data: rows,
    });
  } catch (error) {
    logger.error(error);

    // Return appropriate error response
    return res.status(error.message?.includes('not found') ? 404 : 500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
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
    // Fetch user details by ID
    const [rows] = await db.execute(
      `SELECT 
          id,
          email,
          first_name,
          last_name,
          phone,
          role_id,
          is_active,
          is_verified,
          created_at,
          updated_at
        FROM users 
        WHERE id = ?`,
      [req.params.id]
    );

    // Validate that the user exists
    if (!rows.length) {
      return res.status(404).json({
        success_flag: false,
        message: 'User not found.',
      });
    }

    // Return user details
    return res.json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    // Log error for debugging and monitoring
    logger.error(error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
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
    const { email, password, first_name, last_name, phone, role_id } = req.body;

    // Hash password before storing it in the database
    const password_hash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const { rawToken, hashedToken } = await generateVerificationToken();

    // Create new user record
    const [result] = await db.execute(
      `INSERT INTO users(email,password_hash,first_name,last_name,phone,role_id,is_active,is_verified,is_deleted,verification_token)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [email, password_hash, first_name, last_name, phone, role_id, 0, 0, 0, hashedToken]
    );

    // Generate email verification URL
    const verificationLink = `${process.env.FRONTEND_BASE_URL}/auth/verify-email?uid=${result.insertId}&token=${rawToken}`;

    // Send verification email to the registered user
    await sendVerificationEmail({
      email,
      firstName: first_name,
      verificationLink,
    });

    logger.info(`USER REGISTERED : ${email}`);

    // Return successful registration response
    return res.status(201).json({
      success_flag: true,
      message: 'User registered successfully. Please verify email to activate account.',
      data: { user_id: result.insertId, email },
    });
  } catch (error) {
    logger.error('CREATE USER ERROR', error);

    // Handle duplicate email or phone number
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success_flag: false,
        message: error.sqlMessage?.includes('email') ? 'EMAIL_ALREADY_EXISTS' : 'PHONE_ALREADY_EXISTS',
      });
    }

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
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
    const { id } = req.params;

    // Validate that update data is provided
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success_flag: false,
        message: 'No data provided to update.',
      });
    }

    // Initialize arrays for dynamic update query
    const fields = [];
    const values = [];

    // Build dynamic update fields from request body
    for (const [key, value] of Object.entries(req.body)) {
      fields.push(`${key}=?`);
      values.push(value);
    }

    // check that at least one field is available for update
    if (!fields.length) {
      return res.status(400).json({
        success_flag: false,
        message: 'No valid fields provided to update.',
      });
    }

    // Append user ID for WHERE condition
    values.push(id);

    // Update user record
    await db.execute(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values);

    // Return successful update response
    return res.status(200).json({
      success_flag: true,
      message: 'User updated successfully.',
    });
  } catch (error) {
    logger.error('PATCH USER ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
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
    const { id } = req.params;

    // Fetch user status before deletion
    const [rows] = await db.execute(`SELECT is_active, is_verified FROM users WHERE id=?`, [id]);

    // CHECK that the user exists
    if (!rows.length) {
      return res.status(404).json({
        success_flag: false,
        message: 'User not found.',
      });
    }

    // Extract user details
    const user = rows[0];

    // Perform soft delete for active and verified users
    if (user.is_active && user.is_verified) {
      await db.execute(`UPDATE users SET is_deleted=1, is_active=0 WHERE id=?`, [id]);

      logger.info(`User soft deleted successfully. User ID: ${id}`);
    } else {
      // Permanently delete inactive or unverified users
      await db.execute(`DELETE FROM users WHERE id=?`, [id]);

      logger.info(`User hard deleted successfully. User ID: ${id}`);
    }

    // Return successful deletion response
    return res.json({
      success_flag: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    logger.error(error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
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
    // Fetch authenticated user's profile details
    const [rows] = await db.execute(
      `SELECT 
          id,
          email,
          first_name,
          last_name,
          phone,
          role_id,
          is_active,
          is_verified,
          created_at,
          updated_at
        FROM users 
        WHERE id = ?`,
      [req.user.id]
    );

    // Return profile details
    return res.json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    // Log error for debugging and monitoring
    logger.error(error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
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
    const userId = req.user.id;

    // Check that update data is provided
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success_flag: false,
        message: 'Nothing to update.',
      });
    }

    // Initialize arrays for dynamic update query
    const fields = [];
    const values = [];

    // Build dynamic update query from request data
    for (const [key, value] of Object.entries(req.body)) {
      if (key === 'password') {
        // Hash password before storing it
        const hash = await bcrypt.hash(value, 10);

        fields.push('password_hash=?');
        values.push(hash);
      } else {
        // Add profile field to update query
        fields.push(`${key}=?`);
        values.push(value);
      }
    }

    // Validate that at least one field is available for update
    if (!fields.length) {
      return res.status(400).json({
        success_flag: false,
        message: 'No valid fields provided to update.',
      });
    }

    // Append authenticated user ID for WHERE condition
    values.push(userId);

    // Update user profile
    await db.execute(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values);

    // Return successful update response
    return res.status(200).json({
      success_flag: true,
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    logger.error('UPDATE PROFILE ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
    });
  }
};
