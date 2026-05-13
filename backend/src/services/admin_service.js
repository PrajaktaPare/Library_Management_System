// admin_service — aggregate statistics for the admin dashboard
import pool from '../config/db_config.js';

// fetch all counts needed by the admin dashboard in a single round-trip
export async function getDashboardStats() {
  // total active students
  const [[{ totalStudents }]] = await pool.query(
    `SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student' AND is_active = 1`,
  );

  // total active books
  const [[{ totalBooks }]] = await pool.query(
    `SELECT COUNT(*) AS totalBooks FROM books WHERE is_active = 1`,
  );

  // currently issued (active) books
  const [[{ issuedBooks }]] = await pool.query(
    `SELECT COUNT(*) AS issuedBooks FROM issues WHERE status = 'active'`,
  );

  // total pending requests
  const [[{ pendingRequests }]] = await pool.query(
    `SELECT COUNT(*) AS pendingRequests FROM requests WHERE status = 'pending'`,
  );

  // total outstanding (unpaid) fines
  const [[{ totalFines }]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS totalFines FROM fines WHERE paid = 0`,
  );

  // total overdue issues
  const [[{ overdueCount }]] = await pool.query(
    `SELECT COUNT(*) AS overdueCount FROM issues WHERE status = 'active' AND due_date < NOW()`,
  );

  return {
    totalStudents,
    totalBooks,
    issuedBooks,
    pendingRequests,
    totalFines: parseFloat(totalFines),
    overdueCount,
  };
}

// recent 10 issues for the dashboard table
export async function getRecentIssues() {
  const [rows] = await pool.query(
    `SELECT i.id, i.issue_date, i.due_date, i.status,
            u.name AS user_name, u.username,
            b.title AS book_title
     FROM issues i
     JOIN users u ON u.id = i.user_id
     JOIN books b ON b.id = i.book_id
     ORDER BY i.created_at DESC
     LIMIT 10`,
  );
  return rows;
}