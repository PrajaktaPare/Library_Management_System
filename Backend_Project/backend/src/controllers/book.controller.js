import db from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';

/**
 * Returns total books count and pages.
 * @param {Request} req
 * @param {Response} res
 */
export const getBooksCount = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql: `SELECT COUNT(*) AS total_records FROM books`,
    });

    const [rows] = await db.query(sql, values);

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
    logger.error('GET BOOK COUNT ERROR', error);

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
    // extract request body
    const {
      title,
      author,
      book_num,
      category,
      sub_category = null,
      total_copies = 0,
      available_copies = 0,
      status = 'unavailable',
    } = req.body;

    // insert book
    const [result] = await db.execute(
      `INSERT INTO books (title, author, book_num, category, sub_category,total_copies,available_copies,status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, book_num, category, sub_category, total_copies, available_copies, status]
    );

    // return response
    return res.status(201).json({
      success_flag: true,
      message: 'BOOK_CREATED',
      data: { book_id: result.insertId },
    });
  } catch (error) {
    // log error
    logger.error(error);

    // return error response
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
    // base query
    const baseSql = `SELECT * FROM books`;

    // build filter query
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql,
    });

    // fetch books
    const [rows] = await db.query(sql, values);

    // check records
    if (!rows.length) {
      const error = new Error('NO_RECORDS_FOUND');

      error.statusCode = 404;

      throw error;
    }

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'BOOKS_FETCHED_SUCCESSFULLY',
      data: rows,
    });
  } catch (error) {
    // log error
    logger.error(error);

    // return error response
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
    // fetch book
    const [rows] = await db.execute(`SELECT * FROM books WHERE id=?`, [req.params.id]);

    // check record
    if (!rows.length) throw new Error('BOOK_NOT_FOUND');

    // return response
    return res.status(200).json({
      success_flag: true,
      data: rows[0],
    });
  } catch (error) {
    // log error
    logger.error(error);

    // return error response
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
    // extract id
    const { id } = req.params;

    // allowed fields for book update
    const ALLOWED_FIELDS = [
      'title',
      'author',
      'book_num',
      'category',
      'sub_category',
      'total_copies',
      'available_copies',
      'status',
    ];

    // validate request body
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_DATA_TO_UPDATE',
      });
    }

    // initialize arrays
    const fields = [];
    const values = [];

    // build dynamic query with whitelisted fields only
    for (const [key, value] of Object.entries(req.body)) {
      if (!ALLOWED_FIELDS.includes(key)) continue;
      fields.push(`${key}=?`);
      values.push(value);
    }

    // validate filtered fields
    if (!fields.length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_VALID_FIELDS_TO_UPDATE',
      });
    }

    // append id
    values.push(id);

    // update book
    await db.execute(`UPDATE books SET ${fields.join(', ')} WHERE id=?`, values);

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_UPDATED',
    });
  } catch (error) {
    // log error
    logger.error('PATCH BOOK ERROR', error);

    // return error response
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
    // extract id
    const { id } = req.params;

    // check book existence
    const [rows] = await db.execute(`SELECT id FROM books WHERE id=?`, [id]);

    // validate record
    if (!rows.length) throw new Error('BOOK_NOT_FOUND');

    // check active issues
    const [activeIssues] = await db.execute(
      `SELECT id FROM issues WHERE book_id=? AND status IN ('active','due')`,
      [id]
    );

    // prevent deletion if active issues exist
    if (activeIssues.length > 0) {
      throw new Error('CANNOT_DELETE_BOOK_WITH_ACTIVE_ISSUES');
    }

    // check pending requests
    const [pendingRequests] = await db.execute(
      `SELECT id FROM book_requests WHERE book_id=? AND request_status='pending'`,
      [id]
    );

    // prevent deletion if pending requests exist
    if (pendingRequests.length > 0) {
      throw new Error('CANNOT_DELETE_BOOK_WITH_PENDING_REQUESTS');
    }

    // delete book
    await db.execute(`DELETE FROM books WHERE id=?`, [id]);

    // return response
    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_DELETED',
    });
  } catch (error) {
    // log error
    logger.error('DELETE BOOK ERROR', error);

    // determine status code
    const statusMap = {
      BOOK_NOT_FOUND: 404,
      CANNOT_DELETE_BOOK_WITH_ACTIVE_ISSUES: 409,
      CANNOT_DELETE_BOOK_WITH_PENDING_REQUESTS: 409,
    };

    // return error response
    return res.status(statusMap[error.message] || 500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};
