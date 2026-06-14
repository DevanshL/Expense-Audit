const mongoose = require('mongoose');

/**
 * Tracks daily usage per user per action.
 * TTL index auto-deletes documents after 25 hours — no cron job needed.
 * Resets happen naturally as old documents expire at midnight.
 */
const usageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['ai_summary', 'file_upload', 'pdf_export'],
    required: true
  },
  // Date string YYYY-MM-DD for grouping by day (UTC)
  date: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  // TTL: auto-delete after 25 hours (gives buffer for timezone differences)
  expiresAt: {
    type: Date,
    default: () => {
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC
      tomorrow.setTime(tomorrow.getTime() + 60 * 60 * 1000); // +1 hour buffer
      return tomorrow;
    },
    index: { expires: 0 } // TTL index — MongoDB deletes when expiresAt is reached
  }
}, {
  timestamps: true
});

// Compound unique index: one document per user per action per day
usageLogSchema.index({ userId: 1, action: 1, date: 1 }, { unique: true });

/**
 * Get today's date string in UTC (YYYY-MM-DD)
 */
usageLogSchema.statics.getTodayDate = function() {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get current usage count for a user/action today
 */
usageLogSchema.statics.getCount = async function(userId, action) {
  const today = this.getTodayDate();
  const log = await this.findOne({ userId, action, date: today });
  return log?.count || 0;
};

/**
 * Increment usage count for a user/action today
 * Uses upsert so it creates or updates atomically
 */
usageLogSchema.statics.increment = async function(userId, action) {
  const today = this.getTodayDate();
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  tomorrow.setTime(tomorrow.getTime() + 60 * 60 * 1000);

  const log = await this.findOneAndUpdate(
    { userId, action, date: today },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: tomorrow }
    },
    { upsert: true, new: true }
  );
  return log.count;
};

/**
 * Get all usage counts for a user today
 */
usageLogSchema.statics.getAllCounts = async function(userId) {
  const today = this.getTodayDate();
  const logs = await this.find({ userId, date: today });
  
  const counts = {
    ai_summary: 0,
    file_upload: 0,
    pdf_export: 0
  };
  
  logs.forEach(log => {
    counts[log.action] = log.count;
  });
  
  return counts;
};

module.exports = mongoose.model('UsageLog', usageLogSchema);