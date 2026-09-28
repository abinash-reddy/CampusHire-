const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get notifications for logged-in user with unread count
 * @route   GET /api/notifications
 * @access  Private (Authenticated users: Students, Admins, TPOs)
 */
const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotificationsForUser(
      req.user._id,
      req.query
    );
    return successResponse(res, 'Notifications retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (Owner only)
 */
const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );
    return successResponse(res, 'Notification marked as read', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all unread notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return successResponse(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
