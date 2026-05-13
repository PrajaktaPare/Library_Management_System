// admin_controller — admin-only dashboard and stats endpoints
const asyncHandler = require('../utils/async_handler');
const ApiResponse = require('../utils/api_response');
const adminService = require('../services/admin_service');

// GET /api/admin/stats — dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(ApiResponse.ok('Dashboard stats fetched', stats));
});

// GET /api/admin/recent-issues — last 10 issues for dashboard table
const getRecentIssues = asyncHandler(async (req, res) => {
  const issues = await adminService.getRecentIssues();
  res.status(200).json(ApiResponse.ok('Recent issues fetched', issues));
});

module.exports = { getDashboardStats, getRecentIssues };