const driveService = require('../services/driveService');
const eligibilityService = require('../services/eligibilityService');
const { Student } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new recruitment drive
 * @route   POST /api/drives
 * @access  Private (Admin / TPO only)
 */
const createDrive = async (req, res, next) => {
  try {
    const drive = await driveService.createDrive(req.body, req.user._id);

    return successResponse(res, 'Recruitment drive created successfully', drive, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recruitment drives (search, filters, pagination; students see active only)
 * @route   GET /api/drives
 * @access  Private (Logged-in Students & Admins)
 */
const getDrives = async (req, res, next) => {
  try {
    const result = await driveService.getAllDrives(req.query, req.user.role);

    return successResponse(res, 'Recruitment drives fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single recruitment drive details
 * @route   GET /api/drives/:id
 * @access  Private (Logged-in Students & Admins)
 */
const getDriveById = async (req, res, next) => {
  try {
    const drive = await driveService.getDriveById(req.params.id, req.user.role);

    return successResponse(res, 'Recruitment drive details fetched successfully', drive, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update recruitment drive
 * @route   PUT /api/drives/:id
 * @access  Private (Admin / TPO only)
 */
const updateDrive = async (req, res, next) => {
  try {
    const updatedDrive = await driveService.updateDrive(req.params.id, req.body);

    return successResponse(res, 'Recruitment drive updated successfully', updatedDrive, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or cancel recruitment drive
 * @route   DELETE /api/drives/:id
 * @access  Private (Admin / TPO only)
 */
const deleteDrive = async (req, res, next) => {
  try {
    const result = await driveService.deleteDrive(req.params.id);

    return successResponse(res, result.message, result.drive || null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check eligibility for a recruitment drive
 * @route   GET /api/drives/:driveId/eligibility
 * @access  Private (Student checks own, Admin can specify ?studentId=...)
 */
const checkEligibility = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    let targetStudentId;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) {
        return errorResponse(res, 'Student profile not found for this user', 404);
      }
      targetStudentId = student._id;
    } else {
      // Admin / TPO can pass ?studentId=...
      targetStudentId = req.query.studentId;
      if (!targetStudentId) {
        return errorResponse(res, 'Admin must specify ?studentId= to evaluate eligibility for a student', 400);
      }
    }

    const evaluation = await eligibilityService.checkStudentDriveEligibility(driveId, targetStudentId);

    return successResponse(res, 'Eligibility evaluation completed', evaluation, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View all eligible students for a drive
 * @route   GET /api/drives/:driveId/eligible-students
 * @access  Private (Admin / TPO only)
 */
const getEligibleStudents = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const result = await eligibilityService.getEligibleStudentsForDrive(driveId, req.query);

    return successResponse(res, 'Eligible students retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
  checkEligibility,
  getEligibleStudents,
};

