const resumeService = require('../services/resumeService');
const resumeAnalysisService = require('../services/resumeAnalysisService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Upload or replace resume PDF for current student
 * @route   POST /api/resumes/upload
 * @access  Private (Student only)
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Please upload a PDF resume file using field name "resume" or "file".', 400);
    }

    const resume = await resumeService.uploadStudentResume({
      userId: req.user._id,
      file: req.file,
    });

    return successResponse(res, 'Resume uploaded successfully', resume, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View current active resume details for logged-in student
 * @route   GET /api/resumes/my
 * @access  Private (Student only)
 */
const getMyResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getMyResume(req.user._id);

    return successResponse(res, 'Current resume retrieved successfully', resume, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resume file and record
 * @route   DELETE /api/resumes/:id
 * @access  Private (Student only, owner verified)
 */
const deleteResume = async (req, res, next) => {
  try {
    const result = await resumeService.deleteResume(req.params.id, req.user._id);

    return successResponse(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test and analyze a PDF resume (direct upload or active resume)
 * @route   POST /api/resumes/test
 * @access  Private (Student only)
 */
const testResume = async (req, res, next) => {
  try {
    const result = await resumeAnalysisService.testResume({
      userId: req.user._id,
      file: req.file,
      resumeId: req.body ? req.body.resumeId : null,
    });

    return successResponse(res, 'Resume tested and analyzed successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get historical test results for logged-in student
 * @route   GET /api/resumes/test-results
 * @access  Private (Student only)
 */
const getTestResults = async (req, res, next) => {
  try {
    const results = await resumeAnalysisService.getTestResultsHistory(req.user._id);

    return successResponse(res, 'Resume test history retrieved successfully', results, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Match student resume against a specific recruitment drive

 * @route   POST /api/resumes/match/:driveId
 * @access  Private (Student only)
 */
const matchResume = async (req, res, next) => {
  try {
    const result = await resumeAnalysisService.matchResumeWithDrive({
      userId: req.user._id,
      driveId: req.params.driveId,
      file: req.file,
      resumeId: req.body ? req.body.resumeId : null,
    });

    return successResponse(res, 'Resume matched against recruitment drive successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getMyResume,
  deleteResume,
  testResume,
  getTestResults,
  matchResume,
};


