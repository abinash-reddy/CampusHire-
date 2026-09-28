const express = require('express');
const router = express.Router();
const {
  createUpdate,
  getUpdates,
  getUpdateById,
  updatePlacementUpdate,
  deletePlacementUpdate,
} = require('../controllers/placementUpdateController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All placement update routes require valid JWT
router.use(protect);

// Public to authenticated users (Students, TPOs, Admins)
router.get('/', getUpdates);
router.get('/:id', getUpdateById);

// Admin / TPO Restricted Routes
router.post('/', authorize('ADMIN', 'TPO'), createUpdate);
router.put('/:id', authorize('ADMIN', 'TPO'), updatePlacementUpdate);
router.delete('/:id', authorize('ADMIN', 'TPO'), deletePlacementUpdate);

module.exports = router;
