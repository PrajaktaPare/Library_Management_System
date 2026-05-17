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
   FUNCTION: getPagination

   PURPOSE:
   Generate pagination object from
   query parameters

   PARAMETER:
   - query

   RETURN:
   - page
   - limit
   - offset
========================================= */
const getPagination = query => {
  // Current page number
  const page = Math.max(1, parseInt(query.page) || 1);

  // Records per page
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  // Calculate offset
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};

/* =========================================
   FUNCTION: requestBook

   PURPOSE:
   Student requests a book

   PARAMETER:
   - req
   - res

   RETURN:
   - request details
========================================= */
export const requestBook = async (req, res) => {
  try {
    // Get student ID from JWT
    const studentId = req.user.id;

    // Get book ID from request body
    const { book_id } = req.body;

    // Create request
    const request = await requestBookService(studentId, book_id);

    return res.status(201).json({
      success_flag: true,
      message: 'BOOK_REQUEST_SUBMITTED_SUCCESSFULLY',

      data: request,
    });
  } catch (error) {
    logger.error('REQUEST BOOK CONTROLLER ERROR', error);

    // Error mapping
    const errorMap = {
      BOOK_NOT_FOUND: {
        status: 404,
        message: 'BOOK_NOT_FOUND',
      },

      BOOK_NOT_AVAILABLE: {
        status: 400,
        message: 'BOOK_NOT_AVAILABLE',
      },

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

    // Return mapped error response
    if (mapped) {
      return res.status(mapped.status).json({
        success_flag: false,
        message: mapped.message,
      });
    }

    // Internal server error
    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: issueBook

   PURPOSE:
   Admin approves and issues a book

   PARAMETER:
   - req
   - res

   RETURN:
   - issue details
========================================= */
export const issueBook = async (req, res) => {
  try {
    // Get request ID from params
    const { request_id } = req.params;

    // Issue book
    const result = await issueBookService(request_id);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_ISSUED_SUCCESSFULLY',

      data: result,
    });
  } catch (error) {
    logger.error('ISSUE BOOK CONTROLLER ERROR', error);

    // Error mapping
    const errorMap = {
      REQUEST_NOT_FOUND: {
        status: 404,
        message: 'REQUEST_NOT_FOUND',
      },

      REQUEST_NOT_PENDING: {
        status: 400,
        message: 'REQUEST_IS_ALREADY_PROCESSED',
      },

      BOOK_NOT_AVAILABLE: {
        status: 400,
        message: 'BOOK_NOT_AVAILABLE',
      },
    };

    const mapped = errorMap[error.message];

    // Return mapped error response
    if (mapped) {
      return res.status(mapped.status).json({
        success_flag: false,
        message: mapped.message,
      });
    }

    // Internal server error
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

   PARAMETER:
   - req
   - res

   RETURN:
   - rejection details
========================================= */
export const rejectBookRequest = async (req, res) => {
  try {
    // Get request ID from params
    const { request_id } = req.params;

    // Get rejection reason
    const { reason } = req.body;

    // Reject request
    const result = await rejectBookRequestService(request_id, reason);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_REQUEST_REJECTED',

      data: result,
    });
  } catch (error) {
    logger.error('REJECT BOOK REQUEST CONTROLLER ERROR', error);

    // Error mapping
    const errorMap = {
      REQUEST_NOT_FOUND: {
        status: 404,
        message: 'REQUEST_NOT_FOUND',
      },

      REQUEST_NOT_PENDING: {
        status: 400,
        message: 'REQUEST_IS_ALREADY_PROCESSED',
      },
    };

    const mapped = errorMap[error.message];

    // Return mapped error response
    if (mapped) {
      return res.status(mapped.status).json({
        success_flag: false,
        message: mapped.message,
      });
    }

    // Internal server error
    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getAllRequests

   PURPOSE:
   Fetch all book requests with
   pagination and filters

   PARAMETER:
   - req
   - res

   RETURN:
   - paginated request list
========================================= */
export const getAllRequests = async (req, res) => {
  try {
    // Get request status filter
    const status = req.query.status || 'pending';

    // Generate pagination
    const pagination = getPagination(req.query);

    // Fetch requests
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
   Fetch logged-in student's requests

   PARAMETER:
   - req
   - res

   RETURN:
   - paginated request list
========================================= */
export const getMyRequests = async (req, res) => {
  try {
    // Get logged-in student ID
    const studentId = req.user.id;

    // Generate pagination
    const pagination = getPagination(req.query);

    // Fetch student requests
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
   Student cancels their pending request

   PARAMETER:
   - req
   - res

   RETURN:
   - success response
========================================= */
export const cancelRequest = async (req, res) => {
  try {
    // Get request ID
    const { request_id } = req.params;

    // Get logged-in student ID
    const studentId = req.user.id;

    // Cancel request
    await cancelRequestService(request_id, studentId);

    return res.status(200).json({
      success_flag: true,
      message: 'REQUEST_CANCELLED_SUCCESSFULLY',
    });
  } catch (error) {
    logger.error('CANCEL REQUEST CONTROLLER ERROR', error);

    // Error mapping
    const errorMap = {
      REQUEST_NOT_FOUND: {
        status: 404,
        message: 'REQUEST_NOT_FOUND',
      },

      UNAUTHORIZED: {
        status: 403,
        message: 'NOT_YOUR_REQUEST',
      },

      REQUEST_NOT_PENDING: {
        status: 400,
        message: 'CANNOT_CANCEL_PROCESSED_REQUEST',
      },
    };

    const mapped = errorMap[error.message];

    // Return mapped error response
    if (mapped) {
      return res.status(mapped.status).json({
        success_flag: false,
        message: mapped.message,
      });
    }

    // Internal server error
    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};
