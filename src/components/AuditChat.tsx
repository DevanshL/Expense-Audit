import { useRef, useEffect, useState } from 'react';
import type { BenfordResult } from '../types';
import { useAuditChat } from '../hooks/useAuditChat';

// ─────────────────────────────────────────────────────────────────────────────
// Styles (inline — no extra CSS file needed)
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: '400px',
    maxHeight: '600px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#c7d2fe',
    fontWeight: 600,
    fontSize: '14px',
    letterSpacing: '0.02em',
  },
  clearBtn: {
    background: 'none',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    scrollbarWidth: 'thin' as const,
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(148, 163, 184, 0.6)',
    textAlign: 'center' as const,
    gap: '8px',
  },
  bubble: (role: 'user' | 'assistant') => ({
    maxWidth: '82%',
    alignSelf: role === 'user' ? 'flex-end' : ('flex-start' as const),
    background:
      role === 'user'
        ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
        : 'rgba(30, 41, 59, 0.9)',
    border:
      role === 'user'
        ? 'none'
        : '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius:
      role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    padding: '10px 14px',
    color: role === 'user' ? '#fff' : '#e2e8f0',
    fontSize: '13px',
    lineHeight: '1.55',
    wordBreak: 'break-word' as const,
  }),
  thinkingDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    background: '#818cf8',
    borderRadius: '50%',
    animation: 'pulse 1.2s infinite',
    margin: '0 2px',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 14px',
    borderTop: '1px solid rgba(99, 102, 241, 0.15)',
    background: 'rgba(15, 23, 42, 0.8)',
  },
  input: {
    flex: 1,
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '10px',
    color: '#e2e8f0',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'opacity 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenBadge: {
    padding: '2px 8px 2px 2px',
    textAlign: 'center' as const,
    fontSize: '10px',
    color: 'rgba(148, 163, 184, 0.5)',
  },
  error: {
    margin: '4px 14px',
    padding: '8px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '12px',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

interface AuditChatProps {
  auditId: string;
  auditSnapshot: BenfordResult | null;
}

export function AuditChat({ auditId, auditSnapshot }: AuditChatProps) {
  const { messages, isLoading, error, estimatedTokens, sendMessage, clearHistory } =
    useAuditChat(auditId, auditSnapshot);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span>🤖</span>
          <span>Audit AI Assistant</span>
          <span style={{ fontSize: '10px', color: 'rgba(148,163,184,0.5)', marginLeft: '4px' }}>
            powered by Gemini
          </span>
        </div>
        {messages.length > 0 && (
          <button
            style={styles.clearBtn}
            onClick={clearHistory}
            title="Clear chat history"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && !isLoading ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '32px' }}>💬</div>
            <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '14px' }}>
              Ask about your audit
            </div>
            <div style={{ fontSize: '12px' }}>
              "Why is digit 1 over-represented?"<br />
              "Which vendor is highest risk?"<br />
              "What does a MAD of 0.018 mean?"
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={styles.bubble(msg.role)}>
              {msg.content}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{ ...styles.bubble('assistant'), padding: '14px', opacity: 0.7 }}>
            <span style={styles.thinkingDot} />
            <span style={styles.thinkingDot} />
            <span style={styles.thinkingDot} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <div style={styles.error}>⚠️ {error}</div>}

      {/* Token usage hint */}
      {estimatedTokens && (
        <div style={styles.tokenBadge}>
          ~{estimatedTokens} tokens used per message
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.input}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your audit results… (Enter to send)"
          disabled={isLoading}
        />
        <button
          style={{ ...styles.sendBtn, opacity: isLoading || !input.trim() ? 0.5 : 1 }}
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          title="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default AuditChat;
