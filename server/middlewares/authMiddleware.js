const jwt = require('jsonwebtoken');
const { admin, firebaseInitialized } = require('../config/firebaseAdmin');
const { User, Student } = require('../models');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Universal Authentication Middleware
 * Verifies incoming requests via Firebase ID Tokens (Firebase Admin SDK) or standard JWTs.
 * Attaches the resolved MongoDB User to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Reject if token is missing
  if (!token) {
    return errorResponse(res, 'Authentication required. No access token provided.', 401);
  }

  // 3. Attempt Firebase ID Token verification if Firebase is configured
  if (firebaseInitialized) {
    try {
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      if (decodedFirebase && decodedFirebase.uid) {
        const uid = decodedFirebase.uid;
        const email = (decodedFirebase.email || '').toLowerCase();

        // Find or provision user in MongoDB
        let user = await User.findOne({
          $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])],
        });

        if (!user) {
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

        // Link student profile if student role
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
      // Not a valid Firebase token; fall through to standard JWT verification below
    }
  }

  // 4. Fallback: JWT Verification
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'campushire_development_secret_btwa_key_2026'
    );
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 'The user belonging to this session token no longer exists.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated.', 403);
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session token has expired. Please login again.', 401);
    }
    return errorResponse(res, 'Invalid or malformed token. Authentication failed.', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Checks if authenticated user has one of the allowed roles (case-insensitive)
 * @param  {...String} roles e.g. 'STUDENT', 'ADMIN', 'TPO'
 */
const authorize = (...roles) => {
  const normalizedAllowedRoles = roles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 'Access denied. User role not determined.', 403);
    }

    const userRole = req.user.role.toLowerCase();

    // Map admin and tpo equivalence
    const isAuthorized =
      normalizedAllowedRoles.includes(userRole) ||
      (normalizedAllowedRoles.includes('admin') && userRole === 'tpo');

    if (!isAuthorized) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user.role.toUpperCase()}' is not authorized to access this resource. Required: ${roles.join(', ')}`,
        403
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  firebaseAuthMiddleware: protect,
  roleMiddleware: authorize,
};
