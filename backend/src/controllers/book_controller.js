const { BookService } = require('../services');
const { ApiResponse, asyncHandler, PaginationHelper } = require('../utils');

class BookController {
  static createBook = asyncHandler(async (req, res) => {
    const result = await BookService.createBook(req.body);
    res.status(201).json(ApiResponse.created('Book created successfully', result));
  });

  static getBooks = asyncHandler(async (req, res) => {
    const pagination = PaginationHelper.getPaginationParams(req.query);
    const filters = {
      category: req.query.category,
      status: req.query.status,
      search: req.query.search
    };

    const result = await BookService.getBooks(pagination, filters);
    res.status(200).json(ApiResponse.paginated('Books retrieved', result.books, result.total, pagination.page, pagination.limit));
  });

  static getBookById = asyncHandler(async (req, res) => {
    const result = await BookService.getBookById(req.params.id);
    res.status(200).json(ApiResponse.ok('Book retrieved', result));
  });

  static updateBook = asyncHandler(async (req, res) => {
    const result = await BookService.updateBook(req.params.id, req.body);
    res.status(200).json(ApiResponse.ok('Book updated successfully', result));
  });

  static deleteBook = asyncHandler(async (req, res) => {
    await BookService.deleteBook(req.params.id);
    res.status(200).json(ApiResponse.ok('Book deleted successfully'));
  });

  static getCategories = asyncHandler(async (req, res) => {
    const result = await BookService.getCategories();
    res.status(200).json(ApiResponse.ok('Categories retrieved', result));
  });

  static searchBooks = asyncHandler(async (req, res) => {
    const pagination = PaginationHelper.getPaginationParams(req.query);
    const filters = {
      category: req.query.category,
      status: req.query.status
    };

    const result = await BookService.searchBooks(req.query.search, pagination, filters);
    res.status(200).json(ApiResponse.paginated('Books found', result.books, result.total, pagination.page, pagination.limit));
  });
}

module.exports = BookController;
