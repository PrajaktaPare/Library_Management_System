import { query } from '../database/connection.js';
import { ApiError, DateHelper, EmailHelper } from '../utils/index.js';

class RequestService {
  // ─── DB helpers ─────────────────────────────────────────────────────
  static async _findRequestById(requestId) {
    const results = await query(
      `SELECT br.*, b.title, b.author, b.book_image, u.name AS student_name, u.username, u.email AS student_email
       FROM book_requests br JOIN books b ON br.book_id = b.id JOIN users u ON br.student_id = u.id WHERE br.id = ?`,
      [requestId]
    );
    return results.length > 0 ? results[0] : null;
  }

  static async _findBookById(bookId) {
    const results = await query('SELECT * FROM books WHERE id = ? AND is_active = TRUE', [bookId]);
    return results.length > 0 ? results[0] : null;
  }

  static async _findUserById(userId) {
    const results = await query(
      'SELECT id, username, email, name, phone, role, profile_image FROM users WHERE id = ?', [userId]
    );
    return results.length > 0 ? results[0] : null;
  }

  static async _createNotification(userId, type, title, message, relatedTable, relatedId) {
    await query(
      'INSERT INTO notifications (user_id, type, title, message, related_table, related_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, title, message, relatedTable, relatedId]
    );
  }

  // ─── Business logic ─────────────────────────────────────────────────
  static async requestBook(studentId, bookId) {
    const book = await this._findBookById(bookId);
    if (!book) throw ApiError.notFound('Book not found');
    if (book.available_copies <= 0) throw ApiError.badRequest('Book is not available');

    const existing = await query(
      `SELECT * FROM book_requests WHERE student_id = ? AND book_id = ? AND request_status IN ('pending', 'approved', 'issued')`,
      [studentId, bookId]
    );
    if (existing.length > 0) throw ApiError.conflict('You already have a pending request for this book');

    const activeCount = await query(
      `SELECT COUNT(*) as count FROM book_requests WHERE student_id = ? AND request_status IN ('pending', 'approved', 'issued')`,
      [studentId]
    );
    if (activeCount[0].count >= 5) throw ApiError.badRequest('You have reached the maximum number of active requests');

    const result = await query(
      `INSERT INTO book_requests (student_id, book_id, request_status) VALUES (?, ?, 'pending')`,
      [studentId, bookId]
    );
    await this._createNotification(studentId, 'book_requested', 'Book Request Submitted',
      `Your request for "${book.title}" has been submitted and is pending approval.`, 'book_requests', result.insertId);
    return await this._findRequestById(result.insertId);
  }

  static async getRequestById(requestId) {
    const request = await this._findRequestById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    return request;
  }

  static async getStudentRequests(studentId, pagination, filters = {}) {
    let sql = `SELECT br.*, b.title AS book_title, b.author AS book_author, b.book_image,
               br.issued_at AS issue_date, br.returned_at AS return_date
               FROM book_requests br JOIN books b ON br.book_id = b.id WHERE br.student_id = ?`;
    let countSql = 'SELECT COUNT(*) as count FROM book_requests WHERE student_id = ?';
    const values = [studentId]; const countValues = [studentId];

    if (filters.status) { sql += ' AND br.request_status = ?'; countSql += ' AND request_status = ?'; values.push(filters.status); countValues.push(filters.status); }
    sql += ' ORDER BY br.requested_at DESC LIMIT ? OFFSET ?';
    values.push(pagination.limit, pagination.offset);

    const requests = await query(sql, values);
    const countResult = await query(countSql, countValues);
    return { requests, total: countResult[0].count, page: pagination.page, limit: pagination.limit };
  }

