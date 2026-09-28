const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    recruitmentDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
      required: [true, 'Interview must be linked to a recruitment drive'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Interview must be linked to a student'],
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Interview must be linked to an application'],
      index: true,
    },
    round: {
      type: String,
      required: [true, 'Please specify interview round name'],
      trim: true,
      alias: 'roundName',
    },
    roundNumber: {
      type: Number,
      default: 1,
    },
    date: {
      type: Date,
      required: [true, 'Please provide interview date'],
      index: true,
    },
    time: {
      type: String,
      required: [true, 'Please provide interview time (e.g. 10:00 AM or 14:30)'],
      trim: true,
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'ONLINE', 'OFFLINE'],
      default: 'Online',
    },
    venue: {
      type: String,
      trim: true,
      default: '',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    venueOrLink: {
      type: String,
      trim: true,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      uppercase: true,
      enum: {
        values: ['SCHEDULED', 'COMPLETED', 'CLEARED', 'FAILED', 'CANCELLED', 'RESCHEDULED'],
        message: '{VALUE} is not a valid interview status',
      },
      default: 'SCHEDULED',
      index: true,
    },
    feedback: {
      type: String,
      default: '',
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    interviewerNames: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to synchronize scheduledAt and venueOrLink
interviewSchema.pre('save', function (next) {
  if (this.date) {
    this.scheduledAt = this.date;
  }
  if (!this.venueOrLink) {
    this.venueOrLink = this.mode?.toUpperCase() === 'OFFLINE' ? this.venue : this.meetingLink;
  }
  next();
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;

