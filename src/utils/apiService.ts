/**
 * Centralized API Service
 * Handles all communication with the backend API.
 * Uses JWT token from localStorage for authenticated requests.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('expense-audit-token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }

  return json;
}

// -------------------------------------------------------------------
// Audit endpoints
// -------------------------------------------------------------------

/** Run Benford analysis on the backend (result is cached via Redis). */
export async function performAuditApi(dataset: object) {
  return request<object>('/ai/perform-audit', {
    method: 'POST',
    body: JSON.stringify({ dataset }),
  });
}

/** Generate an AI narrative summary (backed by Redis cache, 1-hour TTL). */
export async function generateAISummaryApi(result: object, dataset: object) {
  return request<{ summary: string; provider: string; model: string }>(
    '/ai/generate-summary',
    {
      method: 'POST',
      body: JSON.stringify({ result, dataset }),
    }
  );
}

// -------------------------------------------------------------------
// Health check
// -------------------------------------------------------------------

export async function healthCheck() {
  return request<{ status: string; redis: string; database: string }>('/health');
}
