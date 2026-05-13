const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Username/email must be at least 3 characters',
    'string.max': 'Username/email must not exceed 100 characters',
    'any.required': 'Username or email is required'
  }),
  password: Joi.string().min(8).max(100).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must not exceed 100 characters',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('admin', 'student').required().messages({
    'any.only': 'Role must be either admin or student',
    'any.required': 'Role is required'
  })
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).alphanum().required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must not exceed 50 characters',
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'any.required': 'Username is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).max(100).required().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/i).messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
    'any.required': 'Password is required'
  }),
  name: Joi.string().max(100).required().messages({
    'any.required': 'Name is required',
    'string.max': 'Name must not exceed 100 characters'
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Phone must be a valid 10-digit number'
  }),
  role: Joi.string().valid('admin', 'student').required().messages({
    'any.only': 'Role must be either admin or student',
    'any.required': 'Role is required'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

module.exports = {
  loginSchema,
  registerSchema,
  refreshTokenSchema
};
