const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All student profile routes require valid JWT authentication and STUDENT role
router.use(protect);
router.use(authorize('STUDENT'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
