const { query } = require('../database/connection');

class NotificationRepository {
  static async createNotification(userId, type, title, message, relatedTable = null, relatedId = null) {
    const sql = `
      INSERT INTO notifications (user_id, type, title, message, related_table, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [userId, type, title, message, relatedTable, relatedId]);
    return result.insertId;
  }

  static async findNotificationById(notificationId) {
    const sql = 'SELECT * FROM notifications WHERE id = ?';
    const results = await query(sql, [notificationId]);
    return results.length > 0 ? results[0] : null;
  }

  static async findNotificationsByUser(userId, offset, limit, filters = {}) {
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const values = [userId];

    if (filters.isRead !== undefined) {
      sql += ' AND is_read = ?';
      values.push(filters.isRead);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    return await query(sql, values);
  }

  static async countNotifications(userId, filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ?';
    const values = [userId];

    if (filters.isRead !== undefined) {
      sql += ' AND is_read = ?';
      values.push(filters.isRead);
    }

    const results = await query(sql, values);
    return results[0].count;
  }

  static async markNotificationAsRead(notificationId) {
    const sql = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?';
    await query(sql, [notificationId]);
  }

  static async markAllAsRead(userId) {
    const sql = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE';
    await query(sql, [userId]);
  }

  static async deleteNotification(notificationId) {
    const sql = 'DELETE FROM notifications WHERE id = ?';
    await query(sql, [notificationId]);
  }

  static async deleteAllNotifications(userId) {
    const sql = 'DELETE FROM notifications WHERE user_id = ?';
    await query(sql, [userId]);
  }

  static async getUnreadCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
    const results = await query(sql, [userId]);
    return results[0].count;
  }
}

module.exports = NotificationRepository;
