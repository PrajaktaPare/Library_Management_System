import bcrypt from 'bcrypt';
import db from '../config/db.js';
import logger from '../services/logger.service.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { generateVerificationToken } from '../services/verfication.token.service.js';

/* =========================================
function: getAllUsers
function purpose: fetch users with filters, sorting, pagination
function input: req.query (filters, pagination, sorting)
function return: list of users
========================================= */
export const getAllUsers = async (req, res) => {
  try {
    // allowed query parameters
    const allowedQueryParams = [
      'id',
      'email',
      'first_name',
      'last_name',
      'phone',
      'page',
      'limit',
      'sortBy',
      'order',
    ];

    // allowed sorting fields
    const allowedSortFields = ['id', 'email', 'first_name', 'created_at'];

    // allowed sorting orders
    const allowedOrder = ['ASC', 'DESC'];

    // extract query params
    const { id, email, first_name, last_name, phone, page, limit, sortBy, order } = req.query;

    // base query
    let sql = `
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
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_deleted = 0
    `;

    // query values array
    const values = [];

    // check invalid query params
    const invalidParams = Object.keys(req.query).filter(param => !allowedQueryParams.includes(param));
    
    // throw error for invalid params
    if (invalidParams.length) {
      const error = new Error(`INVALID_QUERY_PARAMS:${invalidParams.join(',')}`);
      error.statusCode = 400;
      throw error;
    }

    // filter object
    const filters = { id, email, first_name, last_name, phone };

    // apply dynamic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      // exact match for id
      if (key === 'id') {
        sql += ` AND u.id = ?`;
        values.push(Number(value));
      }

      // partial match for other fields
      else {
        sql += ` AND u.${key} LIKE ?`;
        values.push(`%${value}%`);
      }
    });

    // apply sorting
    if (sortBy && allowedSortFields.includes(sortBy)) {
      const sortOrder = allowedOrder.includes(order?.toUpperCase()) ? order.toUpperCase() : 'ASC';

      sql += ` ORDER BY u.${sortBy} ${sortOrder}`;
    }

    // apply pagination
    if (limit) {
      const limitValue = Number(limit);
      const pageValue = Number(page || 1);

      // validate pagination values
      if (isNaN(limitValue) || limitValue <= 0 || isNaN(pageValue) || pageValue <= 0) {
        const error = new Error(isNaN(limitValue) || limitValue <= 0 ? 'INVALID_LIMIT' : 'INVALID_PAGE');

        error.statusCode = 400;
        throw error;
      }

      sql += ` LIMIT ? OFFSET ?`;
      values.push(limitValue, (pageValue - 1) * limitValue);
    }

    // execute query
    const [rows] = await db.query(sql, values);

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'USERS_FETCHED_SUCCESSFULLY',
      data: rows,
    });
  } catch (error) {
    // log error
    logger.error('GET ALL USERS ERROR', error);

    // error response
    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
function: getUserByID
function purpose: fetch single user by ID
function input: req.params.id
function return: user object
========================================= */
export const getUserByID = async (req, res) => {
  try {
    // fetch user by id
    const [rows] = await db.execute(
      `SELECT 
        id,
        email,
        first_name,
        last_name,
        phone,
        is_deleted
       FROM users 
       WHERE id = ?`,
      [req.params.id]
    );

    // extract user
    const user = rows[0];

    // check user exists and not deleted
    if (!user || user.is_deleted) {
      const error = new Error('USER_NOT_FOUND');
      error.statusCode = 404;
      throw error;
    }

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'USER_FETCHED_SUCCESSFULLY',
      data: user,
    });
  } catch (error) {
    // log error
    logger.error('GET USER BY ID ERROR', error);

    // error response
    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/*================================================
function info: create new user and send verification email
function parameter purpose: req.body contains user registration data
function return: created user id with success response
=========================================*/
export const postUser = async (req, res) => {
  try {
    // destructure request body
    const { email, password, first_name, last_name, phone } = req.body;

    // hash password
    const password_hash = await bcrypt.hash(password, 10);

    // generate verification token
    const { rawToken, hashedToken } = await generateVerificationToken();

    // insert user
    const [result] = await db.execute(
      `INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        is_active,
        is_verified,
        is_deleted,
        verification_token
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, password_hash, first_name, last_name, phone, 0, 0, 0, hashedToken]
    );

    // create verification link
    const link = `${process.env.FRONTEND_BASE_URL}/auth/verify-email?uid=${result.insertId}&token=${rawToken}`;

    // send verification email
    await sendVerificationEmail(email, link, first_name);

    // success response
    return res.status(201).json({
      success_flag: true,
      message: 'USER_CREATED_VERIFY_EMAIL',
      data: { user_id: result.insertId },
    });
  } catch (error) {
    // log error
    logger.error('CREATE USER ERROR', error);

    // error response
    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
function: patchUser
function purpose: partially update user fields
function input: req.params.id + req.body
function return: update status
========================================= */
export const patchUser = async (req, res) => {
  try {
    // extract user id
    const { id } = req.params;

    // check empty request body
    if (!Object.keys(req.body).length) {
      const error = new Error('NO_FIELDS_TO_UPDATE');
      error.statusCode = 400;
      throw error;
    }

    // check user existence
    const [rows] = await db.execute(`SELECT is_deleted FROM users WHERE id = ?`, [id]);

    // user not found
    if (!rows.length) {
      const error = new Error('USER_NOT_FOUND');
      error.statusCode = 404;
      throw error;
    }

    // check deleted user
    if (rows[0].is_deleted) {
      const error = new Error('USER_DELETED');
      error.statusCode = 410;
      throw error;
    }

    // allowed update fields
    const allowedFields = ['email', 'first_name', 'last_name', 'phone'];

    // store dynamic update fields
    const fields = [];

    // store update values
    const values = [];

    // validate and prepare fields
    for (const key in req.body) {
      // check invalid field
      if (!allowedFields.includes(key)) {
        const error = new Error(`FIELD_NOT_ALLOWED:${key}`);
        error.statusCode = 400;
        throw error;
      }

      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }

    // check valid fields exist
    if (!fields.length) {
      const error = new Error('NO_VALID_FIELDS_TO_UPDATE');
      error.statusCode = 400;
      throw error;
    }

    // add user id for where condition
    values.push(id);

    // update user
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'USER_UPDATED',
    });
  } catch (error) {
    // log error
    logger.error('PATCH USER ERROR', error);

    // error response
    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
function: putUser
function purpose: full replace user data
function input: req.params.id + req.body
function return: update status
========================================= */
export const putUser = async (req, res) => {
  try {
    // extract user id
    const { id } = req.params;

    // check empty request body
    if (!Object.keys(req.body).length) {
      const error = new Error('ALL_FIELDS_ARE_REQUIRED');
      error.statusCode = 400;
      throw error;
    }

    // check user exists
    const [rows] = await db.execute(`SELECT is_deleted FROM users WHERE id = ?`, [id]);

    // user not found
    if (!rows.length) {
      const error = new Error('USER_NOT_FOUND');
      error.statusCode = 404;
      throw error;
    }

    // check deleted user
    if (rows[0].is_deleted) {
      const error = new Error('USER_DELETED');
      error.statusCode = 410;
      throw error;
    }

    // hash password
    const password_hash = await bcrypt.hash(req.body.password, 10);

    // replace user data
    await db.execute(
      `UPDATE users SET
        email = ?,
        password_hash = ?,
        first_name = ?,
        last_name = ?,
        phone = ?,
        is_active = ?,
        is_verified = ?
       WHERE id = ?`,
      [
        req.body.email,
        password_hash,
        req.body.first_name,
        req.body.last_name,
        req.body.phone,
        req.body.is_active,
        req.body.is_verified,
        id,
      ]
    );

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'USER_REPLACED',
    });
  } catch (error) {
    // log error
    logger.error('PUT USER ERROR', error);

    // error response
    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
function: deleteUser
function purpose: soft delete or hard delete user
function input: req.params.id
function return: deletion status
========================================= */
export const deleteUser = async (req, res) => {
  try {
    // extract user id
    const { id } = req.params;

    // check user exists
    const [rows] = await db.execute(`SELECT is_active, is_verified FROM users WHERE id = ?`, [id]);

    // user not found
    if (!rows.length) {
      const error = new Error('USER_NOT_FOUND');
      error.statusCode = 404;
      throw error;
    }

    // extract user data
    const user = rows[0];

    // soft delete active and verified user
    if (user.is_active && user.is_verified) {
      await db.execute(
        `UPDATE users
         SET is_deleted = 1,
             is_active = 0,
             is_verified = 0
         WHERE id = ?`,
        [id]
      );
    }

    // hard delete user
    else {
      await db.execute(`DELETE FROM users WHERE id = ?`, [id]);
    }

    // success response
    return res.status(200).json({
      success_flag: true,
      message: 'USER_DELETED',
    });
  } catch (error) {
    // log error
    logger.error('DELETE USER ERROR', error);

    // error response
    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
function: getProfile
function purpose: get logged-in user profile
function input: req.user.id
function return: profile data
========================================= */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    //fetch profile
    const [rows] = await db.execute(
      `SELECT id,email,first_name,last_name,phone,role_id,is_active,is_verified,created_at
       FROM users WHERE id=? AND is_deleted=0`,
      [userId]
    );

    //success response
    return res.status(200).json({
      success_flag: true,
      message: 'PROFILE_FETCHED',
      data: rows[0],
    });
  } catch (error) {
    logger.error('GET PROFILE ERROR', error);

    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
function: updateProfile
function purpose: update logged-in user profile
function input: req.user.id + req.body
function return: update status
========================================= */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const allowedFields = ['first_name', 'last_name', 'phone', 'password'];

    const fields = [];
    const values = [];

    // build update fields
    for (const key of Object.keys(req.body)) {
      if (!allowedFields.includes(key)) {
        const error = new Error(`FIELD_NOT_ALLOWED:${key}`);
        error.statusCode = 400;
        throw error;
      }

      if (key === 'password') {
        const hashed = await bcrypt.hash(req.body.password, 10);
        fields.push('password_hash=?');
        values.push(hashed);
      } else {
        fields.push(`${key}=?`);
        values.push(req.body[key]);
      }
    }

    if (!fields.length) {
      const error = new Error('NO_VALID_FIELDS');
      error.statusCode = 400;
      throw error;
    }

    // check phone uniqueness (only if phone is being updated)
    const phoneFieldIndex = fields.findIndex(f => f.startsWith('phone'));

    if (phoneFieldIndex !== -1) {
      const phone = values[phoneFieldIndex];

      const [existing] = await db.execute(`SELECT id FROM users WHERE phone=? AND id!=? AND is_deleted=0`, [
        phone,
        userId,
      ]);

      if (existing.length) {
        const error = new Error('PHONE_EXISTS');
        error.statusCode = 409;
        throw error;
      }
    }

    values.push(userId);

    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id=? AND is_deleted=0`, values);

    return res.status(200).json({
      success_flag: true,
      message: 'PROFILE_UPDATED',
    });
  } catch (error) {
    logger.error('UPDATE PROFILE ERROR', error);

    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};
