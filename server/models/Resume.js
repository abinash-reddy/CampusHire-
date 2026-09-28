const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Resume must belong to a student'],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    filePath: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    storageProvider: {
      type: String,
      enum: ['local', 'firebase'],
      default: 'local',
    },
    version: {
      type: Number,
      default: 1,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    extractedText: {
      type: String,
      default: '',
    },
    detectedSections: {
      type: [String],
      default: [],
    },
    detectedSkills: {
      type: [String],
      default: [],
    },
    atsScore: {
      type: Number,
      default: 0,
      min: [0, 'ATS score cannot be negative'],
      max: [100, 'ATS score cannot exceed 100'],
    },
    isPrimary: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
