const { performBenfordAnalysis } = require('../utils/benfordAnalysis');
const { generateGeminiSummary } = require('../utils/geminiIntegration');
const { decrypt } = require('../utils/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Generate AI summary based on audit results
   */
  async generateSummary(userId, result, dataset) {
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

    // Increment stats
    await user.incrementAISummaries();

    return {
      summary,
      provider,
      model: providerConfig.model
    };
  }

  /**
   * Perform Benford Analysis on raw data
   */
  async performAudit(dataset) {
    return performBenfordAnalysis(dataset);
  }
}

module.exports = new AuditService();
