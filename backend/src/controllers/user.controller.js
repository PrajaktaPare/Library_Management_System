import bcrypt from 'bcrypt';
import db from '../config/db.js';
import logger from '../services/logger.service.js';
import { generateVerificationToken } from '../services/verfication.token.service.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { USER_COLUMNS } from '../validators/user.validator.js';

// allowed columns whitelist
const ALLOWED_COLUMNS = new Set(USER_COLUMNS);

// get all users
export const getAllUsers = async (req, res) => {
  try {
    let filter = {};

    // parse filter safely
    if (req.query.filter) {
      try {
        filter = JSON.parse(req.query.filter);
      } catch {
        return res.status(400).json({
          success_flag: false,
          message: 'INVALID_FILTER_FORMAT',
        });
      }
    }

    const { limit = 10, offset = 0, order = {}, where = {} } = filter;

    let sql = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
             u.role_id, r.role_name,
             u.is_active, u.is_verified,
             u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
    `;

    const values = [];
    const conditions = [];

    // WHERE builder (AND only)
    for (const [key, condition] of Object.entries(where)) {
      if (!ALLOWED_COLUMNS.has(key)) continue;

      if (typeof condition !== 'object' || condition === null) {
        conditions.push(`u.${key} = ?`);
        values.push(condition);
        continue;
      }

      if (condition.like !== undefined) {
        conditions.push(`u.${key} LIKE ?`);
        values.push(`%${condition.like}%`);
        continue;
      }
    }

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const orderColumn =
      order?.column && ALLOWED_COLUMNS.has(order.column)
        ? `u.${order.column}`
        : 'u.id';

    const orderDirection =
      order?.direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${orderColumn} ${orderDirection}`;

    // pagination
    sql += ` LIMIT ? OFFSET ?`;
    values.push(Number(limit) || 10, Number(offset) || 0);

    const [rows] = await db.query(sql, values);

    return res.status(200).json({
      success_flag: true,
      message: 'USERS_FETCHED_SUCCESSFULLY',
      data: rows,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

// get user by id
export const getUserByID = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE id=?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success_flag: false,
        message: 'USER_NOT_FOUND',
      });
    }

    return res.json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'ERROR' });
  }
};

// create user
export const postUser = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role_id } = req.body;

    const password_hash = await bcrypt.hash(password, 10);

    const { rawToken, hashedToken } = await generateVerificationToken();

    const [result] = await db.execute(
      `INSERT INTO users(email,password_hash,first_name,last_name,phone,role_id,is_active,is_verified,is_deleted,verification_token)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [email, password_hash, first_name, last_name, phone, role_id, 0, 0, 0, hashedToken]
    );

    const link = `${process.env.FRONTEND_BASE_URL}/auth/verify-email?uid=${result.insertId}&token=${rawToken}`;

    await sendVerificationEmail(email, link, first_name);

    return res.status(201).json({
      success_flag: true,
      message:"USER_REGISTERED_SUCCESSFULLY_VERIFY_EMAIL_TO_ACTIVATE_ACCOUNT",
      user_id: result.insertId,
    });
  } catch (error) {

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success_flag: false,
      message: error.sqlMessage.includes('email')
        ? 'EMAIL_ALREADY_EXISTS'
        : 'PHONE_ALREADY_EXISTS',
    });
  }

  logger.error(error);

  return res.status(500).json({
    success_flag: false,
    message: 'INTERNAL_SERVER_ERROR',
  });
}
};

// update user
export const patchUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({ message: 'NO_DATA' });
    }

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
      fields.push(`${key}=?`);
      values.push(value);
    }

    values.push(id);

    await db.execute(
      `UPDATE users SET ${fields.join(',')} WHERE id=?`,
      values
    );

    return res.json({ message: 'UPDATED' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'ERROR' });
  }
};

// ❗ FIXED: deleteUser (THIS WAS MISSING)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT is_active, is_verified FROM users WHERE id=?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success_flag: false,
        message: 'USER_NOT_FOUND',
      });
    }

    const user = rows[0];

    // soft delete
    if (user.is_active && user.is_verified) {
      await db.execute(
        `UPDATE users SET is_deleted=1, is_active=0 WHERE id=?`,
        [id]
      );
    } else {
      // hard delete
      await db.execute(`DELETE FROM users WHERE id=?`, [id]);
    }

    return res.json({
      success_flag: true,
      message: 'USER_DELETED',
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'ERROR' });
  }
};

// profile
export const getProfile = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE id=?`,
      [req.user.id]
    );

    return res.json({ data: rows[0] });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'ERROR' });
  }
};

// update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
      if (key === 'password') {
        const hash = await bcrypt.hash(value, 10);
        fields.push('password_hash=?');
        values.push(hash);
      } else {
        fields.push(`${key}=?`);
        values.push(value);
      }
    }

    values.push(userId);

    await db.execute(
      `UPDATE users SET ${fields.join(',')} WHERE id=?`,
      values
    );

    return res.json({ message: 'PROFILE_UPDATED' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'ERROR' });
  }
};