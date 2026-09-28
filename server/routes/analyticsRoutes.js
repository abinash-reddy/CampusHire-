const express = require('express');
const router = express.Router();
const {
  getOverview,
  getBranchAnalytics,
  getCompanyAnalytics,
  getDriveAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All analytics routes are admin-only (ADMIN / TPO)
router.use(protect);
router.use(authorize('ADMIN', 'TPO'));

router.get('/overview', getOverview);
router.get('/branches', getBranchAnalytics);
router.get('/companies', getCompanyAnalytics);
router.get('/drives', getDriveAnalytics);

module.exports = router;
