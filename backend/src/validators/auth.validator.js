import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';

// Create AJV instance for JSON schema validation
const ajv = new Ajv({
  allErrors: true, // Return all validation errors instead of stopping at first error
});

// Add support for formats like email
addFormats(ajv);

// Add support for custom validation error messages
ajvErrors(ajv);

/*
Function Info:
  Validation schema for user registration request body

Parameters Purpose:
  - first_name: user first name
  - last_name: user last name
  - email: user email address
  - password: secure account password
  - phone: user mobile number

Returns:
  - AJV JSON validation schema object
*/

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
