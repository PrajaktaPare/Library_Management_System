const { ApiError, asyncHandler } = require('../utils');

const roleMiddleware = (allowedRoles = []) => {
  return asyncHandler((req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  });
};

module.exports = roleMiddleware;
