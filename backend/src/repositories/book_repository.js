const { query } = require('../database/connection');

class BookRepository {
  static async createBook(bookData) {
    const sql = `
      INSERT INTO books (title, author, isbn, category, sub_category, total_copies, available_copies, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      bookData.title,
      bookData.author,
      bookData.isbn || null,
      bookData.category,
      bookData.sub_category || null,
      bookData.total_copies,
      bookData.available_copies || bookData.total_copies,
      bookData.status || 'available'
    ];
    const result = await query(sql, values);
    return result.insertId;
  }

  static async findBookById(bookId) {
    const sql = 'SELECT * FROM books WHERE id = ? AND is_active = TRUE';
    const results = await query(sql, [bookId]);
    return results.length > 0 ? results[0] : null;
  }

  static async findAllBooks(offset, limit, filters = {}) {
    let sql = 'SELECT * FROM books WHERE is_active = TRUE';
    const values = [];

    if (filters.category) {
      sql += ' AND category = ?';
      values.push(filters.category);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters.search) {
      sql += ' AND (title LIKE ? OR author LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm);
    }

    sql += ' LIMIT ? OFFSET ?';
    values.push(limit, offset);

    return await query(sql, values);
  }

  static async countBooks(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM books WHERE is_active = TRUE';
    const values = [];

    if (filters.category) {
      sql += ' AND category = ?';
      values.push(filters.category);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters.search) {
      sql += ' AND (title LIKE ? OR author LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm);
    }

    const results = await query(sql, values);
    return results[0].count;
  }

  static async updateBook(bookId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return true;

    fields.push('updated_at = NOW()');
    values.push(bookId);

    const sql = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    return true;
  }

  static async deleteBook(bookId) {
    const sql = 'UPDATE books SET is_active = FALSE WHERE id = ?';
    await query(sql, [bookId]);
    return true;
  }

  static async findByISBN(isbn) {
    const sql = 'SELECT * FROM books WHERE isbn = ? AND is_active = TRUE';
    const results = await query(sql, [isbn]);
    return results.length > 0 ? results[0] : null;
  }

  static async getCategories() {
    const sql = 'SELECT DISTINCT category FROM books WHERE is_active = TRUE ORDER BY category';
    return await query(sql);
  }

  static async decreaseAvailableCopies(bookId) {
    const sql = 'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0';
    const result = await query(sql, [bookId]);
    return result.affectedRows > 0;
  }

  static async increaseAvailableCopies(bookId) {
    const sql = 'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?';
    const result = await query(sql, [bookId]);
    return result.affectedRows > 0;
  }
}

module.exports = BookRepository;
