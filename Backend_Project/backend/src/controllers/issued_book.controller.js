import pool from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';
// fine amount
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 5;

// calculate fine
const calculateFine = dueDate => {
  const today = new Date();

  const due = new Date(dueDate);

  const diffTime = today.getTime() - due.getTime();

  const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (overdueDays <= 0) {
    return 0;
  }

  return overdueDays * FINE_PER_DAY;
};

/**
 * Returns total issues count and total pages.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const getIssuesCount = async (req, res) => {
  try {
    // extract limit
    const limit = Number(req.query.limit) || 10;

    // build count query
    const { sql, values } = buildFilterQuery({
      query: req.query,

      // count total issues
      baseSql: `
        SELECT COUNT(*) AS total_records

        FROM book_issued i

        JOIN users u
          ON i.student_id = u.id

        JOIN books b
          ON i.book_id = b.id
      `,

      // alias for filters
      tableAlias: 'i',
    });

    // execute query
    const [rows] = await pool.query(sql, values);

    // extract total count
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
    logger.error('GET ISSUES COUNT ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Fetches all issued books.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const getAllIssues = async (req, res) => {
  try {
    // log api
    logger.info('GET ALL ISSUES API');

    // base sql
    const baseSql = `
      SELECT
        i.id,
        i.request_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.fine_amount,
        i.status,

        i.student_id,

        CONCAT(
          u.first_name,
          ' ',
          u.last_name
        ) AS student_name,

        u.email,

        b.id AS book_id,
        b.title,
        b.author,
        b.book_num,
        b.category

      FROM book_issued i

      JOIN users u
        ON i.student_id = u.id

      JOIN books b
        ON i.book_id = b.id
    `;

    // create filter object
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    // ensure where exists
    filter.where = filter.where || {};

    // student -> only own issues
    if (Number(req.user.role_id) === 2) {
      filter.where.student_id = req.user.id;
    }

    // create modified query
    const modifiedQuery = {
      ...req.query,
      filter: JSON.stringify(filter),
    };

    // build query
    const { sql, values } = buildFilterQuery({
      query: modifiedQuery,
      baseSql,
      tableAlias: 'i',
    });

    // execute query
    const [rows] = await pool.query(sql, values);

    // add realtime fine
    const updatedRows = rows.map(issue => {
      let currentFine = issue.fine_amount;

      if (issue.status !== 'returned' && new Date() > new Date(issue.due_date)) {
        currentFine = calculateFine(issue.due_date);
      }

      return {
        ...issue,
        current_fine: currentFine,
      };
    });

    return res.status(200).json({
      success_flag: true,
      count: updatedRows.length,
      data: updatedRows,
    });
  } catch (error) {
    // log error
    logger.error('GET ALL ISSUES ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Fetches issue details by id.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const getIssueById = async (req, res) => {
  try {
    // extract issue id
    const { issue_id } = req.params;

    // fetch issue
    const [rows] = await pool.execute(
      `
      SELECT
        i.id,
        i.request_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.fine_amount,
        i.status,

        u.id AS student_id,
        CONCAT(u.first_name,' ',u.last_name)
        AS student_name,
        u.email,

        b.id AS book_id,
        b.title,
        b.author,
        b.book_num,
        b.category

      FROM book_issued i

      JOIN users u
        ON i.student_id = u.id

      JOIN books b
        ON i.book_id = b.id

      WHERE i.id = ?
      `,
      [issue_id]
    );

    const issue = rows[0];

    // validate issue
    if (!issue) {
      throw new Error('ISSUE_NOT_FOUND');
    }

    // calculate realtime fine
    let currentFine = issue.fine_amount;

    if (issue.status !== 'returned' && new Date() > new Date(issue.due_date)) {
      currentFine = calculateFine(issue.due_date);
    }

    return res.status(200).json({
      success_flag: true,
      data: {
        ...issue,
        current_fine: currentFine,
      },
    });
  } catch (error) {
    logger.error('GET ISSUE BY ID ERROR', error);

    return res.status(404).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Returns issued book.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const returnIssue = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // extract issue id
    const { issue_id } = req.params;

    // begin transaction
    await connection.beginTransaction();

    // fetch issue
    const [rows] = await connection.execute(
      `
      SELECT *
      FROM book_issued
      WHERE id = ?
      `,
      [issue_id]
    );

    const issue = rows[0];

    // validate issue
    if (!issue) {
      throw new Error('ISSUE_NOT_FOUND');
    }

    if (issue.status === 'returned') {
      throw new Error('BOOK_ALREADY_RETURNED');
    }

    // calculate fine
    const fineAmount = calculateFine(issue.due_date);

    // return date
    const returnDate = new Date().toISOString().split('T')[0];

    // update issue
    await connection.execute(
      `
      UPDATE book_issued
      SET
        return_date = ?,
        fine_amount = ?,
        status = 'returned'
      WHERE id = ?
      `,
      [returnDate, fineAmount, issue_id]
    );

    // increase stock
    await connection.execute(
      `
      UPDATE books
      SET available_copies =
      available_copies + 1
      WHERE id = ?
      `,
      [issue.book_id]
    );

    // update book status
    await connection.execute(
      `
      UPDATE books
      SET status = CASE
        WHEN available_copies > 0
        THEN 'available'
        ELSE 'unavailable'
      END
      WHERE id = ?
      `,
      [issue.book_id]
    );

    // commit transaction
    await connection.commit();

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_RETURNED_SUCCESSFULLY',
      data: {
        issue_id,
        fine_amount: fineAmount,
        return_date: returnDate,
      },
    });
  } catch (error) {
    // rollback transaction
    await connection.rollback();

    logger.error('RETURN ISSUE ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  } finally {
    // release connection
    connection.release();
  }
};
