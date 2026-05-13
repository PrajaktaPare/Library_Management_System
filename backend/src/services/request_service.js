// Updated request service with email notifications, auto due date, and request deletion after issue
const { query } = require('../database/connection');
const { ApiError, DateHelper, EmailHelper } = require('../utils');
const BookService = require('./book_service');

class RequestService {
  // ─── Database helpers (formerly in RequestRepository) ───

  static async createRequestRecord(studentId, bookId) {
    const sql = `
      INSERT INTO book_requests (student_id, book_id, request_status)
      VALUES (?, ?, 'pending')
    `;
    const result = await query(sql, [studentId, bookId]);
    return result.insertId;
  }

  static async findRequestById(requestId) {
    const sql = `
      SELECT br.*, b.title, b.author, b.book_image, u.name AS student_name, u.username, u.email AS student_email
      FROM book_requests br
      JOIN books b ON br.book_id = b.id
      JOIN users u ON br.student_id = u.id
      WHERE br.id = ?
    `;
    const results = await query(sql, [requestId]);
    return results.length > 0 ? results[0] : null;
  }

  static async findRequestsByStudent(studentId, offset, limit, filters = {}) {
    let sql = `
      SELECT br.*, b.title AS book_title, b.author AS book_author, b.book_image,
             br.issued_at AS issue_date, br.returned_at AS return_date
      FROM book_requests br
      JOIN books b ON br.book_id = b.id
      WHERE br.student_id = ?
    `;
    const values = [studentId];

    if (filters.status) {
      sql += ' AND br.request_status = ?';
      values.push(filters.status);
    }

    sql += ' ORDER BY br.requested_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    return await query(sql, values);
  }

  static async findAllRequests(offset, limit, filters = {}) {
    let sql = `
      SELECT br.*, b.title AS book_title, b.author AS book_author, b.book_image,
             u.name AS student_name, u.username, u.email AS student_email,
             br.issued_at AS issue_date, br.returned_at AS return_date
      FROM book_requests br
      JOIN books b ON br.book_id = b.id
      JOIN users u ON br.student_id = u.id
      WHERE 1=1
    `;
    const values = [];

    if (filters.status) {
      sql += ' AND br.request_status = ?';
      values.push(filters.status);
    }

    if (filters.studentId) {
      sql += ' AND br.student_id = ?';
      values.push(filters.studentId);
    }

    sql += ' ORDER BY br.requested_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    return await query(sql, values);
  }

  static async countRequests(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM book_requests WHERE 1=1';
    const values = [];

    if (filters.status) {
      sql += ' AND request_status = ?';
      values.push(filters.status);
    }

    if (filters.studentId) {
      sql += ' AND student_id = ?';
      values.push(filters.studentId);
    }

    const results = await query(sql, values);
    return results[0].count;
  }

  static async updateRequestStatus(requestId, status, dueDate = null) {
    let sql = 'UPDATE book_requests SET request_status = ?';
    const values = [status];

    if (status === 'approved' && dueDate) {
      sql += ', approved_at = NOW(), due_date = ?';
      values.push(dueDate);
    } else if (status === 'issued') {
      sql += ', issued_at = NOW()';
      if (dueDate) {
        sql += ', due_date = ?';
        values.push(dueDate);
      }
    } else if (status === 'returned') {
      sql += ', returned_at = NOW()';
    }

    sql += ', updated_at = NOW() WHERE id = ?';
    values.push(requestId);

    await query(sql, values);
  }

  static async updateRequestRecord(requestId, updateData) {
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
    values.push(requestId);

    const sql = `UPDATE book_requests SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    return true;
  }

  static async findActiveRequestForStudentAndBook(studentId, bookId) {
    const sql = `
      SELECT * FROM book_requests
      WHERE student_id = ? AND book_id = ?
      AND request_status IN ('pending', 'approved', 'issued')
    `;
    const results = await query(sql, [studentId, bookId]);
    return results.length > 0 ? results[0] : null;
  }

  static async countActiveRequestsForStudent(studentId) {
    const sql = `
      SELECT COUNT(*) as count FROM book_requests
      WHERE student_id = ? AND request_status IN ('pending', 'approved', 'issued')
    `;
    const results = await query(sql, [studentId]);
    return results[0].count;
  }

  static async getOverdueRequests() {
    const sql = `
      SELECT br.*, b.title, u.name, u.email
      FROM book_requests br
      JOIN books b ON br.book_id = b.id
      JOIN users u ON br.student_id = u.id
      WHERE br.request_status = 'issued' AND br.due_date < CURDATE()
    `;
    return await query(sql);
  }

  static async deleteRequestRecord(requestId) {
    const sql = 'DELETE FROM book_requests WHERE id = ?';
    await query(sql, [requestId]);
  }

  // ─── Notification helper ───

  static async createNotification(userId, type, title, message, relatedTable, relatedId) {
    const sql = `
      INSERT INTO notifications (user_id, type, title, message, related_table, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [userId, type, title, message, relatedTable, relatedId]);
  }

  // ─── Auth helper ───

  static async findUserById(userId) {
    const sql = 'SELECT id, username, email, name, phone, role, profile_image, is_active, last_login, created_at FROM users WHERE id = ?';
    const results = await query(sql, [userId]);
    return results.length > 0 ? results[0] : null;
  }

