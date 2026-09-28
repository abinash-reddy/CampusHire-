const mongoose = require('mongoose');

const placementUpdateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Update title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Update description is required'],
      alias: 'content',
    },
    category: {
      type: String,
      uppercase: true,
      enum: {
        values: [
          'IMPORTANT',
          'COMPANY',
          'RECRUITMENT',
          'INTERVIEW',
          'RESULT',
          'GENERAL',
          'ANNOUNCEMENT',
          'DRIVENEWS',
          'PLACEMENTMILESTONE',
          'POLICYUPDATE',
          'PREPARATIONTIPS',
        ],
        message: '{VALUE} is not a valid category',
      },
      default: 'GENERAL',
      index: true,
    },
    priority: {
      type: String,
      uppercase: true,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'MEDIUM',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user is required'],
      alias: 'publishedBy',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    targetDepartments: {
      type: [String],
      default: ['ALL'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const PlacementUpdate = mongoose.model('PlacementUpdate', placementUpdateSchema);

module.exports = PlacementUpdate;

