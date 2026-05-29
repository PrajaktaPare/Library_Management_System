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
      type: 'object',

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

/* ---------------- USER ID VALIDATOR ---------------- */

export const userIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'USER_ID_MUST_BE_INTEGER',
        minimum: 'INVALID_USER_ID',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'USER_ID_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
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
        type: 'FIRST_NAME_MUST_BE_STRING',
        minLength: 'FIRST_NAME_REQUIRED',
      },
    },

    last_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'LAST_NAME_MUST_BE_STRING',
        minLength: 'LAST_NAME_REQUIRED',
      },
    },

    email: {
      type: 'string',
      format: 'email',

      errorMessage: {
        type: 'EMAIL_MUST_BE_STRING',
        format: 'INVALID_EMAIL_FORMAT',
      },
    },

    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',

      errorMessage: {
        type: 'PASSWORD_MUST_BE_STRING',
        pattern: 'PASSWORD_MUST_HAVE_UPPERCASE_NUMBER_SPECIALCHAR_6_TO_10_LENGTH',
      },
    },

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',

      errorMessage: {
        type: 'PHONE_MUST_BE_STRING',
        pattern: 'PHONE_MUST_BE_10_DIGITS',
      },
    },

    role_id: {
      type: 'integer',
      enum: [1, 2],

      errorMessage: {
        type: 'ROLE_ID_MUST_BE_INTEGER',
        enum: 'INVALID_ROLE_ID',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      first_name: 'FIRST_NAME_REQUIRED',
      last_name: 'LAST_NAME_REQUIRED',
      email: 'EMAIL_REQUIRED',
      password: 'PASSWORD_REQUIRED',
      phone: 'PHONE_REQUIRED',
      role_id: 'ROLE_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
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
        type: 'FIRST_NAME_MUST_BE_STRING',
        minLength: 'FIRST_NAME_CANNOT_BE_EMPTY',
      },
    },

    last_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'LAST_NAME_MUST_BE_STRING',
        minLength: 'LAST_NAME_CANNOT_BE_EMPTY',
      },
    },

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',

      errorMessage: {
        type: 'PHONE_MUST_BE_STRING',
        pattern: 'PHONE_MUST_BE_10_DIGITS',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
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
        type: 'FIRST_NAME_MUST_BE_STRING',
        minLength: 'FIRST_NAME_REQUIRED',
      },
    },

    last_name: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'LAST_NAME_MUST_BE_STRING',
        minLength: 'LAST_NAME_REQUIRED',
      },
    },

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',

      errorMessage: {
        type: 'PHONE_MUST_BE_STRING',
        pattern: 'PHONE_MUST_BE_10_DIGITS',
      },
    },

    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',

      errorMessage: {
        type: 'PASSWORD_MUST_BE_STRING',
        pattern: 'PASSWORD_MUST_HAVE_UPPERCASE_NUMBER_SPECIALCHAR_6_TO_10_LENGTH',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};
