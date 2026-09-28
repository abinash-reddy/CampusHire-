const express = require('express');
const router = express.Router();
const {
  createInterview,
  getMyInterviews,
  getAdminInterviews,
  updateInterview,
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All interview routes require valid authentication
router.use(protect);

// 1. Student view own interviews
router.get('/my', authorize('STUDENT'), getMyInterviews);

// 2. Admin / TPO create interview schedule
router.post('/', authorize('ADMIN', 'TPO'), createInterview);

// 3. Admin / TPO view interviews list (also available via /api/admin/interviews)
router.get('/', authorize('ADMIN', 'TPO'), getAdminInterviews);

// 4. Admin / TPO update interview schedule or status
router.put('/:id', authorize('ADMIN', 'TPO'), updateInterview);

module.exports = router;
