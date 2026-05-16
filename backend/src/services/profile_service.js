// profile_service — fetch logged-in user's full profile with stats
import pool from '../config/db_config.js';
import ApiError from '../utils/api_error.js';
import { calculateFine } from '../utils/date_helper.js';

// return profile + live stats for any user
export async function getProfile(userId) {
  const [rows] = await pool.query(
    `SELECT id, username, name, role, phone, avatar, created_at
     FROM users WHERE id = ? AND is_active = 1`,
    [userId],
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  const user = rows[0];

  // active issues with live fine
  const [issues] = await pool.query(
    `SELECT i.id, i.issue_date, i.due_date, i.status, b.title
     FROM issues i JOIN books b ON b.id = i.book_id
     WHERE i.user_id = ? AND i.status = 'active'`,
    [userId],
  );

  const activeIssues = issues.map((i) => ({
    ...i,
    computed_fine: calculateFine(i.due_date),
  }));

  // total unpaid fines
  const [[{ totalFines }]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS totalFines FROM fines WHERE user_id = ? AND paid = 0`,
    [userId],
  );

  return {
    ...user,
    activeIssues,
    activeIssueCount: activeIssues.length,
    totalFines: parseFloat(totalFines),
  };
}