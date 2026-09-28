const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student must be linked to a User account'],
      unique: true,
      index: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Please provide student roll number'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Please select department'],
      enum: {
        values: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'OTHER'],
        message: '{VALUE} is not a valid department',
      },
      index: true,
    },
    batchYear: {
      type: Number,
      required: [true, 'Please specify graduation batch year'],
      min: [2020, 'Batch year must be valid'],
      max: [2100, 'Batch year must be valid'],
      index: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'Please provide cumulative CGPA'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10.0'],
    },
    tenthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: null,
    },
    twelfthOrDiplomaPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: null,
    },
    activeBacklogs: {
      type: Number,
      default: 0,
      min: [0, 'Backlogs cannot be negative'],
    },
    historyBacklogs: {
      type: Number,
      default: 0,
      min: [0, 'Backlogs cannot be negative'],
    },
    skills: {
      type: [String],
      default: [],
    },
    programmingLanguages: {
      type: [String],
      default: [],
    },
    projects: [
      {
        title: { type: String, required: [true, 'Project title is required'], trim: true },
        description: { type: String, trim: true, default: '' },
        techStack: { type: [String], default: [] },
        projectUrl: { type: String, trim: true, default: '' },
        githubUrl: { type: String, trim: true, default: '' },
      },
    ],
    certifications: [
      {
        name: { type: String, required: [true, 'Certification name is required'], trim: true },
        issuingOrganization: { type: String, trim: true, default: '' },
        issueDate: { type: Date, default: null },
        credentialUrl: { type: String, trim: true, default: '' },
      },
    ],
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    placementStatus: {
      type: String,
      enum: ['Unplaced', 'Placed', 'Higher Studies', 'Opted Out'],
      default: 'Unplaced',
      index: true,
    },
    currentHighestCtc: {
      type: Number,
      default: 0,
      min: [0, 'Package cannot be negative'],
    },
    activeResume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