  static async getAllRequests(pagination, filters = {}) {
    let sql = `SELECT br.*, b.title AS book_title, b.author AS book_author, b.book_image,
               u.name AS student_name, u.username, u.email AS student_email,
               br.issued_at AS issue_date, br.returned_at AS return_date
               FROM book_requests br JOIN books b ON br.book_id = b.id JOIN users u ON br.student_id = u.id WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as count FROM book_requests WHERE 1=1';
    const values = []; const countValues = [];

    if (filters.status) { sql += ' AND br.request_status = ?'; countSql += ' AND request_status = ?'; values.push(filters.status); countValues.push(filters.status); }
    if (filters.studentId) { sql += ' AND br.student_id = ?'; countSql += ' AND student_id = ?'; values.push(filters.studentId); countValues.push(filters.studentId); }
    sql += ' ORDER BY br.requested_at DESC LIMIT ? OFFSET ?';
    values.push(pagination.limit, pagination.offset);

    const requests = await query(sql, values);
    const countResult = await query(countSql, countValues);
    return { requests, total: countResult[0].count, page: pagination.page, limit: pagination.limit };
  }

  static async approveRequest(requestId, dueDate) {
    const request = await this._findRequestById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.request_status !== 'pending') throw ApiError.badRequest('Only pending requests can be approved');
    if (!dueDate) dueDate = DateHelper.formatDate(DateHelper.addDays(new Date(), 7));

    await query('UPDATE book_requests SET request_status = ?, approved_at = NOW(), due_date = ?, updated_at = NOW() WHERE id = ?', ['approved', dueDate, requestId]);
    await this._createNotification(request.student_id, 'book_approved', 'Book Request Approved',
      `Your request for "${request.title}" has been approved. Due date: ${dueDate}`, 'book_requests', requestId);
    return await this._findRequestById(requestId);
  }

  static async rejectRequest(requestId) {
    const request = await this._findRequestById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.request_status !== 'pending') throw ApiError.badRequest('Only pending requests can be rejected');

    await query('UPDATE book_requests SET request_status = ?, updated_at = NOW() WHERE id = ?', ['rejected', requestId]);
    await this._createNotification(request.student_id, 'book_rejected', 'Book Request Rejected',
      `Your request for "${request.title}" has been rejected.`, 'book_requests', requestId);
    return await this._findRequestById(requestId);
  }

  static async issueBook(requestId) {
    const request = await this._findRequestById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.request_status !== 'approved' && request.request_status !== 'pending')
      throw ApiError.badRequest('Only approved or pending requests can be issued');

    const updateResult = await query('UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0', [request.book_id]);
    if (updateResult.affectedRows === 0) throw ApiError.badRequest('Book is no longer available');

    const issueDate = new Date();
    const dueDate = DateHelper.formatDate(DateHelper.addDays(issueDate, 7));
    const issueDateStr = DateHelper.formatDate(issueDate);

    await query('UPDATE book_requests SET request_status = ?, issued_at = NOW(), due_date = ?, updated_at = NOW() WHERE id = ?', ['issued', dueDate, requestId]);
    await this._createNotification(request.student_id, 'book_issued', 'Book Issued',
      `"${request.title}" has been issued to you. Due date: ${dueDate}`, 'book_requests', requestId);

    const student = await this._findUserById(request.student_id);
    if (student && student.email) {
      EmailHelper.sendBookIssuedEmail(student.email, student.name, request.title, issueDateStr, dueDate)
        .catch(err => console.error('Issue email failed:', err.message));
    }
    return await this._findRequestById(requestId);
  }

  static async returnBook(requestId) {
    const request = await this._findRequestById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.request_status !== 'issued') throw ApiError.badRequest('Only issued books can be returned');

    let fineAmount = 0;
    if (request.due_date) {
      const dueDate = new Date(request.due_date);
      const today = new Date();
      if (today > dueDate) {
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * 5;
      }
    }

    await query('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [request.book_id]);
    await query('UPDATE book_requests SET request_status = ?, returned_at = NOW(), updated_at = NOW() WHERE id = ?', ['returned', requestId]);
    if (fineAmount > 0) await query('UPDATE book_requests SET fine_amount = ?, updated_at = NOW() WHERE id = ?', [fineAmount, requestId]);

    await this._createNotification(request.student_id, 'book_returned', 'Book Returned',
      `"${request.title}" has been successfully returned.${fineAmount > 0 ? ` Fine: ₹${fineAmount}` : ''}`, 'book_requests', requestId);
    return await this._findRequestById(requestId);
  }

  static async getOverdueBooks() {
    return await query(
      `SELECT br.*, b.title, u.name, u.email FROM book_requests br
       JOIN books b ON br.book_id = b.id JOIN users u ON br.student_id = u.id
       WHERE br.request_status = 'issued' AND br.due_date < CURDATE()`
    );
  }
}

export default RequestService;
