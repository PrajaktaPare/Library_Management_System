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

/* ---------------- REQUEST ID VALIDATOR ---------------- */

export const requestIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'REQUEST_ID_MUST_BE_INTEGER',
        minimum: 'INVALID_REQUEST_ID',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'REQUEST_ID_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- CREATE REQUEST VALIDATOR ---------------- */

export const createRequestValidator = {
  type: 'object',

  required: ['book_id'],

  properties: {
    book_id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'BOOK_ID_MUST_BE_INTEGER',
        minimum: 'INVALID_BOOK_ID',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      book_id: 'BOOK_ID_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- REJECT REQUEST VALIDATOR ---------------- */

export const rejectRequestValidator = {
  type: 'object',

  properties: {
    reason: {
      type: 'string',
      minLength: 1,
      maxLength: 500,

      errorMessage: {
        type: 'REASON_MUST_BE_STRING',
        minLength: 'REJECTION_REASON_REQUIRED',
        maxLength: 'REJECTION_REASON_MAX_LENGTH_500',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- GET REQUESTS QUERY VALIDATOR ---------------- */

export const getRequestsQueryValidator = {
  type: 'object',

  properties: {
    filter: {
      type: 'string',

      errorMessage: {
        type: 'FILTER_MUST_BE_STRING',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};
