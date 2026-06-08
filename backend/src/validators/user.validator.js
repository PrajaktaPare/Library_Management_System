import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';

// AJV instance
export const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true,
  strict: false,
});

addFormats(ajv);
ajvErrors(ajv);

/* ---------------- GET USERS VALIDATOR ---------------- */

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
                enum: 'Direction must be ASC or DESC.',
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

/* ---------------- USER ID VALIDATOR ---------------- */

export const userIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'User ID must be a number.',
        minimum: 'Invalid user ID.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'User ID is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
  },
};

/* ---------------- CREATE USER VALIDATOR ---------------- */

export const createUserValidator = {
  type: 'object',

  required: ['first_name', 'last_name', 'email', 'password', 'phone', 'role_id'],

  properties: {
    first_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'First name must be a string.',
        minLength: 'First name is required.',
      },
    },

    last_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'Last name must be a string.',
        minLength: 'Last name is required.',
      },
    },

    email: {
      type: 'string',
      format: 'email',

      errorMessage: {
        type: 'Email must be a string.',
        format: 'Invalid email format.',
      },
    },

    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',

      errorMessage: {
        type: 'Password must be a string.',
        pattern:
          'Password must contain at least one uppercase letter, one number, one special character, and be 6 to 10 characters long.',
      },
    },

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',

      errorMessage: {
        type: 'Phone must be a string.',
        pattern: 'Phone number must be exactly 10 digits.',
      },
    },

    role_id: {
      type: 'integer',
      enum: [1, 2],

      errorMessage: {
        type: 'Role ID must be a number.',
        enum: 'Invalid role ID.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      first_name: 'First name is required.',
      last_name: 'Last name is required.',
      email: 'Email is required.',
      password: 'Password is required.',
      phone: 'Phone is required.',
      role_id: 'Role is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
  },
};

/* ---------------- PATCH USER VALIDATOR ---------------- */

export const patchUserValidator = {
  type: 'object',

  properties: {
    first_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'First name must be a string.',
        minLength: 'First name cannot be empty.',
      },
    },

    last_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'Last name must be a string.',
        minLength: 'Last name cannot be empty.',
      },
    },

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',

      errorMessage: {
        type: 'Phone must be a string.',
        pattern: 'Phone number must be exactly 10 digits.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'Extra fields are not allowed.',
  },
};

/* ---------------- UPDATE PROFILE VALIDATOR ---------------- */

export const updateProfileValidator = {
  type: 'object',

  properties: {
    first_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'First name must be a string.',
        minLength: 'First name is required.',
      },
    },

    last_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'Last name must be a string.',
        minLength: 'Last name is required.',
      },
    },

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',

      errorMessage: {
        type: 'Phone must be a string.',
        pattern: 'Phone number must be exactly 10 digits.',
      },
    },

    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',

      errorMessage: {
        type: 'Password must be a string.',
        pattern:
          'Password must contain at least one uppercase letter, one number, one special character, and be 6 to 10 characters long.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'Extra fields are not allowed.',
  },
};
