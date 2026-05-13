const { query } = require('../database/connection');

class RequestRepository {
  static async createRequest(studentId, bookId) {
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

  static async updateRequest(requestId, updateData) {
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

  static async deleteRequest(requestId) {
    const sql = 'DELETE FROM book_requests WHERE id = ?';
    await query(sql, [requestId]);
  }
}

module.exports = RequestRepository;
