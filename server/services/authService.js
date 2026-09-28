const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');

/**
 * Generate a signed JSON Web Token
 * @param {Object} user 
 * @returns {String} JWT Token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Register a new student
 * Creates User and associated Student profile in a single workflow
 */
const registerStudent = async (data) => {
  const {
    name,
    email,
    password,
    rollNumber,
    department,
    batchYear,
    cgpa = 0,
    phone = '',
    skills = [],
  } = data;

  // 1. Check if user with this email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  // 2. Check if roll number already exists
  if (rollNumber) {
    const existingStudent = await Student.findOne({ rollNumber: rollNumber.toUpperCase().trim() });
    if (existingStudent) {
      const error = new Error(`Student with Roll Number ${rollNumber.toUpperCase()} is already registered`);
      error.statusCode = 409;
      throw error;
    }
  } else {
    const error = new Error('Roll Number is required for student registration');
    error.statusCode = 400;
    throw error;
  }

  // 3. Create User account
  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'student',
  });

  // 4. Create linked Student profile
  const newStudent = await Student.create({
    user: newUser._id,
    rollNumber: rollNumber.toUpperCase().trim(),
    department: department || 'CSE',
    batchYear: Number(batchYear) || new Date().getFullYear(),
    cgpa: Number(cgpa) || 0,
    phone,
    skills: Array.isArray(skills) ? skills : [],
  });

  // 5. Generate authentication token
  const token = generateToken(newUser);

  // Return sanitized objects without password
  const userObj = newUser.toObject();
  delete userObj.password;

  return {
    user: userObj,
    student: newStudent,
    token,
  };
};

/**
 * Register an admin or placement officer account
 */
const registerAdmin = async (data) => {
  const { name, email, password, role = 'admin' } = data;

  const normalizedRole = role.toLowerCase();
  if (!['admin', 'tpo'].includes(normalizedRole)) {
    const error = new Error('Invalid administrative role. Must be admin or tpo');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  const newAdmin = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: normalizedRole,
  });

  const token = generateToken(newAdmin);

  const adminObj = newAdmin.toObject();
  delete adminObj.password;

  return {
    user: adminObj,
    token,
  };
};

/**
 * Authenticate user (Student, Admin, or TPO) and issue JWT
 */
const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Please provide both email and password');
    error.statusCode = 400;
    throw error;
  }

  // Fetch user including the password hash for comparison
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check account status
  if (!user.isActive) {
    const error = new Error('Account has been deactivated. Please contact the placement administrator');
    error.statusCode = 403;
    throw error;
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate JWT
  const token = generateToken(user);

  // If student, attach student profile
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ user: user._id });
  }

  // Sanitize user object
  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: userObj,
    student: studentProfile,
    token,
  };
};

/**
 * Get current authenticated user profile
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ user: user._id }).populate('activeResume');
  }

  return {
    user,
    student: studentProfile,
  };
};

module.exports = {
  generateToken,
  registerStudent,
  registerAdmin,
  loginUser,
  getCurrentUser,
};
