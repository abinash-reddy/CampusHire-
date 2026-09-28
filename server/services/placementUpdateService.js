const { PlacementUpdate } = require('../models');

const VALID_CATEGORIES = [
  'IMPORTANT',
  'COMPANY',
  'RECRUITMENT',
  'INTERVIEW',
  'RESULT',
  'GENERAL',
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/**
 * Create a new official placement update (Admin / TPO)
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
const createUpdate = async (data) => {
  const {
    userId,
    title,
    description,
    category = 'GENERAL',
    priority = 'MEDIUM',
    publishedAt,
    expiresAt,
  } = data;

  // 1. Validate Title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    const error = new Error('Please provide an update title');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate Description
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    const error = new Error('Please provide an update description / content');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate Category
  const normCategory = (category || 'GENERAL').toUpperCase().trim();
  if (!VALID_CATEGORIES.includes(normCategory)) {
    const error = new Error(
      `Invalid category "${category}". Allowed categories: ${VALID_CATEGORIES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Validate Priority
  const normPriority = (priority || 'MEDIUM').toUpperCase().trim();
  if (!VALID_PRIORITIES.includes(normPriority)) {
    const error = new Error(
      `Invalid priority "${priority}". Allowed priorities: ${VALID_PRIORITIES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Dates
  const effectivePublishedAt = publishedAt ? new Date(publishedAt) : new Date();
  if (isNaN(effectivePublishedAt.getTime())) {
    const error = new Error('Invalid publishedAt date format');
    error.statusCode = 400;
    throw error;
  }

  let effectiveExpiresAt = null;
  if (expiresAt) {
    effectiveExpiresAt = new Date(expiresAt);
    if (isNaN(effectiveExpiresAt.getTime())) {
      const error = new Error('Invalid expiresAt date format');
      error.statusCode = 400;
      throw error;
    }
  }

  // 6. Create Document
  const update = await PlacementUpdate.create({
    title: title.trim(),
    description: description.trim(),
    content: description.trim(),
    category: normCategory,
    priority: normPriority,
    publishedAt: effectivePublishedAt,
    expiresAt: effectiveExpiresAt,
    createdBy: userId,
    publishedBy: userId,
    isPublished: true,
  });

  // Trigger Notification to all students for IMPORTANT or HIGH/URGENT priority updates
  if (normCategory === 'IMPORTANT' || ['HIGH', 'URGENT'].includes(normPriority)) {
    const notificationService = require('./notificationService');
    try {
      await notificationService.notifyAllStudents({
        title: `Important Update: ${title.trim()}`,
        message: description.trim(),
        type: 'GeneralNotice',
        actionUrl: `/student/updates`,
      });
    } catch (e) {
      // Non-blocking notification logging
    }
  }


  return update.populate('createdBy', 'name email role');
};


/**
 * Retrieve placement updates with category filtering, search, and pagination
 * @param {Object} query 
 * @returns {Promise<Object>}
 */
const getUpdates = async (query = {}) => {
  const { category, priority, search, page = 1, limit = 10 } = query;

  const filter = { isPublished: true };

  // Category filter
  if (category) {
    filter.category = category.toUpperCase().trim();
  }

  // Priority filter
  if (priority) {
    filter.priority = priority.toUpperCase().trim();
  }

  // Search keyword in title or description
  if (search && search.trim().length > 0) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const parsedLimit = Math.max(1, parseInt(limit));

  const [updates, total] = await Promise.all([
    PlacementUpdate.find(filter)
      .populate('createdBy', 'name email role')
      .sort('-publishedAt')
      .skip(skip)
      .limit(parsedLimit),
    PlacementUpdate.countDocuments(filter),
  ]);

  return {
    updates,
    pagination: {
      total,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Retrieve a single placement update by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
const getUpdateById = async (id) => {
  const update = await PlacementUpdate.findById(id).populate('createdBy', 'name email role');
  if (!update) {
    const error = new Error('Placement update not found');
    error.statusCode = 404;
    throw error;
  }
  return update;
};

/**
 * Update an existing placement update (Admin / TPO)
 * @param {string} id 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
const updatePlacementUpdate = async (id, data) => {
  const update = await PlacementUpdate.findById(id);
  if (!update) {
    const error = new Error('Placement update not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      const error = new Error('Title cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    update.title = data.title.trim();
  }

  if (data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      const error = new Error('Description cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    update.description = data.description.trim();
    update.content = data.description.trim();
  }

  if (data.category !== undefined) {
    const normCategory = data.category.toUpperCase().trim();
    if (!VALID_CATEGORIES.includes(normCategory)) {
      const error = new Error(
        `Invalid category "${data.category}". Allowed: ${VALID_CATEGORIES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    update.category = normCategory;
  }

  if (data.priority !== undefined) {
    const normPriority = data.priority.toUpperCase().trim();
    if (!VALID_PRIORITIES.includes(normPriority)) {
      const error = new Error(
        `Invalid priority "${data.priority}". Allowed: ${VALID_PRIORITIES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    update.priority = normPriority;
  }

  if (data.publishedAt !== undefined) {
    const d = new Date(data.publishedAt);
    if (isNaN(d.getTime())) {
      const error = new Error('Invalid publishedAt date format');
      error.statusCode = 400;
      throw error;
    }
    update.publishedAt = d;
  }

  if (data.expiresAt !== undefined) {
    if (data.expiresAt === null) {
      update.expiresAt = null;
    } else {
      const d = new Date(data.expiresAt);
      if (isNaN(d.getTime())) {
        const error = new Error('Invalid expiresAt date format');
        error.statusCode = 400;
        throw error;
      }
      update.expiresAt = d;
    }
  }

  if (data.isPublished !== undefined) {
    update.isPublished = Boolean(data.isPublished);
  }

  await update.save();

  return update.populate('createdBy', 'name email role');
};

/**
 * Delete a placement update (Admin / TPO)
 * @param {string} id 
 * @returns {Promise<Object>}
 */
const deletePlacementUpdate = async (id) => {
  const update = await PlacementUpdate.findById(id);
  if (!update) {
    const error = new Error('Placement update not found');
    error.statusCode = 404;
    throw error;
  }

  await PlacementUpdate.findByIdAndDelete(id);

  return { message: 'Placement update deleted successfully' };
};

module.exports = {
  createUpdate,
  getUpdates,
  getUpdateById,
  updatePlacementUpdate,
  deletePlacementUpdate,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
};
