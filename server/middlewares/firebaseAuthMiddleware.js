const jwt = require('jsonwebtoken');
const { admin, firebaseInitialized } = require('../config/firebaseAdmin');
const { User, Student } = require('../models');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID Tokens from client requests and resolves corresponding MongoDB User.
 * Supports backward-compatible fallback for JWT tokens during automated testing.
 */
const firebaseAuthMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Authentication token missing. Please log in to access this resource.', 401);
  }

  // 1. Try Firebase ID Token Verification
  if (firebaseInitialized) {
    try {
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      if (decodedFirebase && decodedFirebase.uid) {
        const uid = decodedFirebase.uid;
        const email = (decodedFirebase.email || '').toLowerCase();

        // Resolve User in MongoDB
        let user = await User.findOne({
          $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])],
        });

        if (!user) {
          // Auto-provision MongoDB user record on first Firebase sign-in
          user = await User.create({
            name: decodedFirebase.name || (email ? email.split('@')[0] : 'Campus Student'),
            email: email || `${uid}@campushire.firebase`,
            firebaseUid: uid,
            role: 'student',
          });
        } else if (!user.firebaseUid) {
          user.firebaseUid = uid;
          await user.save();
        }

        // Link student profile reference if present
        if (user.role === 'student') {
          let studentProfile = await Student.findOne({ user: user._id });
          if (!studentProfile) {
            const suffix = String(user._id).slice(-4).toUpperCase();
            const rollNumber = `STU${new Date().getFullYear().toString().slice(-2)}${suffix}`;
            studentProfile = await Student.create({
              user: user._id,
              rollNumber,
              department: 'CSE',
              batchYear: 2026,
              cgpa: 7.5,
              activeBacklogs: 0,
              historyBacklogs: 0,
              placementStatus: 'Unplaced',
            });
          }
          if (!user.student || String(user.student) !== String(studentProfile._id)) {
            user.student = studentProfile._id;
            await user.save();
          }
        }

        req.user = user;
        req.firebaseUser = decodedFirebase;
        return next();
      }
    } catch (fbError) {
      // If not a valid Firebase token, fall through to JWT verification below
    }
  }

  // 2. Fallback: Standard JWT verification (supports audit scripts and test suites)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campushire_development_secret_btwa_key_2026');
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return errorResponse(res, 'User session invalid or deactivated.', 401);
    }

    req.user = user;
    return next();
  } catch (jwtError) {
    return errorResponse(res, 'Invalid or expired session token. Please log in again.', 401);
  }
};

module.exports = {
  firebaseAuthMiddleware,
};
