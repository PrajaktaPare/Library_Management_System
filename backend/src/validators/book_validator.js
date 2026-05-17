/* =========================================
   CREATE BOOK SCHEMA

   PURPOSE:
   Validate create book request body

   ROUTE:
   POST /books

   REQUIRED FIELDS:
   - title
   - author
   - isbn
   - category
   - total_copies

   RETURN:
   - validated request body
========================================= */
export const createBookValidator = {
  type: 'object',

  required: ['title', 'author', 'isbn', 'category', 'total_copies'],

  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      errorMessage: {
        type: 'Title must be a string',
        minLength: 'Title is required',
        maxLength: 'Title must be at most 255 characters',
      },
    },

    author: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      errorMessage: {
        type: 'Author must be a string',
        minLength: 'Author is required',
        maxLength: 'Author must be at most 100 characters',
      },
    },

    isbn: {
      type: 'string',
      maxLength: 20,
      errorMessage: {
        type: 'ISBN must be a string',
        maxLength: 'ISBN must be at most 20 characters',
      },
    },

    category: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      errorMessage: {
        type: 'Category must be a string',
        minLength: 'Category is required',
        maxLength: 'Category must be at most 50 characters',
      },
    },

    sub_category: {
      type: 'string',
      maxLength: 50,
      errorMessage: {
        type: 'Sub-category must be a string',
        maxLength: 'Sub-category must be at most 50 characters',
      },
    },

    total_copies: {
      type: 'integer',
      minimum: 1,
      errorMessage: {
        type: 'Total copies must be an integer',
        minimum: 'Total copies must be at least 1',
      },
    },

    available_copies: {
      type: 'integer',
      minimum: 0,
      errorMessage: {
        type: 'Available copies must be an integer',
        minimum: 'Available copies cannot be negative',
      },
    },

    book_image: {
      type: 'string',
      maxLength: 255,
      errorMessage: {
        type: 'Book image must be a string',
        maxLength: 'Book image path must be at most 255 characters',
      },
    },

    status: {
      type: 'string',
      enum: ['available', 'issued'],
      errorMessage: {
        type: 'Status must be a string',
        enum: 'Status must be either available or issued',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      title: 'Title is required',
      author: 'Author is required',
      category: 'Category is required',
      total_copies: 'Total copies is required',
    },

    additionalProperties: 'Extra fields are not allowed',
  },
};

/* =========================================
   UPDATE BOOK SCHEMA

   PURPOSE:
   Validate update book request body

   ROUTE:
   PATCH /books/:id

   RETURN:
   - validated request body
========================================= */
export const updateBookValidator = {
  type: 'object',

  minProperties: 1,

  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      errorMessage: {
        type: 'Title must be a string',
        minLength: 'Title cannot be empty',
        maxLength: 'Title must be at most 255 characters',
      },
    },

    author: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      errorMessage: {
        type: 'Author must be a string',
        minLength: 'Author cannot be empty',
        maxLength: 'Author must be at most 100 characters',
      },
    },

    isbn: {
      type: 'string',
      maxLength: 20,
      errorMessage: {
        type: 'ISBN must be a string',
        maxLength: 'ISBN must be at most 20 characters',
      },
    },

    category: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      errorMessage: {
        type: 'Category must be a string',
        minLength: 'Category cannot be empty',
        maxLength: 'Category must be at most 50 characters',
      },
    },

    sub_category: {
      type: 'string',
      maxLength: 50,
      errorMessage: {
        type: 'Sub-category must be a string',
        maxLength: 'Sub-category must be at most 50 characters',
      },
    },

    total_copies: {
      type: 'integer',
      minimum: 1,
      errorMessage: {
        type: 'Total copies must be an integer',
        minimum: 'Total copies must be at least 1',
      },
    },

    available_copies: {
      type: 'integer',
      minimum: 0,
      errorMessage: {
        type: 'Available copies must be an integer',
        minimum: 'Available copies cannot be negative',
      },
    },

    book_image: {
      type: 'string',
      maxLength: 255,
      errorMessage: {
        type: 'Book image must be a string',
        maxLength: 'Book image path must be at most 255 characters',
      },
    },

    status: {
      type: 'string',
      enum: ['available', 'issued'],
      errorMessage: {
        type: 'Status must be a string',
        enum: 'Status must be either available or issued',
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
   BOOK ID PARAM SCHEMA

   PURPOSE:
   Validate book id route parameter

   ROUTE:
   /books/:id

   RETURN:
   - validated request params
========================================= */
export const bookIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'string',

      pattern: '^[1-9]\\d*$',

      errorMessage: {
        type: 'Book ID must be a string',

        pattern: 'Book ID must be a valid positive integer',
      },
    },
  },

  errorMessage: {
    required: {
      id: 'Book ID is required',
    },
  },
};
