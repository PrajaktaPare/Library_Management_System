// profile_service — fetch logged-in user's full profile with stats
const { query } = require('../database/connection');
const { ApiError } = require('../utils');

// return profile + live stats for any user
async function getProfile(userId) {
  const rows = await query(
    `SELECT id, username, email, name, phone, role, profile_image, is_active, created_at
     FROM users WHERE id = ? AND is_active = 1`,
    [userId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  const user = rows[0];

  // active issued books with live fine calculation
  const issuedBooks = await query(
    `SELECT br.id, br.issued_at, br.due_date, br.request_status, b.title
     FROM book_requests br JOIN books b ON b.id = br.book_id
     WHERE br.student_id = ? AND br.request_status = 'issued'`,
    [userId]
  );

  const activeIssues = issuedBooks.map((item) => {
    let computedFine = 0;
    if (item.due_date) {
      const dueDate = new Date(item.due_date);
      const today = new Date();
      if (today > dueDate) {
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        computedFine = daysOverdue * 5; // ₹5 per day
      }
    }
    return { ...item, computed_fine: computedFine };
  });

  // total fines from all requests
  const finesResult = await query(
    `SELECT COALESCE(SUM(fine_amount), 0) AS totalFines FROM book_requests WHERE student_id = ? AND fine_amount > 0`,
    [userId]
  );
  const totalFines = parseFloat(finesResult[0].totalFines);

  return {
    ...user,
    activeIssues,
    activeIssueCount: activeIssues.length,
    totalFines,
  };
}

module.exports = { getProfile };