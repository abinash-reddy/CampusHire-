const placementUpdateService = require('../services/placementUpdateService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new placement update
 * @route   POST /api/updates
 * @access  Private (Admin / TPO only)
 */
const createUpdate = async (req, res, next) => {
  try {
    const update = await placementUpdateService.createUpdate({
      ...req.body,
      userId: req.user._id,
    });
    return successResponse(res, 'Placement update created successfully', update, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all published placement updates with filters & pagination
 * @route   GET /api/updates
 * @access  Private (Students, Admins, TPOs)
 */
const getUpdates = async (req, res, next) => {
  try {
    const result = await placementUpdateService.getUpdates(req.query);
    return successResponse(res, 'Placement updates retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single placement update by ID
 * @route   GET /api/updates/:id
 * @access  Private (Students, Admins, TPOs)
 */
const getUpdateById = async (req, res, next) => {
  try {
    const update = await placementUpdateService.getUpdateById(req.params.id);
    return successResponse(res, 'Placement update details retrieved successfully', update, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a placement update
 * @route   PUT /api/updates/:id
 * @access  Private (Admin / TPO only)
 */
const updatePlacementUpdate = async (req, res, next) => {
  try {
    const update = await placementUpdateService.updatePlacementUpdate(req.params.id, req.body);
    return successResponse(res, 'Placement update updated successfully', update, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a placement update
 * @route   DELETE /api/updates/:id
 * @access  Private (Admin / TPO only)
 */
const deletePlacementUpdate = async (req, res, next) => {
  try {
    const result = await placementUpdateService.deletePlacementUpdate(req.params.id);
    return successResponse(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUpdate,
  getUpdates,
  getUpdateById,
  updatePlacementUpdate,
  deletePlacementUpdate,
};
