import pool from '../config/db.js';
import logger from '../services/logger.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';
/**
 * Creates new role.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const createRole = async (req, res) => {
  try {
    // extract body
    const { role_name } = req.body;

    // check duplicate
    const [existingRows] = await pool.execute(
      `
      SELECT id
      FROM roles
      WHERE role_name = ?
      `,
      [role_name]
    );

    // validate duplicate
    if (existingRows.length > 0) {
      throw new Error('ROLE_ALREADY_EXISTS');
    }

    // insert role
    const [result] = await pool.execute(
      `
      INSERT INTO roles (role_name)
      VALUES (?)
      `,
      [role_name]
    );

    // fetch created role
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success_flag: true,
      message: 'ROLE_CREATED',
      data: rows[0],
    });
  } catch (error) {
    logger.error('CREATE ROLE ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Fetches all roles.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const getAllRoles = async (req, res) => {
  try {
    const baseSql = `
      SELECT *
      FROM roles
    `;

    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql,
    });

    const [rows] = await pool.query(sql, values);

    return res.status(200).json({
      success_flag: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    logger.error('GET ALL ROLES ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Fetches role by id.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const getRoleById = async (req, res) => {
  try {
    // extract id
    const { id } = req.params;

    // fetch role
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // validate role
    if (rows.length === 0) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return res.status(200).json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    logger.error('GET ROLE BY ID ERROR', error);

    return res.status(404).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Updates role.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const updateRole = async (req, res) => {
  try {
    // extract params
    const { id } = req.params;

    const { role_name } = req.body;

    // check role exists
    const [existingRows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // validate role
    if (existingRows.length === 0) {
      throw new Error('ROLE_NOT_FOUND');
    }

    // check duplicate
    const [duplicateRows] = await pool.execute(
      `
      SELECT id
      FROM roles
      WHERE role_name = ?
      AND id != ?
      `,
      [role_name, id]
    );

    // validate duplicate
    if (duplicateRows.length > 0) {
      throw new Error('ROLE_ALREADY_EXISTS');
    }

    // update role
    await pool.execute(
      `
      UPDATE roles
      SET role_name = ?
      WHERE id = ?
      `,
      [role_name, id]
    );

    // fetch updated role
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      success_flag: true,
      message: 'ROLE_UPDATED',
      data: rows[0],
    });
  } catch (error) {
    logger.error('UPDATE ROLE ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Deletes role.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const deleteRole = async (req, res) => {
  try {
    // extract id
    const { id } = req.params;

    // check role exists
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // validate role
    if (rows.length === 0) {
      throw new Error('ROLE_NOT_FOUND');
    }

    // delete role
    await pool.execute(
      `
      DELETE FROM roles
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      success_flag: true,
      message: 'ROLE_DELETED',
    });
  } catch (error) {
    logger.error('DELETE ROLE ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};
