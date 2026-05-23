/* ═══════════════════════════════════════════
   Notification Service
   ═══════════════════════════════════════════ */

const Notification = require('../models/Notification');

/**
 * Create a notification for a user.
 */
const createNotification = async (userId, type, message, icon = 'info', color = 'violet', link = '', metadata = {}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    message,
    icon,
    color,
    link,
    metadata
  });

  return notification;
};

/**
 * Get paginated notifications for a user.
 */
const getUserNotifications = async (userId, options = {}) => {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;
  const filter = { user: userId };

  if (options.unreadOnly) {
    filter.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, read: false })
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Mark a notification as read.
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
  return notification;
};

/**
 * Mark all notifications as read for a user.
 */
const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { user: userId, read: false },
    { read: true }
  );
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, read: false });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
