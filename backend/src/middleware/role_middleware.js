import { ApiError, asyncHandler } from '../utils/index.js';

const roleMiddleware = (allowedRoles = []) => {
  return asyncHandler((req, res, next) => {
    if (!req.user) throw ApiError.unauthorized('User not authenticated');
    // Support both array and string argument
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) throw ApiError.forbidden('Insufficient permissions');
    next();
  });
};

// Named export for files that import as authorize
export const authorize = roleMiddleware;
export default roleMiddleware;
