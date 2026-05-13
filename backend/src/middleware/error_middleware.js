const { ApiError, ApiResponse } = require('../utils');
const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    status: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      timestamp: err.timestamp
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token expired',
      timestamp: new Date().toISOString()
    });
  }

  // Handle validation errors
  if (err.details) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation error',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorMiddleware;
