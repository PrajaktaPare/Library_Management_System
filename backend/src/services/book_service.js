// book_service.js

import pool from '../config/db.js';
import logger from '../utils/logger.js';

/* =========================================
   ALLOWED SORT COLUMNS WHITELIST
   Prevents SQL injection via sortBy param
========================================= */
const ALLOWED_SORT_COLUMNS = [
  'id',
  'title',
  'author',
  'category',
  'created_at',
  'available_copies',
];

const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];

/* =========================================
   FUNCTION: createBookRecord

   PURPOSE:
   Insert a new book into the database

   PARAMETER:
   - bookData

   RETURN:
   - insertId
========================================= */
export const createBookRecord = async bookData => {
  const [result] = await pool.execute(
    `
    INSERT INTO books
    (
      title,
      author,
      isbn,
      category,
      sub_category,
      total_copies,
      available_copies,
      book_image,
      status
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      bookData.title,
      bookData.author,
      bookData.isbn || null,
      bookData.category,
      bookData.sub_category || null,
      bookData.total_copies,
      bookData.available_copies ?? bookData.total_copies,
      bookData.book_image || null,
      bookData.status || 'available',
    ]
  );

  return result.insertId;
};

/* =========================================
   FUNCTION: findBookById

   PURPOSE:
   Fetch a single book by ID

   PARAMETER:
   - id

   RETURN:
   - book object or null
========================================= */
export const findBookById = async id => {
  const [rows] = await pool.execute(`SELECT * FROM books WHERE id = ?`, [id]);

  return rows[0] || null;
};

/* =========================================
   FUNCTION: findByISBN

   PURPOSE:
   Check if a book with the given ISBN exists

   PARAMETER:
   - isbn
   - excludeId (optional, for update checks)

   RETURN:
   - book object or null
========================================= */
export const findByISBN = async (isbn, excludeId = null) => {
  let sql = `SELECT * FROM books WHERE isbn = ?`;
  const values = [isbn];

  if (excludeId) {
    sql += ` AND id != ?`;
    values.push(excludeId);
  }

  const [rows] = await pool.execute(sql, values);

  return rows[0] || null;
};

/* =========================================
   FUNCTION: getAllBooksService

   PURPOSE:
   Fetch books with optional filters,
   search, sorting, and pagination.

   Mirrors the user service pattern:
   - Filters applied via LIKE or exact match
   - Pagination is optional (null = no limit)
   - Sorting is optional (default: created_at DESC)

   PARAMETER:
   - filters   : { category, status, search }
   - pagination: { limit, offset }  — null values = fetch all
   - sorting   : { sortBy, order }

   RETURN:
   - { books, total }
========================================= */
export const getAllBooksService = async (
  filters = {},
  pagination = {},
  sorting = {}
) => {
  let sql = `
    SELECT
      id,
      title,
      author,
      isbn,
      category,
      sub_category,
      total_copies,
      available_copies,
      book_image,
      status,
      created_at,
      updated_at
    FROM books
    WHERE 1=1
  `;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM books
    WHERE 1=1
  `;

  const values = [];
  const countValues = [];

  // Filter: category — exact match (like users.role_id exact)
  if (filters.category) {
    const clause = ` AND category = ?`;
    sql += clause;
    countSql += clause;
    values.push(filters.category);
    countValues.push(filters.category);
  }

  // Filter: status — exact match
  if (filters.status) {
    const clause = ` AND status = ?`;
    sql += clause;
    countSql += clause;
    values.push(filters.status);
    countValues.push(filters.status);
  }

  // Filter: search — LIKE across title, author, isbn
  // Mirrors how user service does LIKE on username/email/phone
  if (filters.search) {
    const clause = `
      AND (
        title  LIKE ?
        OR author LIKE ?
        OR isbn   LIKE ?
      )
    `;
    sql += clause;
    countSql += clause;

    const term = `%${filters.search}%`;
    values.push(term, term, term);
    countValues.push(term, term, term);
  }

  // Sorting — whitelisted to prevent SQL injection
  const sortBy = ALLOWED_SORT_COLUMNS.includes(sorting.sortBy)
    ? sorting.sortBy
    : 'created_at';

  const order = ALLOWED_SORT_ORDERS.includes(sorting.order?.toUpperCase())
    ? sorting.order.toUpperCase()
    : 'DESC';

  sql += ` ORDER BY ${sortBy} ${order}`;

  // Pagination — only applied when both limit and offset are provided
  // Matches user service: null = no limit, fetch all
  if (pagination.limit !== null && pagination.offset !== null) {
    sql += ` LIMIT ? OFFSET ?`;
    values.push(Number(pagination.limit), Number(pagination.offset));
  }

  const [books] = await pool.query(sql, values);
  const [countResult] = await pool.query(countSql, countValues);

  return {
    books,
    total: countResult[0].total,
  };
};

/* =========================================
   FUNCTION: updateBookRecord

   PURPOSE:
   Dynamically update allowed book fields

   PARAMETER:
   - id
   - updateData

   RETURN:
   - affectedRows
========================================= */
export const updateBookRecord = async (id, updateData) => {
  const ALLOWED_UPDATE_FIELDS = [
    'title',
    'author',
    'isbn',
    'category',
    'sub_category',
    'total_copies',
    'available_copies',
    'book_image',
    'status',
  ];

  if (updateData.available_copies !== undefined) {
    updateData.status =
      updateData.available_copies > 0 ? 'available' : 'issued';
  }

  const fields = [];
  const values = [];

  for (const key of Object.keys(updateData)) {
    if (!ALLOWED_UPDATE_FIELDS.includes(key)) continue;

    fields.push(`${key} = ?`);
    values.push(updateData[key]);
  }

  if (!fields.length) return 0;

  values.push(id);

  const [result] = await pool.execute(
    `UPDATE books SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows;
};

/* =========================================
   FUNCTION: deleteBookRecord

   PURPOSE:
   Hard delete a book by ID

   PARAMETER:
   - id

   RETURN:
   - affectedRows
========================================= */
export const deleteBookRecord = async id => {
  const [result] = await pool.execute(`DELETE FROM books WHERE id = ?`, [id]);

  return result.affectedRows;
};

/* =========================================
   FUNCTION: getDistinctCategories

   PURPOSE:
   Fetch all unique book categories

   RETURN:
   - string[]
========================================= */
export const getDistinctCategories = async () => {
  const [rows] = await pool.execute(
    `
    SELECT DISTINCT category
    FROM books
    ORDER BY category ASC
    `
  );

  return rows.map(r => r.category);
};

/* =========================================
   BUSINESS LOGIC
========================================= */

/* ─── createBookService ─── */
export const createBookService = async bookData => {
  try {
    // ISBN is required — always check for duplicates
    const existing = await findByISBN(bookData.isbn);
    if (existing) throw new Error('ISBN_ALREADY_EXISTS');

    // Auto-set status based on available_copies
    const availableCopies = bookData.available_copies ?? bookData.total_copies;
    bookData.status = availableCopies > 0 ? 'available' : 'issued';

    const insertId = await createBookRecord(bookData);
    const book = await findBookById(insertId);

    logger.info(`BOOK CREATED: ${book.title} (ID: ${insertId})`);

    return book;
  } catch (error) {
    logger.error('CREATE BOOK SERVICE ERROR', error);
    throw error;
  }
};

/* ─── getBooksService ─── */
export const getBooksService = async (
  filters = {},
  pagination = {},
  sorting = {}
) => {
  try {
    return await getAllBooksService(filters, pagination, sorting);
  } catch (error) {
    logger.error('GET BOOKS SERVICE ERROR', error);
    throw error;
  }
};

/* ─── getBookByIdService ─── */
export const getBookByIdService = async id => {
  try {
    const book = await findBookById(id);

    if (!book) throw new Error('BOOK_NOT_FOUND');

    return book;
  } catch (error) {
    logger.error('GET BOOK BY ID SERVICE ERROR', error);
    throw error;
  }
};

/* ─── updateBookService ─── */
export const updateBookService = async (id, updateData) => {
  try {
    const book = await findBookById(id);

    if (!book) throw new Error('BOOK_NOT_FOUND');

    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existing = await findByISBN(updateData.isbn, id);

      if (existing) throw new Error('ISBN_ALREADY_EXISTS');
    }

    const affectedRows = await updateBookRecord(id, updateData);

    if (affectedRows === 0) throw new Error('NO_VALID_FIELDS_PROVIDED');

    const updated = await findBookById(id);

    logger.info(`BOOK UPDATED: ID ${id}`);

    return updated;
  } catch (error) {
    logger.error('UPDATE BOOK SERVICE ERROR', error);
    throw error;
  }
};

/* ─── deleteBookService ─── */
export const deleteBookService = async id => {
  try {
    const book = await findBookById(id);

    if (!book) throw new Error('BOOK_NOT_FOUND');

    await deleteBookRecord(id);

    logger.info(`BOOK DELETED: ID ${id}`);

    return true;
  } catch (error) {
    logger.error('DELETE BOOK SERVICE ERROR', error);
    throw error;
  }
};

/* ─── getCategoriesService ─── */
export const getCategoriesService = async () => {
  try {
    return await getDistinctCategories();
  } catch (error) {
    logger.error('GET CATEGORIES SERVICE ERROR', error);
    throw error;
  }
};
