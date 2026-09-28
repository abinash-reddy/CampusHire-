const mongoose = require('mongoose');
const {
  Application,
  Student,
  RecruitmentDrive,
  Notification,
  Result,
} = require('../models');
const { evaluateEligibility } = require('./eligibilityService');

const VALID_STATUSES = [
  'APPLIED',
  'SHORTLISTED',
  'ASSESSMENT',
  'TECHNICAL_INTERVIEW',
  'HR_INTERVIEW',
  'SELECTED',
  'REJECTED',
  'WITHDRAWN',
];

/**
 * Submit an application for an open recruitment drive
 * Enforces all 5 validation rules
 */
const applyToDrive = async ({ userId, driveId, resumeId }) => {
  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    const error = new Error('Invalid recruitment drive ID format');
    error.statusCode = 400;
    throw error;
  }

  // 1. Authenticated Student Profile Lookup
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found. Please complete your profile before applying.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch Drive & Partner Company
  const drive = await RecruitmentDrive.findById(driveId).populate('company', 'name industry tier location');
  if (!drive) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. Rule 1: The drive must be OPEN
  if (drive.status.toUpperCase() !== 'OPEN') {
    const error = new Error(
      `This recruitment drive is currently ${drive.status.toUpperCase()} and not accepting applications.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Rule 2: Application deadline must not have passed
  const now = new Date();
  const deadline = new Date(drive.applicationDeadline || drive.registrationDeadline);
  if (deadline < now) {
    const error = new Error(
      `The application deadline passed on ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Rule 3: Prevent duplicate application
  const existingApplication = await Application.findOne({
    recruitmentDrive: driveId,
    student: student._id,
  });
  if (existingApplication) {
    const error = new Error('You have already submitted an application for this recruitment drive.');
    error.statusCode = 409;
    throw error;
  }

  // 6. Rule 4: Eligibility Engine Check
  const evaluation = evaluateEligibility(student, drive);
  if (!evaluation.eligible) {
    const error = new Error(
      `You are not eligible for this drive: ${evaluation.failedCriteria.join('; ')}`
    );
    error.statusCode = 400;
    error.failedCriteria = evaluation.failedCriteria;
    throw error;
  }

  // 7. Resolve Resume
  const resumeToUse = resumeId || student.activeResume || null;

  // 8. Create Application
  const application = await Application.create({
    recruitmentDrive: driveId,
    student: student._id,
    resume: resumeToUse,
    matchScore: evaluation.skillMatch.matchPercentage || 0,
    status: 'APPLIED',
    currentStage: 'Application Submitted',
    statusHistory: [
      {
        status: 'APPLIED',
        stage: 'Application Submitted',
        remarks: 'Application submitted by candidate via student portal',
        updatedAt: new Date(),
        updatedBy: userId,
      },
    ],
  });

  // 9. Send Confirmation Notification to Student
  await Notification.create({
    recipient: userId,
    title: 'Application Submitted Successfully',
    message: `You have successfully applied for the position of "${drive.jobRole}" at ${drive.company.name}.`,
    type: 'ApplicationStatus',
    actionUrl: `/student/applications`,
  });

  return await Application.findById(application._id)
    .populate({
      path: 'recruitmentDrive',
      select: 'jobRole package location driveDate applicationDeadline status company',
      populate: { path: 'company', select: 'name industry tier location website' },
    })
    .populate('resume', 'fileName atsScore');
};

/**
 * Get all applications submitted by the authenticated student
 */
const getMyApplications = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  const applications = await Application.find({ student: student._id })
    .populate({
      path: 'recruitmentDrive',
      select: 'jobRole package location driveDate applicationDeadline status company selectionProcess',
      populate: { path: 'company', select: 'name industry tier location website' },
    })
    .populate('resume', 'fileName atsScore')
    .sort('-createdAt')
    .lean();

  return applications;
};

/**
 * Get single application by ID with authorization checks
 */
const getApplicationById = async (applicationId, user) => {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    const error = new Error('Invalid application ID format');
    error.statusCode = 400;
    throw error;
  }

  const application = await Application.findById(applicationId)
    .populate({
      path: 'recruitmentDrive',
      populate: { path: 'company', select: 'name industry tier location website' },
    })
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name email role' },
    })
    .populate('resume', 'fileName atsScore detectedSkills')
    .populate('statusHistory.updatedBy', 'name role')
    .lean();

  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  // If role is student, ensure application belongs to this student
  if (user.role.toLowerCase() === 'student') {
    if (
      !application.student ||
      !application.student.user ||
      application.student.user._id.toString() !== user._id.toString()
    ) {
      const error = new Error('Access denied. You can only view your own applications.');
      error.statusCode = 403;
      throw error;
    }
  }

  return application;
};

