const interviewService = require('../services/interviewService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create interview schedule for an application
 * @route   POST /api/interviews
 * @access  Private (Admin / TPO only)
 */
const createInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.createInterview(req.body);
    return successResponse(res, 'Interview scheduled successfully', interview, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View all scheduled interviews for logged-in student
 * @route   GET /api/interviews/my
 * @access  Private (Student only)
 */
const getMyInterviews = async (req, res, next) => {
  try {
    const interviews = await interviewService.getMyInterviews(req.user._id);
    return successResponse(res, 'Student interviews retrieved successfully', interviews, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View all interviews with filters and pagination
 * @route   GET /api/admin/interviews
 * @access  Private (Admin / TPO only)
 */
const getAdminInterviews = async (req, res, next) => {
  try {
    const result = await interviewService.getAdminInterviews(req.query);
    return successResponse(res, 'Admin interviews retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update interview schedule details or status
 * @route   PUT /api/interviews/:id
 * @access  Private (Admin / TPO only)
 */
const updateInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.updateInterview(req.params.id, req.body);
    return successResponse(res, 'Interview schedule updated successfully', interview, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInterview,
  getMyInterviews,
  getAdminInterviews,
  updateInterview,
};
