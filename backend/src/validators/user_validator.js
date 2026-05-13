const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Phone must be a valid 10-digit number'
  })
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/i)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
      'any.required': 'New password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required'
    })
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema
};
