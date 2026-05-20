// Import AJV library for JSON schema validation
import Ajv from 'ajv';

// Import AJV format validators like email, uri, date
import addFormats from 'ajv-formats';

// Import custom error message support for AJV
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
export const registerValidator = {
  type: 'object',

  // Required fields for registration
  required: ['first_name', 'last_name', 'email', 'password', 'phone'],

  properties: {
    first_name: {
      type: 'string',

      minLength: 1, // Prevent empty first name

      errorMessage: {
        type: 'FIRST_NAME_MUST_BE_STRING',

        minLength: 'FIRST_NAME_REQUIRED',
      },
    },

    last_name: {
      type: 'string',

      minLength: 1, // Prevent empty last name

      errorMessage: {
        type: 'LAST_NAME_MUST_BE_STRING',

        minLength: 'LAST_NAME_REQUIRED',
      },
    },

    email: {
      type: 'string',

      format: 'email', // Validate email format

      // Extra regex validation for email structure
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',

      errorMessage: {
        type: 'EMAIL_MUST_BE_STRING',

        format: 'INVALID_EMAIL_FORMAT',

        pattern: 'INVALID_EMAIL_PATTERN',
      },
    },

    password: {
      type: 'string',

      // Password rules:
      // - At least 1 uppercase letter
      // - At least 1 number
      // - At least 1 special character
      // - Length between 8 and 10 characters
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,10}$',

      errorMessage: {
        type: 'PASSWORD_MUST_BE_STRING',

        pattern: 'PASSWORD_MUST_BE_8_TO_10_CHARACTERS_WITH_UPPERCASE_NUMBER_AND_SPECIAL_CHARACTER',
      },
    },

    phone: {
      type: 'string',

      minLength: 10, // Minimum 10 digits required

      maxLength: 10, // Maximum 10 digits allowed

      // Allow digits only
      pattern: '^[0-9]+$',

      errorMessage: {
        type: 'PHONE_MUST_BE_STRING',

        minLength: 'PHONE_MUST_BE_10_DIGITS',

        maxLength: 'PHONE_MUST_BE_10_DIGITS',

        pattern: 'PHONE_MUST_CONTAIN_ONLY_DIGITS',
      },
    },
  },

  // Prevent extra unwanted fields in request body
  additionalProperties: false,

  errorMessage: {
    required: {
      first_name: 'FIRST_NAME_REQUIRED',

      last_name: 'LAST_NAME_REQUIRED',

      email: 'EMAIL_REQUIRED',

      password: 'PASSWORD_REQUIRED',

      phone: 'PHONE_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/*
Function Info:
  Validation schema for login request body

Parameters Purpose:
  - email: registered user email
  - password: account password

Returns:
  - AJV JSON validation schema object
*/
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
