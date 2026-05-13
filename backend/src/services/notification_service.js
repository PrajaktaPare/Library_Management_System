const { query } = require('../database/connection');
const { ApiError } = require('../utils');

class NotificationService {
  // ─── Database helpers (formerly in NotificationRepository) ───

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

  static async markAllUserNotificationsAsRead(userId) {
    const sql = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE';
    await query(sql, [userId]);
  }

  static async deleteNotificationRecord(notificationId) {
    const sql = 'DELETE FROM notifications WHERE id = ?';
    await query(sql, [notificationId]);
  }

  static async deleteAllUserNotifications(userId) {
    const sql = 'DELETE FROM notifications WHERE user_id = ?';
    await query(sql, [userId]);
  }

  static async getUnreadCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
    const results = await query(sql, [userId]);
    return results[0].count;
  }

  // ─── Business logic (service layer) ───

  static async getNotifications(userId, pagination, filters = {}) {
    const notifications = await this.findNotificationsByUser(userId, pagination.offset, pagination.limit, filters);
    const total = await this.countNotifications(userId, filters);

    return {
      notifications,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async markAsRead(userId, notificationId) {
    const notification = await this.findNotificationById(notificationId);
    
    if (!notification || notification.user_id !== userId) {
      throw ApiError.notFound('Notification not found');
    }

    await this.markNotificationAsRead(notificationId);
    return await this.findNotificationById(notificationId);
  }

  static async markAllAsRead(userId) {
    await this.markAllUserNotificationsAsRead(userId);
    return true;
  }

  static async deleteNotification(userId, notificationId) {
    const notification = await this.findNotificationById(notificationId);
    
    if (!notification || notification.user_id !== userId) {
      throw ApiError.notFound('Notification not found');
    }

    await this.deleteNotificationRecord(notificationId);
    return true;
  }
}

module.exports = NotificationService;
