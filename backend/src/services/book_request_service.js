import pool from '../config/db.js';
import logger from '../utils/logger.js';

import { sendBookIssuedEmail, sendBookRejectedEmail } from './email_service.js';

// Issue duration in days
const ISSUE_DURATION_DAYS = 7;

// Fine amount per overdue day
const FINE_PER_DAY = 5;

// Format date helper
const formatDate = d =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

/* =========================================
   FUNCTION: findRequestById

   PURPOSE:
   Fetch request details by request ID

   PARAMETER:
   - id

   RETURN:
   - request object
========================================= */
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
      br.created_at,

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

/* =========================================
   FUNCTION: findPendingRequestByStudentAndBook

   PURPOSE:
   Check pending request for same student
   and same book

   PARAMETER:
   - studentId
   - bookId

   RETURN:
   - request object
========================================= */
const findPendingRequestByStudentAndBook = async (studentId, bookId) => {
  const [rows] = await pool.execute(
    `
    SELECT id
    FROM book_requests
    WHERE student_id = ?
    AND book_id = ?
    AND request_status = 'pending'
    `,
    [studentId, bookId]
  );

  return rows[0] || null;
};

/* =========================================
   FUNCTION: findActiveIssueByStudentAndBook

   PURPOSE:
   Check active issued book for student

   PARAMETER:
   - studentId
   - bookId

   RETURN:
   - issue object
========================================= */
const findActiveIssueByStudentAndBook = async (studentId, bookId) => {
  const [rows] = await pool.execute(
    `
    SELECT id
    FROM issues
    WHERE student_id = ?
    AND book_id = ?
    AND issue_status = 'active'
    `,
    [studentId, bookId]
  );

  return rows[0] || null;
};

/* =========================================
   FUNCTION: insertRequest

   PURPOSE:
   Insert new book request

   PARAMETER:
   - studentId
   - bookId

   RETURN:
   - request ID
========================================= */
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

/* =========================================
   FUNCTION: updateRequestStatus

   PURPOSE:
   Update request status

   PARAMETER:
   - requestId
   - status
   - issuedAt

   RETURN:
   - affected rows
========================================= */
const updateRequestStatus = async (requestId, status, issuedAt = null) => {
  const [result] = await pool.execute(
    `
    UPDATE book_requests
    SET
      request_status = ?,
      issued_at = ?
    WHERE id = ?
    `,
    [status, issuedAt, requestId]
  );

  return result.affectedRows;
};

/* =========================================
   FUNCTION: decreaseAvailableCopies

   PURPOSE:
   Decrease available copies of book

   PARAMETER:
   - bookId
   - connection

   RETURN:
   - boolean
========================================= */
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

/* =========================================
   FUNCTION: updateBookStatus

   PURPOSE:
   Update status based on available copies

   PARAMETER:
   - bookId
   - connection

   RETURN:
   - none
========================================= */
const updateBookStatus = async (bookId, connection) => {
  const db = connection || pool;

  await db.execute(
    `
    UPDATE books
    SET status = CASE
      WHEN available_copies > 0
        THEN 'available'
      ELSE 'unavailable'
    END
    WHERE id = ?
    `,
    [bookId]
  );
};

/* =========================================
   FUNCTION: insertIssueRecord

   PURPOSE:
   Create issue record

   PARAMETER:
   - studentId
   - bookId
   - dueDate
   - connection

   RETURN:
   - issue ID
========================================= */
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

