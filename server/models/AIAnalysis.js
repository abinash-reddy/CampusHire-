const mongoose = require('mongoose');

const skillGapItemSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    meaning: { type: String, default: '' },
    whatToLearn: { type: String, default: '' },
    preparationOrder: { type: Number, default: 1 },
    resources: { type: [String], default: [] },
  },
  { _id: false }
);

const interviewQuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['TECHNICAL', 'HR', 'BEHAVIORAL', 'APTITUDE', 'JOB_SPECIFIC'],
      default: 'TECHNICAL',
    },
    question: { type: String, required: true },
    context: { type: String, default: '' },
    sampleAnswerStructure: { type: String, default: '' },
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'AI analysis must be associated with a student'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'AI analysis must be associated with a user account'],
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
      index: true,
    },
    recruitmentDrive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
      default: null,
      index: true,
    },
    analysisType: {
      type: String,
      enum: ['RESUME_REVIEW', 'JOB_MATCH', 'SKILL_GAP', 'INTERVIEW_PREP', 'TEXT_IMPROVEMENT'],
      required: [true, 'Analysis type is required'],
      index: true,
    },
    inputPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    sectionScores: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    detectedSkills: {
      type: [String],
      default: [],
    },
    missingSections: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    keywordSuggestions: {
      type: [String],
      default: [],
    },
    projectSuggestions: {
      type: [String],
      default: [],
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
    skillGaps: [skillGapItemSchema],
    originalText: {
      type: String,
      default: '',
    },
    improvedText: {
      type: String,
      default: '',
    },
    improvementReason: {
      type: String,
      default: '',
    },
    interviewQuestions: [interviewQuestionSchema],
    answerFeedback: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isCached: {
      type: Boolean,
      default: false,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast caching and lookup
aiAnalysisSchema.index({ student: 1, analysisType: 1, recruitmentDrive: 1, createdAt: -1 });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

module.exports = AIAnalysis;
