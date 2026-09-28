const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    contextType: {
      type: String,
      enum: ['GENERAL', 'ELIGIBILITY', 'RESUME', 'DRIVES', 'INTERVIEW', 'SKILLS'],
      default: 'GENERAL',
    },
    retrievedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: true }
);

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Conversation must belong to a user'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Placement Assistant Consultation',
      maxlength: 200,
    },
    messages: [messageSchema],
    category: {
      type: String,
      enum: ['GENERAL', 'RESUME_ADVICE', 'DRIVE_ELIGIBILITY', 'INTERVIEW_PREP', 'SKILL_DEVELOPMENT'],
      default: 'GENERAL',
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

module.exports = AIConversation;
