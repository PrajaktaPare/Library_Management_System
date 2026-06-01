
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

/* ---------------- RETURN ISSUE VALIDATOR ---------------- */

export const returnIssueValidator = {
  type: 'object',

  properties: {
    return_date: {
      type: 'string',
      format: 'date',

      errorMessage: {
        type: 'RETURN_DATE_MUST_BE_STRING',
        format: 'INVALID_RETURN_DATE_FORMAT',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- GET ISSUES QUERY VALIDATOR ---------------- */

export const getIssuesQueryValidator = {
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
