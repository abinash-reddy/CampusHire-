const { errorResponse } = require('../utils/apiResponse');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles (e.g. 'STUDENT', 'ADMIN', 'TPO')
 */
const roleMiddleware = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required to verify permissions.', 401);
    }

    const userRole = (req.user.role || '').toLowerCase();

    // Support admin/tpo equivalence if 'admin' is passed
    const isAuthorized =
      normalizedAllowed.includes(userRole) ||
      (normalizedAllowed.includes('admin') && userRole === 'tpo');

    if (!isAuthorized) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user.role.toUpperCase()}' does not have required permissions for this action.`,
        403
      );
    }

    next();
  };
};

module.exports = {
  roleMiddleware,
};
