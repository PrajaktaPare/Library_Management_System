//login validator
export const loginValidator = {
  type: 'object',

  // Required login fields
  required: ['email', 'password'],

  properties: {
    email: {
      type: 'string',

      format: 'email', // Validate email format

      minLength: 1, // Prevent empty email field

      errorMessage: {
        type: 'WRONG_EMAIL_FORMAT',

        minLength: 'EMAIL_REQUIRED',
      },
    },

    password: {
      type: 'string',

      minLength: 1, // Prevent empty password field

      errorMessage: {
        type: 'PASSWORD_MUST_BE_STRING',

        minLength: 'PASSWORD_REQUIRED',
      },
    },
  },

  // Prevent extra unwanted fields in request body
  additionalProperties: false,

  errorMessage: {
    required: {
      email: 'EMAIL_REQUIRED',

      password: 'PASSWORD_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

export const resetPasswordValidator = {
  type: 'object',

  required: ['email', 'token', 'password'],

  properties: {
    email: {
      type: 'string',
      format: 'email',
      errorMessage: {
        type: 'EMAIL_MUST_BE_STRING',
        format: 'INVALID_EMAIL_FORMAT',
      },
    },

    token: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'INVALID_TOKEN_FORMAT',
        minLength: 'TOKEN_REQUIRED',
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
    required: {
      email: 'EMAIL_REQUIRED',
      token: 'TOKEN_REQUIRED',
      password: 'PASSWORD_REQUIRED',
    },
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

export const forgotPasswordValidator = {
  type: 'object',

  required: ['email'],

  properties: {
    email: {
      type: 'string',
      format: 'email',

      errorMessage: {
        type: 'EMAIL_MUST_BE_STRING',
        format: 'INVALID_EMAIL_FORMAT',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      email: 'EMAIL_REQUIRED',
    },
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};
