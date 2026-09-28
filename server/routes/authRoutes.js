const express = require('express');
const router = express.Router();
const {
  register,
  registerAdminUser,
  login,
  getMe,
  firebaseSync,
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { successResponse } = require('../utils/apiResponse');

// Public Authentication Routes
router.post('/register', register);
router.post('/register-admin', registerAdminUser);
router.post('/login', login);
router.post('/firebase-sync', firebaseSync);

// Private Routes (Logged in Users)
router.get('/me', protect, getMe);

// Role-Based Authorization Verification Endpoints (Useful for Postman & Viva checks)
router.get('/admin-only', protect, authorize('ADMIN', 'TPO'), (req, res) => {
  return successResponse(res, 'Access granted: Authorized Admin / Placement Officer resource', {
    user: req.user,
  });
});

router.get('/student-only', protect, authorize('STUDENT'), (req, res) => {
  return successResponse(res, 'Access granted: Authorized Student resource', {
    user: req.user,
  });
});

module.exports = router;
