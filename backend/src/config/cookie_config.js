// shared cookie options — refresh token is stored in an httpOnly cookie
import env from './env_config.js';

// 7 days in milliseconds for the refresh token cookie lifetime
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true, // inaccessible to JavaScript (prevents XSS theft)
  secure: env.IS_PROD, // HTTPS-only in production
  sameSite: env.IS_PROD ? 'strict' : 'lax', // CSRF protection
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

export { cookieOptions, REFRESH_COOKIE_MAX_AGE };