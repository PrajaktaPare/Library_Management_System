import pool from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';

/**
 * Creates a new role.
 *
 * @param {Request} req - Express request object containing role details.
 * @param {Response} res - Express response object used to return the created role.
 * @returns {Promise<Response>}
 */
export const createRole = async (req, res) => {
  try {
    const { role_name } = req.body;

    // Check if the role already exists
    const [existingRows] = await pool.execute(
      `
      SELECT id
      FROM roles
      WHERE role_name = ?
      `,
      [role_name]
    );

    // check duplicate role
    if (existingRows.length > 0) {
      throw new Error('Role already exists.');
    }

    // Insert new role record
    const [result] = await pool.execute(
      `
      INSERT INTO roles (role_name)
      VALUES (?)
      `,
      [role_name]
    );

    // Return success response
    return res.status(201).json({
      success_flag: true,
      message: 'Role created successfully.',
    });
  } catch (error) {
    logger.error('CREATE ROLE ERROR', error);

    // Return error response
    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Retrieves all roles with support for filtering,
 * sorting, and pagination.
 *
 * @param {Request} req - Express request object containing query parameters.
 * @param {Response} res - Express response object used to return role records.
 * @returns {Promise<Response>}
 */
export const getAllRoles = async (req, res) => {
  try {
    // Base query to fetch role records
    const baseSql = `
      SELECT *
      FROM roles
    `;

    // Generate dynamic query with filtering, sorting, and pagination
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql,
    });

    // Execute query
    const [rows] = await pool.query(sql, values);

    // Return role records
    return res.status(200).json({
      success_flag: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    logger.error('GET ALL ROLES ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Retrieves role details by role ID.
 *
 * @param {Request} req - Express request object containing the role ID in route parameters.
 * @param {Response} res - Express response object used to return role details.
 * @returns {Promise<Response>}
 */
export const getRoleById = async (req, res) => {
  try {
    // Extract role ID from route parameters
    const { id } = req.params;

    // Fetch role details
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // check that the role exists
    if (rows.length === 0) {
      throw new Error('Role not found.');
    }

    // Return role details
    return res.status(200).json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    logger.error('GET ROLE BY ID ERROR', error);

    // Return not found response
    return res.status(404).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Updates role details by role ID.
 *
 * @param {Request} req - Express request object containing the role ID and updated role data.
 * @param {Response} res - Express response object used to return the updated role details.
 * @returns {Promise<Response>}
 */
export const updateRole = async (req, res) => {
  try {
    // Extract role ID from route parameters
    const { id } = req.params;

    // Extract updated role name from request body
    const { role_name } = req.body;

    // Check whether the role exists
    const [existingRows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // check that the role exists
    if (existingRows.length === 0) {
      throw new Error('Role not found.');
    }

    // Check for duplicate role name
    const [duplicateRows] = await pool.execute(
      `
      SELECT id
      FROM roles
      WHERE role_name = ?
      AND id != ?
      `,
      [role_name, id]
    );

    // check duplicate role
    if (duplicateRows.length > 0) {
      throw new Error('Role already exists.');
    }

    // Update role details
    await pool.execute(
      `
      UPDATE roles
      SET role_name = ?
      WHERE id = ?
      `,
      [role_name, id]
    );

    // Fetch updated role details
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // Return success response
    return res.status(200).json({
      success_flag: true,
      message: 'Role updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    logger.error('UPDATE ROLE ERROR', error);

    // Return error response
    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Deletes a role by role ID.
 *
 * @param {Request} req - Express request object containing the role ID in route parameters.
 * @param {Response} res - Express response object used to return the deletion status.
 * @returns {Promise<Response>}
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check whether the role exists
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // check that the role exists
    if (rows.length === 0) {
      throw new Error('Role not found.');
    }

    // Delete role record
    await pool.execute(
      `
      DELETE FROM roles
      WHERE id = ?
      `,
      [id]
    );

    // Return success response
    return res.status(200).json({
      success_flag: true,
      message: 'Role deleted successfully.',
    });
  } catch (error) {
    logger.error('DELETE ROLE ERROR', error);

    // Return error response
    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};
