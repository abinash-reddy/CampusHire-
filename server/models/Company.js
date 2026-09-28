const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide company name'],
      unique: true,
      trim: true,
      index: true,
      alias: 'companyName',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: 'IT / Software',
    },
    location: {
      type: String,
      trim: true,
      default: 'India',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    jobRoles: {
      type: [String],
      default: [],
    },
    tier: {
      type: String,
      enum: ['Normal', 'Dream', 'SuperDream'],
      default: 'Normal',
    },
    contactPerson: {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
