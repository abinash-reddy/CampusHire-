const mongoose = require('mongoose');
const { Student, RecruitmentDrive, Application } = require('../models');

/**
 * Pure evaluation function checking a student against a recruitment drive's criteria
 * @param {Object} student 
 * @param {Object} drive 
 * @returns {Object} { eligible, reasons, matchedCriteria, failedCriteria, skillMatch }
 */
const evaluateEligibility = (student, drive) => {
  const matchedCriteria = [];
  const failedCriteria = [];

  // 1. Check Drive Status & Application Deadline
  const now = new Date();
  const deadline = new Date(drive.applicationDeadline || drive.registrationDeadline);

  if (deadline < now) {
    failedCriteria.push(
      `Application deadline passed on ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}`
    );
  } else {
    matchedCriteria.push('Application registration deadline is open');
  }

  if (drive.status && !['OPEN', 'UPCOMING', 'ONGOING'].includes(drive.status.toUpperCase())) {
    failedCriteria.push(`Drive is currently ${drive.status.toUpperCase()} and not accepting new applications`);
  } else {
    matchedCriteria.push(`Drive is active (${drive.status.toUpperCase()})`);
  }

  // 2. Branch / Department Eligibility
  const studentDept = (student.department || '').toUpperCase().trim();
  const allowedBranches = (drive.eligibleBranches || []).map((b) => b.toUpperCase().trim());

  if (allowedBranches.length > 0 && !allowedBranches.includes(studentDept)) {
    failedCriteria.push(
      `Eligible branches are [${allowedBranches.join(', ')}] but student's branch is ${studentDept}`
    );
  } else {
    matchedCriteria.push(`Branch ${studentDept} is eligible`);
  }

  // 3. Graduation Year / Batch Eligibility
  const studentYear = Number(student.batchYear);
  const eligibleYear = Number(drive.graduationYear);

  if (eligibleYear && studentYear !== eligibleYear) {
    failedCriteria.push(
      `Eligible graduation year is ${eligibleYear} but student's graduation year is ${studentYear}`
    );
  } else {
    matchedCriteria.push(`Graduation year (${studentYear}) matches drive requirement`);
  }

  // 4. CGPA Cutoff
  const studentCgpa = Number(student.cgpa || 0);
  const minCgpa = Number(drive.minimumCGPA !== undefined ? drive.minimumCGPA : 6.0);

  if (studentCgpa < minCgpa) {
    failedCriteria.push(`Required CGPA is ${minCgpa.toFixed(2)} but student's CGPA is ${studentCgpa.toFixed(2)}`);
  } else {
    matchedCriteria.push(`CGPA (${studentCgpa.toFixed(2)}) meets minimum requirement of ${minCgpa.toFixed(2)}`);
  }

  // 5. Active Backlogs
  const studentBacklogs = Number(student.activeBacklogs || 0);
  const maxBacklogs = Number(drive.maximumBacklogs !== undefined ? drive.maximumBacklogs : 0);

  if (studentBacklogs > maxBacklogs) {
    failedCriteria.push(
      `Maximum allowed active backlogs is ${maxBacklogs} but student has ${studentBacklogs} active backlog(s)`
    );
  } else {
    matchedCriteria.push(`Active backlogs count (${studentBacklogs}) within acceptable limit (${maxBacklogs})`);
  }

  // 6. College Placement Policy (Dream Offer Rule)
  if (student.placementStatus === 'Placed' && student.currentHighestCtc > 0) {
    const requiredDreamPackage = student.currentHighestCtc * 1.5;
    const drivePackage = Number(drive.package || 0);

    if (drivePackage < requiredDreamPackage) {
      failedCriteria.push(
        `Placement offer freeze: Student is already placed with ${student.currentHighestCtc} LPA. Under college policy, student can only apply for dream offers >= ${requiredDreamPackage.toFixed(2)} LPA (Drive offers ${drivePackage} LPA)`
      );
    } else {
      matchedCriteria.push(`Qualified for Dream Offer upgrade (${drivePackage} LPA >= ${requiredDreamPackage.toFixed(2)} LPA threshold)`);
    }
  }

  // 7. Skill Analysis (Informative match)
  const studentSkills = (student.skills || []).map((s) => s.toLowerCase().trim());
  const driveSkills = (drive.requiredSkills || []).map((s) => s.toLowerCase().trim());

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of driveSkills) {
    if (studentSkills.includes(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchPercentage = driveSkills.length > 0
    ? Math.round((matchedSkills.length / driveSkills.length) * 100)
    : 100;

  const isEligible = failedCriteria.length === 0;

  return {
    eligible: isEligible,
    reasons: isEligible
      ? ['Student fulfills all eligibility criteria for this recruitment drive.']
      : failedCriteria,
    matchedCriteria,
    failedCriteria,
    skillMatch: {
      matched: matchedSkills,
      missing: missingSkills,
      matchPercentage,
    },
  };
};

/**
 * Check eligibility for a specific student and drive
 * @param {string} driveId 
 * @param {string} studentId 
 */
const checkStudentDriveEligibility = async (driveId, studentId) => {
  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    const error = new Error('Invalid recruitment drive ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    const error = new Error('Invalid student ID format');
    error.statusCode = 400;
    throw error;
  }

  const [drive, student] = await Promise.all([
    RecruitmentDrive.findById(driveId).populate('company', 'name industry tier location website'),
    Student.findById(studentId).populate('user', 'name email'),
  ]);

  if (!drive) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if student has already applied
  const existingApplication = await Application.findOne({
    recruitmentDrive: driveId,
    student: studentId,
  });

  const evaluation = evaluateEligibility(student, drive);

  return {
    drive: {
      id: drive._id,
      jobRole: drive.jobRole,
      company: drive.company ? drive.company.name : 'Unknown',
      package: drive.package,
      deadline: drive.applicationDeadline,
      status: drive.status,
    },
    student: {
      id: student._id,
      name: student.user ? student.user.name : '',
      rollNumber: student.rollNumber,
      department: student.department,
      cgpa: student.cgpa,
      activeBacklogs: student.activeBacklogs,
      batchYear: student.batchYear,
    },
    alreadyApplied: !!existingApplication,
    existingApplicationId: existingApplication ? existingApplication._id : null,
    ...evaluation,
  };
};

/**
 * Find all eligible students in the college database for a given recruitment drive (Admin view)
 * @param {string} driveId 
 * @param {Object} queryParams 
 */
const getEligibleStudentsForDrive = async (driveId, queryParams = {}) => {
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

  const { page = 1, limit = 20, search = '' } = queryParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Base eligibility query filter
  const filter = {
    department: { $in: drive.eligibleBranches },
    batchYear: drive.graduationYear,
    cgpa: { $gte: drive.minimumCGPA },
    activeBacklogs: { $lte: drive.maximumBacklogs },
  };

  // Handle search if provided
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [{ rollNumber: searchRegex }, { skills: { $in: [searchRegex] } }];
  }

  const [candidateStudents, total] = await Promise.all([
    Student.find(filter)
      .populate('user', 'name email role isActive')
      .populate('activeResume', 'fileName atsScore')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Student.countDocuments(filter),
  ]);

  // Evaluate dream offer eligibility for placed students
  const evaluatedStudents = candidateStudents.map((student) => {
    const evalResult = evaluateEligibility(student, drive);
    return {
      student,
      eligible: evalResult.eligible,
      reasons: evalResult.reasons,
      skillMatch: evalResult.skillMatch,
    };
  });

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    drive: {
      id: drive._id,
      jobRole: drive.jobRole,
      minimumCGPA: drive.minimumCGPA,
      maximumBacklogs: drive.maximumBacklogs,
      eligibleBranches: drive.eligibleBranches,
      graduationYear: drive.graduationYear,
    },
    students: evaluatedStudents,
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

module.exports = {
  evaluateEligibility,
  checkStudentDriveEligibility,
  getEligibleStudentsForDrive,
};
