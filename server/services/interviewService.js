const { Interview, Application, Student, RecruitmentDrive } = require('../models');

/**
 * Validate time format (supports 12-hour AM/PM e.g. "10:30 AM" or 24-hour e.g. "14:30")
 * @param {string} timeStr 
 * @returns {boolean}
 */
const isValidTimeFormat = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)$|^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr.trim());
};

/**
 * Create a new interview schedule for an application
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
const createInterview = async (data) => {
  const {
    application: applicationId,
    round,
    date,
    time,
    mode = 'Online',
    venue,
    meetingLink,
    instructions,
    status = 'SCHEDULED',
  } = data;

  // 1. Validate application
  if (!applicationId) {
    const error = new Error('Application ID is required to schedule an interview');
    error.statusCode = 400;
    throw error;
  }

  const app = await Application.findById(applicationId).populate('student recruitmentDrive');
  if (!app) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate round
  if (!round || typeof round !== 'string' || round.trim().length === 0) {
    const error = new Error('Please specify a valid interview round name (e.g., Technical Interview 1)');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate Date
  if (!date) {
    const error = new Error('Please provide an interview date');
    error.statusCode = 400;
    throw error;
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    const error = new Error('Invalid interview date format. Please provide a valid ISO date.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Validate Time
  if (!time || !isValidTimeFormat(time)) {
    const error = new Error('Invalid interview time format. Use HH:MM or HH:MM AM/PM (e.g. "10:30 AM" or "14:00").');
    error.statusCode = 400;
    throw error;
  }

  // 5. Validate mode and location
  const normalizedMode = mode.toUpperCase() === 'OFFLINE' ? 'Offline' : 'Online';
  const effectiveVenue = venue ? venue.trim() : '';
  const effectiveMeetingLink = meetingLink ? meetingLink.trim() : '';

  // 6. Deduce student & drive from application
  const studentId = data.student || (app.student ? app.student._id : null);
  const driveId = data.recruitmentDrive || (app.recruitmentDrive ? app.recruitmentDrive._id : null);

  if (!studentId || !driveId) {
    const error = new Error('Could not resolve student or recruitment drive from application');
    error.statusCode = 400;
    throw error;
  }

  // 7. Create interview document
  const interview = await Interview.create({
    application: app._id,
    student: studentId,
    recruitmentDrive: driveId,
    round: round.trim(),
    roundName: round.trim(),
    date: parsedDate,
    time: time.trim(),
    mode: normalizedMode,
    venue: effectiveVenue,
    meetingLink: effectiveMeetingLink,
    venueOrLink: normalizedMode === 'Offline' ? effectiveVenue : effectiveMeetingLink,
    instructions: instructions ? instructions.trim() : '',
    status: status.toUpperCase(),
    scheduledAt: parsedDate,
  });

  // 8. Progress application status if not already advanced
  if (['APPLIED', 'SHORTLISTED'].includes(app.status)) {
    app.status = 'TECHNICAL_INTERVIEW';
    app.statusHistory.push({
      status: 'TECHNICAL_INTERVIEW',
      updatedAt: new Date(),
      remarks: `Interview scheduled for round: ${round.trim()}`,
    });
    await app.save();
  }

  // Trigger Notification to Student
  const notificationService = require('./notificationService');
  const targetRecipient = app.student && app.student.user ? app.student.user : studentId;
  const driveRole = app.recruitmentDrive ? app.recruitmentDrive.jobRole : 'Job';
  try {
    await notificationService.createNotification({
      recipient: targetRecipient,
      title: `Interview Scheduled: ${round.trim()}`,
      message: `Your interview for "${driveRole}" (${round.trim()}) has been scheduled for ${parsedDate.toLocaleDateString()} at ${time.trim()}. Mode: ${normalizedMode}.`,
      type: 'InterviewSchedule',
      actionUrl: `/student/interviews`,
    });
  } catch (e) {
    // Non-blocking notification logging
  }


  return interview.populate([
    {
      path: 'student',
      select: 'rollNumber department cgpa user placementStatus',
      populate: { path: 'user', select: 'name email' },
    },
    {
      path: 'recruitmentDrive',
      select: 'jobRole package location company',
      populate: { path: 'company', select: 'name companyName industry website tier' },
    },
    { path: 'application', select: 'status appliedAt' },
  ]);
};



/**
 * Get all interview schedules for authenticated student
 * @param {ObjectId} userId 
 * @returns {Promise<Array>}
 */
