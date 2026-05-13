const { ApiError } = require('../utils');

const notFoundMiddleware = (req, res, next) => {
  throw ApiError.notFound(`Route ${req.originalUrl} not found`);
};

module.exports = notFoundMiddleware;
