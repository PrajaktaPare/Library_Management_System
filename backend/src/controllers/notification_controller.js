const { NotificationService } = require('../services');
const { ApiResponse, asyncHandler, PaginationHelper } = require('../utils');

class NotificationController {
  static getNotifications = asyncHandler(async (req, res) => {
    const pagination = PaginationHelper.getPaginationParams(req.query);
    const filters = {
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined
    };

    const result = await NotificationService.getNotifications(req.user.id, pagination, filters);
    res.status(200).json(ApiResponse.paginated('Notifications', result.notifications, result.total, pagination.page, pagination.limit));
  });

  static markAsRead = asyncHandler(async (req, res) => {
    const result = await NotificationService.markAsRead(req.user.id, req.params.id);
    res.status(200).json(ApiResponse.ok('Notification marked as read', result));
  });

  static markAllAsRead = asyncHandler(async (req, res) => {
    await NotificationService.markAllAsRead(req.user.id);
    res.status(200).json(ApiResponse.ok('All notifications marked as read'));
  });

  static deleteNotification = asyncHandler(async (req, res) => {
    await NotificationService.deleteNotification(req.user.id, req.params.id);
    res.status(200).json(ApiResponse.ok('Notification deleted'));
  });

  static getUnreadCount = asyncHandler(async (req, res) => {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.status(200).json(ApiResponse.ok('Unread count', { count }));
  });
}

module.exports = NotificationController;
