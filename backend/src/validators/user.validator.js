//user id validator schema
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
  errorMessage: {
    required: {
      id: 'INVALID_USER_ID',
    },
  },
};

//create user validator schema
export const createUserValidator = {
  type: 'object',
  required: ['first_name', 'last_name', 'email', 'password', 'phone'],
  properties: {
    first_name: {
      type: 'string',
      minLength: 1,
    },
    last_name: {
      type: 'string',
      minLength: 1,
    },
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',
    },
    phone: {
      type: 'string',
      pattern: '^\\d{10}$',
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
    },
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

//update profile validator schema
export const updateProfileValidator = {
  type: 'object',
  properties: {
    first_name: {
      type: 'string',
      minLength: 1,
    },
    last_name: {
      type: 'string',
      minLength: 1,
    },
    phone: {
      type: 'string',
      pattern: '^\\d{10}$',
    },
  },
  additionalProperties: false,
  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

//patch user validator schema
export const patchUserValidator = {
  type: 'object',
  properties: {
    first_name: {
      type: 'string',
      minLength: 1,
    },
    last_name: {
      type: 'string',
      minLength: 1,
    },
    password: {
      type: 'string',
      pattern: '^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,10}$',
    },
    phone: {
      type: 'string',
      pattern: '^\\d{10}$',
    },
  },
  additionalProperties: false,
  errorMessage: {
    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};
