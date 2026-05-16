import { ApiError } from '../utils/index.js';
import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  logger.error({ message: err.message, status: err.statusCode, path: req.path, method: req.method, ip: req.ip });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, statusCode: err.statusCode, message: err.message, errors: err.errors, timestamp: err.timestamp });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid token', timestamp: new Date().toISOString() });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, statusCode: 401, message: 'Token expired', timestamp: new Date().toISOString() });
  }
  if (err.details) {
    const errors = err.details.map(detail => ({ field: detail.path.join('.'), message: detail.message }));
    return res.status(422).json({ success: false, statusCode: 422, message: 'Validation error', errors, timestamp: new Date().toISOString() });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({ success: false, statusCode, message, timestamp: new Date().toISOString() });
};

export default errorMiddleware;
