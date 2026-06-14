const {
  calculateDigitFrequencies,
  calculateMAD,
  assessCompliance,
  extractFirstDigit
} = require('../utils/benfordAnalysis');
const { generateGeminiSummary } = require('../utils/geminiIntegration');
const { generateOllamaSummary, listOllamaModels, isOllamaAvailable } = require('../utils/ollamaIntegration');
const { decrypt } = require('../utils/crypto');
const User = require('../models/User');
const logger = require('../utils/logger');

class AuditService {
  async generateSummary(userId, result, dataset) {
    const user = await User.findWithAIConfig(userId);
    
    // Default to gemini if user has not configured AI settings
    const provider = user?.aiConfig?.preferredProvider || 'gemini';
    const providerConfig = user?.aiConfig?.models?.[provider];

    let summary;

    switch (provider) {
      case 'gemini': {
        let apiKeyToUse;
        if (providerConfig?.apiKey) {
          apiKeyToUse = decrypt(providerConfig.apiKey);
        } else if (process.env.GEMINI_API_KEY) {
          apiKeyToUse = process.env.GEMINI_API_KEY;
        } else {
          throw new Error('Gemini API key is not configured on the cloud server.');
        }
        summary = await generateGeminiSummary(result, dataset, {
          apiKey: apiKeyToUse,
          model: providerConfig?.model || 'gemini-1.5-pro'
        });
        break;
      }

      case 'ollama': {
        const available = await isOllamaAvailable();
        if (!available) {
          throw new Error('Ollama is not running. Start it with: ollama serve');
        }
        summary = await generateOllamaSummary(result, dataset, {
          model: providerConfig?.model || 'llama3.2'
        });
        break;
      }

      default:
        throw new Error(`Unsupported provider: ${provider}. Use gemini or ollama.`);
    }

    await user.incrementAISummaries();
    return { summary, provider, model: providerConfig?.model };
  }

  async performAudit(dataset) {
    if (!dataset?.data || !Array.isArray(dataset.data)) {
      throw new Error('Invalid dataset: expected { data: [...] }');
    }

    const amounts = dataset.data
      .map(row => parseFloat(row.amount))
      .filter(n => !isNaN(n) && n > 0);

    if (amounts.length < 5) {
      throw new Error('Need at least 5 valid positive amounts');
    }

    const firstDigits = amounts.map(extractFirstDigit).filter(d => d !== null);
    const frequencies = calculateDigitFrequencies(firstDigits);
    const mad = calculateMAD(frequencies);
    const compliance = assessCompliance(mad);

    const vendorMap = new Map();
    dataset.data.forEach(row => {
      if (!row.vendor) return;
      if (!vendorMap.has(row.vendor)) vendorMap.set(row.vendor, []);
      vendorMap.get(row.vendor).push(parseFloat(row.amount));
    });

    const vendorStats = [];
    vendorMap.forEach((amts, vendor) => {
      if (amts.length < 2) return;
      const digits = amts.map(extractFirstDigit).filter(d => d !== null);
      const vMad = calculateMAD(calculateDigitFrequencies(digits));
      const vCompliance = assessCompliance(vMad);
      vendorStats.push({ vendor, transactionCount: amts.length, mad: vMad, riskLevel: vCompliance.riskLevel, assessment: vCompliance.assessment });
    });

    return {
      totalAnalyzed: amounts.length,
      digitFrequencies: frequencies,
      mad,
      chiSquare: 0,
      overallAssessment: compliance.assessment,
      riskLevel: compliance.riskLevel,
      suspiciousVendors: vendorStats.filter(v => v.riskLevel !== 'low'),
      flaggedTransactions: [],
      warnings: [],
      compliance
    };
  }

  async getOllamaModels() { return listOllamaModels(); }
  async checkOllamaStatus() { return isOllamaAvailable(); }
}

module.exports = new AuditService();