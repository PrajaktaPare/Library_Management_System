import express from 'express';

import {
  getAllIssues,
  getIssueById,
  returnIssue,
  getIssuesCount,
} from '../controllers/issued_book.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validateSchema } from '../middlewares/schema_validator.middleware.js';

import {
  issueIdValidator,
  getIssuesQueryValidator,
  returnIssueValidator,
} from '../validators/issued_book.validator.js';

const router = express.Router();

// get all issued books
router.get('/', verifyJWT, validateSchema(getIssuesQueryValidator, 'query'), getAllIssues);

router.get('/count', getIssuesCount);

// get issue by id
router.get(
  '/:issue_id',
  verifyJWT,
  authorizeRoles("admin"),
  validateSchema(issueIdValidator, 'params'),
  getIssueById
);

// return issued book
router.patch(
  '/:issue_id/return',
  verifyJWT,
  authorizeRoles("admin"),
  validateSchema(issueIdValidator, 'params'),
  returnIssue
);

export default router;
