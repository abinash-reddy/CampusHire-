const { Notification, User, Student } = require('../models');

/**
 * Create a single notification for a specific user or student
 * @param {Object} params { recipient, title, message, type, actionUrl }
 * @returns {Promise<Object>}
 */
const createNotification = async ({
  recipient,
  title,
  message,
  type = 'GeneralNotice',
  actionUrl = '',
}) => {
  if (!recipient) {
    const error = new Error('Recipient is required to create a notification');
    error.statusCode = 400;
    throw error;
  }

  // Resolve recipient User ID (if recipient is a student _id)
  let targetUserId = recipient;
  const student = await Student.findById(recipient);
  if (student && student.user) {
    targetUserId = student.user;
  }

  const notification = await Notification.create({
    recipient: targetUserId,
    title: title ? title.trim() : 'Notification',
    message: message ? message.trim() : '',
    type,
    actionUrl: actionUrl || '',
    isRead: false,
  });

  return notification;
};

/**
 * Broadcast notification to all active students
 * @param {Object} params { title, message, type, actionUrl }
 * @returns {Promise<Array>}
 */
const notifyAllStudents = async ({
  title,
  message,
  type = 'GeneralNotice',
  actionUrl = '',
}) => {
  const studentUsers = await User.find({
    role: { $regex: /^student$/i },
    isActive: true,
  }).select('_id');

  if (!studentUsers || studentUsers.length === 0) return [];

  const notifications = studentUsers.map((u) => ({
    recipient: u._id,
    title: title ? title.trim() : 'Announcement',
    message: message ? message.trim() : '',
    type,
    actionUrl: actionUrl || '',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return await Notification.insertMany(notifications);
};

/**
 * Retrieve notifications for authenticated student/user with unread count & pagination
 * @param {ObjectId} userId 
 * @param {Object} query 
 * @returns {Promise<Object>}
 */
const getNotificationsForUser = async (userId, query = {}) => {
  const { isRead, page = 1, limit = 20 } = query;

  const filter = { recipient: userId };
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true' || isRead === true;
  }

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const parsedLimit = Math.max(1, parseInt(limit));

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Mark a single notification as read (verifies recipient ownership)
 * @param {string} notificationId 
 * @param {ObjectId} userId 
 * @returns {Promise<Object>}
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  if (notification.recipient.toString() !== userId.toString()) {
    const error = new Error('Access denied. You can only modify your own notifications.');
    error.statusCode = 403;
    throw error;
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return {
    notification,
    unreadCount,
  };
};

/**
 * Mark all unread notifications as read for current user
 * @param {ObjectId} userId 
 * @returns {Promise<Object>}
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return {
    modifiedCount: result.modifiedCount || result.nModified || 0,
    message: 'All notifications marked as read successfully',
    unreadCount: 0,
  };
};

module.exports = {
  createNotification,
  notifyAllStudents,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
};
