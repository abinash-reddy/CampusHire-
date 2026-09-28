const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Register a new student
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, department, batchYear } = req.body;

    // Validation checks
    if (!name || !email || !password || !rollNumber) {
      return errorResponse(
        res,
        'Please provide all required fields: name, email, password, and rollNumber',
        400
      );
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Please provide a valid email address', 400);
    }

    const result = await authService.registerStudent(req.body);

    return successResponse(res, 'Student registration successful', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register an administrator / TPO (Bootstrap / Admin setup)
 * @route   POST /api/auth/register-admin
 * @access  Public (Can be restricted via admin invite key)
 */
const registerAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'admin', adminKey } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Please provide name, email, and password', 400);
    }

    // Basic admin setup key check if set in env
    const configuredKey = process.env.ADMIN_REGISTRATION_KEY || 'campushire_admin_secret_2026';
    if (adminKey && adminKey !== configuredKey) {
      return errorResponse(res, 'Invalid admin registration authorization key', 403);
    }

    const result = await authService.registerAdmin({ name, email, password, role });

    return successResponse(res, 'Admin account created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user (Student or Admin) & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Please provide both email and password', 400);
    }

    const result = await authService.loginUser({ email, password });

    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Student & Admin)
 */
const getMe = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user._id);

    return successResponse(res, 'User profile retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sync Firebase authenticated user with MongoDB
 * @route   POST /api/auth/firebase-sync
 * @access  Public (Requires valid Firebase ID Token)
 */
const firebaseSync = async (req, res, next) => {
  try {
    const { idToken, rollNumber, department, batchYear, name } = req.body;
    const token =
      idToken ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return errorResponse(res, 'Firebase ID Token is required', 400);
    }

    const { admin, firebaseInitialized } = require('../config/firebaseAdmin');
    if (!firebaseInitialized) {
      return errorResponse(res, 'Firebase Admin is not initialized on server', 500);
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email } = decoded;
    const normalizedEmail = (email || '').toLowerCase();

    const { User, Student } = require('../models');

    // Find existing user by firebaseUid or email
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, ...(normalizedEmail ? [{ email: normalizedEmail }] : [])],
    });

    if (!user) {
      user = await User.create({
        name: name || decoded.name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Campus Student'),
        email: normalizedEmail || `${uid}@campushire.firebase`,
        firebaseUid: uid,
        role: 'student',
      });
    } else if (!user.firebaseUid) {
      user.firebaseUid = uid;
      await user.save();
    }

    // Link or create Student document if applicable
    let student = await Student.findOne({ user: user._id });
    if (!student && user.role === 'student') {
      const suffix = String(user._id).slice(-4).toUpperCase();
      const genRoll = rollNumber
        ? rollNumber.toUpperCase()
        : `STU${new Date().getFullYear().toString().slice(-2)}${suffix}`;

      student = await Student.create({
        user: user._id,
        rollNumber: genRoll,
        department: department || 'CSE',
        batchYear: batchYear || 2026,
        cgpa: 7.5,
        activeBacklogs: 0,
        historyBacklogs: 0,
        placementStatus: 'Unplaced',
      });
      user.student = student._id;
      await user.save();
    } else if (student && !user.student) {
      user.student = student._id;
      await user.save();
    }

    return successResponse(
      res,
      'Firebase authentication synchronized successfully',
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          firebaseUid: user.firebaseUid,
        },
        student,
        token,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  registerAdminUser,
  login,
  getMe,
  firebaseSync,
};

