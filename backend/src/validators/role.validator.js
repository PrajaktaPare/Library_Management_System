/* ---------------- ROLE ID VALIDATOR ---------------- */

export const roleIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'ROLE_ID_MUST_BE_INTEGER',
        minimum: 'INVALID_ROLE_ID',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'ROLE_ID_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- CREATE ROLE VALIDATOR ---------------- */

export const createRoleValidator = {
  type: 'object',

  required: ['role_name'],

  properties: {
    role_name: {
      type: 'string',
      minLength: 1,
      maxLength: 50,

      errorMessage: {
        type: 'ROLE_NAME_MUST_BE_STRING',
        minLength: 'ROLE_NAME_REQUIRED',
        maxLength: 'ROLE_NAME_MAX_LENGTH_50',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      role_name: 'ROLE_NAME_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- PATCH ROLE VALIDATOR ---------------- */

export const patchRoleValidator = {
  type: 'object',

  minProperties: 1,

  properties: {
    role_name: {
      type: 'string',
      minLength: 1,
      maxLength: 50,

      errorMessage: {
        type: 'ROLE_NAME_MUST_BE_STRING',
        minLength: 'ROLE_NAME_CANNOT_BE_EMPTY',
        maxLength: 'ROLE_NAME_MAX_LENGTH_50',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    minProperties: 'AT_LEAST_ONE_FIELD_REQUIRED',

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- GET ROLES QUERY VALIDATOR ---------------- */

export const getRolesQueryValidator = {
  type: 'object',

  properties: {
    limit: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'LIMIT_MUST_BE_INTEGER',
        minimum: 'LIMIT_MINIMUM_1',
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
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};
