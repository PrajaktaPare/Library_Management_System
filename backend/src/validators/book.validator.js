export const getBooksValidator = {
  type: 'object',

  properties: {
    filter: {
      type: 'string',

      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,

          errorMessage: {
            type: 'Limit must be a number.',
            minimum: 'Limit must be at least 1.',
            maximum: 'Limit must not exceed 100.',
          },
        },

        offset: {
          type: 'integer',
          minimum: 0,

          errorMessage: {
            type: 'Offset must be a number.',
            minimum: 'Offset cannot be negative.',
          },
        },

        order: {
          type: 'object',

          properties: {
            column: {
              type: 'string',

              errorMessage: {
                type: 'Column must be a string.',
              },
            },

            direction: {
              type: 'string',
              enum: ['ASC', 'DESC'],

              errorMessage: {
                type: 'Direction must be a string.',
                enum: 'Order direction must be ASC or DESC.',
              },
            },
          },

          additionalProperties: false,

          errorMessage: {
            additionalProperties: 'Invalid order field provided.',
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
                      type: 'Like value must be a string.',
                    },
                  },
                },

                additionalProperties: false,

                errorMessage: {
                  additionalProperties: 'Invalid where condition provided.',
                },
              },
            ],
          },

          errorMessage: {
            type: 'Where filter must be an object.',
          },
        },
      },

      additionalProperties: false,

      errorMessage: {
        additionalProperties: 'Invalid filter field provided.',
      },
    },
  },

  additionalProperties: true,
};

/* ---------------- BOOK ID VALIDATOR ---------------- */

export const bookIdValidator = {
  type: 'object',

  required: ['id'],

  properties: {
    id: {
      type: 'integer',
      minimum: 1,

      errorMessage: {
        type: 'Book ID must be a number.',
        minimum: 'Invalid book ID.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      id: 'Book ID is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Title must be a string.',
        minLength: 'Title is required.',
      },
    },

    author: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'Author must be a string.',
        minLength: 'Author is required.',
      },
    },

    book_num: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'Book number must be a string.',
        minLength: 'Book number is required.',
      },
    },

    category: {
      type: 'string',
      minLength: 1,

      errorMessage: {
        type: 'Category must be a string.',
        minLength: 'Category is required.',
      },
    },

    sub_category: {
      type: 'string',

      errorMessage: {
        type: 'Sub category must be a string.',
      },
    },

    total_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'Total copies must be a number.',
        minimum: 'Total copies cannot be negative.',
      },
    },

    available_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'Available copies must be a number.',
        minimum: 'Available copies cannot be negative.',
      },
    },
    status: {
      type: 'string',
      enum: ['available', 'unavailable'],
      minLength: 1,
      errorMessage: {
        type: 'Status must be a string.',
        enum: 'Invalid status.',
        minlength: 'Status ir required.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    required: {
      title: 'Title is required.',
      author: 'Author is required.',
      book_num: 'Book number is required.',
      category: 'Category is required.',
    },

    additionalProperties: 'Extra fields are not allowed.',
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
        type: 'Title must be a string.',
      },
    },

    author: {
      type: 'string',

      errorMessage: {
        type: 'Author must be a string.',
      },
    },

    book_num: {
      type: 'string',

      errorMessage: {
        type: 'Book number must be a string.',
      },
    },

    category: {
      type: 'string',

      errorMessage: {
        type: 'Category must be a string.',
      },
    },

    sub_category: {
      type: 'string',

      errorMessage: {
        type: 'Sub category must be a string.',
      },
    },

    total_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'Total copies must be a number.',
        minimum: 'Total copies cannot be negative.',
      },
    },

    available_copies: {
      type: 'integer',
      minimum: 0,

      errorMessage: {
        type: 'Available copies must be a number.',
        minimum: 'Available copies cannot be negative.',
      },
    },

    status: {
      type: 'string',
      enum: ['available', 'unavailable'],

      errorMessage: {
        type: 'Status must be a string.',
        enum: 'Invalid book status.',
      },
    },
  },

  additionalProperties: false,

  errorMessage: {
    minProperties: 'At least one field is required.',
    additionalProperties: 'Extra fields are not allowed.',
  },
};
