import { ApiError } from '../utils/index.js';

const notFoundMiddleware = (req, res, next) => {
  throw ApiError.notFound(`Route ${req.originalUrl} not found`);
};

export default notFoundMiddleware;
