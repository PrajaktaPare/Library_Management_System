// user_service.js

import pool from '../config/db.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from './email_service.js';

/* =========================================
   FUNCTION: getAllUsersService

   PURPOSE:
   Fetch all users

   PARAMETER:
   - filters
   - pagination
   - sorting

   RETURN:
   - users array
========================================= */
export const getAllUsersService = async (
  filters = {},
  pagination = {},
  sorting = {}
) => {

  let sql = `
    SELECT
      users.id,
      users.username,
      users.email,
      users.name,
      users.phone,
      users.role_id,
      roles.role_name,
      users.is_active,
      users.is_verified,
      users.created_at,
      users.updated_at

    FROM users

    LEFT JOIN roles
    ON users.role_id = roles.id

    WHERE 1=1
  `;

  const values = [];

  // Apply filters
  Object.entries(filters).forEach(
    ([key, value]) => {

      if (value) {

        sql += `
          AND users.${key} LIKE ?
        `;

        values.push(
          `%${value}%`
        );
      }
    }
  );

  // Apply sorting
  if (
    sorting.sortBy &&
    sorting.order
  ) {

    sql += `
      ORDER BY
      users.${sorting.sortBy}
      ${sorting.order}
    `;
  }

  // Apply pagination
  if (
    pagination.limit !== null &&
    pagination.offset !== null
  ) {

    sql += `
      LIMIT ? OFFSET ?
    `;

    values.push(
      Number(
        pagination.limit
      ),
      Number(
        pagination.offset
      )
    );
  }

  const [rows] =
    await pool.query(
      sql,
      values
    );

  return rows;
};

/* =========================================
   FUNCTION: getUserByIDService

   PURPOSE:
   Fetch user by id

   PARAMETER:
   - id

   RETURN:
   - user object
========================================= */
export const getUserByIDService = async id => {

  const [rows] =
    await pool.execute(
      `
      SELECT
        users.id,
        users.username,
        users.email,
        users.name,
        users.phone,
        users.role_id,
        roles.role_name,
        users.is_active,
        users.is_verified,
        users.created_at,
        users.updated_at

      FROM users

      LEFT JOIN roles
      ON users.role_id = roles.id

      WHERE users.id = ?
      `,
      [id]
    );

  return rows[0];
};

/* =========================================
   FUNCTION: createUser

   PURPOSE:
   Create user

   PARAMETER:
   - user data

   RETURN:
   - insert result
========================================= */
export const createUser = async ({
  username,
  email,
  password_hash,
  name,
  phone,
  role_id,
}) => {

  // Generate random verification token
  const rawVerificationToken =
    crypto.randomBytes(10).toString('hex');

  // Hash verification token
  const hashedVerificationToken =
    await bcrypt.hash(rawVerificationToken, 10);

  const [result] = await pool.execute(
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
      password_hash,
      name,
      phone,
      role_id,
      0,
      0,
      hashedVerificationToken,
    ]
  );

  // Create verification link
  const verificationLink =
    `${process.env.FRONTEND_BASE_URL}/auth/verify-email?uid=${result.insertId}&token=${rawVerificationToken}`;

  // Send verification email
  await sendVerificationEmail(email, verificationLink);

  return {
    user_id: result.insertId,
    verification_link: verificationLink,
  };
};

/* =========================================
   FUNCTION: patchUserService

   PURPOSE:
   Partially update user

   PARAMETER:
   - id
   - fields
   - values

   RETURN:
   - update result
========================================= */
export const patchUserService = async (
  id,
  fields,
  values
) => {

  values.push(id);

  const sql = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  const [result] =
    await pool.execute(
      sql,
      values
    );

  return result;
};

/* =========================================
   FUNCTION: putUserService

   PURPOSE:
   Replace user data

   PARAMETER:
   - user data

   RETURN:
   - update result
========================================= */
export const putUserService = async ({
  id,
  username,
  email,
  password_hash,
  name,
  phone,
  role_id,
  is_active,
  is_verified,
}) => {

  const [result] =
    await pool.execute(
      `
      UPDATE users

      SET
        username = ?,
        email = ?,
        password_hash = ?,
        name = ?,
        phone = ?,
        role_id = ?,
        is_active = ?,
        is_verified = ?

      WHERE id = ?
      `,
      [
        username,
        email,
        password_hash,
        name,
        phone,
        role_id,
        is_active,
        is_verified,
        id,
      ]
    );

  return result;
};

/* =========================================
   FUNCTION: deleteUserService

   PURPOSE:
   Delete user

   PARAMETER:
   - id

   RETURN:
   - delete result
========================================= */
export const deleteUserService = async id => {

  const [result] =
    await pool.execute(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [id]
    );

  return result;
};

/* =========================================
   FUNCTION: getProfileService

   PURPOSE:
   Fetch logged-in user profile

   PARAMETER:
   - id

   RETURN:
   - user profile
========================================= */
export const getProfileService = async id => {

  const [rows] =
    await pool.execute(
      `
      SELECT
        users.id,
        users.username,
        users.email,
        users.name,
        users.phone,
        users.role_id,
        roles.role_name,
        users.is_active,
        users.is_verified,
        users.created_at,
        users.updated_at

      FROM users

      LEFT JOIN roles
      ON users.role_id = roles.id

      WHERE users.id = ?
      `,
      [id]
    );

  return rows[0];
};

/* =========================================
   FUNCTION: updateProfileService

   PURPOSE:
   Update logged-in profile

   PARAMETER:
   - id
   - data

   RETURN:
   - update result
========================================= */
export const updateProfileService = async (
  id,
  data
) => {

  const fields = [];

  const values = [];

  // Build dynamic query
  for (const key in data) {

    fields.push(
      `${key} = ?`
    );

    values.push(data[key]);
  }

  values.push(id);

  const sql = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  const [result] =
    await pool.execute(
      sql,
      values
    );

  return result;
};