const studentService = require('../services/studentService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get current student's full profile
 * @route   GET /api/students/profile
 * @access  Private (Student only)
 */
const getProfile = async (req, res, next) => {
  try {
    const student = await studentService.getStudentProfile(req.user._id);

    return successResponse(res, 'Student profile fetched successfully', student, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current student's profile
 * @route   PUT /api/students/profile
 * @access  Private (Student only)
 */
const updateProfile = async (req, res, next) => {
  try {
    const updatedStudent = await studentService.updateStudentProfile(req.user._id, req.body);

    return successResponse(res, 'Student profile updated successfully', updatedStudent, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
