import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests') => {
  return rateLimit({ windowMs, max: maxRequests, message: { success: false, statusCode: 429, message }, standardHeaders: true, legacyHeaders: false, skip: (req) => process.env.NODE_ENV === 'development' });
};

export const loginLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts. Please try again after 15 minutes.');
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests. Please try again later.');
export const authLimiter = createRateLimiter(60 * 60 * 1000, 10, 'Too many authentication attempts. Please try again later.');
export { createRateLimiter };
