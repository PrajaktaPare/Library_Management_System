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

  required: ['bookId'],

  properties: {
    bookId: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'bookId_MUST_BE_INTEGER',
        minimum: 'INVALID_bookId',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      bookId: 'bookId_REQUIRED',
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

      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,

          errorMessage: {
            type: 'LIMIT_MUST_BE_INTEGER',
            minimum: 'LIMIT_MINIMUM_1',
            maximum: 'LIMIT_MAXIMUM_100',
          },
        },

        offset: {
          type: 'integer',
          minimum: 0,

          errorMessage: {
            type: 'OFFSET_MUST_BE_INTEGER',
            minimum: 'OFFSET_CANNOT_BE_NEGATIVE',
          },
        },

        order: {
          type: 'object',

          properties: {
            column: {
              type: 'string',

              errorMessage: {
                type: 'COLUMN_MUST_BE_STRING',
              },
            },

            direction: {
              type: 'string',
              enum: ['ASC', 'DESC'],

              errorMessage: {
                type: 'ORDER_DIRECTION_MUST_BE_STRING',
                enum: 'ORDER_DIRECTION_MUST_BE_ASC_OR_DESC',
              },
            },
          },

          additionalProperties: false,

          errorMessage: {
            additionalProperties: 'INVALID_ORDER_FIELD',
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
                      type: 'LIKE_MUST_BE_STRING',
                    },
                  },
                },

                additionalProperties: false,

                errorMessage: {
                  additionalProperties: 'INVALID_WHERE_OPERATOR',
                },
              },
            ],
          },

          errorMessage: {
            type: 'WHERE_MUST_BE_OBJECT',
          },
        },
      },

      additionalProperties: false,

      errorMessage: {
        additionalProperties: 'INVALID_FILTER_FIELD',
      },
    },
  },

  additionalProperties: true,
};
