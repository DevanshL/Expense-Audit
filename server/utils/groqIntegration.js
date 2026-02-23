/**
 * Groq Integration (groq.com — fast inference for Llama, Mixtral, Gemma)
 * Groq uses an OpenAI-compatible API at api.groq.com/openai/v1
 *
 * Free tier models (June 2025):
 *   - llama-3.3-70b-versatile   (best quality, 128k context)
 *   - llama3-8b-8192            (fast, lightweight)
 *   - mixtral-8x7b-32768        (good for analysis, 32k context)
 *   - gemma2-9b-it              (lightweight alternative)
 */

const fetch = require('node-fetch');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Send a chat conversation to Groq and return the assistant's reply.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} config - { apiKey, model, temperature, maxTokens }
 * @returns {Promise<string>} assistant reply text
 */
async function chatWithGroq(messages, config = {}) {
  const {
    apiKey,
    model = 'llama-3.3-70b-versatile',
    temperature = 0.3,
    maxTokens = 1024,
  } = config;

  if (!apiKey) throw new Error('Groq API key is required');

  const response = await fetch(GROQ_API_URL, {
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
    if (response.status === 401) throw new Error('Invalid Groq API key');
    if (response.status === 429) throw new Error('Groq rate limit exceeded — try again shortly');
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Groq');
  return text;
}

/**
 * One-shot audit summary using Groq (fallback when Gemini is unavailable).
 * Used by AuditService when provider is 'groq'.
 */
async function generateGroqSummary(result, dataset, config) {
  if (!result?.digitFrequencies) throw new Error('Invalid analysis result data');

  const ud = {
    total: result.totalAnalyzed,
    mad: result.mad?.toFixed(4),
    chi: result.chiSquare?.toFixed(2),
    risk: result.riskLevel,
    flagged: result.flaggedTransactions?.length || 0,
    vendors: result.suspiciousVendors?.length || 0,
  };

  const userPrompt =
    `You are a Senior Financial Analyst (CFE). Analyze these Benford's Law audit results:\n\n` +
    `Transactions: ${ud.total}\nMAD: ${ud.mad}\nChi-Square: ${ud.chi}\n` +
    `Risk Level: ${ud.risk}\nFlagged Transactions: ${ud.flagged}\nSuspicious Vendors: ${ud.vendors}\n\n` +
    `Digit Distribution:\n` +
    result.digitFrequencies
      .map(f => `Digit ${f.digit}: ${f.observed?.toFixed(1)}% vs ${f.expected?.toFixed(1)}% (dev: ${f.deviation?.toFixed(1)}%)`)
      .join('\n') +
    `\n\nProvide: EXECUTIVE SUMMARY, KEY FINDINGS, RISK ASSESSMENT, RECOMMENDATIONS.\nBe specific — reference the actual MAD and deviations.`;

  const text = await chatWithGroq([{ role: 'user', content: userPrompt }], config);

  const summary = { executiveSummary: '', keyFindings: [], riskAssessment: '', recommendedActions: [] };
  let section = '';
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.toUpperCase().includes('EXECUTIVE SUMMARY')) { section = 'exec'; continue; }
    if (t.toUpperCase().includes('KEY FINDINGS'))      { section = 'findings'; continue; }
    if (t.toUpperCase().includes('RISK ASSESSMENT'))   { section = 'risk'; continue; }
    if (t.toUpperCase().includes('RECOMMENDATIONS'))   { section = 'recs'; continue; }
    if (!t) continue;
    if (section === 'exec')     summary.executiveSummary += t + ' ';
    else if (section === 'findings') summary.keyFindings.push(t.replace(/^[-•*\d.]\s*/, ''));
    else if (section === 'risk')     summary.riskAssessment += t + ' ';
    else if (section === 'recs')     summary.recommendedActions.push(t.replace(/^[-•*\d.]\s*/, ''));
  }

  return {
    ...summary,
    model: config.model || 'llama-3.3-70b-versatile',
    generatedAt: new Date().toISOString(),
    provider: 'groq',
  };
}

module.exports = { chatWithGroq, generateGroqSummary };
