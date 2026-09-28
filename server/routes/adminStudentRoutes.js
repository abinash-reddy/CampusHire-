const express = require('express');
const router = express.Router();
const { getStudents, getStudentById } = require('../controllers/adminStudentController');
const { getAdminApplications, updateStatus } = require('../controllers/applicationController');
const { getAdminInterviews } = require('../controllers/interviewController');
const { getAllResults } = require('../controllers/resultController');
const {
  getOverview,
  getBranchAnalytics,
  getCompanyAnalytics,
  getDriveAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All admin management routes require valid JWT authentication and ADMIN / TPO role
router.use(protect);
router.use(authorize('ADMIN', 'TPO'));

// Students management
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);

// Applications management
router.get('/applications', getAdminApplications);
router.put('/applications/:id/status', updateStatus);

// Interviews management (Phase 13)
router.get('/interviews', getAdminInterviews);

// Placement Results management (Phase 16)
router.get('/results', getAllResults);

// Placement Analytics (Phase 17)
router.get('/analytics/overview', getOverview);
router.get('/analytics/branches', getBranchAnalytics);
router.get('/analytics/companies', getCompanyAnalytics);
router.get('/analytics/drives', getDriveAnalytics);

module.exports = router;


