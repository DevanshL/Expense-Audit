const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 20000,
  },
  tokenCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Unique identifier for the audit run this chat is tied to
    auditId: {
      type: String,
      required: true,
    },
    // Full message history
    messages: [messageSchema],

    // Rolling summary of messages that have been compressed (to save tokens)
    // Covers messages[0..summaryUpToIndex-1]
    summary: {
      type: String,
      default: '',
    },
    summaryUpToIndex: {
      type: Number,
      default: 0,
    },

    // Snapshot of the BenfordResult that seeded this conversation
    // Stored so we can always rebuild the system context
    auditSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Track which AI provider/model was used
    lastProvider: {
      type: String,
      default: 'gemini',
    },
    lastModel: {
      type: String,
      default: 'gemini-2.0-flash',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one session per user per audit
chatSessionSchema.index({ userId: 1, auditId: 1 }, { unique: true });

// Auto-expire sessions 30 days after last update
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Helper: total message count
chatSessionSchema.virtual('totalMessages').get(function () {
  return this.messages.length;
});

// Helper: messages that are NOT yet summarized
chatSessionSchema.methods.getRecentMessages = function () {
  return this.messages.slice(this.summaryUpToIndex);
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
