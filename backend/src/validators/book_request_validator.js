/* =========================================
   REQUEST BOOK SCHEMA

   PURPOSE:
   Validate book request body

   ROUTE:
   POST /book-requests

   REQUIRED FIELDS:
   - book_id

   RETURN:
   - validated request body
========================================= */
export const requestBookValidator = {
  type: 'object',

  required: ['book_id'],

  properties: {
    book_id: {
      type: 'integer',

      minimum: 1,

      errorMessage: {
        type: 'Book ID must be an integer',

        minimum: 'Book ID must be a positive integer',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      book_id: 'Book ID is required',
    },

    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   REJECT REQUEST SCHEMA

   PURPOSE:
   Validate reject request body

   ROUTE:
   PATCH /book-requests/:request_id/reject

   RETURN:
   - validated request body
========================================= */
export const rejectRequestValidator = {
  type: 'object',

  properties: {
    reason: {
      type: 'string',

      minLength: 1,

      maxLength: 500,

      errorMessage: {
        type: 'Reason must be a string',

        minLength: 'Reason cannot be empty',

        maxLength: 'Reason must be at most 500 characters',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   REQUEST ID PARAM SCHEMA

   PURPOSE:
   Validate request id route parameter

   ROUTE:
   /book-requests/:request_id

   RETURN:
   - validated request params
========================================= */
export const requestIdValidator = {
  type: 'object',

  required: ['request_id'],

  properties: {
    request_id: {
      type: 'string',

      pattern: '^[1-9]\\d*$',

      errorMessage: {
        type: 'Request ID must be a string',

        pattern: 'Request ID must be a valid positive integer',
      },
    },
  },

  errorMessage: {
    required: {
      request_id: 'Request ID is required',
    },
  },
};
