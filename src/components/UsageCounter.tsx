import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Zap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface ActionUsage {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}

interface UsageStats {
  ai_summary: ActionUsage;
  file_upload: ActionUsage;
  pdf_export: ActionUsage;
  resetAt: string;
  plan: string;
}

interface UsageCounterProps {
  action: 'ai_summary' | 'file_upload' | 'pdf_export';
  className?: string;
}

const ACTION_LABELS = {
  ai_summary: 'AI summaries',
  file_upload: 'file uploads',
  pdf_export: 'PDF exports'
};

export function UsageCounter({ action, className }: UsageCounterProps) {
  const { isAuthenticated, currentPlan } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStats();
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('expense-audit-token');
      const res = await fetch(`${API_BASE}/ai/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return null;

  const usage = stats[action];
  if (!usage) return null;

  // Unlimited plan — don't show counter
  if (usage.unlimited) return null;

  const percentage = Math.min(100, (usage.used / usage.limit) * 100);
  const isNearLimit = usage.remaining <= 1;
  const isAtLimit = usage.remaining === 0;

  // Reset time formatted
  const resetTime = new Date(stats.resetAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const getBarColor = () => {
    if (isAtLimit) return '#ef4444';
    if (isNearLimit) return '#f97316';
    if (percentage >= 60) return '#eab308';
    return '#22c55e';
  };

  const getBgColor = () => {
    if (isAtLimit) return '#fef2f2';
    if (isNearLimit) return '#fff7ed';
    return '#f0fdf4';
  };

  const getBorderColor = () => {
    if (isAtLimit) return '#fecaca';
    if (isNearLimit) return '#fed7aa';
    return '#bbf7d0';
  };

  return (
    <div
      className={className}
      style={{
        background: getBgColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#374151' }}>
          {ACTION_LABELS[action]} today
        </span>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: isAtLimit ? '#dc2626' : isNearLimit ? '#ea580c' : '#374151'
        }}>
          {usage.used} / {usage.limit}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '6px',
        background: '#e5e7eb',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '0.4rem'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: getBarColor(),
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
          {isAtLimit
            ? `Limit reached · Resets at ${resetTime}`
            : `${usage.remaining} remaining · Resets at ${resetTime}`}
        </span>

        {/* Upgrade nudge when near or at limit */}
        {(isNearLimit || isAtLimit) && currentPlan === 'free' && (
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#7c3aed',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              textDecoration: 'underline'
            }}
          >
            <Zap style={{ width: '10px', height: '10px' }} />
            Get Pro (100/day)
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to check if user has hit their limit before rendering gated content.
 * Use this to show a disabled state before the API call fails.
 */
export function useUsageLimit(action: 'ai_summary' | 'file_upload' | 'pdf_export') {
  const { isAuthenticated } = useAuth();
  const [limitHit, setLimitHit] = useState(false);
  const [stats, setStats] = useState<ActionUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('expense-audit-token');
        const res = await fetch(`${API_BASE}/ai/usage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const usage = data.data[action];
          setStats(usage);
          setLimitHit(!usage.unlimited && usage.remaining === 0);
        }
      } catch {
        // Fail open
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, action]);

  return { limitHit, stats, loading };
}