const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    recruitmentDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
      required: [true, 'Result must be linked to a recruitment drive'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Result must be linked to a student'],
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Result must be linked to a company'],
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
      index: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
      alias: 'jobTitle',
    },
    package: {
      type: Number,
      required: [true, 'Package (CTC in LPA) is required'],
      min: [0, 'Package cannot be negative'],
      alias: 'packageCtc',
    },
    status: {
      type: String,
      uppercase: true,
      enum: {
        values: ['SELECTED', 'REJECTED', 'WAITLISTED', 'OFFERED', 'ACCEPTED'],
        message: '{VALUE} is not a valid result status',
      },
      required: [true, 'Result status is required'],
      default: 'SELECTED',
      index: true,
    },
    resultDate: {
      type: Date,
      default: Date.now,
      alias: 'selectionDate',
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    acceptanceStatus: {
      type: String,
      enum: ['Offered', 'Accepted', 'Declined', 'Revoked'],
      default: 'Offered',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate result publication for the same student on the same recruitment drive
resultSchema.index({ recruitmentDrive: 1, student: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;

