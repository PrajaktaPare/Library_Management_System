import pool from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { sendBookIssuedEmail, sendBookRejectedEmail } from '../services/email.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';
import { formatDate } from '../services/format_date.service.js';
/**
 * Returns total book request count
 * @param {Request} req - Express request object containing Where condition.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Total book request count response.
 */
export const getRequestsCount = async (req, res) => {
  try {
    // build count query
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql: `
        SELECT COUNT(*) AS total_records
        FROM book_requests br
        JOIN users u
        ON br.student_id = u.id
        JOIN books b
        ON br.book_id = b.id
      `,
      tableAlias: 'br',
      includePagination: false,
    });

    // execute built query
    const [rows] = await pool.query(sql, values);

    // extract total count
    const totalRecords = rows[0]?.total_records || 0;

    return res.status(200).json({
      success_flag: true,
      data: {
        count: totalRecords,
      },
    });
  } catch (error) {
    logger.error('GET BOOK REQUEST COUNT ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: error.message || 'An unexpected error occurred. Please try again later.',
    });
  }
};

/**
 * Creates a new book request.
 * @param {Request} req - Express request object containing request data.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Created book request response.
 * @throws Error if book unavailable or duplicate book request exists.
 */
export const requestBook = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { bookId } = req.body;

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
      [bookId]
    );

    const book = bookRows[0];

    // Check if the book exists in the database
    if (!book) {
      throw new Error('Book not found.');
    }

    // Ensure the book has available copies and can be issued
    if (book.available_copies < 1 || book.status === 'unavailable') {
      throw new Error('Book is currently not available.');
    }

    // Check whether the student already has a pending request for this book
    const [pendingRows] = await pool.execute(
      `
      SELECT id
      FROM book_requests
      WHERE student_id = ?
      AND book_id = ?
      AND request_status = 'pending'
      `,
      [studentId, bookId]
    );

    // Prevent duplicate pending requests
    if (pendingRows.length > 0) {
      throw new Error('You already have a pending request for this book.');
    }

    // check active issued book
    const [issuedRows] = await pool.execute(
      `
      SELECT id
      FROM book_issued
      WHERE student_id = ?
      AND book_id = ?
      AND status = 'active'
      `,
      [studentId, bookId]
    );

    // Prevent requesting a book that is already issued to the student
    if (issuedRows.length > 0) {
      throw new Error('This book has already been issued to you.');
    }

    // Create a new book request record
    const [result] = await pool.execute(
      `
      INSERT INTO book_requests
      (
        student_id,
        book_id
      )
      VALUES (?, ?)
      `,
      [studentId, bookId]
    );

    // Return success response after book request creation
    return res.status(201).json({
      success_flag: true,
      message: 'Book request created successfully.',
    });
  } catch (error) {
    logger.error('BOOK REQUEST ERROR', error);

    // Return error response to client
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
 * @returns {Promise<Response>} List of book requests.
 */
export const getRequests = async (req, res) => {
  try {
    // Base query to fetch book request details along with student and book information
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

    // Parse filter object from query parameters
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    // Initialize where clause if not provided
    filter.where = filter.where || {};

    // Restrict students to viewing only their own book  requests
    if (req.user.role === 'student') {
      filter.where.student_id = req.user.id;
    }

    // Update query parameters with modified filters
    const modifiedQuery = {
      ...req.query,
      filter: JSON.stringify(filter),
    };

    // Generate dynamic SQL query with filters
    const { sql, values } = buildFilterQuery({
      query: modifiedQuery,
      baseSql,
      tableAlias: 'br',
    });

    // Execute generated query
    const [rows] = await pool.query(sql, values);

    // Return book request records
    return res.status(200).json({
      success_flag: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    logger.error('GET BOOK REQUESTS ERROR', error);

    // Return error response
    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Fetches book request details by id.
 * @param {Request} req - Express request object containing request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Book Request details response.
 * @throws Error if book request not found.
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch book request details along with associated student and book information
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

    // Check that the requested book exists
    if (rows.length === 0) {
      throw new Error('Book request not found.');
    }

    // Return book request details
    return res.status(200).json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    logger.error('GET BOOK REQUEST BY ID ERROR', error);

    // Return not found response for missing book request
    if (error.message === 'Book request not found.') {
      return res.status(404).json({
        success_flag: false,
        message: error.message,
      });
    }

    // Return internal server error response for unexpected errors
    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Approve a requested book.
 * @param {Request} req - Express request object containing request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Approved book request response.
 * @throws Error if book request invalid or book unavailable.
 */
export const approveRequest = async (req, res) => {
  const issueDurationDays = Number(process.env.ISSUE_DURATION_DAYS) || 7;
  const finePerDay = Number(process.env.FINE_PER_DAY) || 5;

  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    // start transaction
    await connection.beginTransaction();
    // Retrieve book request details along with associated student and book information
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
      `,
      [id]
    );

    // Extract book request details
    const bookRequest = rows[0];

    // check that the book request exists
    if (!bookRequest) {
      throw new Error('Book request not found.');
    }

    // Ensure only pending book requests can be approved
    if (bookRequest.request_status !== 'pending') {
      throw new Error('This book request is no longer pending.');
    }

    // Verify that the requested book is available for issue
    if (bookRequest.available_copies < 1 || bookRequest.status === 'unavailable') {
      throw new Error('Book is currently not available.');
    }

    // Reduce available book copies
    const [updateBook] = await connection.execute(
      `
      UPDATE books
      SET available_copies =
        available_copies - 1
      WHERE id = ?
      AND available_copies > 0
      `,
      [bookRequest.book_id]
    );

    // Ensure book stock was updated successfully
    if (updateBook.affectedRows === 0) {
      throw new Error('Book is currently not available.');
    }

    // Update book status based on remaining available copies
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
      [bookRequest.book_id]
    );

    // Generate issuedate and duedate
    const bookissuedDate = new Date();

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + issueDurationDays);

    const issuedAt = new Date();

    // Create issued book record
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
      [id, bookRequest.student_id, bookRequest.book_id, bookissuedDate, dueDate]
    );

    // Mark book request as issued and store timestamp
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

    // Commit transaction after all database operations succeed
    await connection.commit();

    // Send book issued notification email to the student
    await sendBookIssuedEmail({
      email: bookRequest.email,
      studentName: bookRequest.student_name,
      bookTitle: bookRequest.title,
      bookAuthor: bookRequest.author,
      bookIsbn: bookRequest.book_num,
      bookCategory: bookRequest.category,
      issueDate: formatDate(bookissuedDate),
      dueDate: formatDate(dueDate),
      finePerDay: finePerDay,
    });

    // Return successful approval response
    return res.status(200).json({
      success_flag: true,
      message: 'Book request approved successfully.',
      data: {
        request_id: id,
        student_name: bookRequest.student_name,
        book_title: bookRequest.title,
        issued_at: issuedAt,
        due_date: dueDate,
      },
    });
  } catch (error) {
    // Roll back all database changes if any operation fails
    await connection.rollback();

    logger.error('APPROVE BOOK REQUEST ERROR', error);

    if (error.message === 'Book request not found.' || error.message === 'BOOK_REQUEST_ALREADY_PROCESSED') {
      return res.status(404).json({
        success_flag: false,
        message: error.message,
      });
    }

    if (error.message === 'Book is currently not available.') {
      return res.status(400).json({
        success_flag: false,
        message: error.message,
      });
    }

    // Return internal server error response for unexpected errors
    return res.status(500).json({
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
 * @param {Request} req - Express request object containing book request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Rejected book request response.
 * @throws Error if book request invalid.
 */
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'No reason provided' } = req.body;

    // Fetch book request details along with student and book information
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

    // Extract book request details
    const bookRequest = rows[0];

    // check that the book request exists
    if (!bookRequest) {
      throw new Error('Request not found.');
    }

    // Ensure only pending book requests can be rejected
    if (bookRequest.request_status !== 'pending') {
      throw new Error('This request is not in pending status.');
    }

    // Update book request status to rejected
    await pool.execute(
      `
      UPDATE book_requests
      SET request_status =
        'rejected'
      WHERE id = ?
      `,
      [id]
    );
    logger.info('BOOK REJECTED');

    // Send rejection notification email to the student
    await sendBookRejectedEmail({
      email: bookRequest.email,
      studentName: bookRequest.student_name,
      bookTitle: bookRequest.title,
      bookAuthor: bookRequest.author,
      bookIsbn: bookRequest.book_num,
      bookCategory: bookRequest.category,
      requestedAt: formatDate(bookRequest.requested_at),
      rejectedAt: formatDate(new Date()),
      reason,
    });

    // Return success response
    return res.status(200).json({
      success_flag: true,
      message: 'Book request rejected successfully.',
    });
  } catch (error) {
    // log error
    logger.error('REJECT BOOK REQUEST ERROR', error);

    if (error.message === 'Book request not found.') {
      return res.status(404).json({
        success_flag: false,
        message: error.message,
      });
    }

    if (error.message === 'This book request is no longer pending.') {
      return res.status(400).json({
        success_flag: false,
        message: error.message,
      });
    }

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Cancel a pending  book request.
 * @param {Request} req - Express request object containing book request id.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Cancelled book request response.
 * @throws Error if unauthorized or book request invalid.
 */
export const cancelRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    // Fetch book request details
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM book_requests
      WHERE id = ?
      `,
      [id]
    );

    const bookRequest = rows[0];

    // check that the book request exists
    if (!bookRequest) {
      throw new Error('Book request not found.');
    }

    // Ensure only pending book requests can be cancelled
    if (bookRequest.request_status !== 'pending') {
      throw new Error('This book request is no longer pending.');
    }

    // Ensure students can cancel only their own book requests
    if (bookRequest.student_id !== studentId) {
      throw new Error('You are not authorized to access this book request.');
    }
    // Delete the pending book request
    await pool.execute(
      `
      DELETE FROM book_requests
      WHERE id = ?
      `,
      [id]
    );

    // Return success response
    return res.status(200).json({
      success_flag: true,
      message: 'Book request cancelled successfully.',
    });
  } catch (error) {
    // log error
    logger.error('CANCEL BOOK REQUEST ERROR', error);

    if (error.message === 'Book request not found.') {
      return res.status(404).json({
        success_flag: false,
        message: error.message,
      });
    }

    if (error.message === 'This book request is no longer pending.') {
      return res.status(400).json({
        success_flag: false,
        message: error.message,
      });
    }

    if (error.message === 'You are not authorized to access this book request.') {
      return res.status(403).json({
        success_flag: false,
        message: error.message,
      });
    }
    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};
