// student_controller — student-specific dashboard data
const asyncHandler = require('../utils/async_handler');
const ApiResponse = require('../utils/api_response');
const { query } = require('../database/connection');

// GET /api/student/stats — student dashboard statistics
const getStudentStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // active issued books
  const activeIssues = await query(
    `SELECT br.id, br.due_date FROM book_requests br WHERE br.student_id = ? AND br.request_status = 'issued'`,
    [userId]
  );

  // pending requests
  const pendingResult = await query(
    `SELECT COUNT(*) AS pendingRequests FROM book_requests WHERE student_id = ? AND request_status = 'pending'`,
    [userId]
  );
  const pendingRequests = pendingResult[0].pendingRequests;

  // compute fine total and overdue count from active issues
  let totalFines = 0;
  let overdueCount = 0;

  activeIssues.forEach((issue) => {
    if (issue.due_date) {
      const dueDate = new Date(issue.due_date);
      const today = new Date();
      if (today > dueDate) {
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        totalFines += daysOverdue * 5; // ₹5 per day
        overdueCount++;
      }
    }
  });

  res.status(200).json(ApiResponse.ok('Student stats fetched', {
    booksIssued: activeIssues.length,
    booksOverdue: overdueCount,
    booksPending: pendingRequests,
    totalFines,
  }));
});

module.exports = { getStudentStats };