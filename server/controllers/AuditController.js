const AuditService = require('../services/AuditService');
const logger = require('../utils/logger');

class AuditController {
  async generateSummary(req, res) {
    try {
      const { result, dataset } = req.body;
      if (!result || !dataset) {
        return res.status(400).json({
          success: false,
          message: 'Analysis result and dataset are required'
        });
      }

      const summary = await AuditService.generateSummary(req.user._id, result, dataset);
      res.json({
        success: true,
        message: 'AI summary generated successfully',
        data: summary
      });
    } catch (error) {
      logger.error('Audit controller summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate AI summary'
      });
    }
  }

  // Placeholder for direct backend audit if needed
  async runAudit(req, res) {
    try {
      const { dataset } = req.body;
      const result = await AuditService.performAudit(dataset);
      res.json({ success: true, data: result });
    } catch (error) {
       res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuditController();
