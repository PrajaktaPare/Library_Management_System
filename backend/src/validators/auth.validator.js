//login validator
export const loginValidator = {
  type: 'object',

  required: ['email', 'password'],

  properties: {
    email: {
      type: 'string',
      format: 'email',
      minLength: 1,
      errorMessage: {
        type: 'Email must be a string.',
        format: 'Invalid email format.',
        minLength: 'Email is required.',
      },
    },

    password: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'Password must be a string.',
        minLength: 'Password is required.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      email: 'Email is required.',
      password: 'Password is required.',
    },
    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Email must be a string.',
        format: 'Invalid email format.',
      },
    },

    token: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'Token must be a string.',
        minLength: 'Token is required.',
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
    required: {
      email: 'Email is required.',
      token: 'Token is required.',
      password: 'Password is required.',
    },
    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Email must be a string.',
        format: 'Invalid email format.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      email: 'Email is required.',
    },
    additionalProperties: 'Extra fields are not allowed.',
  },
};
