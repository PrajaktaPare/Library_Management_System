// admin_service — aggregate statistics for the admin dashboard
const { query } = require('../database/connection');

// fetch all counts needed by the admin dashboard in a single round-trip
async function getDashboardStats() {
  // total active students
  const studentsResult = await query(
    `SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student' AND is_active = 1`
  );
  const totalStudents = studentsResult[0].totalStudents;

  // total active books
  const booksResult = await query(
    `SELECT COUNT(*) AS totalBooks FROM books WHERE is_active = 1`
  );
  const totalBooks = booksResult[0].totalBooks;

  // currently issued (active) books
  const issuedResult = await query(
    `SELECT COUNT(*) AS issuedBooks FROM book_requests WHERE request_status = 'issued'`
  );
  const issuedBooks = issuedResult[0].issuedBooks;

  // total pending requests
  const pendingResult = await query(
    `SELECT COUNT(*) AS pendingRequests FROM book_requests WHERE request_status = 'pending'`
  );
  const pendingRequests = pendingResult[0].pendingRequests;

  // total outstanding fines
  const finesResult = await query(
    `SELECT COALESCE(SUM(fine_amount), 0) AS totalFines FROM book_requests WHERE fine_amount > 0`
  );
  const totalFines = parseFloat(finesResult[0].totalFines);

  // total overdue issues
  const overdueResult = await query(
    `SELECT COUNT(*) AS overdueCount FROM book_requests WHERE request_status = 'issued' AND due_date < NOW()`
  );
  const overdueCount = overdueResult[0].overdueCount;

  return {
    totalStudents,
    totalBooks,
    issuedBooks,
    pendingRequests,
    totalFines,
    overdueCount,
  };
}

// recent 10 issued books for the dashboard table
async function getRecentIssues() {
  const rows = await query(
    `SELECT br.id, br.issued_at AS issue_date, br.due_date, br.request_status AS status,
            u.name AS user_name, u.username,
            b.title AS book_title
     FROM book_requests br
     JOIN users u ON u.id = br.student_id
     JOIN books b ON b.id = br.book_id
     WHERE br.request_status = 'issued'
     ORDER BY br.issued_at DESC
     LIMIT 10`
  );
  return rows;
}

module.exports = { getDashboardStats, getRecentIssues };