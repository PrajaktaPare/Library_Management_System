/* ---------------- ISSUE ID VALIDATOR ---------------- */

export const issueIdValidator = {
  type: 'object',

  required: ['issue_id'],

  properties: {
    issue_id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'Issue ID must be a number.',
        minimum: 'Invalid issue ID.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      issue_id: 'Issue ID is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
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
