const UsageLog = require('../models/UsageLog');
const logger = require('../utils/logger');

/**
 * Daily limits per plan per action.
 * -1 = unlimited
 */
const PLAN_LIMITS = {
  free: {
    ai_summary:  5,
    file_upload: 10,
    pdf_export:  3
  },
  pro: {
    ai_summary:  100,
    file_upload: 500,
    pdf_export:  50
  },
  enterprise: {
    ai_summary:  -1,
    file_upload: -1,
    pdf_export:  -1
  }
};

/**
 * Human-readable action labels
 */
const ACTION_LABELS = {
  ai_summary:  'AI summaries',
  file_upload: 'file uploads',
  pdf_export:  'PDF exports'
};

/**
 * Create rate limit middleware for a specific action.
 *
 * Usage:
 *   router.post('/generate-summary', authenticateToken, checkLimit('ai_summary'), handler)
 *
 * @param {string} action - 'ai_summary' | 'file_upload' | 'pdf_export'
 * @param {boolean} increment - Whether to increment counter on this request (default: true)
 */
function checkLimit(action, increment = true) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const plan = req.user.stripe?.plan || 'free';
      const limit = PLAN_LIMITS[plan]?.[action];

      // Unlimited plan — skip check
      if (limit === -1) {
        if (increment) await UsageLog.increment(req.user._id, action);
        return next();
      }

      // Get current usage
      const currentCount = await UsageLog.getCount(req.user._id, action);

      // Limit exceeded
      if (currentCount >= limit) {
        const label = ACTION_LABELS[action];
        return res.status(429).json({
          success: false,
          message: `Daily limit reached`,
          error: 'LIMIT_EXCEEDED',
          data: {
            action,
            limit,
            used: currentCount,
            remaining: 0,
            plan,
            resetAt: getNextMidnightUTC(),
            upgradeRequired: plan === 'free',
            message: `You've used all ${limit} ${label} for today. ${plan === 'free' ? 'Upgrade to Pro for 100/day.' : 'Limit resets at midnight UTC.'}`
          }
        });
      }

      // Attach usage info to request for downstream use
      req.usage = {
        action,
        limit,
        used: currentCount,
        remaining: limit - currentCount,
        plan
      };

      // Increment counter
      if (increment) {
        await UsageLog.increment(req.user._id, action);
        req.usage.used = currentCount + 1;
        req.usage.remaining = limit - currentCount - 1;
      }

      next();
    } catch (error) {
      logger.error('Plan limit check error:', error);
      // Fail open — don't block users if limit check fails
      next();
    }
  };
}

/**
 * Get usage stats for the current user (for frontend display)
 */
async function getUsageStats(userId, plan) {
  const counts = await UsageLog.getAllCounts(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  return {
    ai_summary: {
      used: counts.ai_summary,
      limit: limits.ai_summary,
      remaining: limits.ai_summary === -1 ? -1 : Math.max(0, limits.ai_summary - counts.ai_summary),
      unlimited: limits.ai_summary === -1
    },
    file_upload: {
      used: counts.file_upload,
      limit: limits.file_upload,
      remaining: limits.file_upload === -1 ? -1 : Math.max(0, limits.file_upload - counts.file_upload),
      unlimited: limits.file_upload === -1
    },
    pdf_export: {
      used: counts.pdf_export,
      limit: limits.pdf_export,
      remaining: limits.pdf_export === -1 ? -1 : Math.max(0, limits.pdf_export - counts.pdf_export),
      unlimited: limits.pdf_export === -1
    },
    resetAt: getNextMidnightUTC(),
    plan
  };
}

/**
 * Get next midnight UTC as ISO string
 */
function getNextMidnightUTC() {
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return midnight.toISOString();
}

module.exports = { checkLimit, getUsageStats, PLAN_LIMITS };