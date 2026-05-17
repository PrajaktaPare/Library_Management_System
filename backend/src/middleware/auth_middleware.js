import { verifyToken } from '../services/jwt_service.js';

import logger from '../utils/logger.js';

/* =========================================
   FUNCTION: verifyJWT

   PURPOSE:
   Verify JWT token from authorization
   header and authenticate user

   PARAMETER:
   - req
   - res
   - next

   RETURN:
   - next middleware
   - unauthorized response
========================================= */
export const verifyJWT = (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader) {
      logger.warn('Unauthorized: No token');

      return res.status(401).json({
        message: 'Unauthorized: No token',
      });
    }

    // Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Unauthorized: Invalid token format');

      return res.status(401).json({
        message: 'Invalid token format',
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Check if token is empty
    if (!token) {
      logger.warn('Unauthorized: Empty token');

      return res.status(401).json({
        message: 'Invalid token format',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach decoded user data to request
    req.user = decoded;

    logger.info(`User authenticated: ${decoded?.id}`);

    // Continue to next middleware
    next();
  } catch (error) {
    logger.error('JWT ERROR', error);

    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};

/* =========================================
   FUNCTION: authorizeRoles

   PURPOSE:
   Authorize user based on allowed roles

   PARAMETER:
   - roles

   RETURN:
   - middleware function
========================================= */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Log allowed roles
    logger.info(`Allowed Roles: ${roles}`);

    // Log current user role
    logger.info(`User Role: ${req.user?.role_id}`);

    // Check if user role is allowed
    if (!roles.includes(String(req.user.role_id))) {
      logger.warn(`Access denied for role: ${req.user?.role_id}`);

      return res.status(403).json({
        message: 'Access denied',
      });
    }

    logger.info('User authorized');

    // Continue to next middleware
    next();
  };
};
