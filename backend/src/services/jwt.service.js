import jwt from 'jsonwebtoken';
import logger from './logger.service.js';

/*
  Purpose:
    Generate JWT token for authenticated user
     Parameters:
    - user: Object containing user details

  Returns:
    - Signed JWT token string
*/
export const generateToken = user => {
  logger.info(`GENERATING JWT TOKEN FOR USER ID ${user.id}`);

  // Generate and sign JWT token
  const token = jwt.sign(
    {
      id: user.id,
      role_id: user.role_id,
    },

    // Secret key used for token signing
    process.env.JWT_SECRET,
    {
      // Set token expiration time
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  logger.info(`JWT TOKEN GENERATED FOR USER ID ${user.id}`);

  return token;
};

/*
  Purpose:
    Verify and decode JWT token

  Parameters:
    - token: JWT token string

  Returns:
    - Decoded token payload
*/
export const verifyToken = token => {
  logger.info('VERIFYING JWT TOKEN');

  // Verify token using secret key
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  logger.info(`JWT TOKEN VERIFIED FOR USER ID ${decoded.id}`);
  return decoded;
};
