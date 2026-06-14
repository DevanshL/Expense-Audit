const fetch = require('node-fetch');

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

/**
 * Generate AI summary using local Ollama models
 * @param {Object} result - Benford analysis result
 * @param {Object} dataset - Dataset information
 * @param {Object} config - Ollama configuration { model }
 */
async function generateOllamaSummary(result, dataset, config) {
  const { model = 'llama3.2' } = config;

  if (!result || !result.digitFrequencies) {
    throw new Error('Invalid analysis result data');
  }

  const analysisData = {
    totalTransactions: result.totalAnalyzed,
    mad: result.mad ?? 0,
    chiSquare: result.chiSquare ?? 0,
    riskLevel: result.riskLevel,
    flaggedTransactions: result.flaggedTransactions?.length || 0,
    suspiciousVendors: result.suspiciousVendors?.length || 0,
    totalRows: dataset.preview?.totalRows || dataset.data?.length || 0
  };

  const prompt = `You are a Senior Financial Analyst and Certified Fraud Examiner with 15 years of experience in forensic accounting and fraud detection.

Analyze this Benford's Law financial audit data and provide a structured report.

ANALYSIS DATA:
- Total transactions: ${analysisData.totalTransactions}
- MAD Score: ${analysisData.mad.toFixed(4)}
- Chi-Square: ${analysisData.chiSquare.toFixed(2)}
- Risk Level: ${analysisData.riskLevel.toUpperCase()}
- Flagged transactions: ${analysisData.flaggedTransactions}
- Suspicious vendors: ${analysisData.suspiciousVendors}

DIGIT DISTRIBUTION:
${result.digitFrequencies.map(f =>
  `Digit ${f.digit}: Observed ${f.observed.toFixed(1)}% vs Expected ${f.expected.toFixed(1)}% (deviation: ${f.deviation.toFixed(1)}%)`
).join('\n')}

Respond in EXACTLY this format:

EXECUTIVE SUMMARY:
[2-3 sentences on overall fraud risk and business impact]

KEY FINDINGS:
[3-5 specific statistical discoveries from this data]

RISK ASSESSMENT:
[Explain MAD score ${analysisData.mad.toFixed(4)} and ${analysisData.riskLevel} risk in business terms]

VENDOR ANALYSIS:
[Analysis of ${analysisData.suspiciousVendors} flagged vendor(s) and risk patterns]

TRANSACTION PATTERNS:
[Which digits deviate most and what manipulation this suggests]

RECOMMENDATIONS:
[4-6 specific actionable steps based on these findings]

Be specific to this data. Reference actual numbers. No generic advice.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 1024
        }
      }),
      timeout: 120000 // 2 min timeout for local models
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error('No response from Ollama model');
    }

    try {
      const summary = parseStructuredResponse(data.response);
      return {
        ...summary,
        model,
        generatedAt: new Date().toISOString(),
        provider: 'ollama'
      };
    } catch (parseError) {
      console.warn('Ollama response parse failed, using fallback:', parseError.message);
      return createFallbackSummary(data.response, model);
    }

  } catch (error) {
    console.error('Ollama call failed:', error.message);

    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      throw new Error('Ollama is not running. Start it with: ollama serve');
    }
    if (error.message.includes('model') && error.message.includes('not found')) {
      throw new Error(`Model "${model}" not found. Run: ollama pull ${model}`);
    }
    throw new Error(`Ollama summary failed: ${error.message}`);
  }
}

/**
 * List available Ollama models
 */
async function listOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at
    }));
  } catch {
    return [];
  }
}

/**
 * Check if Ollama is running
 */
async function isOllamaAvailable() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Parse structured response sections
 */
function parseStructuredResponse(response) {
  const sections = {
    executiveSummary: '',
    keyFindings: [],
    riskAssessment: '',
    recommendedActions: [],
    furtherInvestigation: []
  };

  const lines = response.split('\n');
  let currentSection = '';
  let currentContent = [];

  const flush = () => {
    if (!currentSection || currentContent.length === 0) return;
    const text = currentContent.join(' ').trim();
    const items = currentContent
      .filter(l => l.trim().length > 0)
      .map(l => l.replace(/^[-•*\d+\.]\s*/, '').trim())
      .filter(l => l.length > 0);

    switch (currentSection) {
      case 'executiveSummary': sections.executiveSummary = text; break;
      case 'keyFindings': sections.keyFindings = items; break;
      case 'riskAssessment': sections.riskAssessment = text; break;
      case 'vendorAnalysis': if (text) sections.keyFindings.push(text); break;
      case 'transactionPatterns': if (text) sections.keyFindings.push(text); break;
      case 'recommendations': sections.recommendedActions = items; break;
    }
    currentContent = [];
  };

  for (const line of lines) {
    const t = line.trim();
    const upper = t.toUpperCase();

    if (upper.includes('EXECUTIVE SUMMARY:')) { flush(); currentSection = 'executiveSummary'; }
    else if (upper.includes('KEY FINDINGS:')) { flush(); currentSection = 'keyFindings'; }
    else if (upper.includes('RISK ASSESSMENT:')) { flush(); currentSection = 'riskAssessment'; }
    else if (upper.includes('VENDOR ANALYSIS:')) { flush(); currentSection = 'vendorAnalysis'; }
    else if (upper.includes('TRANSACTION PATTERNS:')) { flush(); currentSection = 'transactionPatterns'; }
    else if (upper.includes('RECOMMENDATIONS:')) { flush(); currentSection = 'recommendations'; }
    else if (t.length > 0 && !t.startsWith('#')) {
      currentContent.push(t);
    }
  }
  flush();

  // Fallback if parsing produced nothing
  if (!sections.executiveSummary && !sections.keyFindings.length) {
    const sentences = response.split('.').filter(s => s.trim().length > 10);
    sections.executiveSummary = sentences.slice(0, 3).join('.') + '.';
    sections.keyFindings = ['Local AI analysis completed'];
    sections.recommendedActions = ['Review the complete analysis findings'];
  }

  return sections;
}

function createFallbackSummary(text, model) {
  return {
    executiveSummary: text.substring(0, 400) + (text.length > 400 ? '...' : ''),
    keyFindings: ['AI analysis generated — review full response for details'],
    riskAssessment: 'See full response for detailed risk assessment.',
    recommendedActions: [
      'Review flagged transactions in detail',
      'Investigate suspicious vendors',
      'Implement enhanced monitoring',
      'Document findings and establish controls'
    ],
    furtherInvestigation: [],
    model,
    generatedAt: new Date().toISOString(),
    provider: 'ollama',
    fullResponse: text,
    parseError: true
  };
}

module.exports = {
  generateOllamaSummary,
  listOllamaModels,
  isOllamaAvailable
};