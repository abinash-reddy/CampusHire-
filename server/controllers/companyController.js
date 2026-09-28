const companyService = require('../services/companyService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new hiring partner company
 * @route   POST /api/companies
 * @access  Private (Admin / TPO only)
 */
const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.createCompany(req.body);

    return successResponse(res, 'Company created successfully', company, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get companies (search, filter, pagination; active-only for students)
 * @route   GET /api/companies
 * @access  Private (Logged in users: Students & Admins)
 */
const getCompanies = async (req, res, next) => {
  try {
    const result = await companyService.getAllCompanies(req.query, req.user.role);

    return successResponse(res, 'Companies fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single company details with recruitment history
 * @route   GET /api/companies/:id
 * @access  Private (Logged in users: Students & Admins)
 */
const getCompanyById = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(req.params.id, req.user.role);

    return successResponse(res, 'Company details fetched successfully', company, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update company details
 * @route   PUT /api/companies/:id
 * @access  Private (Admin / TPO only)
 */
const updateCompany = async (req, res, next) => {
  try {
    const updated = await companyService.updateCompany(req.params.id, req.body);

    return successResponse(res, 'Company updated successfully', updated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate (soft delete) or remove company
 * @route   DELETE /api/companies/:id
 * @access  Private (Admin / TPO only)
 */
const deleteCompany = async (req, res, next) => {
  try {
    const hardDelete = req.query.hard === 'true';
    const result = await companyService.deleteCompany(req.params.id, hardDelete);

    return successResponse(res, result.message, result.company || null, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
