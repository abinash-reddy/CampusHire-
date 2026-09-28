const resultService = require('../services/resultService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Publish recruitment result for a candidate
 * @route   POST /api/results
 * @access  Private (Admin / TPO only)
 */
const publishResult = async (req, res, next) => {
  try {
    const result = await resultService.publishResult(req.body);
    return successResponse(res, 'Recruitment result published successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get placement results for authenticated student
 * @route   GET /api/results/my
 * @access  Private (Student only)
 */
const getMyResults = async (req, res, next) => {
  try {
    const results = await resultService.getMyResults(req.user._id);
    return successResponse(res, 'Student placement results retrieved successfully', results, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all recruitment results with filters and pagination
 * @route   GET /api/results or GET /api/admin/results
 * @access  Private (Admin / TPO only)
 */
const getAllResults = async (req, res, next) => {
  try {
    const data = await resultService.getAllResults(req.query);
    return successResponse(res, 'Placement results retrieved successfully', data, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single placement result details (enforces student privacy)
 * @route   GET /api/results/:id
 * @access  Private (Owner student or Admin / TPO)
 */
const getResultById = async (req, res, next) => {
  try {
    const result = await resultService.getResultById(req.params.id, req.user);
    return successResponse(res, 'Placement result details retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  publishResult,
  getMyResults,
  getAllResults,
  getResultById,
};
