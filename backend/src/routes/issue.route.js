import express from 'express';

import { getAllIssues, getIssueById, returnIssue, getMyIssues, getIssuesCount } from '../controllers/issue.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validateSchema } from '../middlewares/schema.validator.middleware.js';

import {
  issueIdValidator,
  getIssuesQueryValidator,
  returnIssueValidator,
} from '../validators/issue.validator.js';

const router = express.Router();

// get all issued books
router.get('/', verifyJWT, authorizeRoles(1), validateSchema(getIssuesQueryValidator, 'query'), getAllIssues);

router.get('/count', getIssuesCount);

// get issue by id
router.get(
  '/:issue_id',
  verifyJWT,
  authorizeRoles(1),
  validateSchema(issueIdValidator, 'params'),
  getIssueById
);

// return issued book
router.patch(
  '/:issue_id/return',
  verifyJWT,
  authorizeRoles(1),
  validateSchema(issueIdValidator, 'params'),
  validateSchema(returnIssueValidator, 'body'),
  returnIssue
);

// get logged in student issues
router.get('/student/me', verifyJWT, authorizeRoles(2), getMyIssues);

export default router;
