// book_request_controller.js

import logger from '../utils/logger.js';

import {
  requestBookService,
  issueBookService,
  rejectBookRequestService,
  getAllRequestsService,
  getMyRequestsService,
  cancelRequestService,
} from '../services/book_request_service.js';

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
   FUNCTION: requestBook

   PURPOSE:
   Student requests a book

   BODY: { book_id }

   RETURN:
   - 201 with request details
========================================= */
export const requestBook = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { book_id } = req.body;

    const request = await requestBookService(studentId, book_id);

    return res.status(201).json({
      success_flag: true,
      message: 'BOOK_REQUEST_SUBMITTED_SUCCESSFULLY',
      data: request,
    });
  } catch (error) {
    logger.error('REQUEST BOOK CONTROLLER ERROR', error);

    const errorMap = {
      BOOK_NOT_FOUND: { status: 404, message: 'BOOK_NOT_FOUND' },
      BOOK_NOT_AVAILABLE: { status: 400, message: 'BOOK_NOT_AVAILABLE' },
      REQUEST_ALREADY_PENDING: {
        status: 409,
        message: 'REQUEST_ALREADY_PENDING',
      },
      BOOK_ALREADY_ISSUED_TO_STUDENT: {
        status: 409,
        message: 'BOOK_ALREADY_ISSUED_TO_STUDENT',
      },
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
   FUNCTION: issueBook

   PURPOSE:
   Admin approves and issues a book request

   PARAMS: request_id

   RETURN:
   - 200 with issue details
========================================= */
export const issueBook = async (req, res) => {
  try {
    const { request_id } = req.params;

    const result = await issueBookService(request_id);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_ISSUED_SUCCESSFULLY',
      data: result,
    });
  } catch (error) {
    logger.error('ISSUE BOOK CONTROLLER ERROR', error);

    const errorMap = {
      REQUEST_NOT_FOUND: { status: 404, message: 'REQUEST_NOT_FOUND' },
      REQUEST_NOT_PENDING: {
        status: 400,
        message: 'REQUEST_IS_ALREADY_PROCESSED',
      },
      BOOK_NOT_AVAILABLE: { status: 400, message: 'BOOK_NOT_AVAILABLE' },
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
   FUNCTION: rejectBookRequest

   PURPOSE:
   Admin rejects a book request

   PARAMS: request_id
   BODY: { reason }

   RETURN:
   - 200 with rejection details
========================================= */
export const rejectBookRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { reason } = req.body;

    const result = await rejectBookRequestService(request_id, reason);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_REQUEST_REJECTED',
      data: result,
    });
  } catch (error) {
    logger.error('REJECT BOOK REQUEST CONTROLLER ERROR', error);

    const errorMap = {
      REQUEST_NOT_FOUND: { status: 404, message: 'REQUEST_NOT_FOUND' },
      REQUEST_NOT_PENDING: {
        status: 400,
        message: 'REQUEST_IS_ALREADY_PROCESSED',
      },
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
   FUNCTION: getAllRequests

   PURPOSE:
   Admin gets all book requests with
   optional status filter and pagination

   QUERY: status, page, limit

   RETURN:
   - 200 paginated requests
========================================= */
export const getAllRequests = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const pagination = getPagination(req.query);

    const { requests, total } = await getAllRequestsService(
      { status },
      pagination
    );

    return res.status(200).json({
      success_flag: true,
      message: 'REQUESTS_FETCHED_SUCCESSFULLY',
      data: {
        requests,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          total_pages: Math.ceil(total / pagination.limit),
        },
      },
    });
  } catch (error) {
    logger.error('GET ALL REQUESTS CONTROLLER ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getMyRequests

   PURPOSE:
   Student views their own requests

   QUERY: page, limit

   RETURN:
   - 200 paginated requests
========================================= */
export const getMyRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    const pagination = getPagination(req.query);

    const { requests, total } = await getMyRequestsService(
      studentId,
      pagination
    );

    return res.status(200).json({
      success_flag: true,
      message: 'MY_REQUESTS_FETCHED_SUCCESSFULLY',
      data: {
        requests,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          total_pages: Math.ceil(total / pagination.limit),
        },
      },
    });
  } catch (error) {
    logger.error('GET MY REQUESTS CONTROLLER ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: cancelRequest

   PURPOSE:
   Student cancels their own pending request

   PARAMS: request_id

   RETURN:
   - 200 success
========================================= */
export const cancelRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const studentId = req.user.id;

    await cancelRequestService(request_id, studentId);

    return res.status(200).json({
      success_flag: true,
      message: 'REQUEST_CANCELLED_SUCCESSFULLY',
    });
  } catch (error) {
    logger.error('CANCEL REQUEST CONTROLLER ERROR', error);

    const errorMap = {
      REQUEST_NOT_FOUND: { status: 404, message: 'REQUEST_NOT_FOUND' },
      UNAUTHORIZED: { status: 403, message: 'NOT_YOUR_REQUEST' },
      REQUEST_NOT_PENDING: {
        status: 400,
        message: 'CANNOT_CANCEL_PROCESSED_REQUEST',
      },
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
