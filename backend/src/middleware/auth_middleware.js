const { JwtHelper, ApiError, asyncHandler } = require('../utils');

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

module.exports = authMiddleware;
