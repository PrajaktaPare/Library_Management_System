import { verifyToken } from '../services/jwt.service.js';
import logger from '../services/logger.service.js';

/*
  Purpose:
    Verify JWT token and authenticate user

  Parameters:
    - req: Contains request data and headers
    - res: Contains response methods
    - next: Pass control to next middleware

  Returns:
    - Authenticated user data or error response
*/
export const verifyJWT = (req, res, next) => {
  try {
    // Get Authorization header from request
    const authHeader = req.headers.authorization;

    // Check if authorization header exists
    if (!authHeader) {
      logger.warn('AUTH HEADER MISSING');

      return res.status(401).json({
        success_flag: false,
        message: 'AUTHORIZATION_TOKEN_REQUIRED',
      });
    }

    // Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('INVALID AUTH TOKEN FORMAT');

      return res.status(401).json({
        success_flag: false,
        message: 'INVALID_TOKEN_FORMAT',
      });
    }

    // Extract token from authorization header
    const token = authHeader.split(' ')[1];

    // Check if token exists
    if (!token) {
      logger.warn('TOKEN NOT FOUND');

      return res.status(401).json({
        success_flag: false,
        message: 'TOKEN_REQUIRED',
      });
    }

    // Verify and decode JWT token
    const decoded = verifyToken(token);

    // Attach decoded user data into request object
    req.user = decoded;

    // Log authenticated user ID
    logger.info(`USER AUTHENTICATED: ${decoded.id}`);

    // Pass request to next middleware
    next();
  } catch (error) {
    // Log JWT verification error
    logger.error('JWT VERIFICATION FAILED', error);

    return res.status(401).json({
      success_flag: false,
      message: 'INVALID_OR_EXPIRED_TOKEN',
    });
  }
};

/*
  Purpose:
    Restrict route access based on allowed user roles

  Parameters:
    - roles: Allowed role IDs

  Returns:
    - Authorization middleware function
*/
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      // Get logged-in user role from decoded token
      const userRole = Number(req.user?.role_id);

      // Log current user role
      logger.info(`USER ROLE: ${userRole}`);

      // Log allowed roles for route
      logger.info(`ALLOWED ROLES: ${roles}`);

      // Check if user role is authorized
      if (!roles.includes(userRole)) {
        logger.warn(`ACCESS DENIED - ROLE ${userRole}`);

        return res.status(403).json({
          success_flag: false,
          message: 'ACCESS_DENIED',
        });
      }

      // Log successful authorization
      logger.info('USER AUTHORIZED SUCCESSFULLY');

      // Pass request to next middleware
      next();
    } catch (error) {
      // Log authorization errors
      logger.error('ROLE AUTHORIZATION ERROR', error);

      return res.status(500).json({
        success_flag: false,
        message: 'INTERNAL_SERVER_ERROR',
      });
    }
  };
};
