import { useState, useEffect, useCallback } from 'react';
import type { BenfordResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  return localStorage.getItem('expense-audit-token');
}

async function chatRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`);
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  tokenCount?: number;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  estimatedTokens: number | null;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

/**
 * Manages a persistent AI chat session tied to a specific audit run.
 * - History loads from the backend on mount (survives page refresh)
 * - Cleared on logout via DELETE /api/chat/all (see AuthController)
 */
export function useAuditChat(
  auditId: string | null,
  auditSnapshot: BenfordResult | null
): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTokens, setEstimatedTokens] = useState<number | null>(null);

  // Load history from server on mount / auditId change
  useEffect(() => {
    if (!auditId || !getToken()) return;

    chatRequest<{ success: boolean; data: { messages: ChatMessage[] } }>(
      `/chat/history/${auditId}`
    )
      .then(res => {
        if (res.success) setMessages(res.data.messages);
      })
      .catch(() => { /* ignore — backend might not have history yet */ });
  }, [auditId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!auditId || !text.trim()) return;

      const userMsg: ChatMessage = { role: 'user', content: text };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const res = await chatRequest<{
          success: boolean;
          data: { message: string; estimatedPromptTokens: number };
        }>('/chat/message', {
          method: 'POST',
          body: JSON.stringify({
            auditId,
            message: text,
            auditSnapshot,
          }),
        });

        if (res.success) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: res.data.message, createdAt: new Date().toISOString() },
          ]);
          setEstimatedTokens(res.data.estimatedPromptTokens);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send message';
        setError(msg);
        // Remove the optimistic user message on error
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [auditId, auditSnapshot]
  );

  const clearHistory = useCallback(async () => {
    if (!auditId) return;
    try {
      await chatRequest(`/chat/session/${auditId}`, { method: 'DELETE' });
      setMessages([]);
      setEstimatedTokens(null);
    } catch (err) {
      setError('Failed to clear history');
    }
  }, [auditId]);

  return { messages, isLoading, error, estimatedTokens, sendMessage, clearHistory };
}
