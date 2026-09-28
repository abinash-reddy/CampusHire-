const mongoose = require('mongoose');
const { Student, User, Application, Result } = require('../models');

/**
 * Fetch paginated, filtered, and searched students for Admin / Placement Officers
 * @param {Object} queryParams
 */
const getAllStudents = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    branch,
    department,
    year,
    batchYear,
    status,
    placementStatus,
    minCgpa,
    sort = '-createdAt',
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Build filter criteria for Student collection
  const filter = {};

  // 1. Department / Branch filter
  const targetDept = department || branch;
  if (targetDept && targetDept !== 'ALL') {
    filter.department = targetDept.toUpperCase().trim();
  }

  // 2. Batch Year filter
  const targetYear = batchYear || year;
  if (targetYear) {
    const parsedYear = parseInt(targetYear, 10);
    if (!isNaN(parsedYear)) {
      filter.batchYear = parsedYear;
    }
  }

  // 3. Placement Status filter
  const targetStatus = placementStatus || status;
  if (targetStatus && targetStatus !== 'ALL') {
    filter.placementStatus = targetStatus;
  }

  // 4. Minimum CGPA filter
  if (minCgpa !== undefined && minCgpa !== '') {
    const parsedCgpa = parseFloat(minCgpa);
    if (!isNaN(parsedCgpa)) {
      filter.cgpa = { $gte: parsedCgpa };
    }
  }

  // 5. Search by Name, Email, Roll Number, or Skill
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');

    // Find users matching name or email
    const matchingUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select('_id');

    const matchingUserIds = matchingUsers.map((u) => u._id);

    filter.$or = [
      { rollNumber: searchRegex },
      { skills: { $in: [searchRegex] } },
      { user: { $in: matchingUserIds } },
    ];
  }

  // Execute query with pagination and populate user (explicitly excluding password)
  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('user', 'name email role isActive lastLogin')
      .populate('activeResume', 'fileName atsScore detectedSkills createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Student.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    students,
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
 * Fetch single student complete record with application history and placement offers
 * @param {string} studentId
 */
const getStudentById = async (studentId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    const error = new Error('Invalid student ID format');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId)
    .populate('user', 'name email role isActive lastLogin createdAt')
    .populate('activeResume')
    .lean();

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  // Fetch student's recruitment applications
  const applications = await Application.find({ student: studentId })
    .populate({
      path: 'recruitmentDrive',
      select: 'jobTitle ctcPackage registrationDeadline status company',
      populate: { path: 'company', select: 'name industry tier' },
    })
    .sort('-appliedAt')
    .lean();

  // Fetch placement offers/results if any
  const results = await Result.find({ student: studentId })
    .populate('company', 'name industry tier')
    .populate('recruitmentDrive', 'jobTitle ctcPackage')
    .lean();

  return {
    ...student,
    applicationStats: {
      totalApplications: applications.length,
      offersCount: results.length,
    },
    applications,
    placementOffers: results,
  };
};

module.exports = {
  getAllStudents,
  getStudentById,
};
