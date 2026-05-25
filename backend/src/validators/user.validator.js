import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';

// allowed DB columns
export const USER_COLUMNS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'phone',
  'role_id',
  'is_active',
  'is_verified',
  'created_at',
  'updated_at',
];

// ajv instance
export const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true,
  strict: false,
});

addFormats(ajv);
ajvErrors(ajv);

// GET users validator
export const getUsersValidator = {
  type: 'object',
  properties: {
    filter: {
      type: 'string',
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },

        offset: {
          type: 'integer',
          minimum: 0,
        },

        order: {
          type: 'object',
          properties: {
            column: {
              type: 'string',
            },
            direction: {
              type: 'string',
              enum: ['ASC', 'DESC'],
            },
          },
          additionalProperties: false,
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
                  },
                },
                additionalProperties: false,
              },
            ],
          },
        },
      },

      additionalProperties: false,
    },
  },

  additionalProperties: true,
};

// user id validator
export const userIdValidator = {
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

// create user validator
export const createUserValidator = {
  type: 'object',
  required: ['first_name', 'last_name', 'email', 'password', 'phone', 'role_id'],
  properties: {
    first_name: { type: 'string', minLength: 1 },
    last_name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',
    },
    phone: { type: 'string', pattern: '^\\d{10}$' },
    role_id: { type: 'integer', enum: [1, 2] },
  },
  additionalProperties: false,
};

// PATCH user validator is_active and is_deleted
export const patchUserValidator = {
  type: 'object',
  properties: {
    first_name: { type: 'string', minLength: 1 },
    last_name: { type: 'string', minLength: 1 },
    phone: { type: 'string', pattern: '^\\d{10}$' },
  },
  additionalProperties: false,
};

// update profile validator
export const updateProfileValidator = {
  type: 'object',
  properties: {
    first_name: { type: 'string', minLength: 1 },
    last_name: { type: 'string', minLength: 1 },
    phone: { type: 'string', pattern: '^\\d{10}$' },
    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',
    },
  },
  additionalProperties: false,
};
