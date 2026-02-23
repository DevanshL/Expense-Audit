const express = require('express');
const ChatService = require('../services/ChatService');
const { authenticateToken } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat/message
// Send a user message and get an AI response
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/message',
  [
    body('auditId').notEmpty().withMessage('auditId is required'),
    body('message').notEmpty().isLength({ max: 4000 }).withMessage('message is required and max 4000 chars'),
    body('auditSnapshot').optional().isObject(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { auditId, message, auditSnapshot } = req.body;
      const userId = req.user._id;

      const result = await ChatService.sendMessage(userId, auditId, message, auditSnapshot);

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Chat message error:', error.message);
      const status = error.message.includes('API key') ? 400 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chat/history/:auditId
// Load full chat history for an audit session
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/history/:auditId',
  [param('auditId').notEmpty()],
  handleValidation,
  async (req, res) => {
    try {
      const history = await ChatService.getHistory(req.user._id, req.params.auditId);
      res.json({ success: true, data: history });
    } catch (error) {
      logger.error('Chat history error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/chat/session/:auditId
// Clear a specific audit's chat session
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  '/session/:auditId',
  [param('auditId').notEmpty()],
  handleValidation,
  async (req, res) => {
    try {
      const deleted = await ChatService.clearSession(req.user._id, req.params.auditId);
      res.json({ success: true, deleted });
    } catch (error) {
      logger.error('Chat delete error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/chat/all
// Clear ALL sessions for the current user (called on logout)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/all', async (req, res) => {
  try {
    const count = await ChatService.clearAllSessions(req.user._id);
    res.json({ success: true, sessionsCleared: count });
  } catch (error) {
    logger.error('Chat clear-all error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
