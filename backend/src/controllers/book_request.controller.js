import pool from '../config/db.config.js';
import logger from '../services/logger.service.js';

import { sendEmail } from '../services/email.service.js';

import { buildFilterQuery } from '../utils/query.filter.js';

// issue duration
const ISSUE_DURATION_DAYS = Number(process.env.ISSUE_DURATION_DAYS) || 7;

// fine amount
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 5;

// format date helper
const formatDate = date =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

/**
 * Returns total request count and total pages.
 * @param {Request} req - Express request object containing filters and limit.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Total request count response.
 */
export const getRequestsCount = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql: `
        SELECT COUNT(*) AS total_records
        FROM book_requests br
        JOIN users u ON br.student_id = u.id
        JOIN books b ON br.book_id = b.id
      `,
      tableAlias: 'br',
    });

    const [rows] = await pool.query(sql, values);

    const totalRecords = rows[0]?.total_records || 0;

    return res.status(200).json({
      success_flag: true,
      data: {
        total_records: totalRecords,
        limit,
        total_pages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    logger.error('GET REQUEST COUNT ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Creates a new book request.
 * @param {Request} req - Express request object containing request data.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Created request response.
 * @throws Error if book unavailable or duplicate request exists.
 */
export const requestBook = async (req, res) => {
  try {
    // extract student id
    const studentId = req.user.id;

    // extract book id
    const { book_id } = req.body;

    // fetch book
    const [bookRows] = await pool.execute(
      `
      SELECT
        id,
        title,
        available_copies,
        status
      FROM books
      WHERE id = ?
      `,
      [book_id]
    );

    const book = bookRows[0];

    // validate book
    if (!book) {
      throw new Error('BOOK_NOT_FOUND');
    }

    // validate availability
    if (book.available_copies < 1 || book.status === 'unavailable') {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    // check pending request
    const [pendingRows] = await pool.execute(
      `
      SELECT id
      FROM book_requests
      WHERE student_id = ?
      AND book_id = ?
      AND request_status = 'pending'
      `,
      [studentId, book_id]
    );

    // validate pending request
    if (pendingRows.length > 0) {
      throw new Error('REQUEST_ALREADY_PENDING');
    }

    // check active issue
    const [issueRows] = await pool.execute(
      `
      SELECT id
      FROM book_issued
      WHERE student_id = ?
      AND book_id = ?
      AND status = 'active'
      `,
      [studentId, book_id]
    );

    // validate active issue
    if (issueRows.length > 0) {
      throw new Error('BOOK_ALREADY_ISSUED');
    }

    // create request
    const [result] = await pool.execute(
      `
      INSERT INTO book_requests
      (
        student_id,
        book_id
      )
      VALUES (?, ?)
      `,
      [studentId, book_id]
    );

    // fetch request
    const [requestRows] = await pool.execute(
      `
      SELECT
        br.id,
        br.request_status,
        br.requested_at,
        br.created_at,

        u.id AS student_id,
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

      FROM book_requests br

      JOIN users u
        ON br.student_id = u.id

      JOIN books b
        ON br.book_id = b.id

      WHERE br.id = ?
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success_flag: true,
      message: 'BOOK_REQUEST_CREATED',
      data: requestRows[0],
    });
  } catch (error) {
    // log error
    logger.error('REQUEST BOOK ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Fetches all book requests.
 * @param {Request} req - Express request object containing filters.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} List of requests.
 */
export const getRequests = async (req, res) => {
  try {
    // base sql
    const baseSql = `
      SELECT
        br.id,
        br.student_id,
        br.request_status,
        br.requested_at,
        br.issued_at,
        br.created_at,

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
        b.category,
        b.sub_category

      FROM book_requests br

      JOIN users u
        ON br.student_id = u.id

      JOIN books b
        ON br.book_id = b.id
    `;

    // create filter object
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    // ensure where exists
    filter.where = filter.where || {};

    // student -> own requests only
    if (req.user.role === 'student') {
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
      tableAlias: 'br',
    });

    // execute query
    const [rows] = await pool.query(sql, values);

    return res.status(200).json({
      success_flag: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    logger.error('GET REQUESTS ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Fetches request details by id.
 * @param {Request} req - Express request object containing request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Request details response.
 * @throws Error if request not found.
 */
export const getRequestById = async (req, res) => {
  try {
    // extract id
    const { id } = req.params;

    // fetch request
    const [rows] = await pool.execute(
      `
      SELECT
        br.id,
        br.request_status,
        br.requested_at,
        br.issued_at,
        br.created_at,

        u.id AS student_id,
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

      FROM book_requests br

      JOIN users u
        ON br.student_id = u.id

      JOIN books b
        ON br.book_id = b.id

      WHERE br.id = ?
      `,
      [id]
    );

    // validate request
    if (rows.length === 0) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    return res.status(200).json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    // log error
    logger.error('GET REQUEST BY ID ERROR', error);

    return res.status(404).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Approves and issues a requested book.
 * @param {Request} req - Express request object containing request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Approved request response.
 * @throws Error if request invalid or book unavailable.
 */
export const approveRequest = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // extract request id
    const { id } = req.params;

    // start transaction
    await connection.beginTransaction();

    // fetch request with row lock
    const [rows] = await connection.execute(
      `
      SELECT
        br.id,
        br.student_id,
        br.book_id,
        br.request_status,
        br.requested_at,

        u.email,

        CONCAT(
          u.first_name,
          ' ',
          u.last_name
        ) AS student_name,

        b.title,
        b.author,
        b.book_num,
        b.category,
        b.available_copies,
        b.status

      FROM book_requests br

      JOIN users u
        ON br.student_id = u.id

      JOIN books b
        ON br.book_id = b.id

      WHERE br.id = ?

      FOR UPDATE
      `,
      [id]
    );

    // extract request
    const request = rows[0];

    // validate request exists
    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    // validate request status
    if (request.request_status !== 'pending') {
      throw new Error('REQUEST_NOT_PENDING');
    }

    // validate availability
    if (request.available_copies < 1 || request.status === 'unavailable') {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    // decrease available copies
    const [updateBook] = await connection.execute(
      `
      UPDATE books
      SET available_copies =
        available_copies - 1
      WHERE id = ?
      AND available_copies > 0
      `,
      [request.book_id]
    );

    // validate update success
    if (updateBook.affectedRows === 0) {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

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
      [request.book_id]
    );

    // create dates
    const now = new Date();

    const dueDate = new Date();

    dueDate.setDate(dueDate.getDate() + ISSUE_DURATION_DAYS);

    // formatted dates
    const issueDateStr = now.toISOString().split('T')[0];

    const dueDateStr = dueDate.toISOString().split('T')[0];

    const issuedAt = now.toISOString().slice(0, 19).replace('T', ' ');

    // create issue entry
    await connection.execute(
      `
      INSERT INTO book_issued
      (
        request_id,
        student_id,
        book_id,
        issue_date,
        due_date,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'active')
      `,
      [id, request.student_id, request.book_id, issueDateStr, dueDateStr]
    );

    // update request status
    await connection.execute(
      `
      UPDATE book_requests
      SET
        request_status = 'issued',
        issued_at = ?
      WHERE id = ?
      `,
      [issuedAt, id]
    );

    // commit transaction
    await connection.commit();

    // send issue email
      await sendEmail({
        type: 'book_issued',
        to: request.email,
        variables: {
          student_name: request.student_name,
          book_title: request.title,
          book_author: request.author,
          book_isbn: request.book_num,
          book_category: request.category,
          issue_date: formatDate(now),
          due_date: formatDate(dueDate),
          fine_per_day: FINE_PER_DAY,
        },
      });
    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_REQUEST_APPROVED',
      data: {
        request_id: id,
        student_name: request.student_name,
        book_title: request.title,
        issued_at: issuedAt,
        due_date: dueDateStr,
      },
    });
  } catch (error) {
    // rollback transaction
    await connection.rollback();

    // log error
    logger.error('APPROVE REQUEST ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  } finally {
    // release connection
    connection.release();
  }
};

/**
 * Rejects a pending book request.
 * @param {Request} req - Express request object containing request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Rejected request response.
 * @throws Error if request invalid.
 */
export const rejectRequest = async (req, res) => {
  try {
    // extract params
    const { id } = req.params;

    const { reason = 'No reason provided' } = req.body;

    // fetch request
    const [rows] = await pool.execute(
      `
      SELECT
        br.id,
        br.request_status,
        br.requested_at,

        u.email,

        CONCAT(
          u.first_name,
          ' ',
          u.last_name
        ) AS student_name,

        b.title,
        b.author,
        b.book_num,
        b.category

      FROM book_requests br

      JOIN users u
        ON br.student_id = u.id

      JOIN books b
        ON br.book_id = b.id

      WHERE br.id = ?
      `,
      [id]
    );

    const request = rows[0];

    // validate request
    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    // validate status
    if (request.request_status !== 'pending') {
      throw new Error('REQUEST_NOT_PENDING');
    }

    // update request
    await pool.execute(
      `
      UPDATE book_requests
      SET request_status =
        'rejected'
      WHERE id = ?
      `,
      [id]
    );

    // send email
    await sendEmail({
  type: 'book_rejected',
  to: request.email,
  variables: {
    student_name: request.student_name,
    book_title: request.title,
    book_author: request.author,
    book_isbn: request.book_num,
    book_category: request.category,
    requested_at: formatDate(request.requested_at),
    rejected_at: formatDate(new Date()),
    reason,
  },
});

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_REQUEST_REJECTED',
    });
  } catch (error) {
    // log error
    logger.error('REJECT REQUEST ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Cancels a pending request.
 * @param {Request} req - Express request object containing request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Cancelled request response.
 * @throws Error if unauthorized or request invalid.
 */
export const cancelRequest = async (req, res) => {
  try {
    // extract student id
    const studentId = req.user.id;

    // extract request id
    const { id } = req.params;

    // fetch request
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM book_requests
      WHERE id = ?
      `,
      [id]
    );

    const request = rows[0];

    // validate request
    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    // validate status
    if (request.request_status !== 'pending') {
      throw new Error('REQUEST_NOT_PENDING');
    }

    // delete request
    await pool.execute(
      `
      DELETE FROM book_requests
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      success_flag: true,
      message: 'REQUEST_CANCELLED',
    });
  } catch (error) {
    // log error
    logger.error('CANCEL REQUEST ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  }
};
