const express = require('express');
const router = express.Router();
const { authenticateToken, logAction } = require('../middleware/auth');
const { checkLimit, getUsageStats } = require('../middleware/planLimits');
const AuditController = require('../controllers/AuditController');
const logger = require('../utils/logger');

/**
 * @route POST /api/ai/generate-summary
 * @desc Generate AI summary using user's configured AI provider
 * @access Private — rate limited by plan
 */
router.post('/generate-summary',
  authenticateToken,
  checkLimit('ai_summary'),
  logAction('ai_summary_generated'),
  AuditController.generateSummary
);

/**
 * @route POST /api/ai/perform-audit
 * @desc Run Benford analysis on the backend
 * @access Private
 */
router.post('/perform-audit',
  authenticateToken,
  AuditController.runAudit
);

/**
 * @route GET /api/ai/usage
 * @desc Get current user's daily usage stats for all actions
 * @access Private
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const plan = req.user.stripe?.plan || 'free';
    const stats = await getUsageStats(req.user._id, plan);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get usage stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get usage stats' });
  }
});

module.exports = router;