import pool from '../config/db.js';
import logger from '../utils/logger.js';

import { sendBookReturnedEmail } from './email_service.js';

// Fine amount charged per overdue day
const FINE_PER_DAY = 5;

// Calculate overdue fine
const calculateFine = (dueDate, returnedAt) => {
  const due = new Date(dueDate);

  const returned = new Date(returnedAt);

  due.setHours(0, 0, 0, 0);

  returned.setHours(0, 0, 0, 0);

  const diffMs = returned - due;

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      overdue_days: 0,
      fine_amount: 0,
    };
  }

  return {
    overdue_days: diffDays,
    fine_amount: diffDays * FINE_PER_DAY,
  };
};

// Format date for email response
const formatDate = d =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

// Update book availability status
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

// Find issue details by issue ID
const findActiveIssueById = async issueId => {
  const [rows] = await pool.execute(
    `
    SELECT
      i.id,
      i.student_id,
      i.book_id,
      i.issue_status,
      i.due_date,
      i.fine_amount,
      i.returned_at,
      i.resolved_at,

      u.name      AS student_name,
      u.email     AS student_email,
      u.username  AS student_username,

      b.title     AS book_title,
      b.author    AS book_author,
      b.isbn      AS book_isbn,
      b.category  AS book_category,
      b.available_copies,

      br.id         AS request_id,
      br.issued_at  AS issue_date

    FROM issues i

    JOIN users u
      ON i.student_id = u.id

    JOIN books b
      ON i.book_id = b.id

    LEFT JOIN book_requests br
      ON br.student_id = i.student_id
      AND br.book_id = i.book_id
      AND br.request_status = 'issued'

    WHERE i.id = ?
    `,
    [issueId]
  );

  return rows[0] || null;
};

