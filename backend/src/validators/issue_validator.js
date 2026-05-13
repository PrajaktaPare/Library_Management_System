const Joi = require('joi');

const createIssueSchema = Joi.object({
  book_id: Joi.number().integer().required(),
  issue_type: Joi.string().valid('damage', 'loss', 'late_return', 'other').required(),
  description: Joi.string().max(1000).optional(),
 fine_amount: Joi.number().precision(2).optional()
});

const updateIssueSchema = Joi.object({
  issue_status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').required(),
  fine_amount: Joi.number().precision(2).optional(),
  resolution_notes: Joi.string().max(1000).optional()
});

module.exports = {
  createIssueSchema,
  updateIssueSchema
};
