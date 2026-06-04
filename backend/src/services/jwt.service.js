import jwt from 'jsonwebtoken';

//Generate JWT token for authenticated user
export const generateToken = user => {
  // Generate and sign JWT token
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },

    // Secret key used for token signing
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
  return token;
};

// verify token
export const verifyToken = token => {
  // Verify token using secret key
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};
