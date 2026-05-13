const { BookRepository } = require('../repositories');
const { ApiError } = require('../utils');

class BookService {
  static async createBook(bookData) {
    // Check if ISBN already exists
    if (bookData.isbn) {
      const existingBook = await BookRepository.findByISBN(bookData.isbn);
      if (existingBook) {
        throw ApiError.conflict('A book with this ISBN already exists');
      }
    }

    const bookId = await BookRepository.createBook(bookData);
    return await BookRepository.findBookById(bookId);
  }

  static async getBooks(pagination, filters = {}) {
    const books = await BookRepository.findAllBooks(pagination.offset, pagination.limit, filters);
    const total = await BookRepository.countBooks(filters);

    return {
      books,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async getBookById(bookId) {
    const book = await BookRepository.findBookById(bookId);
    
    if (!book) {
      throw ApiError.notFound('Book not found');
    }

    return book;
  }

  static async updateBook(bookId, updateData) {
    const book = await BookRepository.findBookById(bookId);
    
    if (!book) {
      throw ApiError.notFound('Book not found');
    }

    // If ISBN is being updated, check if it's unique
    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existingBook = await BookRepository.findByISBN(updateData.isbn);
      if (existingBook) {
        throw ApiError.conflict('A book with this ISBN already exists');
      }
    }

    await BookRepository.updateBook(bookId, updateData);
    return await BookRepository.findBookById(bookId);
  }

  static async deleteBook(bookId) {
    const book = await BookRepository.findBookById(bookId);
    
    if (!book) {
      throw ApiError.notFound('Book not found');
    }

    await BookRepository.deleteBook(bookId);
    return true;
  }

  static async getCategories() {
    return await BookRepository.getCategories();
  }

  static async searchBooks(searchTerm, pagination, filters = {}) {
    filters.search = searchTerm;
    return await this.getBooks(pagination, filters);
  }
}

module.exports = BookService;
