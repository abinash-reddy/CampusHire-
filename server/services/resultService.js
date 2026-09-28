const { Result, Student, RecruitmentDrive, Company, Application } = require('../models');

const VALID_STATUSES = ['SELECTED', 'REJECTED', 'WAITLISTED'];

/**
 * Publish or update recruitment result for a candidate (Admin / TPO only)
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
const publishResult = async (data) => {
  const {
    student: studentParam,
    recruitmentDrive: driveParam,
    company: companyParam,
    jobRole: roleParam,
    package: packageParam,
    status = 'SELECTED',
    resultDate,
    remarks,
  } = data;

  // 1. Validate Recruitment Drive
  if (!driveParam) {
    const error = new Error('Please provide recruitment drive ID');
    error.statusCode = 400;
    throw error;
  }
  const drive = await RecruitmentDrive.findById(driveParam).populate('company');
  if (!drive) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate Student
  if (!studentParam) {
    const error = new Error('Please provide student ID');
    error.statusCode = 400;
    throw error;
  }
  let student = await Student.findById(studentParam).populate('user');
  if (!student) {
    student = await Student.findOne({ user: studentParam }).populate('user');
  }
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. Validate Status
  const normStatus = (status || 'SELECTED').toUpperCase().trim();
  if (!VALID_STATUSES.includes(normStatus)) {
    const error = new Error(
      `Invalid status "${status}". Allowed statuses: ${VALID_STATUSES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Resolve details
  const companyId = companyParam || (drive.company ? drive.company._id : null);
  if (!companyId) {
    const error = new Error('Company ID could not be resolved from recruitment drive');
    error.statusCode = 400;
    throw error;
  }
  const roleName = (roleParam || drive.jobRole || '').trim();
  const offeredPackage = typeof packageParam === 'number' ? packageParam : drive.package;

  if (!roleName) {
    const error = new Error('Job role is required');
    error.statusCode = 400;
    throw error;
  }
  if (typeof offeredPackage !== 'number' || offeredPackage < 0) {
    const error = new Error('Offered package CTC must be a valid positive number');
    error.statusCode = 400;
    throw error;
  }

  // 5. Look for linked Application
  const application = await Application.findOne({
    recruitmentDrive: drive._id,
    student: student._id,
  });

  const effectiveResultDate = resultDate ? new Date(resultDate) : new Date();

  // 6. Upsert Result Document
  let result = await Result.findOne({
    recruitmentDrive: drive._id,
    student: student._id,
  });

  if (result) {
    result.status = normStatus;
    result.package = offeredPackage;
    result.packageCtc = offeredPackage;
    result.jobRole = roleName;
    result.jobTitle = roleName;
    result.resultDate = effectiveResultDate;
    result.selectionDate = effectiveResultDate;
    result.remarks = remarks ? remarks.trim() : result.remarks;
    if (application) result.application = application._id;
    await result.save();
  } else {
    result = await Result.create({
      recruitmentDrive: drive._id,
      student: student._id,
      company: companyId,
      application: application ? application._id : null,
      jobRole: roleName,
      jobTitle: roleName,
      package: offeredPackage,
      packageCtc: offeredPackage,
      status: normStatus,
      resultDate: effectiveResultDate,
      selectionDate: effectiveResultDate,
      remarks: remarks ? remarks.trim() : '',
      acceptanceStatus: 'Offered',
    });
  }

  // 7. Update Student's placement status & Application status
  if (normStatus === 'SELECTED') {
    student.placementStatus = 'Placed';
    student.currentHighestCtc = Math.max(student.currentHighestCtc || 0, offeredPackage);
    await student.save();

    if (application) {
      application.status = 'SELECTED';
      application.statusHistory.push({
        status: 'SELECTED',
        updatedAt: new Date(),
        remarks: remarks || `Selected with package ${offeredPackage} LPA`,
      });
      await application.save();
    }

    // Trigger Notification to Student
    if (student.user) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification({
        recipient: student.user._id,
        title: 'Placement Result: Selected!',
        message: `Congratulations! You have been selected for "${roleName}" with an offered package of ${offeredPackage} LPA.`,
        type: 'ResultAnnouncement',
        actionUrl: `/student/results`,
      }).catch(() => {});
    }
  } else if (normStatus === 'REJECTED') {
    if (application) {
      application.status = 'REJECTED';
      application.statusHistory.push({
        status: 'REJECTED',
        updatedAt: new Date(),
        remarks: remarks || 'Not selected in final round',
      });
      await application.save();
    }

    if (student.user) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification({
        recipient: student.user._id,
        title: `Placement Result: ${roleName}`,
        message: `Recruitment results for "${roleName}" have been published.`,
        type: 'ResultAnnouncement',
        actionUrl: `/student/results`,
      }).catch(() => {});
    }
  } else if (normStatus === 'WAITLISTED') {
    if (student.user) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification({
        recipient: student.user._id,
        title: `Placement Result: ${roleName}`,
        message: `You are waitlisted for "${roleName}". You will be notified if further updates occur.`,
        type: 'ResultAnnouncement',
        actionUrl: `/student/results`,
      }).catch(() => {});
    }
  }

  return await Result.findById(result._id)
    .populate('company', 'companyName name industry tier location website')
    .populate('recruitmentDrive', 'jobRole package location driveDate')
    .populate({
      path: 'student',
      select: 'rollNumber department cgpa placementStatus currentHighestCtc',
      populate: { path: 'user', select: 'name email' },
    });
};

/**
 * Get all placement results for the authenticated student
 * @param {ObjectId} userId 
 * @returns {Promise<Array>}
 */
