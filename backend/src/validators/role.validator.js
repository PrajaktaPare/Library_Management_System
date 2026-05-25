// allowed columns
export const ROLE_COLUMNS = ['id', 'role_name'];

// validate role id
export const roleIdValidator = {
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

// create role validation
export const createRoleValidator = {
  type: 'object',
  required: ['role_name'],
  properties: {
    role_name: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
    },
  },
  additionalProperties: false,
};

// patch role validation
export const patchRoleValidator = {
  type: 'object',
  minProperties: 1,
  properties: {
    role_name: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
    },
  },
  additionalProperties: false,
};

// query validation
export const getRolesQueryValidator = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
    },
    offset: {
      type: 'integer',
      minimum: 0,
    },
  },
  additionalProperties: false,
};
