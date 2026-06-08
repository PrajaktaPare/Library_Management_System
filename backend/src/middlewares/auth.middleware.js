import { verifyToken } from '../services/jwt.service.js';
import logger from '../services/logger.service.js';

// verify jwt middleware
export const verifyJWT = (req, res, next) => {
  try {
    // get authorization header
    const authHeader = req.headers.authorization;

    // check auth header exists
    if (!authHeader) {
      logger.warn('AUTH HEADER MISSING');

      // return response
      return res.status(401).json({
        success_flag: false,
        message: 'Authorization token is required.',
      });
    }

    // validate bearer format
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('INVALID AUTH TOKEN FORMAT');

      // return response
      return res.status(401).json({
        success_flag: false,
        message: 'Invalid token format.',
      });
    }

    // extract token
    const token = authHeader.split(' ')[1];

    // check token exists
    if (!token) {
      // log warning
      logger.warn('TOKEN NOT FOUND');

      // return response
      return res.status(401).json({
        success_flag: false,
        message: 'Token is required.',
      });
    }

    // verify token
    const decoded = verifyToken(token);

    // attach user data
    req.user = decoded;

    // continue request
    next();
  } catch (error) {
    logger.error('JWT VERIFICATION FAILED', error);

    // return error response
    return res.status(401).json({
      success_flag: false,
      message: 'Invalid or Expired Token.',
    });
  }
};

// role authorization middleware
export const authorizeRoles = (...roles) => {
  // return middleware
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;
      // validate role access
      if (!roles.includes(userRole)) {
        // return response
        return res.status(403).json({
          success_flag: false,
          message: 'Access denied',
        });
      }
      // continue request
      next();
    } catch (error) {
      logger.error('ROLE AUTHORIZATION ERROR', error);

      // return error response
      return res.status(500).json({
        success_flag: false,
        message: 'An unexpected error occurred. Please try again later.',
      });
    }
  };
};
