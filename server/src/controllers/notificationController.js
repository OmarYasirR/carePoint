const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

/**
 * GET /api/notifications?unreadOnly=&page=&limit=
 * Always scoped to the requesting user.
 */
const listNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;

  const filter = { user: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
    Notification.countDocuments(filter),
  ]);

  res.json({ data: notifications, unreadCount, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json(notification);
});

/**
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
});

/**
 * DELETE /api/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const result = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!result) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ message: 'Notification deleted' });
});

module.exports = { listNotifications, markAsRead, markAllAsRead, deleteNotification };
