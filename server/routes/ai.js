const express = require('express');
const router = express.Router();
const { authenticateToken, logAction } = require('../middleware/auth');
const AuditController = require('../controllers/AuditController');

/**
 * @route POST /api/ai/generate-summary
 * @desc Generate AI summary using user's configured AI provider
 * @access Private
 */
router.post('/generate-summary', 
  authenticateToken, 
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

module.exports = router;
