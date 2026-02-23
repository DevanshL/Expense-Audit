/**
 * OpenAI Integration
 * Supports chat completions for gpt-4o-mini, gpt-4o, and gpt-3.5-turbo
 */

const fetch = require('node-fetch');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Send a chat conversation to OpenAI and return the assistant's reply.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} config - { apiKey, model, temperature, maxTokens }
 * @returns {Promise<string>} assistant reply text
 */
async function chatWithOpenAI(messages, config = {}) {
  const {
    apiKey,
    model = 'gpt-4o-mini',
    temperature = 0.3,
    maxTokens = 1024,
  } = config;

  if (!apiKey) throw new Error('OpenAI API key is required');

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401) throw new Error('Invalid OpenAI API key');
    if (response.status === 429) throw new Error('OpenAI rate limit or quota exceeded');
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');
  return text;
}

/**
 * One-shot summary generation (mirrors geminiIntegration.generateGeminiSummary)
 * Used by AuditService when provider is 'openai'.
 */
async function generateOpenAISummary(result, dataset, config) {
  if (!result?.digitFrequencies) throw new Error('Invalid analysis result data');

  const analysisData = {
    totalTransactions: result.totalAnalyzed,
    mad: result.mad,
    chiSquare: result.chiSquare,
    riskLevel: result.riskLevel,
    flaggedTransactions: result.flaggedTransactions?.length || 0,
    suspiciousVendors: result.suspiciousVendors?.length || 0,
  };

  const userPrompt = `You are a Senior Financial Analyst (CFE). Analyze these Benford's Law results:

Transactions: ${analysisData.totalTransactions}
MAD: ${analysisData.mad?.toFixed(4)}
Chi-Square: ${analysisData.chiSquare?.toFixed(2)}
Risk Level: ${analysisData.riskLevel}
Flagged Transactions: ${analysisData.flaggedTransactions}
Suspicious Vendors: ${analysisData.suspiciousVendors}

Digit Distribution:
${result.digitFrequencies.map(f => `Digit ${f.digit}: ${f.observed?.toFixed(1)}% observed vs ${f.expected?.toFixed(1)}% expected (deviation: ${f.deviation?.toFixed(1)}%)`).join('\n')}

Provide: EXECUTIVE SUMMARY, KEY FINDINGS, RISK ASSESSMENT, RECOMMENDATIONS.`;

  const messages = [{ role: 'user', content: userPrompt }];
  const text = await chatWithOpenAI(messages, config);

  // Parse sections (reuse same structure as Gemini)
  const summary = {
    executiveSummary: '',
    keyFindings: [],
    riskAssessment: '',
    recommendedActions: [],
  };

  const lines = text.split('\n');
  let section = '';
  for (const line of lines) {
    const t = line.trim();
    if (t.toUpperCase().includes('EXECUTIVE SUMMARY')) { section = 'exec'; continue; }
    if (t.toUpperCase().includes('KEY FINDINGS')) { section = 'findings'; continue; }
    if (t.toUpperCase().includes('RISK ASSESSMENT')) { section = 'risk'; continue; }
    if (t.toUpperCase().includes('RECOMMENDATIONS')) { section = 'recs'; continue; }
    if (!t) continue;
    if (section === 'exec') summary.executiveSummary += t + ' ';
    else if (section === 'findings') summary.keyFindings.push(t.replace(/^[-•*\d.]\s*/, ''));
    else if (section === 'risk') summary.riskAssessment += t + ' ';
    else if (section === 'recs') summary.recommendedActions.push(t.replace(/^[-•*\d.]\s*/, ''));
  }

  return {
    ...summary,
    model: config.model || 'gpt-4o-mini',
    generatedAt: new Date().toISOString(),
    provider: 'openai',
  };
}

module.exports = { chatWithOpenAI, generateOpenAISummary };
