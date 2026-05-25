// allowed columns
export const ISSUE_COLUMNS = [
  'id',
  'request_id',
  'student_id',
  'book_id',
  'issue_date',
  'due_date',
  'return_date',
  'fine_amount',
  'status',
  'created_at',
  'updated_at',
];

// validate issue id
export const issueIdValidator = {
  type: 'object',

  required: ['issue_id'],

  properties: {
    issue_id: {
      type: 'integer',
      minimum: 1,
    },
  },

  additionalProperties: false,
};

// return issue validator
export const returnIssueValidator = {
  type: 'object',

  properties: {
    return_date: {
      type: 'string',
      format: 'date',
    },
  },

  additionalProperties: false,
};

// get issues query validator
export const getIssuesQueryValidator = {
  type: 'object',

  properties: {
    filter: {
      type: 'string',
    },
  },

  additionalProperties: false,
};
