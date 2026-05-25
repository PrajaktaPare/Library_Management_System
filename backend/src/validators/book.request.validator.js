// allowed request columns
export const REQUEST_COLUMNS = [
  'id',
  'student_id',
  'book_id',
  'request_status',
  'requested_at',
  'issued_at',
  'created_at',
  'updated_at',
];

// validate request id
export const requestIdValidator = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
    },
  },
  additionalProperties: false,
};

// create request validation
export const createRequestValidator = {
  type: 'object',
  required: ['book_id'],
  properties: {
    book_id: {
      type: 'integer',
      minimum: 1,
    },
  },
  additionalProperties: false,
};

// reject request validation
export const rejectRequestValidator = {
  type: 'object',
  properties: {
    reason: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
  },
  additionalProperties: false,
};

// get requests query validation
export const getRequestsQueryValidator = {
  type: 'object',

  properties: {
    filter: {
      type: 'string',
    },
  },

  additionalProperties: false,
};
