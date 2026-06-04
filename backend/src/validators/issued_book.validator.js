/* ---------------- ISSUE ID VALIDATOR ---------------- */

export const issueIdValidator = {
  type: 'object',

  required: ['issue_id'],

  properties: {
    issue_id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'ISSUE_ID_MUST_BE_INTEGER',
        minimum: 'INVALID_ISSUE_ID',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      issue_id: 'ISSUE_ID_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- GET ISSUES QUERY VALIDATOR ---------------- */

export const getIssuesQueryValidator = {
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
