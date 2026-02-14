const { performBenfordAnalysis } = require('../utils/benfordAnalysis');
const { generateGeminiSummary } = require('../utils/geminiIntegration');
const { decrypt } = require('../utils/auth');
const User = require('../models/User');
const logger = require('../utils/logger');
const cacheService = require('./CacheService');
const crypto = require('crypto');

class AuditService {
  /**
   * Generate AI summary based on audit results
   */
  async generateSummary(userId, result, dataset) {
    // Generate a cache key based on the user ID, result, and dataset
    const cacheInput = { userId, result, dataset };
    const cacheKeyHash = crypto.createHash('md5').update(JSON.stringify(cacheInput)).digest('hex');
    const cacheKey = cacheService.generateKey('ai-summary', cacheKeyHash);

    // Try to get from cache first
    try {
      const cachedSummary = await cacheService.get(cacheKey);
      if (cachedSummary) {
        logger.info(`Returning cached AI summary for key: ${cacheKey}`);
        return cachedSummary;
      }
    } catch (cacheError) {
      logger.error('Error fetching from cache:', cacheError);
      // Continue without cache if there's an error
    }

    const user = await User.findWithAIConfig(userId);
    if (!user || !user.aiConfig?.preferredProvider) {
      throw new Error('AI configuration not found');
    }

    const provider = user.aiConfig.preferredProvider;
    const providerConfig = user.aiConfig.models[provider];

    if (!providerConfig?.apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }

    const decryptedApiKey = decrypt(providerConfig.apiKey);

    let summary;
    switch (provider) {
      case 'gemini':
        summary = await generateGeminiSummary(result, dataset, {
          apiKey: decryptedApiKey,
          model: providerConfig.model || 'gemini-2.0-flash'
        });
        break;
      // Other providers can be added here
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    const response = {
      summary,
      provider,
      model: providerConfig.model
    };

    // Store in cache for 1 hour
    try {
      await cacheService.set(cacheKey, response, 3600);
    } catch (cacheError) {
      logger.error('Error setting cache:', cacheError);
    }

    // Increment stats
    await user.incrementAISummaries();

    return response;
  }

  /**
   * Perform Benford Analysis on raw data
   */
  async performAudit(dataset) {
    return performBenfordAnalysis(dataset);
  }
}

module.exports = new AuditService();