  // ─── Business logic (service layer) ───

  static async requestBook(studentId, bookId) {
    // Check if book exists
    const book = await BookService.findBookById(bookId);
    if (!book) {
      throw ApiError.notFound('Book not found');
    }

    // Check if book is available
    if (book.available_copies <= 0) {
      throw ApiError.badRequest('Book is not available');
    }

    // Check if student already has active request for this book
    const existingRequest = await this.findActiveRequestForStudentAndBook(studentId, bookId);
    if (existingRequest) {
      throw ApiError.conflict('You already have a pending request for this book');
    }

    // Check max active requests limit
    const activeCount = await this.countActiveRequestsForStudent(studentId);
    if (activeCount >= 5) {
      throw ApiError.badRequest('You have reached the maximum number of active requests');
    }

    const requestId = await this.createRequestRecord(studentId, bookId);

    // Create notification for student
    await this.createNotification(
      studentId,
      'book_requested',
      'Book Request Submitted',
      `Your request for "${book.title}" has been submitted and is pending approval.`,
      'book_requests',
      requestId
    );

    return await this.findRequestById(requestId);
  }

  static async getRequestById(requestId) {
    const request = await this.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    return request;
  }

  static async getStudentRequests(studentId, pagination, filters = {}) {
    const requests = await this.findRequestsByStudent(studentId, pagination.offset, pagination.limit, filters);
    const total = await this.countRequests({ studentId, ...filters });

    return {
      requests,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async getAllRequests(pagination, filters = {}) {
    const requests = await this.findAllRequests(pagination.offset, pagination.limit, filters);
    const total = await this.countRequests(filters);

    return {
      requests,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async approveRequest(requestId, dueDate) {
    const request = await this.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'pending') {
      throw ApiError.badRequest('Only pending requests can be approved');
    }

    // Auto-set due date to 7 days from now if not provided
    if (!dueDate) {
      dueDate = DateHelper.formatDate(DateHelper.addDays(new Date(), 7));
    }

    await this.updateRequestStatus(requestId, 'approved', dueDate);

    // Create notification
    await this.createNotification(
      request.student_id,
      'book_approved',
      'Book Request Approved',
      `Your request for "${request.title}" has been approved. Due date: ${dueDate}`,
      'book_requests',
      requestId
    );

    return await this.findRequestById(requestId);
  }

  static async rejectRequest(requestId) {
    const request = await this.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'pending') {
      throw ApiError.badRequest('Only pending requests can be rejected');
    }

    await this.updateRequestStatus(requestId, 'rejected');

    // Create notification
    await this.createNotification(
      request.student_id,
      'book_rejected',
      'Book Request Rejected',
      `Your request for "${request.title}" has been rejected.`,
      'book_requests',
      requestId
    );

    return await this.findRequestById(requestId);
  }

  static async issueBook(requestId) {
    const request = await this.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'approved' && request.request_status !== 'pending') {
      throw ApiError.badRequest('Only approved or pending requests can be issued');
    }

    // Decrease available copies
    const updated = await BookService.decreaseAvailableCopies(request.book_id);
    if (!updated) {
      throw ApiError.badRequest('Book is no longer available');
    }

    // Auto-set due date to 7 days from now
    const issueDate = new Date();
    const dueDate = DateHelper.formatDate(DateHelper.addDays(issueDate, 7));
    const issueDateStr = DateHelper.formatDate(issueDate);

    await this.updateRequestStatus(requestId, 'issued', dueDate);

    // Create notification
    await this.createNotification(
      request.student_id,
      'book_issued',
      'Book Issued',
      `"${request.title}" has been issued to you. Due date: ${dueDate}`,
      'book_requests',
      requestId
    );

    // Send email notification to student
    const student = await this.findUserById(request.student_id);
    if (student && student.email) {
      EmailHelper.sendBookIssuedEmail(student.email, student.name, request.title, issueDateStr, dueDate)
        .catch(err => console.error('Issue email failed:', err.message));
    }

    return await this.findRequestById(requestId);
  }

  static async returnBook(requestId) {
    const request = await this.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'issued') {
      throw ApiError.badRequest('Only issued books can be returned');
    }

    // Calculate fine if overdue
    let fineAmount = 0;
    if (request.due_date) {
      const dueDate = new Date(request.due_date);
      const today = new Date();
      if (today > dueDate) {
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * 5; // ₹5 per day
      }
    }

    // Increase available copies
    await BookService.increaseAvailableCopies(request.book_id);
    await this.updateRequestStatus(requestId, 'returned');

    // Update fine if any
    if (fineAmount > 0) {
      await this.updateRequestRecord(requestId, { fine_amount: fineAmount });
    }

    // Create notification
    await this.createNotification(
      request.student_id,
      'book_returned',
      'Book Returned',
      `"${request.title}" has been successfully returned.${fineAmount > 0 ? ` Fine: ₹${fineAmount}` : ''}`,
      'book_requests',
      requestId
    );

    return await this.findRequestById(requestId);
  }

  static async getOverdueBooks() {
    return await this.getOverdueRequests();
  }
}

module.exports = RequestService;
