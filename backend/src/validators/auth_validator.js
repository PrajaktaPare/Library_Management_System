import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
ajvErrors(ajv);

/* =========================================
   REGISTER SCHEMA

   Fields (all required):
   - name     : string, min 1 char
   - username : string, min 3 chars, no spaces
   - email    : valid email format
   - password : 6-10 chars, 1 uppercase, 1 digit, 1 special char
   - phone    : exactly 10 digits

   No extra fields allowed
========================================= */
export const registerValidator = {
  type: 'object',

  required: [
    'name',
    'username',
    'email',
    'password',
    'phone',
  ],

  properties: {

    name: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'Name must be a string',
        minLength: 'Name is required',
      },
    },

    username: {
      type: 'string',
      minLength: 3,
      pattern: '^\\S+$',
      errorMessage: {
        type: 'Username must be a string',
        minLength: 'Username must be at least 3 characters',
        pattern: 'Username cannot contain spaces',
      },
    },

    email: {
      type: 'string',
      format: 'email',
      errorMessage: {
        type: 'Email must be a string',
        format: 'Enter a valid email address',
      },
    },

    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',
      errorMessage: {
        type: 'Password must be a string',
        pattern:
          'Password must be 6-10 characters and include at least one uppercase letter, one number, and one special character (@$!%*?&)',
      },
    },

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',
      errorMessage: {
        type: 'Phone must be a string',
        pattern: 'Phone number must be exactly 10 digits',
      },
    },

  },

  additionalProperties: false,

  errorMessage: {
    required: {
      name: 'Name is required',
      username: 'Username is required',
      email: 'Email is required',
      password: 'Password is required',
      phone: 'Phone number is required',
    },
    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   LOGIN SCHEMA

   Fields (all required):
   - username : non-empty string
   - password : non-empty string

   No extra fields allowed
========================================= */
export const loginValidator = {
  type: 'object',

  required: [
    'username',
    'password',
  ],

  properties: {

    username: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'Username must be a string',
        minLength: 'Username is required',
      },
    },

    password: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'Password must be a string',
        minLength: 'Password is required',
      },
    },

  },

  additionalProperties: false,

  errorMessage: {
    required: {
      username: 'Username is required',
      password: 'Password is required',
    },
    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   COMPILED VALIDATORS
========================================= */
export const validateRegister = ajv.compile(registerValidator);
export const validateLogin    = ajv.compile(loginValidator);