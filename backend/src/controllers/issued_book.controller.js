import pool from '../config/db.config.js';
import logger from '../services/logger.service.js';
import { buildFilterQuery } from '../utils/query.filter.js';
import { calculateFine } from '../services/calculate_fine.service.js';

/**
 * Returns total count
 * @param {Request} req - Express request object containing Where condition.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Total count response.
 */
export const getIssuedBooksCount = async (req, res) => {
  try {
    // Generate count query with where condition
    const { sql, values } = buildFilterQuery({
      query: req.query,
      baseSql: `
        SELECT COUNT(*) AS total_records
        FROM book_issued i
        JOIN users u
        ON i.student_id = u.id
        JOIN books b
        ON i.book_id = b.id
      `,
      tableAlias: 'i',
      includePagination: false,
    });

    // Execute count query
    const [rows] = await pool.query(sql, values);

    // Extract count of total records
    const totalRecords = rows[0]?.total_records || 0;

    // Return total issued books count
    return res.status(200).json({
      success_flag: true,
      data: {
        total_records: totalRecords,
      },
    });
  } catch (error) {
    logger.error('GET ISSUED BOOK COUNT ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Retrieves issued book records with support for
 * filtering, sorting, pagination, and role-based access.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>}
 */
export const getAllIssuedBooks = async (req, res) => {
  try {
    // Base query to fetch issued book details
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

    // Parse filter object from query parameters
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    // Ensure where clause exists
    filter.where = filter.where || {};

    // Restrict students to viewing only their own issued books
    if (req.user.role === 'student') {
      filter.where.student_id = req.user.id;
    }

    // Create modified query with role-based filters
    const modifiedQuery = {
      ...req.query,
      filter: JSON.stringify(filter),
    };

    // Generate query with filters
    const { sql, values } = buildFilterQuery({
      query: modifiedQuery,
      baseSql,
      tableAlias: 'i',
    });

    // Execute query
    const [rows] = await pool.query(sql, values);

    // Calculate fine for overdue books
    const updatedRows = rows.map(issuedBook => {
      let fine = 0;
      if (issuedBook.status !== 'returned') {
        fine = calculateFine(issuedBook.due_date);
      }
      return {
        ...issuedBook,
        fine_amount: fine,
      };
    });

    // Return issued book records
    return res.status(200).json({
      success_flag: true,
      count: updatedRows.length,
      data: updatedRows,
    });
  } catch (error) {
    // Log error for debugging and monitoring
    logger.error('GET ALL ISSUED BOOK ERROR', error);

    // Return internal server error response
    return res.status(500).json({
      success_flag: false,
      message: error.message,
    });
  }
};

/**
 * Fetches issued book details by issued book ID.
 *
 * @param {Request} req - Express request object containing the issued book ID in route parameters.
 * @param {Response} res - Express response object used to return the issued book details.
 * @returns {Promise<Response>}
 */
export const getIssuedBookDataById = async (req, res) => {
  try {
    const { issueId } = req.params;

    // Fetch issued book details along with student and book information
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
      [issueId]
    );

    const issuedBook = rows[0];

    // check that the issued book record exists
    if (!issuedBook) {
      throw new Error('ISSUED_BOOK_DATA_NOT_FOUND');
    }

    // Use stored fine amount by default
    let currentFine = issuedBook.fine_amount;

    // Calculate fine if the book is overdue and not returned
    if (issuedBook.status !== 'returned' && new Date() > new Date(issuedBook.due_date)) {
      currentFine = calculateFine(issuedBook.due_date);
    }

    // Return issued book details with current fine
    return res.status(200).json({
      success_flag: true,
      data: {
        ...issuedBook,
        current_fine: currentFine,
      },
    });
  } catch (error) {
    logger.error('GET ISSUED BOOK BY ID ERROR', error);

    // Return appropriate error response
    return res.status(error.message === 'ISSUED_BOOK_DATA_NOT_FOUND' ? 404 : 500).json({
      success_flag: false,
      message: error.message === 'ISSUED_BOOK_DATA_NOT_FOUND' ? error.message : 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Returns an issued book and updates the issued book record.
 * @param {Request} req - Express request object containing the issued book ID in route parameters.
 * @param {Response} res - Express response object used to return the book return status and fine details.
 * @returns {Promise<Response>}
 */
export const returnIssuedBook = async (req, res) => {
  // Get database connection for transaction handling
  const connection = await pool.getConnection();

  try {
    const { issueId } = req.params;

    // Start database transaction
    await connection.beginTransaction();

    // Fetch issued book record
    const [rows] = await connection.execute(
      `
      SELECT *
      FROM book_issued
      WHERE id = ?
      `,
      [issueId]
    );

    const issuedBook = rows[0];
    // check that the issued book record exists
    if (!issuedBook) {
      throw new Error('ISSUED_BOOK_DATA_NOT_FOUND');
    }

    // Prevent returning an already returned book
    if (issuedBook.status === 'returned') {
      throw new Error('BOOK_ALREADY_RETURNED');
    }

    // Calculate overdue fine amount
    const fineAmount = calculateFine(issuedBook.due_date);

    // Generate return date
    const returnDate = new Date().toISOString().split('T')[0];

    // Update issued book record with return details
    await connection.execute(
      `
      UPDATE book_issued
      SET
        return_date = ?,
        fine_amount = ?,
        status = 'returned'
      WHERE id = ?
      `,
      [returnDate, fineAmount, issueId]
    );

    // increase available copies of book
    await connection.execute(
      `
      UPDATE books
      SET available_copies =
      available_copies + 1
      WHERE id = ?
      `,
      [issuedBook.book_id]
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
      [issuedBook.book_id]
    );

    // commit transaction
    await connection.commit();

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_RETURNED_SUCCESSFULLY',
      data: {
        issueId,
        fine_amount: fineAmount,
        return_date: returnDate,
      },
    });
  } catch (error) {
    // rollback transaction
    await connection.rollback();

    logger.error('RETURN ISSUED BOOK ERROR', error);

    return res.status(400).json({
      success_flag: false,
      message: error.message,
    });
  } finally {
    // release connection
    connection.release();
  }
};
