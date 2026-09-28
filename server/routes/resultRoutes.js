const express = require('express');
const router = express.Router();
const {
  publishResult,
  getMyResults,
  getAllResults,
  getResultById,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All result routes require valid JWT
router.use(protect);

// 1. Student view own results (Must be before /:id)
router.get('/my', authorize('STUDENT'), getMyResults);

// 2. Admin publish recruitment result
router.post('/', authorize('ADMIN', 'TPO'), publishResult);

// 3. Admin view all recruitment results
router.get('/', authorize('ADMIN', 'TPO'), getAllResults);

// 4. View single result details (owner student or Admin)
router.get('/:id', getResultById);

module.exports = router;
