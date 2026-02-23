const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const { decrypt } = require('../utils/auth');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Token budget constants
// ─────────────────────────────────────────────────────────────────────────────
const RECENT_MESSAGE_WINDOW = 6;   // keep last N messages verbatim
const SUMMARIZE_THRESHOLD   = 10;  // summarize when unsummarized messages exceed this
const AUDIT_CONTEXT_TOKENS  = 350; // approximate audit snapshot token budget
const MAX_OUTPUT_TOKENS      = 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Rough token estimator (1 token ≈ 4 chars — conservative)
// ─────────────────────────────────────────────────────────────────────────────
function estimateTokens(text = '') {
  return Math.ceil(text.length / 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the frozen audit context block (included once per prompt)
// ─────────────────────────────────────────────────────────────────────────────
function buildAuditContext(snapshot) {
  if (!snapshot) return 'No audit data available.';
  const s = snapshot;
  return [
    `Audit Summary:`,
    `- Transactions analyzed: ${s.totalAnalyzed ?? 'N/A'}`,
    `- MAD score: ${s.mad != null ? s.mad.toFixed(4) : 'N/A'}`,
    `- Chi-square: ${s.chiSquare != null ? s.chiSquare.toFixed(2) : 'N/A'}`,
    `- Risk level: ${s.riskLevel ?? 'N/A'}`,
    `- Overall assessment: ${s.overallAssessment ?? 'N/A'}`,
    `- Flagged transactions: ${s.flaggedTransactions?.length ?? 0}`,
    `- Suspicious vendors: ${s.suspiciousVendors?.length ?? 0}`,
    s.digitFrequencies?.length
      ? `- Digit distribution:\n` +
        s.digitFrequencies
          .map(f => `  Digit ${f.digit}: ${f.observed?.toFixed(1)}% observed vs ${f.expected?.toFixed(1)}% expected`)
          .join('\n')
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the full prompt from a session (rolling summary + recent messages)
// ─────────────────────────────────────────────────────────────────────────────
function buildPromptMessages(session) {
  const systemContent =
    `You are a Senior Financial Analyst and Certified Fraud Examiner (CFE) ` +
    `specializing in Benford's Law analysis. The user has just run a fraud audit. ` +
    `Answer their questions concisely and specifically based on the audit data below. ` +
    `If asked something unrelated to the audit or finance, politely redirect.\n\n` +
    buildAuditContext(session.auditSnapshot);

  const messages = [{ role: 'system', content: systemContent }];

  // Include rolling summary of older turns (if any)
  if (session.summary) {
    messages.push({
      role: 'assistant',
      content: `[Summary of our earlier discussion: ${session.summary}]`,
    });
  }

  // Include recent verbatim messages
  const recent = session.getRecentMessages();
  for (const msg of recent) {
    messages.push({ role: msg.role, content: msg.content });
  }

  return messages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Summarize older messages to compress history
// ─────────────────────────────────────────────────────────────────────────────
async function compressHistory(session, callAI) {
  const unsummarized = session.messages.slice(
    session.summaryUpToIndex,
    session.messages.length - RECENT_MESSAGE_WINDOW
  );

  if (unsummarized.length === 0) return;

  const transcript = unsummarized
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const summaryPrompt = [
    {
      role: 'system',
      content:
        'You are a concise summarizer. Summarize the following conversation excerpt ' +
        'in 3–5 sentences, preserving all key facts, findings, and action items. ' +
        'Be specific — include numbers and vendor names.',
    },
    { role: 'user', content: transcript },
  ];

  try {
    const newSummary = await callAI(summaryPrompt, { maxTokens: 300 });
    session.summary = session.summary
      ? `${session.summary} Later: ${newSummary}`
      : newSummary;
    session.summaryUpToIndex =
      session.messages.length - RECENT_MESSAGE_WINDOW;
    await session.save();
    logger.info(`[ChatService] Compressed ${unsummarized.length} messages into summary`);
  } catch (err) {
    logger.warn('[ChatService] Summarization failed, keeping full history:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve AI caller for a user: Gemini primary, Grok fallback
// ─────────────────────────────────────────────────────────────────────────────
async function resolveAICaller(userId) {
  // Server-level keys (fallback for all users)
  const serverGeminiKey = process.env.GEMINI_API_KEY;
  const serverGrokKey   = process.env.GROQ_API_KEY;

  // Load user's AI config
  let userGeminiKey = null;
  let userGrokKey   = null;
  let preferredProvider = 'gemini';

  try {
    const user = await User.findWithAIConfig(userId);
    if (user?.aiConfig) {
      preferredProvider = user.aiConfig.preferredProvider || 'gemini';
      const geminiCfg = user.aiConfig.models?.gemini;
      const grokCfg   = user.aiConfig.models?.grok;
      if (geminiCfg?.apiKey) userGeminiKey = decrypt(geminiCfg.apiKey);
      if (grokCfg?.apiKey)   userGrokKey   = decrypt(grokCfg.apiKey);
    }
  } catch (_) { /* ignore — no profile config */ }

  // Try preferred provider first, then fallback
  const geminiKey = userGeminiKey || serverGeminiKey;
  const grokKey   = userGrokKey   || serverGrokKey;

  if (preferredProvider === 'groq' && grokKey) {
    const { chatWithGroq } = require('../utils/groqIntegration');
    return {
      provider: 'groq',
      model: process.env.DEFAULT_GROQ_MODEL || 'llama-3.3-70b-versatile',
      callAI: (messages, opts = {}) =>
        chatWithGroq(messages, { apiKey: grokKey, model: process.env.DEFAULT_GROQ_MODEL || 'llama-3.3-70b-versatile', ...opts }),
    };
  }

  // Default: Gemini (primary)
  if (geminiKey) {
    const { chatWithGemini } = require('../utils/geminiIntegration');
    const model = process.env.DEFAULT_GEMINI_MODEL || 'gemini-2.0-flash';
    return {
      provider: 'gemini',
      model,
      callAI: (messages, opts = {}) => chatWithGemini(messages, { apiKey: geminiKey, model, ...opts }),
    };
  }

  // Fallback: Grok
  if (grokKey) {
    const { chatWithGroq } = require('../utils/groqIntegration');
    const model = process.env.DEFAULT_GROQ_MODEL || 'llama-3.3-70b-versatile';
    return {
      provider: 'groq',
      model,
      callAI: (messages, opts = {}) => chatWithGroq(messages, { apiKey: grokKey, model, ...opts }),
    };
  }

  throw new Error(
    'No AI API key configured. Add GEMINI_API_KEY or GROQ_API_KEY to server/.env, or set your key in Profile Settings.'
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const ChatService = {
  /**
   * Get or create a chat session for a user + audit combo.
   * auditSnapshot is only used when creating a new session.
   */
  async getOrCreateSession(userId, auditId, auditSnapshot) {
    let session = await ChatSession.findOne({ userId, auditId });
    if (!session) {
      session = await ChatSession.create({ userId, auditId, auditSnapshot });
      logger.info(`[ChatService] Created new session for user ${userId}, audit ${auditId}`);
    }
    return session;
  },

  /**
   * Load full message history for a session.
   */
  async getHistory(userId, auditId) {
    const session = await ChatSession.findOne({ userId, auditId });
    if (!session) return { messages: [], summary: '' };
    return {
      messages: session.messages,
      summary: session.summary,
      totalMessages: session.messages.length,
    };
  },

  /**
   * Send a message and get an AI response.
   * This is the main method — handles compression automatically.
   */
  async sendMessage(userId, auditId, userMessage, auditSnapshot) {
    // Ensure session exists
    const session = await this.getOrCreateSession(userId, auditId, auditSnapshot);

    // Add user message
    session.messages.push({
      role: 'user',
      content: userMessage,
      tokenCount: estimateTokens(userMessage),
    });

    // Resolve AI provider
    const { provider, model, callAI } = await resolveAICaller(userId);
    session.lastProvider = provider;
    session.lastModel = model;

    // Compress history if needed
    const unsummarizedCount =
      session.messages.length - session.summaryUpToIndex;
    if (unsummarizedCount > SUMMARIZE_THRESHOLD + RECENT_MESSAGE_WINDOW) {
      await compressHistory(session, callAI);
    }

    // Build prompt and call AI
    const promptMessages = buildPromptMessages(session);
    const aiResponse = await callAI(promptMessages, { maxTokens: MAX_OUTPUT_TOKENS });

    // Store AI response
    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      tokenCount: estimateTokens(aiResponse),
    });

    await session.save();

    return {
      message: aiResponse,
      provider,
      model,
      totalMessages: session.messages.length,
      estimatedPromptTokens:
        AUDIT_CONTEXT_TOKENS +
        estimateTokens(session.summary) +
        session.getRecentMessages().reduce((s, m) => s + estimateTokens(m.content), 0),
    };
  },

  /**
   * Clear a specific audit session for a user.
   */
  async clearSession(userId, auditId) {
    const result = await ChatSession.deleteOne({ userId, auditId });
    return result.deletedCount > 0;
  },

  /**
   * Clear ALL chat sessions for a user (called on logout).
   */
  async clearAllSessions(userId) {
    const result = await ChatSession.deleteMany({ userId });
    logger.info(`[ChatService] Cleared ${result.deletedCount} sessions for user ${userId}`);
    return result.deletedCount;
  },
};

module.exports = ChatService;
