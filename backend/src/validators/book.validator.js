// allowed columns whitelist for safety
export const BOOK_COLUMNS = [
  'id',
  'title',
  'author',
  'book_num',
  'category',
  'sub_category',
  'total_copies',
  'available_copies',
  'status',
  'created_at',
  'updated_at',
];

// validate book id
export const bookIdValidator = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
    },
  },
  additionalProperties: false,
};

// create book validation
export const createBookValidator = {
  type: 'object',
  required: ['title', 'author', 'book_num', 'category'],
  properties: {
    title: { type: 'string', minLength: 1 },
    author: { type: 'string', minLength: 1 },
    book_num: { type: 'string', minLength: 1 },
    category: { type: 'string', minLength: 1 },
    sub_category: { type: 'string' },
    total_copies: { type: 'integer', minimum: 0 },
    available_copies: { type: 'integer', minimum: 0 },
    status: {
      type: 'string',
      enum: ['available', 'unavailable'],
    },
  },
  additionalProperties: false,
};

// patch validation
export const patchBookValidator = {
  type: 'object',
  minProperties: 1,
  properties: {
    title: { type: 'string' },
    author: { type: 'string' },
    book_num: { type: 'string' },
    category: { type: 'string' },
    sub_category: { type: 'string' },
    total_copies: { type: 'integer', minimum: 0 },
    available_copies: { type: 'integer', minimum: 0 },
    status: { type: 'string', enum: ['available', 'unavailable'] },
  },
  additionalProperties: false,
};