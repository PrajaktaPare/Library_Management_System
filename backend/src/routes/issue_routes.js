// issue_routes.js

import express from 'express';

import {
  returnBook,
  getAllIssues,
  getMyIssues,
  getIssueById,
} from '../controllers/issue_controller.js';

import {
  verifyJWT,
  authorizeRoles,
  validateParams,
} from '../middleware/index.js';

const router = express.Router();

const issueIdSchema = {
  type: 'object',
  required: ['issue_id'],
  properties: {
    issue_id: {
      type: 'string',
      pattern: '^[1-9]\\d*$',
      errorMessage: { pattern: 'Issue ID must be a valid positive integer' },
    },
  },
};

// GET /issues/my
// Student views their own issued books
router.get('/my', verifyJWT, getMyIssues);

router.get(
  '/:issue_id',
  verifyJWT,
  validateParams(issueIdSchema),
  getIssueById
);

// GET /issues
// Admin views all issues
// Query: ?status=active|returned  ?overdue=true  ?page=1&limit=10
router.get('/', verifyJWT, authorizeRoles('1'), getAllIssues);

// PATCH /issues/:issue_id/return
// Admin marks a book as returned
// Auto-calculates fine, restores available_copies, sends email
router.patch(
  '/:issue_id/return',
  verifyJWT,
  authorizeRoles('1'),
  validateParams(issueIdSchema),
  returnBook
);

export default router;
