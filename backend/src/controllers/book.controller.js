import db from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';

/**
 * Returns total request count
 * @param {Request} req - Express request object containing Where condition.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Total request count response.
 */
export const getBooksCount = async (req, res) => {
  try {
    // Build count query with where condition
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql: `
        SELECT COUNT(*) AS total_records
        FROM books
      `,
      includePagination: false,
    });

    // Execute count query
    const [rows] = await db.query(sql, values);

    // Extract total record count
    const totalRecords = rows[0]?.total_records || 0;

    // Return total number of books
    return res.status(200).json({
      success_flag: true,
      data: {
        count: totalRecords,
      },
    });
  } catch (error) {
    logger.error('GET BOOK COUNT ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Creates a new book.
 * @param {Request} req - Express request object containing book data.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Created book response.
 * @throws Error if duplicate book number exists.
 */
export const createBook = async (req, res) => {
  try {
    // Extract book details from request body
    const { title, author, book_num, category, sub_category, total_copies, available_copies, status } =
      req.body;

    // Insert new book record into the database
    const [result] = await db.execute(
      `INSERT INTO books
      (
        title,
        author,
        book_num,
        category,
        sub_category,
        total_copies,
        available_copies,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, book_num, category, sub_category, total_copies, available_copies, status]
    );

    // Return success response with created book ID
    return res.status(201).json({
      success_flag: true,
      message: 'BOOK_CREATED',
      data: { book_id: result.insertId },
    });
  } catch (error) {
    logger.error(error);

    // Return conflict response for duplicate book number,
    // otherwise return internal server error response
    return res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({
      success_flag: false,
      message:
        error.code === 'ER_DUP_ENTRY' ? 'BOOK_NUM_ALREADY_EXISTS' : error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Fetches all books with filters.
 * @param {Request} req - Express request object containing filters.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} List of books.
 * @throws Error if no records found.
 */
export const getAllBooks = async (req, res) => {
  try {
    // Base query to fetch book records
    const baseSql = `SELECT * FROM books`;

    // Generate dynamic query with filtering, sorting, and pagination
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql,
    });

    // Execute query
    const [rows] = await db.query(sql, values);

    // check that book records exist
    if (!rows.length) {
      const error = new Error('NO_RECORDS_FOUND');
      error.statusCode = 404;
      throw error;
    }

    // Return book records
    return res.status(200).json({
      success_flag: true,
      message: 'BOOKS_FETCHED_SUCCESSFULLY',
      data: rows,
    });
  } catch (error) {
    logger.error(error);

    // Return appropriate error response
    return res.status(error.statusCode || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Fetches a single book by ID.
 * @param {Request} req - Express request object containing book ID.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Book details.
 * @throws Error if book not found.
 */
export const getBookById = async (req, res) => {
  try {
    // Fetch book details by ID
    const [rows] = await db.execute(`SELECT * FROM books WHERE id = ?`, [req.params.id]);

    // check that the book exists
    if (!rows.length) {
      throw new Error('BOOK_NOT_FOUND');
    }

    // Return book details
    return res.status(200).json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    logger.error(error);

    // Return appropriate error response
    return res.status(error.message === 'BOOK_NOT_FOUND' ? 404 : 500).json({
      success_flag: false,
      message: error.message === 'BOOK_NOT_FOUND' ? error.message : 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Updates book details dynamically.
 * @param {Request} req - Express request object containing update data.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Update status.
 */
export const patchBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Initialize arrays for dynamic update query
    const fields = [];
    const values = [];

    // Build dynamic SET clause using request body fields
    for (const [key, value] of Object.entries(req.body)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    // check that at least one field is provided for update
    if (!fields.length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_VALID_FIELDS_TO_UPDATE',
      });
    }

    // Append book ID for WHERE condition
    values.push(id);

    // Update book record with provided fields
    await db.execute(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, values);

    // Return success response
    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_UPDATED',
    });
  } catch (error) {
    logger.error('PATCH BOOK ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Deletes a book by ID.
 * @param {Request} req - Express request object containing book ID.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Delete status.
 * @throws Error if book not found.
 */
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch book details by ID
    const [rows] = await db.execute(`SELECT id FROM books WHERE id = ?`, [id]);

    // check that the book exists
    if (!rows.length) {
      throw new Error('BOOK_NOT_FOUND');
    }

    // Check for active book issued
    const [activeIssuedBooks] = await db.execute(
      `
      SELECT id
      FROM book_issued
      WHERE book_id = ?
      AND status IN ('active', 'due')
      `,
      [id]
    );

    // Prevent deletion if the book is currently issued
    if (activeIssuedBooks.length > 0) {
      throw new Error('CANNOT_DELETE_BOOK_WITH_ACTIVE_ISSUED_DATA');
    }

    // Check for pending book requests
    const [pendingRequests] = await db.execute(
      `
      SELECT id
      FROM book_requests
      WHERE book_id = ?
      AND request_status = 'pending'
      `,
      [id]
    );

    // Prevent deletion if pending requests exist
    if (pendingRequests.length > 0) {
      throw new Error('CANNOT_DELETE_BOOK_WITH_PENDING_REQUESTS');
    }

    // Delete book record
    await db.execute(`DELETE FROM books WHERE id = ?`, [id]);

    // Return success response
    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_DELETED',
    });
  } catch (error) {
    logger.error('DELETE BOOK ERROR', error);

    // Map business errors to appropriate HTTP status codes
    const statusMap = {
      BOOK_NOT_FOUND: 404,
      CANNOT_DELETE_BOOK_WITH_ACTIVE_ISSUED_DATA: 409,
      CANNOT_DELETE_BOOK_WITH_PENDING_REQUESTS: 409,
    };

    // Return error response
    return res.status(statusMap[error.message] || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};
