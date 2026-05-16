// student_controller — student-specific dashboard data
import asyncHandler from '../utils/async_handler.js';
import apiResponse from '../utils/api_response.js';
import pool from '../config/db_config.js';
import { calculateFine } from '../utils/date_helper.js';
import { HTTP } from '../utils/constants.js';

// GET /api/student/stats — student dashboard statistics
export const getStudentStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // active issues
  const [activeIssues] = await pool.query(
    `SELECT i.id, i.due_date FROM issues i WHERE i.user_id = ? AND i.status = 'active'`,
    [userId],
  );

  // pending requests
  const [[{ pendingRequests }]] = await pool.query(
    `SELECT COUNT(*) AS pendingRequests FROM requests WHERE user_id = ? AND status = 'pending'`,
    [userId],
  );

  // compute fine total and overdue count from active issues
  let totalFines = 0;
  let overdueCount = 0;

  activeIssues.forEach((issue) => {
    const fine = calculateFine(issue.due_date);
    totalFines += fine;
    if (fine > 0) {
      overdueCount++;
    }
  });

  return apiResponse(res, HTTP.OK, 'Student stats fetched', {
    booksIssued: activeIssues.length,
    booksOverdue: overdueCount,
    booksPending: pendingRequests,
    totalFines,
  });
});