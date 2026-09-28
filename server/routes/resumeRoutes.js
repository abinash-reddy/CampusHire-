const express = require('express');
const router = express.Router();
const {
  uploadResume,
  getMyResume,
  deleteResume,
  testResume,
  getTestResults,
  matchResume,
} = require('../controllers/resumeController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadResumeMiddleware } = require('../middlewares/uploadMiddleware');

// All resume management routes require valid JWT and STUDENT role
router.use(protect);
router.use(authorize('STUDENT'));

// Resume CRUD & Upload
router.post('/upload', uploadResumeMiddleware, uploadResume);
router.get('/my', getMyResume);

// Resume Testing & Analysis (Phase 11)
router.post('/test', uploadResumeMiddleware, testResume);
router.get('/test-results', getTestResults);

// Job-Specific Resume Matching (Phase 12)
router.post('/match/:driveId', uploadResumeMiddleware, matchResume);

// Specific ID routes
router.delete('/:id', deleteResume);

module.exports = router;


