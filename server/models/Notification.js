const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'DriveAlert',
        'ApplicationStatus',
        'InterviewSchedule',
        'ResultAnnouncement',
        'GeneralNotice',
        'DRIVE_PUBLISHED',
        'APPLICATION_SUBMITTED',
        'APPLICATION_SHORTLISTED',
        'INTERVIEW_SCHEDULED',
        'STATUS_CHANGED',
        'RESULT_PUBLISHED',
        'UPDATE_ANNOUNCEMENT',
      ],
      default: 'GeneralNotice',
      index: true,
    },
    actionUrl: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
