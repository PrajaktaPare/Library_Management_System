import { query } from '../database/connection.js';
import { ApiError } from '../utils/index.js';

class BookService {
  // ─── DB helpers (previously in BookRepository) ──────────────────────
  static async _findBookById(bookId) {
    const results = await query('SELECT * FROM books WHERE id = ? AND is_active = TRUE', [bookId]);
    return results.length > 0 ? results[0] : null;
  }

  static async _findByISBN(isbn) {
    const results = await query('SELECT * FROM books WHERE isbn = ? AND is_active = TRUE', [isbn]);
    return results.length > 0 ? results[0] : null;
  }

  // ─── Business logic ─────────────────────────────────────────────────
  static async createBook(bookData) {
    if (bookData.isbn) {
      const existing = await this._findByISBN(bookData.isbn);
      if (existing) throw ApiError.conflict('A book with this ISBN already exists');
    }
    const result = await query(
      'INSERT INTO books (title, author, isbn, category, sub_category, total_copies, available_copies, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [bookData.title, bookData.author, bookData.isbn || null, bookData.category, bookData.sub_category || null, bookData.total_copies, bookData.available_copies || bookData.total_copies, bookData.status || 'available']
    );
    return await this._findBookById(result.insertId);
  }

  static async getBooks(pagination, filters = {}) {
    let sql = 'SELECT * FROM books WHERE is_active = TRUE';
    let countSql = 'SELECT COUNT(*) as count FROM books WHERE is_active = TRUE';
    const values = [];
    const countValues = [];

    if (filters.category) { sql += ' AND category = ?'; countSql += ' AND category = ?'; values.push(filters.category); countValues.push(filters.category); }
    if (filters.status) { sql += ' AND status = ?'; countSql += ' AND status = ?'; values.push(filters.status); countValues.push(filters.status); }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      sql += ' AND (title LIKE ? OR author LIKE ?)'; countSql += ' AND (title LIKE ? OR author LIKE ?)';
      values.push(searchTerm, searchTerm); countValues.push(searchTerm, searchTerm);
    }

    sql += ' LIMIT ? OFFSET ?';
    values.push(pagination.limit, pagination.offset);

    const books = await query(sql, values);
    const countResult = await query(countSql, countValues);
    return { books, total: countResult[0].count, page: pagination.page, limit: pagination.limit };
  }

  static async getBookById(bookId) {
    const book = await this._findBookById(bookId);
    if (!book) throw ApiError.notFound('Book not found');
    return book;
  }

  static async updateBook(bookId, updateData) {
    const book = await this._findBookById(bookId);
    if (!book) throw ApiError.notFound('Book not found');
    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existing = await this._findByISBN(updateData.isbn);
      if (existing) throw ApiError.conflict('A book with this ISBN already exists');
    }
    const fields = []; const values = [];
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') { fields.push(`${key} = ?`); values.push(updateData[key]); }
    });
    if (fields.length > 0) {
      fields.push('updated_at = NOW()'); values.push(bookId);
      await query(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return await this._findBookById(bookId);
  }

  static async deleteBook(bookId) {
    const book = await this._findBookById(bookId);
    if (!book) throw ApiError.notFound('Book not found');
    await query('UPDATE books SET is_active = FALSE WHERE id = ?', [bookId]);
    return true;
  }

  static async getCategories() {
    return await query('SELECT DISTINCT category FROM books WHERE is_active = TRUE ORDER BY category');
  }

  static async searchBooks(searchTerm, pagination, filters = {}) {
    filters.search = searchTerm;
    return await this.getBooks(pagination, filters);
  }
}

export default BookService;
