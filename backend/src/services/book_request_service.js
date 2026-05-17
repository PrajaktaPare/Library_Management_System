// book_request_service.js

import pool from '../config/db.js';
import logger from '../utils/logger.js';
import { sendBookIssuedEmail, sendBookRejectedEmail } from './email_service.js';

/* =========================================
   CONSTANTS
========================================= */
const ISSUE_DURATION_DAYS = 7;
const FINE_PER_DAY = 5; // ₹5 per day

/* =========================================
   DB HELPERS
========================================= */

/* ─── findRequestById ─── */
const findRequestById = async id => {
  const [rows] = await pool.execute(
    `
    SELECT
      br.id,
      br.student_id,
      br.book_id,
      br.request_status,
      br.requested_at,
      br.issued_at,

      u.name      AS student_name,
      u.email     AS student_email,
      u.username  AS student_username,

      b.title     AS book_title,
      b.author    AS book_author,
      b.isbn      AS book_isbn,
      b.category  AS book_category,
      b.available_copies,
      b.total_copies

    FROM book_requests br

    JOIN users u
      ON br.student_id = u.id

    JOIN books b
      ON br.book_id = b.id

    WHERE br.id = ?
    `,
    [id]
  );

  return rows[0] || null;
};

/* ─── findPendingRequestByStudentAndBook ─── */
const findPendingRequestByStudentAndBook = async (studentId, bookId) => {
  const [rows] = await pool.execute(
    `
    SELECT id
    FROM book_requests
    WHERE student_id      = ?
    AND   book_id         = ?
    AND   request_status  = 'pending'
    `,
    [studentId, bookId]
  );

  return rows[0] || null;
};

/* ─── findActiveIssueByStudentAndBook ─── */
const findActiveIssueByStudentAndBook = async (studentId, bookId) => {
  const [rows] = await pool.execute(
    `
    SELECT id
    FROM issues
    WHERE student_id   = ?
    AND   book_id      = ?
    AND   issue_status = 'active'
    `,
    [studentId, bookId]
  );

  return rows[0] || null;
};

/* ─── insertRequest ─── */
const insertRequest = async (studentId, bookId) => {
  const [result] = await pool.execute(
    `
    INSERT INTO book_requests
    (student_id, book_id, request_status)
    VALUES (?, ?, 'pending')
    `,
    [studentId, bookId]
  );

  return result.insertId;
};

/* ─── updateRequestStatus ─── */
const updateRequestStatus = async (requestId, status, issuedAt = null) => {
  const [result] = await pool.execute(
    `
    UPDATE book_requests
    SET
      request_status = ?,
      issued_at      = ?
    WHERE id = ?
    `,
    [status, issuedAt, requestId]
  );

  return result.affectedRows;
};

/* ─── decreaseAvailableCopies ─── */
const decreaseAvailableCopies = async (bookId, connection) => {
  const db = connection || pool;

  const [result] = await db.execute(
    `
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = ?
    AND available_copies > 0
    `,
    [bookId]
  );

  return result.affectedRows > 0;
};

/* ─── updateBookStatusIfNocopies ─── */
const updateBookStatusIfNoCopies = async (bookId, connection) => {
  const db = connection || pool;

  await db.execute(
    `
    UPDATE books
    SET status = CASE
      WHEN available_copies = 0 THEN 'issued'
      ELSE 'available'
    END
    WHERE id = ?
    `,
    [bookId]
  );
};

/* ─── insertIssueRecord ─── */
const insertIssueRecord = async (studentId, bookId, dueDate, connection) => {
  const db = connection || pool;

  const [result] = await db.execute(
    `
    INSERT INTO issues
    (student_id, book_id, issue_status, due_date)
    VALUES (?, ?, 'active', ?)
    `,
    [studentId, bookId, dueDate]
  );

  return result.insertId;
};

