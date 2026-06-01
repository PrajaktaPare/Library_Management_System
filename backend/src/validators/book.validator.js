
/* ---------------- BOOK ID VALIDATOR ---------------- */

export const bookIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'BOOK_ID_MUST_BE_INTEGER',
        minimum: 'INVALID_BOOK_ID',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'BOOK_ID_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- CREATE BOOK VALIDATOR ---------------- */

export const createBookValidator = {
  type: 'object',

  required: ['title', 'author', 'book_num', 'category'],

  properties: {
    title: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'TITLE_MUST_BE_STRING',
        minLength: 'TITLE_REQUIRED',
      },
    },

    author: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'AUTHOR_MUST_BE_STRING',
        minLength: 'AUTHOR_REQUIRED',
      },
    },

    book_num: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'BOOK_NUMBER_MUST_BE_STRING',
        minLength: 'BOOK_NUMBER_REQUIRED',
      },
    },

    category: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'CATEGORY_MUST_BE_STRING',
        minLength: 'CATEGORY_REQUIRED',
      },
    },

    sub_category: {
      type: 'string',

      errorMessage: {
        type: 'SUB_CATEGORY_MUST_BE_STRING',
      },
    },

    total_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'TOTAL_COPIES_MUST_BE_INTEGER',
        minimum: 'TOTAL_COPIES_CANNOT_BE_NEGATIVE',
      },
    },

    available_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'AVAILABLE_COPIES_MUST_BE_INTEGER',
        minimum: 'AVAILABLE_COPIES_CANNOT_BE_NEGATIVE',
      },
    },

    status: {
      type: 'string',
      enum: ['available', 'unavailable'],

      errorMessage: {
        type: 'STATUS_MUST_BE_STRING',
        enum: 'INVALID_BOOK_STATUS',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      title: 'TITLE_REQUIRED',
      author: 'AUTHOR_REQUIRED',
      book_num: 'BOOK_NUMBER_REQUIRED',
      category: 'CATEGORY_REQUIRED',
    },

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};

/* ---------------- PATCH BOOK VALIDATOR ---------------- */

export const patchBookValidator = {
  type: 'object',

  minProperties: 1,

  properties: {
    title: {
      type: 'string',

      errorMessage: {
        type: 'TITLE_MUST_BE_STRING',
      },
    },

    author: {
      type: 'string',

      errorMessage: {
        type: 'AUTHOR_MUST_BE_STRING',
      },
    },

    book_num: {
      type: 'string',

      errorMessage: {
        type: 'BOOK_NUMBER_MUST_BE_STRING',
      },
    },

    category: {
      type: 'string',

      errorMessage: {
        type: 'CATEGORY_MUST_BE_STRING',
      },
    },

    sub_category: {
      type: 'string',

      errorMessage: {
        type: 'SUB_CATEGORY_MUST_BE_STRING',
      },
    },

    total_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'TOTAL_COPIES_MUST_BE_INTEGER',
        minimum: 'TOTAL_COPIES_CANNOT_BE_NEGATIVE',
      },
    },

    available_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'AVAILABLE_COPIES_MUST_BE_INTEGER',
        minimum: 'AVAILABLE_COPIES_CANNOT_BE_NEGATIVE',
      },
    },

    status: {
      type: 'string',
      enum: ['available', 'unavailable'],

      errorMessage: {
        type: 'STATUS_MUST_BE_STRING',
        enum: 'INVALID_BOOK_STATUS',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    minProperties: 'AT_LEAST_ONE_FIELD_REQUIRED',

    additionalProperties: 'EXTRA_FIELDS_NOT_ALLOWED',
  },
};
