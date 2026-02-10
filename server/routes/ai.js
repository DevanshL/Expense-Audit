const express = require('express');
const router = express.Router();
const { authenticateToken, logAction } = require('../middleware/auth');
const { decrypt } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * @route POST /api/ai/generate-summary
 * @desc Generate AI summary using user's configured AI provider
 * @access Private
 */
router.post('/generate-summary', authenticateToken, logAction('ai_summary_generated'), async (req, res) => {
  try {
    logger.info('AI summary generation request received', {
      userId: req.user?._id,
      hasBody: !!req.body,
      bodyKeys: Object.keys(req.body || {})
    });

    const { result, dataset } = req.body;
    const userId = req.user._id;

    // Validate request data
    if (!result || !dataset) {
      logger.warn('Invalid request data for AI summary', {
        hasResult: !!result,
        hasDataset: !!dataset,
        userId
      });
      return res.status(400).json({
        success: false,
        message: 'Analysis result and dataset are required'
      });
    }

    // Get user with AI configuration (including encrypted API keys)
    logger.info('Fetching user AI configuration', { userId });
    const user = await require('../models/User').findById(userId).select('+aiConfig.models.openai.apiKey +aiConfig.models.gemini.apiKey +aiConfig.models.anthropic.apiKey +aiConfig.models.azure.apiKey +aiConfig.models.azure.endpoint +aiConfig.models.azure.deploymentName');
    
    if (!user) {
      logger.error('User not found for AI summary generation', { userId });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('User AI configuration retrieved', {
      userId,
      hasAIConfig: !!user.aiConfig,
      preferredProvider: user.aiConfig?.preferredProvider,
      availableProviders: user.aiConfig?.models ? Object.keys(user.aiConfig.models) : []
    });

    // Check if user has AI configuration
    if (!user.aiConfig || !user.aiConfig.preferredProvider) {
      logger.warn('User AI configuration not found', { userId });
      return res.status(400).json({
        success: false,
        message: 'AI configuration not found. Please configure your AI provider in settings.'
      });
    }

    const provider = user.aiConfig.preferredProvider;
    const providerConfig = user.aiConfig.models[provider];

    logger.info('Provider configuration check', {
      userId,
      provider,
      hasProviderConfig: !!providerConfig,
      hasApiKey: !!providerConfig?.apiKey,
      model: providerConfig?.model
    });

    // Check if provider is configured with API key
    if (!providerConfig || !providerConfig.apiKey) {
      logger.warn('Provider API key not configured', { userId, provider });
      return res.status(400).json({
        success: false,
        message: `API key not configured for ${provider}. Please update your AI settings.`
      });
    }

    // Decrypt the API key
    let decryptedApiKey;
    try {
      decryptedApiKey = decrypt(providerConfig.apiKey);
      logger.info('API key decryption successful', { userId, provider });
    } catch (error) {
      logger.error('Failed to decrypt API key:', { error: error.message, userId, provider });
      return res.status(500).json({
        success: false,
        message: 'Failed to access AI configuration. Please reconfigure your API key.'
      });
    }

    // Generate AI summary based on provider
    let summary;
    try {
      logger.info('Starting AI summary generation:', {
        provider,
        model: providerConfig.model,
        userId: user._id,
        hasApiKey: !!decryptedApiKey
      });

      switch (provider) {
        case 'openai':
          summary = await generateOpenAISummary(result, dataset, {
            apiKey: decryptedApiKey,
            model: providerConfig.model || 'gpt-4o-mini'
          });
          break;
        
        case 'anthropic':
          summary = await generateAnthropicSummary(result, dataset, {
            apiKey: decryptedApiKey,
            model: providerConfig.model || 'claude-3-5-sonnet'
          });
          break;
        
        case 'gemini':
          summary = await generateGeminiSummary(result, dataset, {
            apiKey: decryptedApiKey,
            model: providerConfig.model || 'gemini-2.5-pro'
          });
          break;
        
        case 'azure':
          summary = await generateAzureOpenAISummary(result, dataset, {
            apiKey: decryptedApiKey,
            model: providerConfig.model || 'gpt-4o',
            endpoint: decrypt(providerConfig.endpoint),
            deploymentName: providerConfig.deploymentName
          });
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: `Unsupported AI provider: ${provider}`
          });
      }

      logger.info('AI summary generated successfully:', {
        provider,
        model: providerConfig.model,
        userId: user._id,
        summaryKeys: Object.keys(summary || {})
      });

      // Ensure we have a valid summary object
      if (!summary || typeof summary !== 'object') {
        throw new Error('Invalid summary object returned from AI provider');
      }

      // Increment AI summaries generated count
      await require('../models/User').findByIdAndUpdate(
        userId,
        { 
          $inc: { 'stats.aiSummariesGenerated': 1 },
          $set: { 'stats.lastActivity': new Date() }
        }
      );

      logger.info('AI summary generated successfully and usage statistics updated', {
        userId,
        provider,
        model: providerConfig.model
      });

      res.json({
        success: true,
        message: 'AI summary generated successfully',
        data: {
          summary,
          provider,
          model: providerConfig.model
        }
      });

    } catch (error) {
      logger.error('AI summary generation error:', {
        error: error.message,
        stack: error.stack,
        provider,
        model: providerConfig.model,
        userId: user._id
      });

      // Return a structured error response
      res.status(500).json({
        success: false,
        message: `Failed to generate AI summary: ${error.message}`,
        provider,
        model: providerConfig.model,
        errorCode: 'AI_GENERATION_FAILED'
      });
    }

  } catch (error) {
    logger.error('AI summary endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// AI Provider-specific summary generation functions
async function generateOpenAISummary(result, dataset, config) {
  // TODO: Implement OpenAI integration
  throw new Error('OpenAI integration not yet implemented');
}

async function generateAnthropicSummary(result, dataset, config) {
  // TODO: Implement Anthropic integration
  throw new Error('Anthropic integration not yet implemented');
}

async function generateGeminiSummary(result, dataset, config) {
  const { generateGeminiSummary: utilGenerateGeminiSummary } = require('../utils/geminiIntegration');
  return await utilGenerateGeminiSummary(result, dataset, config);
}

async function generateAzureOpenAISummary(result, dataset, config) {
  // TODO: Implement Azure OpenAI integration
  throw new Error('Azure OpenAI integration not yet implemented');
}

/**
 * @route GET /api/ai/export-summaries
 * @desc Export user's AI summaries as PDF
 * @access Private
 */
router.get('/export-summaries', authenticateToken, async (req, res) => {
  try {
    // For now, return a simple text export since we don't have stored summaries
    // In a real implementation, you would fetch stored summaries from database
    
    const exportData = {
      exportType: 'ExpenseAudit_AI_Summaries',
      exportDate: new Date().toISOString(),
      user: req.user.email,
      message: 'AI summaries are generated on-demand and not permanently stored. To export summaries, please re-run your analysis and use the export options in the results.',
      suggestedWorkflow: [
        '1. Upload your data files',
        '2. Run Benford\'s Law analysis',
        '3. Generate AI summary',
        '4. Export results using the executive report feature'
      ]
    };

    const filename = `ai_summaries_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info('AI summaries export requested for user:', {
      userId: req.user._id,
      filename
    });

    res.json(exportData);

  } catch (error) {
    logger.error('Export AI summaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export AI summaries'
    });
  }
});

module.exports = router;
