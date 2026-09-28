const { Student, User } = require('../models');

/**
 * Validate that a URL is a valid http/https URL
 * @param {string} urlString 
 * @returns {boolean}
 */
const isValidUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string' || urlString.trim() === '') {
    return true; // Empty string is acceptable (field optional)
  }
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

/**
 * Fetch profile for a student by their linked user ID
 * @param {string} userId 
 */
const getStudentProfile = async (userId) => {
  let student = await Student.findOne({ user: userId })
    .populate('user', 'name email role isActive lastLogin')
    .populate('activeResume', 'fileName atsScore detectedSkills detectedSections createdAt');

  if (!student) {
    const user = await User.findById(userId);
    if (user && (user.role === 'student' || !user.role)) {
      const suffix = String(user._id).slice(-4).toUpperCase();
      const generatedRoll = `STU${new Date().getFullYear().toString().slice(-2)}${suffix}`;

      student = await Student.create({
        user: user._id,
        rollNumber: generatedRoll,
        department: 'CSE',
        batchYear: 2026,
        cgpa: 7.5,
        activeBacklogs: 0,
        historyBacklogs: 0,
        placementStatus: 'Unplaced',
      });
      user.student = student._id;
      await user.save();

      student = await Student.findById(student._id)
        .populate('user', 'name email role isActive lastLogin')
        .populate('activeResume', 'fileName atsScore detectedSkills detectedSections createdAt');
    } else {
      const error = new Error('Student profile not found for this user');
      error.statusCode = 404;
      throw error;
    }
  }

  return student;
};

/**
 * Update allowed fields in a student's own profile
 * Disallows modification of admin-only fields (e.g. placementStatus, currentHighestCtc, user)
 * @param {string} userId 
 * @param {Object} data 
 */
