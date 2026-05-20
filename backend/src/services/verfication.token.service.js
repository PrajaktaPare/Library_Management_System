import crypto from 'crypto';
import bcrypt from 'bcrypt';
import logger from './logger.service.js';

/*
function info: generate secure verification token for email verification flow
function parameter purpose: none required
function return: returns raw token (for email link) and hashed token (for DB storage)
*/
export const generateVerificationToken = async () => {
  try {
    const rawToken = crypto.randomBytes(10).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);

    return { rawToken, hashedToken };
  } catch (error) {
    logger.error('TOKEN_GENERATION_ERROR', error);
    throw new Error('TOKEN_GENERATION_FAILED');
  }
};
