const mongoose = require('mongoose');

const resumeTestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Resume test must belong to a student'],
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Test must be associated with a resume'],
      index: true,
    },
    recruitmentDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
      default: null,
      index: true,
    },
    overallScore: {
      type: Number,
      required: [true, 'Overall score is required'],
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
      alias: 'atsScore',
    },
    sectionScores: {
      contact: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      experience: { type: Number, default: 0 },
      certifications: { type: Number, default: 0 },
      achievements: { type: Number, default: 0 },
    },
    keywordScore: {
      type: Number,
      default: 0,
      min: [0, 'Keyword score cannot be negative'],
      max: [100, 'Keyword score cannot exceed 100'],
    },
    detectedSections: {
      type: [String],
      default: [],
    },
    missingSections: {
      type: [String],
      default: [],
    },
    detectedSkills: {
      type: [String],
      default: [],
    },
    // Job Match Specific Fields (Phase 12)
    testType: {
      type: String,
      enum: ['GENERAL', 'JOB_MATCH'],
      default: 'GENERAL',
      index: true,
    },
    matchPercentage: {
      type: Number,
      min: [0, 'Match percentage cannot be negative'],
      max: [100, 'Match percentage cannot exceed 100'],
      default: 0,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    matchedKeywords: {
      type: [String],
      default: [],
    },
    missingKeywords: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
      alias: 'recommendations',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    isReadable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

  }
);

const ResumeTest = mongoose.model('ResumeTest', resumeTestSchema);

module.exports = ResumeTest;
