import { query } from '../database/connection.js';
import { ApiError } from '../utils/index.js';

class IssueService {
  static async createIssue(studentId, bookId, issueType, description, fineAmount = 0) {
    const result = await query(
      `INSERT INTO issues (student_id, book_id, issue_type, description, fine_amount, issue_status) VALUES (?, ?, ?, ?, ?, 'open')`,
      [studentId, bookId, issueType, description, fineAmount]
    );
    return await this._findIssueById(result.insertId);
  }

  static async _findIssueById(issueId) {
    const results = await query(
      `SELECT i.*, b.title, u.name, u.username FROM issues i
       JOIN books b ON i.book_id = b.id JOIN users u ON i.student_id = u.id WHERE i.id = ?`,
      [issueId]
    );
    return results.length > 0 ? results[0] : null;
  }

  static async getIssueById(issueId) {
    const issue = await this._findIssueById(issueId);
    if (!issue) throw ApiError.notFound('Issue not found');
    return issue;
  }

  static async getAllIssues(pagination, filters = {}) {
    let sql = `SELECT i.*, b.title, u.name, u.username FROM issues i
       JOIN books b ON i.book_id = b.id JOIN users u ON i.student_id = u.id WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as count FROM issues WHERE 1=1';
    const values = []; const countValues = [];

    if (filters.status) { sql += ' AND i.issue_status = ?'; countSql += ' AND issue_status = ?'; values.push(filters.status); countValues.push(filters.status); }
    if (filters.type) { sql += ' AND i.issue_type = ?'; countSql += ' AND issue_type = ?'; values.push(filters.type); countValues.push(filters.type); }

    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    values.push(pagination.limit, pagination.offset);

    const issues = await query(sql, values);
    const countResult = await query(countSql, countValues);
    return { issues, total: countResult[0].count, page: pagination.page, limit: pagination.limit };
  }

  static async updateIssue(issueId, updateData) {
    const issue = await this._findIssueById(issueId);
    if (!issue) throw ApiError.notFound('Issue not found');

    const fields = []; const values = [];
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') { fields.push(`${key} = ?`); values.push(updateData[key]); }
    });
    if (fields.length > 0) {
      if (updateData.issue_status === 'resolved' || updateData.issue_status === 'closed') fields.push('resolved_at = NOW()');
      fields.push('updated_at = NOW()'); values.push(issueId);
      await query(`UPDATE issues SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return await this._findIssueById(issueId);
  }
}

export default IssueService;
