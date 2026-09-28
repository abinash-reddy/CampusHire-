const mongoose = require('mongoose');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    System health check
 * @route   GET /api/health
 * @access  Public
 */
const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const healthData = {
    service: 'CampusHire API',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStateMap[mongoose.connection.readyState] || 'unknown',
      readyState: mongoose.connection.readyState,
    },
  };

  return successResponse(res, 'CampusHire API is operational', healthData, 200);
};

module.exports = {
  getHealthStatus,
};
