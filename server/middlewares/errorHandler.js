const { errorResponse } = require('../utils/apiResponse');

/**
 * Handle 404 - Not Found for unhandled routes
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Cannot ${req.method} ${req.originalUrl} - Route not found`, 404);
};

/**
 * Centralized global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Unhandled Error] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, `Resource not found with id of ${err.value}`, 404);
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, `Duplicate value entered for ${field}. It must be unique.`, 409);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, 'Validation Error', 400, messages);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token. Please authenticate again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Session token expired. Please login again.', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
