import { JwtHelper, ApiError, asyncHandler } from '../utils/index.js';

const authMiddleware = asyncHandler((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }
  const token = authHeader.substring(7);
  const decoded = JwtHelper.verifyAccessToken(token);
  req.user = decoded;
  next();
});

// Named export for files that import as { authenticate }
export const authenticate = authMiddleware;
export default authMiddleware;
