import { query } from '../database/connection.js';
import { ApiError } from '../utils/index.js';

class NotificationService {
  static async getNotifications(userId, pagination, filters = {}) {
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    let countSql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ?';
    const values = [userId]; const countValues = [userId];

    if (filters.isRead !== undefined) { sql += ' AND is_read = ?'; countSql += ' AND is_read = ?'; values.push(filters.isRead); countValues.push(filters.isRead); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(pagination.limit, pagination.offset);

    const notifications = await query(sql, values);
    const countResult = await query(countSql, countValues);
    return { notifications, total: countResult[0].count, page: pagination.page, limit: pagination.limit };
  }

  static async markAsRead(userId, notificationId) {
    const results = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    const notification = results.length > 0 ? results[0] : null;
    if (!notification || notification.user_id !== userId) throw ApiError.notFound('Notification not found');
    await query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?', [notificationId]);
    const updated = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    return updated[0];
  }

  static async markAllAsRead(userId) {
    await query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE', [userId]);
    return true;
  }

  static async deleteNotification(userId, notificationId) {
    const results = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    const notification = results.length > 0 ? results[0] : null;
    if (!notification || notification.user_id !== userId) throw ApiError.notFound('Notification not found');
    await query('DELETE FROM notifications WHERE id = ?', [notificationId]);
    return true;
  }

  static async getUnreadCount(userId) {
    const results = await query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]);
    return results[0].count;
  }
}

export default NotificationService;
