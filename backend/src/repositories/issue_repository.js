const { query } = require('../database/connection');

class IssueRepository {
  static async createIssue(studentId, bookId, issueType, description, fineAmount = 0) {
    const sql = `
      INSERT INTO issues (student_id, book_id, issue_type, description, fine_amount, issue_status)
      VALUES (?, ?, ?, ?, ?, 'open')
    `;
    const result = await query(sql, [studentId, bookId, issueType, description, fineAmount]);
    return result.insertId;
  }

  static async findIssueById(issueId) {
    const sql = `
      SELECT i.*, b.title, u.name, u.username
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN users u ON i.student_id = u.id
      WHERE i.id = ?
    `;
    const results = await query(sql, [issueId]);
    return results.length > 0 ? results[0] : null;
  }

  static async findAllIssues(offset, limit, filters = {}) {
    let sql = `
      SELECT i.*, b.title, u.name, u.username
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN users u ON i.student_id = u.id
      WHERE 1=1
    `;
    const values = [];

    if (filters.status) {
      sql += ' AND i.issue_status = ?';
      values.push(filters.status);
    }

    if (filters.type) {
      sql += ' AND i.issue_type = ?';
      values.push(filters.type);
    }

    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    return await query(sql, values);
  }

  static async countIssues(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM issues WHERE 1=1';
    const values = [];

    if (filters.status) {
      sql += ' AND issue_status = ?';
      values.push(filters.status);
    }

    if (filters.type) {
      sql += ' AND issue_type = ?';
      values.push(filters.type);
    }

    const results = await query(sql, values);
    return results[0].count;
  }

  static async updateIssue(issueId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return true;

    if (updateData.issue_status === 'resolved' || updateData.issue_status === 'closed') {
      fields.push('resolved_at = NOW()');
    }

    fields.push('updated_at = NOW()');
    values.push(issueId);

    const sql = `UPDATE issues SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    return true;
  }
}

module.exports = IssueRepository;
