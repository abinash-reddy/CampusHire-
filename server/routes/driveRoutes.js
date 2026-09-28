const express = require('express');
const router = express.Router();
const {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
  checkEligibility,
  getEligibleStudents,
} = require('../controllers/driveController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All recruitment drive routes require authenticated session
router.use(protect);

// Eligibility Check routes
router.get('/:driveId/eligibility', checkEligibility);
router.get('/:driveId/eligible-students', authorize('ADMIN', 'TPO'), getEligibleStudents);

// View routes (Students see active drives, Admins see all)
router.get('/', getDrives);
router.get('/:id', getDriveById);

// Admin / TPO management routes
router.post('/', authorize('ADMIN', 'TPO'), createDrive);
router.put('/:id', authorize('ADMIN', 'TPO'), updateDrive);
router.delete('/:id', authorize('ADMIN', 'TPO'), deleteDrive);

module.exports = router;
