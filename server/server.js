const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

// 1. Load environment variables
dotenv.config();

// 2. Import database connection and middlewares
const connectDB = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// 3. Import routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminStudentRoutes = require('./routes/adminStudentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const driveRoutes = require('./routes/driveRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const placementUpdateRoutes = require('./routes/placementUpdateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const resultRoutes = require('./routes/resultRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// 4. Initialize Express Application



const app = express();


// 5. Connect Database
connectDB();

// 6. Global Middlewares
// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin === '*' ? true : [allowedOrigin, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger (Development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static Files (Uploaded Resumes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 7. Base and Health Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CampusHire API - College Placement & Recruitment Management System',
    healthCheck: '/api/health',
    version: '1.0.0',
  });
});

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminStudentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/updates', placementUpdateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/analytics', analyticsRoutes);

// 8. 404 & Centralized Error Handling Middlewares




app.use(notFoundHandler);
app.use(errorHandler);

// 9. Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CampusHire Server running in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.message}`);
});

module.exports = app;
