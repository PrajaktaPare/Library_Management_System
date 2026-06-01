import crypto from 'crypto';
import bcrypt from 'bcrypt';
import logger from './logger.service.js';

/**
 * Generate verification token for email verification.
 *
 * @returns {Promise<Object>}
 * Returns:
 * - rawToken → sent in email verification link
 * - hashedToken → stored securely in database
 */
export const generateVerificationToken = async () => {
  try {
    // generate random token
    const rawToken = crypto.randomBytes(10).toString('hex');
    // hash token before storing
    const hashedToken = await bcrypt.hash(rawToken, 10);

    // return both tokens
    return {
      rawToken,
      hashedToken,
    };
  } catch (error) {
    // log token generation error
    logger.error('TOKEN_GENERATION_ERROR', error);

    // throw application error
    throw new Error('TOKEN_GENERATION_FAILED');
  }
};
