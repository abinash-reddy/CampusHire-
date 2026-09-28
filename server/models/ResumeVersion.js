const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Resume version must belong to a student'],
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Resume version must be linked to a root resume entity'],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: [true, 'Version number is required'],
      default: 1,
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
    atsScore: {
      type: Number,
      default: 0,
      min: [0, 'ATS score cannot be negative'],
      max: [100, 'ATS score cannot exceed 100'],
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    changeNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast student version lookups
resumeVersionSchema.index({ student: 1, versionNumber: -1 });

const ResumeVersion = mongoose.model('ResumeVersion', resumeVersionSchema);

module.exports = ResumeVersion;
