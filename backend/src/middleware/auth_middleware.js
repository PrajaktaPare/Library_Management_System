import { verifyToken } from '../services/jwt_service.js';
import logger from '../utils/logger.js';

export const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Unauthorized: No token');
      return res.status(401).json({ message: 'Unauthorized: No token' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Unauthorized: Invalid token format');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Unauthorized: Empty token');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const decoded = verifyToken(token);

    req.user = decoded;

    logger.info(`User authenticated: ${decoded?.id}`);

    next();
  } catch (error) {
    logger.error('JWT ERROR', error);

    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    logger.info(`Allowed Roles: ${roles}`);
    logger.info(`User Role: ${req.user?.role}`);

    if (!roles.includes(String(req.user.role_id))) {
      logger.warn(`Access denied for role: ${req.user.role}`);

      return res.status(403).json({
        message: 'Access denied',
      });
    }

    logger.info('User authorized');

    next();
  };
};
