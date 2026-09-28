const express = require('express');
const router = express.Router();
const {
  apply,
  getMyApplications,
  getApplicationById,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All application routes require authentication
router.use(protect);

// Student endpoints
router.post('/', authorize('STUDENT'), apply);
router.get('/my', authorize('STUDENT'), getMyApplications);
router.get('/:id', getApplicationById);

module.exports = router;
