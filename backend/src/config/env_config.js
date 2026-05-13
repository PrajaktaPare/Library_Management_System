// loads .env and exports a validated config object — crash early on missing required vars
import dotenv from 'dotenv';
dotenv.config();

// list of keys that MUST be set in .env
const required = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
];

// fail fast so the app never silently runs with missing secrets
required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
});

const env = {
  // server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  IS_PROD: process.env.NODE_ENV === 'production',

  // database
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,

  // jwt
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',

  // cookies
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'changeme',

  // cors — split comma-separated origins into an array
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),

  // rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,

  // uploads
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'src/uploads',

  // business logic
  FINE_PER_DAY: parseFloat(process.env.FINE_PER_DAY) || 5,
  LOAN_PERIOD_DAYS: parseInt(process.env.LOAN_PERIOD_DAYS, 10) || 7,
};

export default env;