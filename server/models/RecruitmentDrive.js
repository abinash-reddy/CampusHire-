const mongoose = require('mongoose');

const recruitmentDriveSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Recruitment drive must be linked to a company'],
      index: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Please provide job role / title'],
      trim: true,
      alias: 'jobTitle',
    },
    jobDescription: {
      type: String,
      required: [true, 'Please provide job description'],
    },
    package: {
      type: Number,
      required: [true, 'Please provide package CTC in LPA'],
      min: [0, 'Package CTC cannot be negative'],
      alias: 'ctcPackage',
    },
    location: {
      type: String,
      trim: true,
      default: 'Multiple / Pan India',
      alias: 'jobLocation',
    },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Internship', 'Internship + PPO'],
      default: 'Full-Time',
    },
    eligibleBranches: {
      type: [String],
      default: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS'],
    },
    minimumCGPA: {
      type: Number,
      default: 6.0,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10.0'],
    },
    maximumBacklogs: {
      type: Number,
      default: 0,
      min: [0, 'Backlogs cannot be negative'],
    },
    graduationYear: {
      type: Number,
      required: [true, 'Please specify eligible graduation batch year'],
      index: true,
    },
    numberOfPositions: {
      type: Number,
      default: 1,
      min: [1, 'Number of positions must be at least 1'],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    selectionProcess: {
      type: [String],
      default: ['Online Assessment', 'Technical Interview', 'HR Interview'],
    },
    rounds: [
      {
        roundNumber: { type: Number, default: 1 },
        name: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    applicationDeadline: {
      type: Date,
      required: [true, 'Please provide application deadline'],
      index: true,
      alias: 'registrationDeadline',
    },
    driveDate: {
      type: Date,
      required: [true, 'Please provide drive start date'],
    },
    status: {
      type: String,
      uppercase: true,
      enum: {
        values: ['UPCOMING', 'OPEN', 'CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'DRAFT', 'PUBLISHED'],
        message: '{VALUE} is not a valid drive status',
      },
      default: 'OPEN',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias for eligibilityCriteria structure (for backwards compatibility)
recruitmentDriveSchema.virtual('eligibilityCriteria').get(function () {
  return {
    minCgpa: this.minimumCGPA,
    maxActiveBacklogs: this.maximumBacklogs,
    allowedDepartments: this.eligibleBranches,
    eligibleBatch: this.graduationYear,
  };
});

const RecruitmentDrive = mongoose.model('RecruitmentDrive', recruitmentDriveSchema);

module.exports = RecruitmentDrive;
