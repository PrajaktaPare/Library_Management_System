const Joi = require('joi');

const createBookSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'any.required': 'Book title is required',
    'string.max': 'Title must not exceed 255 characters'
  }),
  author: Joi.string().max(100).required().messages({
    'any.required': 'Author name is required',
    'string.max': 'Author name must not exceed 100 characters'
  }),
  isbn: Joi.string().max(20).optional().messages({
    'string.max': 'ISBN must not exceed 20 characters'
  }),
  category: Joi.string().max(50).required().messages({
    'any.required': 'Category is required',
    'string.max': 'Category must not exceed 50 characters'
  }),
  sub_category: Joi.string().max(50).optional().messages({
    'string.max': 'Sub-category must not exceed 50 characters'
  }),
  total_copies: Joi.number().integer().min(1).required().messages({
    'number.min': 'Total copies must be at least 1',
    'any.required': 'Total copies is required'
  }),
  available_copies: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('available', 'issued', 'damaged', 'lost', 'maintenance').default('available')
});

const updateBookSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  author: Joi.string().max(100).optional(),
  isbn: Joi.string().max(20).optional(),
  category: Joi.string().max(50).optional(),
  sub_category: Joi.string().max(50).optional(),
  total_copies: Joi.number().integer().min(1).optional(),
  available_copies: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('available', 'issued', 'damaged', 'lost', 'maintenance').optional()
}).min(1);

const searchBookSchema = Joi.object({
  search: Joi.string().max(255).optional(),
  category: Joi.string().max(50).optional(),
  status: Joi.string().valid('available', 'issued', 'damaged', 'lost', 'maintenance').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  searchBookSchema
};
