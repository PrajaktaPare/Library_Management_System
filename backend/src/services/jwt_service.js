import jwt from 'jsonwebtoken';

/* =========================================
   FUNCTION: generateToken

   PURPOSE:
   Generate JWT token

   PARAMETER:
   - user

   RETURN:
   - jwt token
========================================= */
export const generateToken = user => {
  return jwt.sign(
    {
      id: user.id,
      role_id: user.role_id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

/* =========================================
   FUNCTION: verifyToken

   PURPOSE:
   Verify JWT token

   PARAMETER:
   - token

   RETURN:
   - decoded token
========================================= */
export const verifyToken = token => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
