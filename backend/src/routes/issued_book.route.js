import express from 'express';

import {
  getAllIssuedBooks,
  getIssuedBookDataById,
  returnIssuedBook,
  getIssuedBooksCount,
} from '../controllers/issued_book.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

import { validateSchema } from '../middlewares/schema_validator.middleware.js';

import { issueIdValidator, getIssuesQueryValidator } from '../validators/issued_book.validator.js';

const router = express.Router();

// get all issued books
router.get('/', verifyJWT, validateSchema(getIssuesQueryValidator, 'query'), getAllIssuedBooks);

router.get('/count', getIssuedBooksCount);

// get issue by id
router.get(
  '/:issue_id',
  verifyJWT,
  authorizeRoles('admin'),
  validateSchema(issueIdValidator, 'params'),
  getIssuedBookDataById
);

// return issued book
router.patch(
  '/:issue_id/return',
  verifyJWT,
  authorizeRoles('admin'),
  validateSchema(issueIdValidator, 'params'),
  returnIssuedBook
);

export default router;
