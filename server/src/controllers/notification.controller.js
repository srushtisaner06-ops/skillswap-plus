/* ═══════════════════════════════════════════
   Notification Controller
   ═══════════════════════════════════════════ */

const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * GET /api/notifications
 * Get paginated notifications for the current user.
 */
const getNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === true;

  const result = await notificationService.getUserNotifications(req.user._id, { page, limit, unreadOnly });

  res.status(200).json({
    status: 'success',
    data: result
  });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user._id);

  res.status(200).json({
    status: 'success',
    data: { unreadCount }
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
const markAsRead = catchAsync(async (req, res, next) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return next(new AppError('Invalid notification id.', 400));
  }

  const notification = await notificationService.markAsRead(req.params.id, req.user._id);

  if (!notification) {
    return next(new AppError('Notification not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { notification }
  });
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read.
 */
const markAllAsRead = catchAsync(async (req, res, next) => {
  const result = await notificationService.markAllAsRead(req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read',
    data: { modifiedCount: result.modifiedCount || 0 }
  });
});

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