const getMyResults = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  const results = await Result.find({ student: student._id })
    .populate('company', 'companyName name industry tier location website')
    .populate('recruitmentDrive', 'jobRole package location driveDate status')
    .sort('-resultDate -createdAt')
    .lean();

  return results;
};

/**
 * Get all placement results with filters and pagination (Admin / TPO only)
 * @param {Object} query 
 * @returns {Promise<Object>}
 */
const getAllResults = async (query = {}) => {
  const {
    driveId,
    companyId,
    status,
    department,
    page = 1,
    limit = 10,
  } = query;

  const filter = {};
  if (driveId) filter.recruitmentDrive = driveId;
  if (companyId) filter.company = companyId;
  if (status) filter.status = status.toUpperCase().trim();

  // If department filter specified, find matching students first
  if (department) {
    const matchingStudents = await Student.find({
      department: department.toUpperCase().trim(),
    }).select('_id');
    filter.student = { $in: matchingStudents.map((s) => s._id) };
  }

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const parsedLimit = Math.max(1, parseInt(limit));

  const [results, total] = await Promise.all([
    Result.find(filter)
      .populate('company', 'companyName name industry tier location')
      .populate('recruitmentDrive', 'jobRole package location driveDate')
      .populate({
        path: 'student',
        select: 'rollNumber department cgpa placementStatus currentHighestCtc',
        populate: { path: 'user', select: 'name email' },
      })
      .sort('-resultDate -createdAt')
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Result.countDocuments(filter),
  ]);

  return {
    results,
    pagination: {
      total,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Get single result details with strict privacy enforcement
 * @param {string} id 
 * @param {Object} user 
 * @returns {Promise<Object>}
 */
const getResultById = async (id, user) => {
  const result = await Result.findById(id)
    .populate('company', 'companyName name industry tier location website')
    .populate('recruitmentDrive', 'jobRole package location driveDate')
    .populate({
      path: 'student',
      select: 'rollNumber department cgpa placementStatus currentHighestCtc user',
      populate: { path: 'user', select: 'name email' },
    });

  if (!result) {
    const error = new Error('Placement result record not found');
    error.statusCode = 404;
    throw error;
  }

  // Student privacy barrier: students can only view their own result
  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'student') {
    const studentUser = result.student ? result.student.user : null;
    const studentUserId = studentUser ? (studentUser._id || studentUser) : null;

    if (!studentUserId || studentUserId.toString() !== user._id.toString()) {
      const error = new Error('Access denied. You can only view your own placement results.');
      error.statusCode = 403;
      throw error;
    }
  }

  return result;
};

module.exports = {
  publishResult,
  getMyResults,
  getAllResults,
  getResultById,
  VALID_STATUSES,
};