const updateStudentProfile = async (userId, data) => {
  let student = await Student.findOne({ user: userId });
  if (!student) {
    const user = await User.findById(userId);
    if (user && (user.role === 'student' || !user.role)) {
      const suffix = String(user._id).slice(-4).toUpperCase();
      const generatedRoll = `STU${new Date().getFullYear().toString().slice(-2)}${suffix}`;
      student = await Student.create({
        user: user._id,
        rollNumber: generatedRoll,
        department: data.department || 'CSE',
        batchYear: data.batchYear || 2026,
        cgpa: data.cgpa || 7.5,
        placementStatus: 'Unplaced',
      });
      user.student = student._id;
      await user.save();
    } else {
      const error = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const {
    name,
    department,
    batchYear,
    cgpa,
    tenthPercentage,
    twelfthOrDiplomaPercentage,
    activeBacklogs,
    historyBacklogs,
    skills,
    programmingLanguages,
    projects,
    certifications,
    githubUrl,
    linkedinUrl,
    phone,
    gender,
  } = data;

  // 1. Validate CGPA if provided
  if (cgpa !== undefined && cgpa !== null) {
    const numCgpa = Number(cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      const error = new Error('CGPA must be a valid number between 0.0 and 10.0');
      error.statusCode = 400;
      throw error;
    }
    student.cgpa = numCgpa;
  }

  // 2. Validate Batch Year if provided
  if (batchYear !== undefined && batchYear !== null) {
    const numYear = Number(batchYear);
    if (isNaN(numYear) || numYear < 2020 || numYear > 2100) {
      const error = new Error('Batch Year must be a valid year between 2020 and 2100');
      error.statusCode = 400;
      throw error;
    }
    student.batchYear = numYear;
  }

  // 3. Validate Percentage fields if provided
  if (tenthPercentage !== undefined) {
    if (tenthPercentage !== null) {
      const numTenth = Number(tenthPercentage);
      if (isNaN(numTenth) || numTenth < 0 || numTenth > 100) {
        const error = new Error('10th percentage must be between 0 and 100');
        error.statusCode = 400;
        throw error;
      }
      student.tenthPercentage = numTenth;
    } else {
      student.tenthPercentage = null;
    }
  }

  if (twelfthOrDiplomaPercentage !== undefined) {
    if (twelfthOrDiplomaPercentage !== null) {
      const numTwelfth = Number(twelfthOrDiplomaPercentage);
      if (isNaN(numTwelfth) || numTwelfth < 0 || numTwelfth > 100) {
        const error = new Error('12th / Diploma percentage must be between 0 and 100');
        error.statusCode = 400;
        throw error;
      }
      student.twelfthOrDiplomaPercentage = numTwelfth;
    } else {
      student.twelfthOrDiplomaPercentage = null;
    }
  }

  // 4. Validate Backlogs if provided
  if (activeBacklogs !== undefined && activeBacklogs !== null) {
    const numActive = Number(activeBacklogs);
    if (isNaN(numActive) || numActive < 0) {
      const error = new Error('Active backlogs cannot be negative');
      error.statusCode = 400;
      throw error;
    }
    student.activeBacklogs = numActive;
  }

  if (historyBacklogs !== undefined && historyBacklogs !== null) {
    const numHistory = Number(historyBacklogs);
    if (isNaN(numHistory) || numHistory < 0) {
      const error = new Error('History backlogs cannot be negative');
      error.statusCode = 400;
      throw error;
    }
    student.historyBacklogs = numHistory;
  }

  // 5. Validate URLs (GitHub, LinkedIn)
  if (githubUrl !== undefined) {
    if (!isValidUrl(githubUrl)) {
      const error = new Error('Invalid GitHub URL format. Must start with http:// or https://');
      error.statusCode = 400;
      throw error;
    }
    student.githubUrl = githubUrl.trim();
  }

  if (linkedinUrl !== undefined) {
    if (!isValidUrl(linkedinUrl)) {
      const error = new Error('Invalid LinkedIn URL format. Must start with http:// or https://');
      error.statusCode = 400;
      throw error;
    }
    student.linkedinUrl = linkedinUrl.trim();
  }

  // 6. Validate & Update Department / Branch
  if (department !== undefined) {
    const allowedDepts = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'OTHER'];
    const deptUpper = department.toUpperCase().trim();
    if (!allowedDepts.includes(deptUpper)) {
      const error = new Error(`Invalid department. Allowed: ${allowedDepts.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    student.department = deptUpper;
  }

  // 7. Update Skills & Programming Languages
  if (skills !== undefined) {
    student.skills = Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : [];
  }

  if (programmingLanguages !== undefined) {
    student.programmingLanguages = Array.isArray(programmingLanguages)
      ? programmingLanguages.map((p) => String(p).trim()).filter(Boolean)
      : [];
  }

  // 8. Validate & Update Projects
  if (projects !== undefined) {
    if (!Array.isArray(projects)) {
      const error = new Error('Projects must be an array');
      error.statusCode = 400;
      throw error;
    }

    for (const proj of projects) {
      if (!proj.title || typeof proj.title !== 'string' || proj.title.trim() === '') {
        const error = new Error('Every project must have a title');
        error.statusCode = 400;
        throw error;
      }
      if (proj.projectUrl && !isValidUrl(proj.projectUrl)) {
        const error = new Error(`Invalid project URL for project "${proj.title}"`);
        error.statusCode = 400;
        throw error;
      }
      if (proj.githubUrl && !isValidUrl(proj.githubUrl)) {
        const error = new Error(`Invalid GitHub repository URL for project "${proj.title}"`);
        error.statusCode = 400;
        throw error;
      }
    }
    student.projects = projects;
  }

  // 9. Validate & Update Certifications
  if (certifications !== undefined) {
    if (!Array.isArray(certifications)) {
      const error = new Error('Certifications must be an array');
      error.statusCode = 400;
      throw error;
    }

    for (const cert of certifications) {
      if (!cert.name || typeof cert.name !== 'string' || cert.name.trim() === '') {
        const error = new Error('Every certification must have a name');
        error.statusCode = 400;
        throw error;
      }
      if (cert.credentialUrl && !isValidUrl(cert.credentialUrl)) {
        const error = new Error(`Invalid credential URL for certification "${cert.name}"`);
        error.statusCode = 400;
        throw error;
      }
    }
    student.certifications = certifications;
  }

  // 10. Update Optional Contact Info
  if (phone !== undefined) {
    student.phone = String(phone).trim();
  }

  if (gender !== undefined) {
    student.gender = gender;
  }

  // Save student updates
  await student.save();

  // If name was provided, also update name in User document
  if (name && typeof name === 'string' && name.trim().length >= 2) {
    await User.findByIdAndUpdate(userId, { name: name.trim() });
  }

  // Return populated student
  return await Student.findById(student._id)
    .populate('user', 'name email role isActive')
    .populate('activeResume', 'fileName atsScore detectedSkills createdAt');
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
};
