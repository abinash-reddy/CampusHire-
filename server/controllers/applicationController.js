const applicationService = require('../services/applicationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Submit an application for a recruitment drive
 * @route   POST /api/applications
 * @access  Private (Student only)
 */
const apply = async (req, res, next) => {
  try {
    const driveId = req.body.driveId || req.body.recruitmentDrive;
    if (!driveId) {
      return errorResponse(res, 'Please provide driveId in request body', 400);
    }

    const application = await applicationService.applyToDrive({
      userId: req.user._id,
      driveId,
      resumeId: req.body.resumeId,
    });

    return successResponse(res, 'Application submitted successfully', application, 201);
  } catch (error) {
    if (error.failedCriteria) {
      return errorResponse(res, error.message, error.statusCode || 400, {
        failedCriteria: error.failedCriteria,
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all applications submitted by logged-in student
 * @route   GET /api/applications/my
 * @access  Private (Student only)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getMyApplications(req.user._id);

    return successResponse(res, 'Applications fetched successfully', applications, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single application by ID
 * @route   GET /api/applications/:id
 * @access  Private (Student who applied or Admin)
 */
const getApplicationById = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationById(req.params.id, req.user);

    return successResponse(res, 'Application details fetched successfully', application, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Get all applications with search, status filters, and pagination
 * @route   GET /api/admin/applications
 * @access  Private (Admin / TPO only)
 */
const getAdminApplications = async (req, res, next) => {
  try {
    const result = await applicationService.getAllApplicationsAdmin(req.query);

    return successResponse(res, 'All applications fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Update candidate recruitment application status
 * @route   PUT /api/admin/applications/:id/status
 * @access  Private (Admin / TPO only)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status, stage, remarks } = req.body;
    if (!status) {
      return errorResponse(res, 'Please provide status in request body', 400);
    }

    const updated = await applicationService.updateApplicationStatus(
      req.params.id,
      { status, stage, remarks },
      req.user._id
    );

    return successResponse(res, `Application status updated to ${updated.status}`, updated, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  apply,
  getMyApplications,
  getApplicationById,
  getAdminApplications,
  updateStatus,
};
