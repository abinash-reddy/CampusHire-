const analyticsService = require('../services/analyticsService');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get overall placement analytics metrics
 * @route   GET /api/admin/analytics/overview
 * @access  Private (Admin / TPO only)
 */
const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverviewAnalytics();

    return successResponse(
      res,
      'Placement overview analytics retrieved successfully',
      data,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get branch-wise placement counts suitable for dashboard charts
 * @route   GET /api/admin/analytics/branches
 * @access  Private (Admin / TPO only)
 */
const getBranchAnalytics = async (req, res, next) => {
  try {
    const branches = await analyticsService.getBranchPlacementAnalytics();

    return res.status(200).json({
      success: true,
      message: 'Branch-wise placement analytics retrieved successfully',
      data: branches,
      branches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get company-wise application counts suitable for dashboard charts
 * @route   GET /api/admin/analytics/companies
 * @access  Private (Admin / TPO only)
 */
const getCompanyAnalytics = async (req, res, next) => {
  try {
    const companies = await analyticsService.getCompanyApplicationAnalytics();

    return res.status(200).json({
      success: true,
      message: 'Company-wise application analytics retrieved successfully',
      data: companies,
      companies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get drive-wise application counts
 * @route   GET /api/admin/analytics/drives
 * @access  Private (Admin / TPO only)
 */
const getDriveAnalytics = async (req, res, next) => {
  try {
    const drives = await analyticsService.getDriveApplicationAnalytics();

    return res.status(200).json({
      success: true,
      message: 'Drive-wise application analytics retrieved successfully',
      data: drives,
      drives,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getBranchAnalytics,
  getCompanyAnalytics,
  getDriveAnalytics,
};
