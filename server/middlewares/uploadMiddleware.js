const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { errorResponse } = require('../utils/apiResponse');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename: resume_<userId>_<timestamp>.pdf
    const userId = req.user ? req.user._id : 'guest';
    const timestamp = Date.now();
    const sanitizedOriginalName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = `resume_${userId}_${timestamp}_${sanitizedOriginalName}.pdf`;
    cb(null, finalFilename);
  },
});

// File filter: strict PDF validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/x-pdf',
    'application/acrobat',
    'applications/vnd.pdf',
    'text/pdf',
    'application/octet-stream',
  ];
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  const isPdfMime = allowedMimes.includes(file.mimetype);

  if (isPdfExt && isPdfMime) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF documents (.pdf) are permitted.');
    error.statusCode = 400;
    cb(error, false);
  }
};

// 5MB max file size
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Middleware wrapper to cleanly handle Multer limits and validation errors.
 * Accepts either 'resume' or 'file' field name.
 */
const uploadResumeMiddleware = (req, res, next) => {
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return errorResponse(res, 'File size exceeds maximum permitted limit of 5MB.', 400);
        }
        return errorResponse(res, `Upload error: ${err.message}`, 400);
      }
      return errorResponse(res, err.message, err.statusCode || 400);
    }

    if (req.files) {
      if (req.files.resume && req.files.resume[0]) {
        req.file = req.files.resume[0];
      } else if (req.files.file && req.files.file[0]) {
        req.file = req.files.file[0];
      }
    }

    next();
  });
};

module.exports = {
  uploadResumeMiddleware,
  uploadDir,
};