// Fetch all issues with filters and pagination
const getAllIssuesQuery = async (filters = {}, pagination = {}) => {
  let sql = `
    SELECT
      i.id,
      i.issue_status,
      i.due_date,
      i.fine_amount,
      i.returned_at,
      i.resolved_at,

      u.id        AS student_id,
      u.name      AS student_name,
      u.email     AS student_email,
      u.username  AS student_username,

      b.id        AS book_id,
      b.title     AS book_title,
      b.author    AS book_author,
      b.isbn      AS book_isbn,
      b.category  AS book_category,

      br.id        AS request_id,
      br.issued_at AS issue_date,

      CASE
        WHEN i.issue_status = 'active'
        AND CURDATE() > i.due_date
        THEN DATEDIFF(CURDATE(), i.due_date) * ${FINE_PER_DAY}
        ELSE 0
      END AS current_fine

    FROM issues i

    JOIN users u
      ON i.student_id = u.id

    JOIN books b
      ON i.book_id = b.id

    LEFT JOIN book_requests br
      ON br.student_id = i.student_id
      AND br.book_id = i.book_id
      AND br.request_status = 'issued'

    WHERE 1=1
  `;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM issues i

    JOIN users u
      ON i.student_id = u.id

    JOIN books b
      ON i.book_id = b.id

    WHERE 1=1
  `;

  const values = [];

  const countValues = [];

  // Filter by issue status
  if (filters.status) {
    sql += ` AND i.issue_status = ?`;

    countSql += ` AND i.issue_status = ?`;

    values.push(filters.status);

    countValues.push(filters.status);
  }

  // Filter overdue issues
  if (filters.overdue === 'true') {
    sql += `
      AND i.issue_status = 'active'
      AND CURDATE() > i.due_date
    `;

    countSql += `
      AND i.issue_status = 'active'
      AND CURDATE() > i.due_date
    `;
  }

  // Filter by student ID
  if (filters.student_id) {
    sql += ` AND i.student_id = ?`;

    countSql += ` AND i.student_id = ?`;

    values.push(filters.student_id);

    countValues.push(filters.student_id);
  }

  // Sort latest issues first
  sql += ` ORDER BY i.id DESC`;

  // Apply pagination
  if (pagination.limit !== undefined) {
    sql += ` LIMIT ? OFFSET ?`;

    values.push(Number(pagination.limit), Number(pagination.offset || 0));
  }

  const [issues] = await pool.query(sql, values);

  const [countResult] = await pool.query(countSql, countValues);

  return {
    issues,
    total: countResult[0].total,
  };
};

/* =========================================
   FUNCTION: returnBookService

   PURPOSE:
   Return issued book,
   calculate fine,
   update issue and stock

   PARAMETER:
   - issueId

   RETURN:
   - returned book details
========================================= */
export const returnBookService = async issueId => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const issue = await findActiveIssueById(issueId);

    // Issue not found
    if (!issue) {
      throw new Error('ISSUE_NOT_FOUND');
    }

    // Book already returned
    if (issue.issue_status === 'returned') {
      throw new Error('BOOK_ALREADY_RETURNED');
    }

    const returnedAt = new Date();

    const returnedStr = returnedAt.toISOString().slice(0, 19).replace('T', ' ');

    const { overdue_days, fine_amount } = calculateFine(
      issue.due_date,
      returnedAt
    );

    // Update issue record
    await connection.execute(
      `
      UPDATE issues
      SET
        issue_status = 'returned',
        returned_at = ?,
        resolved_at = ?,
        fine_amount = ?
      WHERE id = ?
      `,
      [returnedStr, returnedStr, fine_amount, issueId]
    );

    // Increase available copies
    await connection.execute(
      `
      UPDATE books
      SET available_copies =
          available_copies + 1
      WHERE id = ?
      `,
      [issue.book_id]
    );

    // Update book status
    await updateBookStatus(issue.book_id, connection);

    // Update request status
    if (issue.request_id) {
      await connection.execute(
        `
        UPDATE book_requests
        SET request_status = 'returned'
        WHERE id = ?
        `,
        [issue.request_id]
      );
    }

    await connection.commit();

    // Send return confirmation email
    await sendBookReturnedEmail({
      to: issue.student_email,
      studentName: issue.student_name,
      bookTitle: issue.book_title,
      bookAuthor: issue.book_author,
      bookCategory: issue.book_category,
      issueDate: formatDate(issue.issue_date || issue.due_date),
      dueDate: formatDate(issue.due_date),
      returnedAt: formatDate(returnedAt),
      overdueDays: overdue_days,
      fineAmount: fine_amount,
      finePerDay: FINE_PER_DAY,
    });

    logger.info(`BOOK RETURNED: Issue ${issueId}`);

    return {
      issue_id: issueId,
      student_name: issue.student_name,
      book_title: issue.book_title,
      due_date: issue.due_date,
      returned_at: returnedStr,
      overdue_days,
      fine_amount,
      fine_per_day: FINE_PER_DAY,
    };
  } catch (error) {
    await connection.rollback();

    logger.error('RETURN BOOK SERVICE ERROR', error);

    throw error;
  } finally {
    connection.release();
  }
};

/* =========================================
   FUNCTION: getAllIssuesService

   PURPOSE:
   Fetch all issues

   PARAMETER:
   - filters
   - pagination

   RETURN:
   - issues list
========================================= */
export const getAllIssuesService = async (filters = {}, pagination = {}) => {
  try {
    return await getAllIssuesQuery(filters, pagination);
  } catch (error) {
    logger.error('GET ALL ISSUES SERVICE ERROR', error);

    throw error;
  }
};

/* =========================================
   FUNCTION: getMyIssuesService

   PURPOSE:
   Fetch logged-in student issues

   PARAMETER:
   - studentId
   - pagination

   RETURN:
   - student issue list
========================================= */
export const getMyIssuesService = async (studentId, pagination = {}) => {
  try {
    return await getAllIssuesQuery({ student_id: studentId }, pagination);
  } catch (error) {
    logger.error('GET MY ISSUES SERVICE ERROR', error);

    throw error;
  }
};

/* =========================================
   FUNCTION: getIssueByIdService

   PURPOSE:
   Fetch issue details by ID

   PARAMETER:
   - issueId

   RETURN:
   - issue details
========================================= */
export const getIssueByIdService = async issueId => {
  try {
    const issue = await findActiveIssueById(issueId);

    // Issue not found
    if (!issue) {
      throw new Error('ISSUE_NOT_FOUND');
    }

    // Calculate current fine for active issue
    if (issue.issue_status === 'active') {
      const { overdue_days, fine_amount } = calculateFine(
        issue.due_date,
        new Date()
      );

      issue.overdue_days = overdue_days;

      issue.current_fine = fine_amount;
    } else {
      issue.overdue_days = 0;

      issue.current_fine = issue.fine_amount;
    }

    return issue;
  } catch (error) {
    logger.error('GET ISSUE BY ID SERVICE ERROR', error);

    throw error;
  }
};
