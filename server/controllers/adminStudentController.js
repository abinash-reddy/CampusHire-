const adminStudentService = require('../services/adminStudentService');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get paginated, filtered and searchable list of students
 * @route   GET /api/admin/students
 * @access  Private (Admin / TPO only)
 */
const getStudents = async (req, res, next) => {
  try {
    const result = await adminStudentService.getAllStudents(req.query);

    return successResponse(res, 'Students fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student details with applications and placement history
 * @route   GET /api/admin/students/:id
 * @access  Private (Admin / TPO only)
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await adminStudentService.getStudentById(req.params.id);

    return successResponse(res, 'Student details fetched successfully', student, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
};
