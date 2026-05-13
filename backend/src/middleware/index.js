module.exports = {
  authMiddleware: require('./auth_middleware'),
  roleMiddleware: require('./role_middleware'),
  errorMiddleware: require('./error_middleware'),
  validateMiddleware: require('./validate_middleware'),
  rateLimitMiddleware: require('./rate_limit_middleware'),
  loggerMiddleware: require('./logger_middleware'),
  notFoundMiddleware: require('./not_found_middleware')
};
