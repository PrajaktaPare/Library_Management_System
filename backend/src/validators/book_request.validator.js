/* ---------------- REQUEST ID VALIDATOR ---------------- */

export const requestIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'Request ID must be a number.',
        minimum: 'Invalid request ID.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'Request ID is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
  },
};

/* ---------------- CREATE REQUEST VALIDATOR ---------------- */

export const createRequestValidator = {
  type: 'object',

  required: ['bookId'],

  properties: {
    bookId: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'Book ID must be a number.',
        minimum: 'Invalid book ID.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      bookId: 'Book ID is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Reason must be a string.',
        minLength: 'Rejection reason is required.',
        maxLength: 'Rejection reason must not exceed 500 characters.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'Extra fields are not allowed.',
  },
};

/* ---------------- GET REQUESTS QUERY VALIDATOR ---------------- */

export const getRequestsQueryValidator = {
  type: 'object',

  properties: {
    filter: {
      type: 'string',

      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,

          errorMessage: {
            type: 'Limit must be a number.',
            minimum: 'Limit must be at least 1.',
            maximum: 'Limit must not exceed 100.',
          },
        },

        offset: {
          type: 'integer',
          minimum: 0,

          errorMessage: {
            type: 'Offset must be a number.',
            minimum: 'Offset cannot be negative.',
          },
        },

        order: {
          type: 'object',

          properties: {
            column: {
              type: 'string',

              errorMessage: {
                type: 'Column must be a string.',
              },
            },

            direction: {
              type: 'string',
              enum: ['ASC', 'DESC'],

              errorMessage: {
                type: 'Direction must be a string.',
                enum: 'Order direction must be ASC or DESC.',
              },
            },
          },

          additionalProperties: false,

          errorMessage: {
            additionalProperties: 'Invalid order field provided.',
          },
        },

        where: {
          type: 'object',

          additionalProperties: {
            anyOf: [
              {
                type: ['string', 'number', 'boolean'],
              },
              {
                type: 'object',
                properties: {
                  like: {
                    type: 'string',

                    errorMessage: {
                      type: 'Like value must be a string.',
                    },
                  },
                },

                additionalProperties: false,

                errorMessage: {
                  additionalProperties: 'Invalid where condition provided.',
                },
              },
            ],
          },

          errorMessage: {
            type: 'Where filter must be an object.',
          },
        },
      },

      additionalProperties: false,

      errorMessage: {
        additionalProperties: 'Invalid filter field provided.',
      },
    },
  },

  additionalProperties: true,
};
