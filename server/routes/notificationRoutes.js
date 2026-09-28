const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// All notification routes require authenticated user
router.use(protect);

// 1. Get user notifications with unread count
router.get('/', getNotifications);

// 2. Mark all notifications as read (MUST be before /:id)
router.put('/read-all', markAllAsRead);

// 3. Mark specific notification as read
router.put('/:id/read', markAsRead);

module.exports = router;
