const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require('../controllers/companyController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All company routes require authenticated sessions
router.use(protect);

// View routes (accessible to both Students and Admins; students restricted to active companies)
router.get('/', getCompanies);
router.get('/:id', getCompanyById);

// Admin-only management routes
router.post('/', authorize('ADMIN', 'TPO'), createCompany);
router.put('/:id', authorize('ADMIN', 'TPO'), updateCompany);
router.delete('/:id', authorize('ADMIN', 'TPO'), deleteCompany);

module.exports = router;
