/* ---------------- ROLE ID VALIDATOR ---------------- */

export const roleIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'Role ID must be a number.',
        minimum: 'Invalid role ID.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'Role ID is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Role name must be a string.',
        minLength: 'Role name is required.',
        maxLength: 'Role name must not exceed 50 characters.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      role_name: 'Role name is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Role name must be a string.',
        minLength: 'Role name cannot be empty.',
        maxLength: 'Role name must not exceed 50 characters.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    minProperties: 'At least one field is required.',
    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Limit must be a number.',
        minimum: 'Limit must be at least 1.',
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
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'Extra fields are not allowed.',
  },
};
