const Joi = require('joi');

const createRequestSchema = Joi.object({
  book_id: Joi.number().integer().required().messages({
    'number.base': 'Book ID must be a number',
    'any.required': 'Book ID is required'
  })
});

const updateRequestStatusSchema = Joi.object({
  request_status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'issued', 'returned', 'cancelled')
    .required()
    .messages({
      'any.only': 'Invalid request status',
      'any.required': 'Status is required'
    }),
  due_date: Joi.date().greater('now').optional().messages({
    'date.greater': 'Due date must be in the future'
  }),
  notes: Joi.string().max(500).optional()
});

const issueBookSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  due_date: Joi.date().required().messages({
    'any.required': 'Due date is required'
  })
});

const returnBookSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  notes: Joi.string().max(500).optional()
});

const approveRequestSchema = Joi.object({
  due_date: Joi.date().required().messages({
    'any.required': 'Due date is required'
  }),
  notes: Joi.string().max(500).optional()
});

module.exports = {
  createRequestSchema,
  updateRequestStatusSchema,
  issueBookSchema,
  returnBookSchema,
  approveRequestSchema
};