const getMyInterviews = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  const interviews = await Interview.find({ student: student._id })
    .populate({
      path: 'recruitmentDrive',
      select: 'jobRole package location company driveDate',
      populate: { path: 'company', select: 'name companyName industry website tier' },
    })
    .populate({
      path: 'application',
      select: 'status appliedAt',
    })
    .sort({ date: 1, createdAt: -1 });

  return interviews;
};

/**
 * Get all interview schedules for admin/TPO with filtering and pagination
 * @param {Object} query 
 * @returns {Promise<Object>}
 */
const getAdminInterviews = async (query = {}) => {
  const { driveId, studentId, status, page = 1, limit = 10 } = query;

  const filter = {};
  if (driveId) filter.recruitmentDrive = driveId;
  if (studentId) filter.student = studentId;
  if (status) filter.status = status.toUpperCase();

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const parsedLimit = Math.max(1, parseInt(limit));

  const [interviews, total] = await Promise.all([
    Interview.find(filter)
      .populate({
        path: 'student',
        select: 'rollNumber department cgpa placementStatus user',
        populate: { path: 'user', select: 'name email' },
      })

      .populate({
        path: 'recruitmentDrive',
        select: 'jobRole package company',
        populate: { path: 'company', select: 'name companyName industry website tier' },
      })
      .populate({
        path: 'application',
        select: 'status appliedAt',
      })
      .sort({ date: 1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Interview.countDocuments(filter),
  ]);

  return {
    interviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Update interview schedule details (Admin / TPO)
 * @param {string} id 
 * @param {Object} updateData 
 * @returns {Promise<Object>}
 */
const updateInterview = async (id, updateData) => {
  const interview = await Interview.findById(id);
  if (!interview) {
    const error = new Error('Interview schedule not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate Date if being updated
  if (updateData.date !== undefined) {
    const parsedDate = new Date(updateData.date);
    if (isNaN(parsedDate.getTime())) {
      const error = new Error('Invalid interview date format');
      error.statusCode = 400;
      throw error;
    }
    interview.date = parsedDate;
    interview.scheduledAt = parsedDate;
  }

  // Validate Time if being updated
  if (updateData.time !== undefined) {
    if (!isValidTimeFormat(updateData.time)) {
      const error = new Error('Invalid interview time format. Use HH:MM or HH:MM AM/PM.');
      error.statusCode = 400;
      throw error;
    }
    interview.time = updateData.time.trim();
  }

  // Update strings & status
  if (updateData.round !== undefined) {
    interview.round = updateData.round.trim();
    interview.roundName = updateData.round.trim();
  }
  if (updateData.mode !== undefined) {
    interview.mode = updateData.mode.toUpperCase() === 'OFFLINE' ? 'Offline' : 'Online';
  }
  if (updateData.venue !== undefined) {
    interview.venue = updateData.venue.trim();
  }
  if (updateData.meetingLink !== undefined) {
    interview.meetingLink = updateData.meetingLink.trim();
  }
  if (updateData.instructions !== undefined) {
    interview.instructions = updateData.instructions.trim();
  }
  if (updateData.feedback !== undefined) {
    interview.feedback = updateData.feedback.trim();
  }
  if (updateData.status !== undefined) {
    const allowedStatuses = ['SCHEDULED', 'COMPLETED', 'CLEARED', 'FAILED', 'CANCELLED', 'RESCHEDULED'];
    const normStatus = updateData.status.toUpperCase();
    if (!allowedStatuses.includes(normStatus)) {
      const error = new Error(`Invalid status "${updateData.status}". Allowed: ${allowedStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    interview.status = normStatus;
  }

  // Synchronize venueOrLink
  interview.venueOrLink = interview.mode === 'Offline' ? interview.venue : interview.meetingLink;

  await interview.save();

  return interview.populate([
    {
      path: 'student',
      select: 'rollNumber department cgpa user placementStatus',
      populate: { path: 'user', select: 'name email' },
    },
    {
      path: 'recruitmentDrive',
      select: 'jobRole package location company',
      populate: { path: 'company', select: 'companyName' },
    },

    { path: 'application', select: 'status appliedAt' },
  ]);
};

module.exports = {
  createInterview,
  getMyInterviews,
  getAdminInterviews,
  updateInterview,
  isValidTimeFormat,
};
