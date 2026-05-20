// Import jsonwebtoken package
import jwt from 'jsonwebtoken';

// Import logger service
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
  // Log token generation request
  logger.info(`GENERATING JWT TOKEN FOR USER ID ${user.id}`);

  // Generate and sign JWT token
  const token = jwt.sign(
    {
      // Store user ID inside token payload
      id: user.id,

      // Store user role ID inside token payload
      role_id: user.role_id,
    },

    // Secret key used for token signing
    process.env.JWT_SECRET,

    {
      // Set token expiration time
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  // Log successful token generation
  logger.info(`JWT TOKEN GENERATED FOR USER ID ${user.id}`);

  // Return generated token
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
  // Log token verification request
  logger.info('VERIFYING JWT TOKEN');

  // Verify token using secret key
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Log successful token verification
  logger.info(`JWT TOKEN VERIFIED FOR USER ID ${decoded.id}`);

  // Return decoded token payload
  return decoded;
};
