const fs = require('fs');
const mongoose = require('mongoose');
const { Resume, Student } = require('../models');

/**
 * Handle new resume upload or replacement for authenticated student
 */
const uploadStudentResume = async ({ userId, file }) => {
  if (!file) {
    const error = new Error('No resume file provided. Please attach a PDF file.');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ user: userId });
  if (!student) {
    // If student record not found, cleanup uploaded physical file
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    const error = new Error('Student profile not found. Please register/complete your profile first.');
    error.statusCode = 404;
    throw error;
  }

  // Demote previous primary resumes
  await Resume.updateMany({ student: student._id }, { isPrimary: false });

  // Create new Resume document
  const resume = await Resume.create({
    student: student._id,
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    isPrimary: true,
  });

  // Link active resume to Student document
  student.activeResume = resume._id;
  await student.save();

  return resume;
};

/**
 * Retrieve current active resume for authenticated student
 */
const getMyResume = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  const resume = await Resume.findOne({
    student: student._id,
    isPrimary: true,
  }).populate('student', 'rollNumber department batchYear');

  return resume;
};

/**
 * Delete a resume and remove physical file from disk with strict ownership verification
 */
const deleteResume = async (resumeId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    const error = new Error('Invalid resume ID format');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  const resume = await Resume.findById(resumeId);
  if (!resume) {
    const error = new Error('Resume not found');
    error.statusCode = 404;
    throw error;
  }

  // Ownership verification: student can only delete their own resume
  if (resume.student.toString() !== student._id.toString()) {
    const error = new Error('Access denied. You cannot modify or delete another student\'s resume.');
    error.statusCode = 403;
    throw error;
  }

  // Delete physical file from disk
  if (resume.filePath && fs.existsSync(resume.filePath)) {
    try {
      fs.unlinkSync(resume.filePath);
    } catch (err) {
      console.warn(`[Warning] Could not remove physical file ${resume.filePath}: ${err.message}`);
    }
  }

  // Remove database record
  await Resume.findByIdAndDelete(resumeId);

  // If this was the active resume, reassign to the latest remaining resume or set to null
  if (student.activeResume && student.activeResume.toString() === resumeId) {
    const latestRemaining = await Resume.findOne({ student: student._id }).sort('-createdAt');
    if (latestRemaining) {
      latestRemaining.isPrimary = true;
      await latestRemaining.save();
      student.activeResume = latestRemaining._id;
    } else {
      student.activeResume = null;
    }
    await student.save();
  }

  return { message: 'Resume deleted successfully' };
};

module.exports = {
  uploadStudentResume,
  getMyResume,
  deleteResume,
};
