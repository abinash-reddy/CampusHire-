const mongoose = require('mongoose');
const { RecruitmentDrive, Company, Application } = require('../models');

/**
 * Validate date logic for recruitment drives
 */
const validateDates = (applicationDeadline, driveDate) => {
  const deadlineDate = new Date(applicationDeadline);
  const driveStartDate = new Date(driveDate);

  if (isNaN(deadlineDate.getTime())) {
    const error = new Error('Application deadline must be a valid date');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(driveStartDate.getTime())) {
    const error = new Error('Drive date must be a valid date');
    error.statusCode = 400;
    throw error;
  }

  if (driveStartDate < deadlineDate) {
    const error = new Error('Drive date cannot be earlier than the application deadline');
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Create a new recruitment drive (Admin only)
 */
const createDrive = async (data, adminUserId) => {
  const {
    company,
    jobRole,
    jobTitle,
    jobDescription,
    package: ctcPackage,
    ctcPackage: altPackage,
    location,
    jobLocation,
    employmentType = 'Full-Time',
    eligibleBranches,
    minimumCGPA = 6.0,
    maximumBacklogs = 0,
    graduationYear,
    numberOfPositions = 1,
    requiredSkills = [],
    selectionProcess = ['Online Assessment', 'Technical Interview', 'HR Interview'],
    rounds = [],
    applicationDeadline,
    registrationDeadline,
    driveDate,
    status = 'OPEN',
  } = data;

  // 1. Validate Company
  const targetCompanyId = company;
  if (!targetCompanyId || !mongoose.Types.ObjectId.isValid(targetCompanyId)) {
    const error = new Error('Please select a valid company ID for the recruitment drive');
    error.statusCode = 400;
    throw error;
  }

  const existingCompany = await Company.findById(targetCompanyId);
  if (!existingCompany) {
    const error = new Error('Specified company does not exist');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate Required Text Fields
  const roleName = (jobRole || jobTitle || '').trim();
  if (!roleName) {
    const error = new Error('Job role / title is required');
    error.statusCode = 400;
    throw error;
  }

  if (!jobDescription || jobDescription.trim() === '') {
    const error = new Error('Job description is required');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate CTC Package
  const parsedPackage = Number(ctcPackage !== undefined ? ctcPackage : altPackage);
  if (isNaN(parsedPackage) || parsedPackage < 0) {
    const error = new Error('Package CTC must be a positive number in LPA');
    error.statusCode = 400;
    throw error;
  }

  // 4. Validate Graduation Year
  const parsedYear = Number(graduationYear);
  if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2100) {
    const error = new Error('Eligible graduation batch year must be between 2020 and 2100');
    error.statusCode = 400;
    throw error;
  }

  // 5. Validate Dates
  const targetDeadline = applicationDeadline || registrationDeadline;
  if (!targetDeadline || !driveDate) {
    const error = new Error('Both application deadline and drive date are required');
    error.statusCode = 400;
    throw error;
  }
  validateDates(targetDeadline, driveDate);

  // 6. Validate CGPA
  const parsedCgpa = Number(minimumCGPA);
  if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
    const error = new Error('Minimum CGPA must be between 0.0 and 10.0');
    error.statusCode = 400;
    throw error;
  }

  // 7. Validate Backlogs
  const parsedBacklogs = Number(maximumBacklogs);
  if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
    const error = new Error('Maximum allowed backlogs cannot be negative');
    error.statusCode = 400;
    throw error;
  }

  // 8. Create Drive
  const drive = await RecruitmentDrive.create({
    company: targetCompanyId,
    jobRole: roleName,
    jobDescription: jobDescription.trim(),
    package: parsedPackage,
    location: (location || jobLocation || 'Multiple / Pan India').trim(),
    employmentType,
    eligibleBranches: Array.isArray(eligibleBranches) && eligibleBranches.length > 0
      ? eligibleBranches.map((b) => String(b).toUpperCase().trim())
      : ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS'],
    minimumCGPA: parsedCgpa,
    maximumBacklogs: parsedBacklogs,
    graduationYear: parsedYear,
    numberOfPositions: Math.max(1, Number(numberOfPositions) || 1),
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.map((s) => String(s).trim()).filter(Boolean) : [],
    selectionProcess: Array.isArray(selectionProcess) ? selectionProcess : ['Online Assessment', 'Technical Interview', 'HR Interview'],
    rounds: Array.isArray(rounds) && rounds.length > 0 ? rounds : [
      { roundNumber: 1, name: 'Online Assessment', description: 'Aptitude & Coding' },
      { roundNumber: 2, name: 'Technical Interview', description: 'Core CS & System Design' },
      { roundNumber: 3, name: 'HR Interview', description: 'Culture & Behavioral' },
    ],
    applicationDeadline: new Date(targetDeadline),
    driveDate: new Date(driveDate),
    status: status.toUpperCase().trim(),
    createdBy: adminUserId || null,
  });

  const createdDrive = await RecruitmentDrive.findById(drive._id).populate('company', 'companyName name industry tier location website');

  // Notify all students when a new recruitment drive is published/opened
  if (['OPEN', 'PUBLISHED'].includes(drive.status)) {
    const compName = createdDrive.company ? (createdDrive.company.companyName || createdDrive.company.name || 'Hiring Partner') : 'Hiring Partner';
    const notificationService = require('./notificationService');
    try {
      await notificationService.notifyAllStudents({
        title: `New Recruitment Drive: ${roleName}`,
        message: `A new recruitment drive for "${roleName}" at ${compName} has been announced with package ${parsedPackage} LPA. Apply before ${new Date(targetDeadline).toLocaleDateString()}.`,
        type: 'DriveAlert',
        actionUrl: `/student/drives`,
      });
    } catch (e) {
      // Non-blocking notification logging
    }
  }

  return createdDrive;
};



/**
 * List recruitment drives with search, filters, and role-based restrictions
 */
const getAllDrives = async (queryParams, userRole = 'student') => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    branch,
    eligibleBranches,
    year,
    graduationYear,
    minPackage,
    companyId,
    sort = '-createdAt',
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // 1. Role-based status filtering:
  // Students only see active drives (OPEN, UPCOMING, ONGOING)
  const activeStudentStatuses = ['OPEN', 'UPCOMING', 'ONGOING'];
  if (userRole.toLowerCase() === 'student') {
    if (status && activeStudentStatuses.includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    } else {
      filter.status = { $in: activeStudentStatuses };
    }
  } else if (status && status !== 'ALL') {
    filter.status = status.toUpperCase();
  }

  // 2. Company filter
  if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
    filter.company = companyId;
  }

  // 3. Branch filter
  const targetBranch = branch || eligibleBranches;
  if (targetBranch && targetBranch !== 'ALL') {
    filter.eligibleBranches = { $in: [targetBranch.toUpperCase().trim()] };
  }

  // 4. Year filter
  const targetYear = graduationYear || year;
  if (targetYear) {
    const numYear = parseInt(targetYear, 10);
    if (!isNaN(numYear)) {
      filter.graduationYear = numYear;
    }
  }

  // 5. Min CTC package filter
  if (minPackage !== undefined && minPackage !== '') {
    const numPkg = parseFloat(minPackage);
    if (!isNaN(numPkg)) {
      filter.package = { $gte: numPkg };
    }
  }

  // 6. Search query (matches jobRole, location, skills, or company name)
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');

    const matchingCompanies = await Company.find({ name: searchRegex }).select('_id');
    const companyIds = matchingCompanies.map((c) => c._id);

    filter.$or = [
      { jobRole: searchRegex },
      { location: searchRegex },
      { requiredSkills: { $in: [searchRegex] } },
      { company: { $in: companyIds } },
    ];
  }

  const [drives, total] = await Promise.all([
    RecruitmentDrive.find(filter)
      .populate('company', 'name industry tier location website')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    RecruitmentDrive.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    drives,
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
 * Fetch a single recruitment drive by ID with application count
 */
const getDriveById = async (driveId, userRole = 'student') => {
  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    const error = new Error('Invalid recruitment drive ID format');
    error.statusCode = 400;
    throw error;
  }

  const drive = await RecruitmentDrive.findById(driveId)
    .populate('company', 'name industry tier location website contactPerson description')
    .populate('createdBy', 'name email role')
    .lean();

  if (!drive) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  // If student and drive is draft/cancelled, disallow view
  if (userRole.toLowerCase() === 'student' && ['DRAFT', 'CANCELLED'].includes(drive.status)) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  // Get total applications count for this drive
  const applicantCount = await Application.countDocuments({ recruitmentDrive: driveId });

  return {
    ...drive,
    applicantCount,
  };
};

/**
 * Update recruitment drive (Admin only)
 */
const updateDrive = async (driveId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    const error = new Error('Invalid recruitment drive ID format');
    error.statusCode = 400;
    throw error;
  }

  const drive = await RecruitmentDrive.findById(driveId);
  if (!drive) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  // Check company if changed
  if (updateData.company) {
    if (!mongoose.Types.ObjectId.isValid(updateData.company)) {
      const error = new Error('Invalid company ID');
      error.statusCode = 400;
      throw error;
    }
    const compExists = await Company.findById(updateData.company);
    if (!compExists) {
      const error = new Error('Company not found');
      error.statusCode = 404;
      throw error;
    }
    drive.company = updateData.company;
  }

  // Validate dates if either is updated
  const newDeadline = updateData.applicationDeadline || updateData.registrationDeadline || drive.applicationDeadline;
  const newDriveDate = updateData.driveDate || drive.driveDate;
  if (updateData.applicationDeadline || updateData.registrationDeadline || updateData.driveDate) {
    validateDates(newDeadline, newDriveDate);
    drive.applicationDeadline = new Date(newDeadline);
    drive.driveDate = new Date(newDriveDate);
  }

  if (updateData.jobRole || updateData.jobTitle) {
    drive.jobRole = (updateData.jobRole || updateData.jobTitle).trim();
  }
  if (updateData.jobDescription) drive.jobDescription = updateData.jobDescription.trim();
  if (updateData.package !== undefined || updateData.ctcPackage !== undefined) {
    const p = Number(updateData.package !== undefined ? updateData.package : updateData.ctcPackage);
    if (!isNaN(p) && p >= 0) drive.package = p;
  }
  if (updateData.location || updateData.jobLocation) {
    drive.location = (updateData.location || updateData.jobLocation).trim();
  }
  if (updateData.employmentType) drive.employmentType = updateData.employmentType;
  if (updateData.eligibleBranches) {
    drive.eligibleBranches = Array.isArray(updateData.eligibleBranches)
      ? updateData.eligibleBranches.map((b) => String(b).toUpperCase().trim())
      : drive.eligibleBranches;
  }
  if (updateData.minimumCGPA !== undefined) {
    const cgpa = Number(updateData.minimumCGPA);
    if (!isNaN(cgpa) && cgpa >= 0 && cgpa <= 10) drive.minimumCGPA = cgpa;
  }
  if (updateData.maximumBacklogs !== undefined) {
    const backlogs = Number(updateData.maximumBacklogs);
    if (!isNaN(backlogs) && backlogs >= 0) drive.maximumBacklogs = backlogs;
  }
  if (updateData.graduationYear !== undefined) {
    const yr = Number(updateData.graduationYear);
    if (!isNaN(yr) && yr >= 2020 && yr <= 2100) drive.graduationYear = yr;
  }
  if (updateData.numberOfPositions !== undefined) {
    drive.numberOfPositions = Math.max(1, Number(updateData.numberOfPositions) || 1);
  }
  if (updateData.requiredSkills !== undefined) {
    drive.requiredSkills = Array.isArray(updateData.requiredSkills)
      ? updateData.requiredSkills.map((s) => String(s).trim()).filter(Boolean)
      : [];
  }
  if (updateData.selectionProcess !== undefined) {
    drive.selectionProcess = Array.isArray(updateData.selectionProcess) ? updateData.selectionProcess : drive.selectionProcess;
  }
  if (updateData.rounds !== undefined && Array.isArray(updateData.rounds)) {
    drive.rounds = updateData.rounds;
  }
  if (updateData.status) {
    drive.status = updateData.status.toUpperCase().trim();
  }

  await drive.save();
  return await RecruitmentDrive.findById(driveId).populate('company', 'name industry tier location website');
};

/**
 * Delete or cancel recruitment drive (Admin only)
 */
const deleteDrive = async (driveId) => {
  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    const error = new Error('Invalid recruitment drive ID format');
    error.statusCode = 400;
    throw error;
  }

  const drive = await RecruitmentDrive.findById(driveId);
  if (!drive) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if students have already applied
  const applicationCount = await Application.countDocuments({ recruitmentDrive: driveId });

  if (applicationCount > 0) {
    // If applications exist, mark as CANCELLED to preserve audit trail
    drive.status = 'CANCELLED';
    await drive.save();
    return {
      message: `Drive has ${applicationCount} active student applications. Status changed to CANCELLED instead of permanent deletion to preserve application history.`,
      drive,
    };
  } else {
    // No applications yet: safe to permanently delete
    await RecruitmentDrive.findByIdAndDelete(driveId);
    return {
      message: 'Recruitment drive permanently deleted successfully',
      drive: null,
    };
  }
};

module.exports = {
  createDrive,
  getAllDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
};
