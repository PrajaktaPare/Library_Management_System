// admin_controller — admin-only dashboard and stats endpoints
import asyncHandler from '../utils/async_handler.js';
import apiResponse from '../utils/api_response.js';
import * as adminService from '../services/admin_service.js';
import { HTTP } from '../utils/constants.js';

// GET /api/admin/stats — dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  return apiResponse(res, HTTP.OK, 'Dashboard stats fetched', stats);
});

// GET /api/admin/recent-issues — last 10 issues for dashboard table
export const getRecentIssues = asyncHandler(async (req, res) => {
  const issues = await adminService.getRecentIssues();
  return apiResponse(res, HTTP.OK, 'Recent issues fetched', issues);
});