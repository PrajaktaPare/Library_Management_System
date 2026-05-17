// issue_controller.js

import logger from '../utils/logger.js';

import {
  returnBookService,
  getAllIssuesService,
  getMyIssuesService,
  getIssueByIdService,
} from '../services/issue_service.js';

/* =========================================
   HELPER
========================================= */
const getPagination = query => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/* =========================================
   FUNCTION: returnBook

   PURPOSE:
   Admin marks a book as returned.
   Auto-calculates fine if overdue.
   Restores available_copies + book status.

   PARAMS: issue_id

   RETURN:
   - 200 with fine summary
========================================= */
export const returnBook = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const result = await returnBookService(issue_id);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_RETURNED_SUCCESSFULLY',
      data: result,
    });
  } catch (error) {
    logger.error('RETURN BOOK CONTROLLER ERROR', error);

    const errorMap = {
      ISSUE_NOT_FOUND: { status: 404, message: 'ISSUE_NOT_FOUND' },
      BOOK_ALREADY_RETURNED: { status: 400, message: 'BOOK_ALREADY_RETURNED' },
    };

    const mapped = errorMap[error.message];

    if (mapped) {
      return res.status(mapped.status).json({
        success_flag: false,
        message: mapped.message,
      });
    }

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getAllIssues

   PURPOSE:
   Admin views all issues.
   Filters: status, overdue

   QUERY: status, overdue, page, limit

   RETURN:
   - 200 paginated issues
========================================= */
export const getAllIssues = async (req, res) => {
  try {
    const { status, overdue } = req.query;
    const pagination = getPagination(req.query);

    const { issues, total } = await getAllIssuesService(
      { status, overdue },
      pagination
    );

    return res.status(200).json({
      success_flag: true,
      message: 'ISSUES_FETCHED_SUCCESSFULLY',
      data: {
        issues,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          total_pages: Math.ceil(total / pagination.limit),
        },
      },
    });
  } catch (error) {
    logger.error('GET ALL ISSUES CONTROLLER ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getMyIssues

   PURPOSE:
   Student views their own issued books
   with current fine if overdue

   QUERY: page, limit

   RETURN:
   - 200 paginated issues
========================================= */
export const getMyIssues = async (req, res) => {
  try {
    const studentId = req.user.id;
    const pagination = getPagination(req.query);

    const { issues, total } = await getMyIssuesService(studentId, pagination);

    return res.status(200).json({
      success_flag: true,
      message: 'MY_ISSUES_FETCHED_SUCCESSFULLY',
      data: {
        issues,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          total_pages: Math.ceil(total / pagination.limit),
        },
      },
    });
  } catch (error) {
    logger.error('GET MY ISSUES CONTROLLER ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getIssueById

   PURPOSE:
   Get single issue with real-time fine calc

   PARAMS: issue_id

   RETURN:
   - 200 with issue + current_fine
========================================= */
export const getIssueById = async (req, res) => {
  try {
    const { issue_id } = req.params;

    const issue = await getIssueByIdService(issue_id);

    return res.status(200).json({
      success_flag: true,
      message: 'ISSUE_FETCHED_SUCCESSFULLY',
      data: issue,
    });
  } catch (error) {
    logger.error('GET ISSUE BY ID CONTROLLER ERROR', error);

    if (error.message === 'ISSUE_NOT_FOUND') {
      return res.status(404).json({
        success_flag: false,
        message: 'ISSUE_NOT_FOUND',
      });
    }

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};