/* ─── getAllRequestsQuery ─── */
const getAllRequestsQuery = async (filters = {}, pagination = {}) => {
  let sql = `
    SELECT
      br.id,
      br.request_status,
      br.requested_at,
      br.issued_at,
      br.created_at,

      u.id        AS student_id,
      u.name      AS student_name,
      u.email     AS student_email,
      u.username  AS student_username,

      b.id        AS book_id,
      b.title     AS book_title,
      b.author    AS book_author,
      b.isbn      AS book_isbn,
      b.category  AS book_category

    FROM book_requests br

    JOIN users u ON br.student_id = u.id
    JOIN books b ON br.book_id    = b.id

    WHERE 1=1
  `;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM book_requests br
    JOIN users u ON br.student_id = u.id
    JOIN books b ON br.book_id    = b.id
    WHERE 1=1
  `;

  const values = [];
  const countValues = [];

  if (filters.status) {
    const clause = ` AND br.request_status = ?`;
    sql += clause;
    countSql += clause;
    values.push(filters.status);
    countValues.push(filters.status);
  }

  if (filters.student_id) {
    const clause = ` AND br.student_id = ?`;
    sql += clause;
    countSql += clause;
    values.push(filters.student_id);
    countValues.push(filters.student_id);
  }

  sql += ` ORDER BY br.created_at DESC`;

  if (pagination.limit !== undefined) {
    sql += ` LIMIT ? OFFSET ?`;
    values.push(Number(pagination.limit), Number(pagination.offset || 0));
  }

  const [requests] = await pool.query(sql, values);
  const [countResult] = await pool.query(countSql, countValues);

  return {
    requests,
    total: countResult[0].total,
  };
};

/* =========================================
   BUSINESS LOGIC
========================================= */

/* ─── requestBookService ─── */
export const requestBookService = async (studentId, bookId) => {
  try {
    // Check: book exists and has copies
    const [bookRows] = await pool.execute(
      `SELECT id, title, available_copies FROM books WHERE id = ?`,
      [bookId]
    );

    const book = bookRows[0];

    if (!book) {
      throw new Error('BOOK_NOT_FOUND');
    }

    if (book.available_copies < 1) {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    // Check: student hasn't already pending request for this book
    const existingRequest = await findPendingRequestByStudentAndBook(
      studentId,
      bookId
    );

    if (existingRequest) {
      throw new Error('REQUEST_ALREADY_PENDING');
    }

    // Check: student doesn't already have this book issued
    const activeIssue = await findActiveIssueByStudentAndBook(
      studentId,
      bookId
    );

    if (activeIssue) {
      throw new Error('BOOK_ALREADY_ISSUED_TO_STUDENT');
    }

    const requestId = await insertRequest(studentId, bookId);

    const request = await findRequestById(requestId);

    logger.info(
      `BOOK REQUEST CREATED: Student ${studentId} → Book ${bookId} (Request ID: ${requestId})`
    );

    return request;
  } catch (error) {
    logger.error('REQUEST BOOK SERVICE ERROR', error);

    throw error;
  }
};

/* ─── issueBookService ─── */
export const issueBookService = async requestId => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch full request
    const request = await findRequestById(requestId);

    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (request.request_status !== 'pending') {
      throw new Error('REQUEST_NOT_PENDING');
    }

    if (request.available_copies < 1) {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    // 1. Decrease available copies
    const decreased = await decreaseAvailableCopies(
      request.book_id,
      connection
    );

    if (!decreased) {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    // 2. Update book status if 0 copies left
    await updateBookStatusIfNoCopies(request.book_id, connection);

    // 3. Calculate due date (today + 7 days)
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + ISSUE_DURATION_DAYS);

    const dueDateStr = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const issuedAtStr = now.toISOString().slice(0, 19).replace('T', ' ');

    // 4. Insert into issues table
    await insertIssueRecord(
      request.student_id,
      request.book_id,
      dueDateStr,
      connection
    );

    // 5. Update request status → issued
    await connection.execute(
      `
      UPDATE book_requests
      SET request_status = 'issued', issued_at = ?
      WHERE id = ?
      `,
      [issuedAtStr, requestId]
    );

    await connection.commit();

    // 6. Send issued email
    const formatDate = d =>
      new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    await sendBookIssuedEmail({
      to: request.student_email,
      studentName: request.student_name,
      bookTitle: request.book_title,
      bookAuthor: request.book_author,
      bookIsbn: request.book_isbn || 'N/A',
      bookCategory: request.book_category,
      issueDate: formatDate(now),
      dueDate: formatDate(dueDate),
      finePerDay: FINE_PER_DAY,
    });

    logger.info(
      `BOOK ISSUED: Request ${requestId} | Student ${request.student_id} | Book ${request.book_id}`
    );

    return {
      request_id: requestId,
      student_name: request.student_name,
      book_title: request.book_title,
      issued_at: issuedAtStr,
      due_date: dueDateStr,
      fine_per_day: FINE_PER_DAY,
    };
  } catch (error) {
    await connection.rollback();

    logger.error('ISSUE BOOK SERVICE ERROR', error);

    throw error;
  } finally {
    connection.release();
  }
};

/* ─── rejectBookRequestService ─── */
export const rejectBookRequestService = async (
  requestId,
  reason = 'No reason provided'
) => {
  try {
    const request = await findRequestById(requestId);

    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (request.request_status !== 'pending') {
      throw new Error('REQUEST_NOT_PENDING');
    }

    // Update status → rejected
    await updateRequestStatus(requestId, 'rejected');

    // Send rejection email
    const formatDate = d =>
      new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    await sendBookRejectedEmail({
      to: request.student_email,
      studentName: request.student_name,
      bookTitle: request.book_title,
      bookAuthor: request.book_author,
      bookIsbn: request.book_isbn || 'N/A',
      bookCategory: request.book_category,
      requestedAt: formatDate(request.requested_at),
      rejectedAt: formatDate(new Date()),
      reason,
    });

    logger.info(
      `BOOK REQUEST REJECTED: Request ${requestId} | Student ${request.student_id} | Book ${request.book_id}`
    );

    return {
      request_id: requestId,
      student_name: request.student_name,
      book_title: request.book_title,
      reason,
    };
  } catch (error) {
    logger.error('REJECT BOOK REQUEST SERVICE ERROR', error);

    throw error;
  }
};

/* ─── getAllRequestsService ─── */
export const getAllRequestsService = async (filters = {}, pagination = {}) => {
  try {
    return await getAllRequestsQuery(filters, pagination);
  } catch (error) {
    logger.error('GET ALL REQUESTS SERVICE ERROR', error);

    throw error;
  }
};

/* ─── getMyRequestsService ─── */
export const getMyRequestsService = async (studentId, pagination = {}) => {
  try {
    return await getAllRequestsQuery({ student_id: studentId }, pagination);
  } catch (error) {
    logger.error('GET MY REQUESTS SERVICE ERROR', error);

    throw error;
  }
};

/* ─── cancelRequestService ─── */
export const cancelRequestService = async (requestId, studentId) => {
  try {
    const request = await findRequestById(requestId);

    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    // Student can only cancel their own request
    if (request.student_id !== studentId) {
      throw new Error('UNAUTHORIZED');
    }

    if (request.request_status !== 'pending') {
      throw new Error('REQUEST_NOT_PENDING');
    }

    await pool.execute(`DELETE FROM book_requests WHERE id = ?`, [requestId]);

    logger.info(`REQUEST CANCELLED: ID ${requestId} by Student ${studentId}`);

    return true;
  } catch (error) {
    logger.error('CANCEL REQUEST SERVICE ERROR', error);

    throw error;
  }
};
