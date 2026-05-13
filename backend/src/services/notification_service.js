const { NotificationRepository } = require('../repositories');
const { ApiError } = require('../utils');

class NotificationService {
  static async getNotifications(userId, pagination, filters = {}) {
    const notifications = await NotificationRepository.findNotificationsByUser(userId, pagination.offset, pagination.limit, filters);
    const total = await NotificationRepository.countNotifications(userId, filters);

    return {
      notifications,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async markAsRead(userId, notificationId) {
    const notification = await NotificationRepository.findNotificationById(notificationId);
    
    if (!notification || notification.user_id !== userId) {
      throw ApiError.notFound('Notification not found');
    }

    await NotificationRepository.markNotificationAsRead(notificationId);
    return await NotificationRepository.findNotificationById(notificationId);
  }

  static async markAllAsRead(userId) {
    await NotificationRepository.markAllAsRead(userId);
    return true;
  }

  static async deleteNotification(userId, notificationId) {
    const notification = await NotificationRepository.findNotificationById(notificationId);
    
    if (!notification || notification.user_id !== userId) {
      throw ApiError.notFound('Notification not found');
    }

    await NotificationRepository.deleteNotification(notificationId);
    return true;
  }

  static async getUnreadCount(userId) {
    return await NotificationRepository.getUnreadCount(userId);
  }
}

module.exports = NotificationService;
