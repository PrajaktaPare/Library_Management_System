import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
ajvErrors(ajv);

/* =========================================
   USER ID PARAM SCHEMA

   Used by:
   - GET    /users/:id
   - PATCH  /users/:id
   - PUT    /users/:id
   - DELETE /users/:id

   Validates req.params.id:
   - must be a positive integer (as string, since URL params are always strings)
========================================= */
export const userIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {

    id: {
      type: 'string',
      pattern: '^[1-9]\\d*$',
      errorMessage: {
        type: 'User ID must be a string',
        pattern: 'User ID must be a valid positive integer',
      },
    },

  },

  errorMessage: {
    required: {
      id: 'User ID is required',
    },
  },
};

/* =========================================
   CREATE USER SCHEMA  (POST /users/)

   Used by admin to create a user directly.
   Email is included (unlike register, no email
   verification flow — admin sets user as active).

   Fields (all required):
   - name     : string, min 1 char
   - username : string, min 3 chars, no spaces
   - email    : valid email format
   - password : 6-10 chars, 1 uppercase, 1 digit, 1 special char
   - phone    : exactly 10 digits
   - role_id  : integer, min 1

   No extra fields allowed
========================================= */
export const createUserValidator = {
  type: 'object',

  required: [
    'name',
    'username',
    'email',
    'password',
    'phone',
    'role_id',
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

    role_id: {
      type: 'integer',
      minimum: 1,
      errorMessage: {
        type: 'Role ID must be an integer',
        minimum: 'Role ID must be at least 1',
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
      role_id: 'Role ID is required',
    },
    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   PUT USER SCHEMA  (PUT /users/:id)

   Full replacement — same fields as create.
   Also accepts is_active and is_verified
   since admin may want to control those.

   Fields (all required):
   - name        : string, min 1 char
   - username    : string, min 3 chars, no spaces
   - email       : valid email format
   - password    : 6-10 chars, 1 uppercase, 1 digit, 1 special char
   - phone       : exactly 10 digits
   - role_id     : integer, min 1
   - is_active   : 0 or 1
   - is_verified : 0 or 1

   No extra fields allowed
========================================= */
export const putUserValidator = {
  type: 'object',

  required: [
    'name',
    'username',
    'email',
    'password',
    'phone',
    'role_id',
    'is_active',
    'is_verified',
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

    role_id: {
      type: 'integer',
      minimum: 1,
      errorMessage: {
        type: 'Role ID must be an integer',
        minimum: 'Role ID must be at least 1',
      },
    },

    is_active: {
      type: 'integer',
      enum: [0, 1],
      errorMessage: {
        type: 'is_active must be 0 or 1',
        enum: 'is_active must be 0 or 1',
      },
    },

    is_verified: {
      type: 'integer',
      enum: [0, 1],
      errorMessage: {
        type: 'is_verified must be 0 or 1',
        enum: 'is_verified must be 0 or 1',
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
      role_id: 'Role ID is required',
      is_active: 'is_active is required',
      is_verified: 'is_verified is required',
    },
    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   PATCH USER SCHEMA  (PATCH /users/:id)

   Partial update — all fields optional,
   but at least one must be provided.

   Allowed fields (from controller allowedFields):
   - username    : string, min 3 chars, no spaces
   - email       : valid email format
   - name        : string, min 1 char
   - phone       : exactly 10 digits
   - role_id     : integer, min 1
   - is_active   : 0 or 1
   - is_verified : 0 or 1

   No extra fields allowed
========================================= */
export const patchUserValidator = {
  type: 'object',

  minProperties: 1,

  properties: {

    name: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'Name must be a string',
        minLength: 'Name cannot be empty',
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

    phone: {
      type: 'string',
      pattern: '^\\d{10}$',
      errorMessage: {
        type: 'Phone must be a string',
        pattern: 'Phone number must be exactly 10 digits',
      },
    },

    role_id: {
      type: 'integer',
      minimum: 1,
      errorMessage: {
        type: 'Role ID must be an integer',
        minimum: 'Role ID must be at least 1',
      },
    },

    is_active: {
      type: 'integer',
      enum: [0, 1],
      errorMessage: {
        type: 'is_active must be 0 or 1',
        enum: 'is_active must be 0 or 1',
      },
    },

    is_verified: {
      type: 'integer',
      enum: [0, 1],
      errorMessage: {
        type: 'is_verified must be 0 or 1',
        enum: 'is_verified must be 0 or 1',
      },
    },

  },

  additionalProperties: false,

  errorMessage: {
    minProperties: 'At least one field must be provided',
    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   UPDATE PROFILE SCHEMA  (PATCH /users/profile/me)

   Logged-in user can only update their own
   name and phone — nothing else.

   Allowed fields:
   - name  : string, min 1 char (optional)
   - phone : exactly 10 digits  (optional)

   At least one must be provided.
   No extra fields allowed.
========================================= */
export const updateProfileValidator = {
  type: 'object',

  minProperties: 1,

  properties: {

    name: {
      type: 'string',
      minLength: 1,
      errorMessage: {
        type: 'Name must be a string',
        minLength: 'Name cannot be empty',
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
    minProperties: 'At least one field (name or phone) must be provided',
    additionalProperties: 'Only name and phone can be updated',
  },
};

/* =========================================
   COMPILED VALIDATORS
========================================= */
export const validateUserId        = ajv.compile(userIdValidator);
export const validateCreateUser    = ajv.compile(createUserValidator);
export const validatePutUser       = ajv.compile(putUserValidator);
export const validatePatchUser     = ajv.compile(patchUserValidator);
export const validateUpdateProfile = ajv.compile(updateProfileValidator);