/**
 * Admin: List all applications with search, status filters, and pagination
 */
const getAllApplicationsAdmin = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    driveId,
    status,
    department,
    branch,
    batchYear,
    search = '',
    sort = '-createdAt',
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Drive filter
  if (driveId && mongoose.Types.ObjectId.isValid(driveId)) {
    filter.recruitmentDrive = driveId;
  }

  // Status filter
  if (status && status !== 'ALL') {
    filter.status = status.toUpperCase().trim();
  }

  // If filtering by student attributes (branch, year, search)
  const targetDept = department || branch;
  const studentFilter = {};

  if (targetDept && targetDept !== 'ALL') {
    studentFilter.department = targetDept.toUpperCase().trim();
  }
  if (batchYear) {
    const y = parseInt(batchYear, 10);
    if (!isNaN(y)) studentFilter.batchYear = y;
  }

  if (Object.keys(studentFilter).length > 0 || (search && search.trim() !== '')) {
    const studentMatchCriteria = { ...studentFilter };

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      studentMatchCriteria.$or = [
        { rollNumber: searchRegex },
        { skills: { $in: [searchRegex] } },
      ];
    }

    const matchingStudents = await Student.find(studentMatchCriteria).select('_id');
    const studentIds = matchingStudents.map((s) => s._id);

    filter.student = { $in: studentIds };
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: 'student',
        select: 'rollNumber department batchYear cgpa activeBacklogs skills placementStatus user',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'recruitmentDrive',
        select: 'jobRole package location status company',
        populate: { path: 'company', select: 'name industry tier' },
      })
      .populate('resume', 'fileName atsScore')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Application.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    applications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };
};

/**
 * Admin: Update application status with audit trail and automated actions
 */
const updateApplicationStatus = async (applicationId, { status, stage, remarks = '' }, adminUserId) => {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    const error = new Error('Invalid application ID format');
    error.statusCode = 400;
    throw error;
  }

  const normalizedStatus = (status || '').toUpperCase().trim();
  if (!VALID_STATUSES.includes(normalizedStatus)) {
    const error = new Error(
      `Invalid status "${status}". Allowed statuses are: ${VALID_STATUSES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  const application = await Application.findById(applicationId)
    .populate('student')
    .populate({
      path: 'recruitmentDrive',
      populate: { path: 'company' },
    });

  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  // Update status and current stage
  application.status = normalizedStatus;
  application.currentStage = stage || normalizedStatus.replace('_', ' ');

  // Append to status history
  application.statusHistory.push({
    status: normalizedStatus,
    stage: application.currentStage,
    remarks: remarks.trim(),
    updatedAt: new Date(),
    updatedBy: adminUserId,
  });

  await application.save();

  // Trigger Notification to Student
  if (application.student && application.student.user) {
    const companyName = application.recruitmentDrive.company ? application.recruitmentDrive.company.name : 'the company';
    const driveRole = application.recruitmentDrive.jobRole;

    await Notification.create({
      recipient: application.student.user,
      title: `Application Status Updated: ${normalizedStatus}`,
      message: `Your application for "${driveRole}" at ${companyName} has been moved to ${application.currentStage}. Remarks: ${remarks || 'None'}`,
      type: 'ApplicationStatus',
      actionUrl: `/student/applications`,
    });
  }

  // If candidate is SELECTED, automatically record Placement Offer
  if (normalizedStatus === 'SELECTED') {
    const student = await Student.findById(application.student._id);
    const drive = application.recruitmentDrive;

    if (student && drive) {
      student.placementStatus = 'Placed';
      student.currentHighestCtc = Math.max(student.currentHighestCtc || 0, drive.package);
      await student.save();

      // Upsert Result record
      await Result.findOneAndUpdate(
        { recruitmentDrive: drive._id, student: student._id },
        {
          recruitmentDrive: drive._id,
          student: student._id,
          application: application._id,
          company: drive.company._id,
          jobTitle: drive.jobRole,
          packageCtc: drive.package,
          selectionDate: new Date(),
          acceptanceStatus: 'Offered',
          remarks: remarks || 'Selected through campus recruitment drive',
        },
        { upsert: true, new: true }
      );
    }
  }

  return await Application.findById(application._id)
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
    })
    .populate({
      path: 'recruitmentDrive',
      populate: { path: 'company', select: 'name' },
    });
};

module.exports = {
  applyToDrive,
  getMyApplications,
  getApplicationById,
  getAllApplicationsAdmin,
  updateApplicationStatus,
  VALID_STATUSES,
};
