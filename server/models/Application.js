const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    recruitmentDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
      required: [true, 'Application must be linked to a recruitment drive'],
      index: true,
      alias: 'drive',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Application must be linked to a student'],
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    matchScore: {
      type: Number,
      default: 0,
      min: [0, 'Match score cannot be negative'],
      max: [100, 'Match score cannot exceed 100'],
    },
    status: {
      type: String,
      uppercase: true,
      enum: {
        values: [
          'APPLIED',
          'SHORTLISTED',
          'ASSESSMENT',
          'TECHNICAL_INTERVIEW',
          'HR_INTERVIEW',
          'SELECTED',
          'REJECTED',
          'WITHDRAWN',
        ],
        message: '{VALUE} is not a valid application status',
      },
      default: 'APPLIED',
      index: true,
    },
    currentStage: {
      type: String,
      default: 'Application Submitted',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        stage: { type: String, default: '' },
        remarks: { type: String, default: '' },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate applications by the same student for the same recruitment drive
applicationSchema.index({ recruitmentDrive: 1, student: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
