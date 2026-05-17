// book_controller.js

import logger from '../utils/logger.js';

import {
  createBookService,
  getBooksService,
  getBookByIdService,
  updateBookService,
  deleteBookService,
  getCategoriesService,
} from '../services/book_service.js';

/* =========================================
   FUNCTION: createBook

   PURPOSE:
   Create a new book (admin only)

   PARAMETER:
   - req.body : book data

   RETURN:
   - json response with created book
========================================= */
export const createBook = async (req, res) => {
  try {
    const book = await createBookService(req.body);

    return res.status(201).json({
      success_flag: true,
      message: 'BOOK_CREATED_SUCCESSFULLY',
      data: book,
    });
  } catch (error) {
    logger.error('CREATE BOOK CONTROLLER ERROR', error);

    if (error.message === 'ISBN_ALREADY_EXISTS') {
      return res.status(409).json({
        success_flag: false,
        message: 'ISBN_ALREADY_EXISTS',
      });
    }

    return res.status(500).json({
      success_flag: false,
      message: error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getAllBooks

   PURPOSE:
   Get all books with optional filters,
   search, sorting, and pagination

   QUERY PARAMS:
   - category     : filter by category
   - status       : filter by status (available | issued)
   - search       : search title, author, or ISBN
   - sortBy       : column to sort by
   - order        : ASC | DESC
   - page + limit : both required if either is provided

   RETURN:
   - paginated json response
========================================= */
export const getAllBooks = async (req, res) => {
  try {
    const { category, status, search, sortBy, order, page, limit } = req.query;

    // Filters
    const filters = {
      category,
      status,
      search,
    };

    // Pagination — both page and limit required if either provided
    const pagination = {
      limit: null,
      offset: null,
    };

    if (page || limit) {
      if (!page || !limit) {
        return res.status(400).json({
          success_flag: false,
          message: 'PAGE_AND_LIMIT_REQUIRED',
        });
      }

      if (isNaN(page) || isNaN(limit)) {
        return res.status(400).json({
          success_flag: false,
          message: 'PAGE_AND_LIMIT_MUST_BE_NUMBER',
        });
      }

      pagination.limit = Math.min(100, Math.max(1, Number(limit)));
      pagination.offset = (Math.max(1, Number(page)) - 1) * pagination.limit;
    }

    // Sorting
    const sorting = {
      sortBy,
      order,
    };

    const { books, total } = await getBooksService(
      filters,
      pagination,
      sorting
    );

    // Build response — include pagination block only when requested
    const responseData =
      pagination.limit !== null
        ? {
            books,
            pagination: {
              total,
              page: Math.max(1, Number(page)),
              limit: pagination.limit,
              total_pages: Math.ceil(total / pagination.limit),
            },
          }
        : { books, total };

    return res.status(200).json({
      success_flag: true,
      message: 'BOOKS_FETCHED_SUCCESSFULLY',
      data: responseData,
    });
  } catch (error) {
    logger.error('GET ALL BOOKS CONTROLLER ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getBookById

   PURPOSE:
   Get a single book by ID

   PARAMETER:
   - req.params.id : book ID

   RETURN:
   - json response with book data
========================================= */
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await getBookByIdService(id);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_FETCHED_SUCCESSFULLY',
      data: book,
    });
  } catch (error) {
    logger.error('GET BOOK BY ID CONTROLLER ERROR', error);

    if (error.message === 'BOOK_NOT_FOUND') {
      return res.status(404).json({
        success_flag: false,
        message: 'BOOK_NOT_FOUND',
      });
    }

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: updateBook

   PURPOSE:
   Update an existing book (admin only)

   PARAMETER:
   - req.params.id : book ID
   - req.body      : fields to update

   RETURN:
   - json response with updated book
========================================= */
export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_FIELDS_PROVIDED',
      });
    }

    const book = await updateBookService(id, req.body);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_UPDATED_SUCCESSFULLY',
      data: book,
    });
  } catch (error) {
    logger.error('UPDATE BOOK CONTROLLER ERROR', error);

    if (error.message === 'BOOK_NOT_FOUND') {
      return res.status(404).json({
        success_flag: false,
        message: 'BOOK_NOT_FOUND',
      });
    }

    if (error.message === 'ISBN_ALREADY_EXISTS') {
      return res.status(409).json({
        success_flag: false,
        message: 'ISBN_ALREADY_EXISTS',
      });
    }

    if (error.message === 'NO_VALID_FIELDS_PROVIDED') {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_VALID_FIELDS_PROVIDED',
      });
    }

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: deleteBook

   PURPOSE:
   Delete a book by ID (admin only)

   PARAMETER:
   - req.params.id : book ID

   RETURN:
   - json success response
========================================= */
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteBookService(id);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_DELETED_SUCCESSFULLY',
    });
  } catch (error) {
    logger.error('DELETE BOOK CONTROLLER ERROR', error);

    if (error.message === 'BOOK_NOT_FOUND') {
      return res.status(404).json({
        success_flag: false,
        message: 'BOOK_NOT_FOUND',
      });
    }

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getCategories

   PURPOSE:
   Get all distinct book categories

   RETURN:
   - json response with categories array
========================================= */
export const getCategories = async (req, res) => {
  try {
    const categories = await getCategoriesService();

    return res.status(200).json({
      success_flag: true,
      message: 'CATEGORIES_FETCHED_SUCCESSFULLY',
      data: categories,
    });
  } catch (error) {
    logger.error('GET CATEGORIES CONTROLLER ERROR', error);

    return res.status(500).json({
      success_flag: false,
      message: 'INTERNAL_SERVER_ERROR',
    });
  }
};