/* =========================================
   FUNCTION: getAllRequestsQuery

   PURPOSE:
   Fetch all request records

   PARAMETER:
   - filters
   - pagination

   RETURN:
   - requests list
========================================= */
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
    JOIN books b ON br.book_id = b.id

    WHERE 1=1
  `;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM book_requests br
    WHERE 1=1
  `;

  const values = [];
  const countValues = [];

  if (filters.status) {
    sql += ` AND br.request_status = ?`;
    countSql += ` AND br.request_status = ?`;

    values.push(filters.status);
    countValues.push(filters.status);
  }

  if (filters.student_id) {
    sql += ` AND br.student_id = ?`;
    countSql += ` AND br.student_id = ?`;

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
   FUNCTION: requestBookService

   PURPOSE:
   Create book request

   PARAMETER:
   - studentId
   - bookId

   RETURN:
   - request object
========================================= */
export const requestBookService = async (studentId, bookId) => {
  try {
    const [bookRows] = await pool.execute(
      `
      SELECT id, title, available_copies
      FROM books
      WHERE id = ?
      `,
      [bookId]
    );

    const book = bookRows[0];

    if (!book) {
      throw new Error('BOOK_NOT_FOUND');
    }

    if (book.available_copies < 1) {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    const existingRequest = await findPendingRequestByStudentAndBook(
      studentId,
      bookId
    );

    if (existingRequest) {
      throw new Error('REQUEST_ALREADY_PENDING');
    }

    const activeIssue = await findActiveIssueByStudentAndBook(
      studentId,
      bookId
    );

    if (activeIssue) {
      throw new Error('BOOK_ALREADY_ISSUED_TO_STUDENT');
    }

    const requestId = await insertRequest(studentId, bookId);

    return await findRequestById(requestId);
  } catch (error) {
    logger.error('REQUEST BOOK SERVICE ERROR', error);

    throw error;
  }
};

/* =========================================
   FUNCTION: issueBookService

   PURPOSE:
   Issue requested book

   PARAMETER:
   - requestId

   RETURN:
   - issued book details
========================================= */
export const issueBookService = async requestId => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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

    const decreased = await decreaseAvailableCopies(
      request.book_id,
      connection
    );

    if (!decreased) {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    await updateBookStatus(request.book_id, connection);

    const now = new Date();

    const dueDate = new Date(now);

    dueDate.setDate(dueDate.getDate() + ISSUE_DURATION_DAYS);

    const dueDateStr = dueDate.toISOString().split('T')[0];

    const issuedAtStr = now.toISOString().slice(0, 19).replace('T', ' ');

    await insertIssueRecord(
      request.student_id,
      request.book_id,
      dueDateStr,
      connection
    );

    await connection.execute(
      `
      UPDATE book_requests
      SET request_status = 'issued',
          issued_at = ?
      WHERE id = ?
      `,
      [issuedAtStr, requestId]
    );

    await connection.commit();

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

    return {
      request_id: requestId,
      student_name: request.student_name,
      book_title: request.book_title,
      issued_at: issuedAtStr,
      due_date: dueDateStr,
    };
  } catch (error) {
    await connection.rollback();

    logger.error('ISSUE BOOK SERVICE ERROR', error);

    throw error;
  } finally {
    connection.release();
  }
};

/* =========================================
   FUNCTION: rejectBookRequestService

   PURPOSE:
   Reject book request

   PARAMETER:
   - requestId
   - reason

   RETURN:
   - rejection details
========================================= */
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

    await updateRequestStatus(requestId, 'rejected');

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

    return {
      request_id: requestId,
      reason,
    };
  } catch (error) {
    logger.error('REJECT BOOK REQUEST SERVICE ERROR', error);

    throw error;
  }
};

/* =========================================
   FUNCTION: getAllRequestsService

   PURPOSE:
   Fetch all requests

   PARAMETER:
   - filters
   - pagination

   RETURN:
   - requests list
========================================= */
export const getAllRequestsService = async (filters = {}, pagination = {}) => {
  return await getAllRequestsQuery(filters, pagination);
};

/* =========================================
   FUNCTION: getMyRequestsService

   PURPOSE:
   Fetch logged in student requests

   PARAMETER:
   - studentId
   - pagination

   RETURN:
   - requests list
========================================= */
export const getMyRequestsService = async (studentId, pagination = {}) => {
  return await getAllRequestsQuery({ student_id: studentId }, pagination);
};

/* =========================================
   FUNCTION: cancelRequestService

   PURPOSE:
   Cancel pending request

   PARAMETER:
   - requestId
   - studentId

   RETURN:
   - boolean
========================================= */
export const cancelRequestService = async (requestId, studentId) => {
  try {
    const request = await findRequestById(requestId);

    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (request.student_id !== studentId) {
      throw new Error('UNAUTHORIZED');
    }

    if (request.request_status !== 'pending') {
      throw new Error('REQUEST_NOT_PENDING');
    }

    await pool.execute(`DELETE FROM book_requests WHERE id = ?`, [requestId]);

    return true;
  } catch (error) {
    logger.error('CANCEL REQUEST SERVICE ERROR', error);

    throw error;
  }
};
