import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface UsageStats {
  filesUploaded: number;
  aiSummariesGenerated: number;
  reportsGenerated: number;
  lastActivity: string;
  lastLogin: string | null;
}

export interface UsageData {
  user: {
    name: string;
    email: string;
  };
  stats: UsageStats;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function useUsageTracking() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Fetch usage statistics
  const fetchUsageStats = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping usage stats fetch');
      return;
    }

    console.log('Fetching usage stats - authenticated:', isAuthenticated, 'user:', user?.email);
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('expense-audit-token');
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_BASE}/users/usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status, 'ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: Failed to fetch usage statistics`);
      }

      const data = await response.json();
      console.log('Usage stats response:', data);
      
      if (data.success) {
        setUsageData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch usage statistics');
      }
    } catch (err) {
      console.error('Error fetching usage statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage statistics');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Increment specific usage statistic
  const incrementUsage = async (type: 'filesUploaded' | 'aiSummariesGenerated' | 'reportsGenerated') => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE}/users/usage/increment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        },
        body: JSON.stringify({ type })
      });

      if (!response.ok) {
        throw new Error('Failed to update usage statistics');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state with new stats
        setUsageData(prevData => {
          if (!prevData) return null;
          return {
            ...prevData,
            stats: {
              ...prevData.stats,
              [type]: data.data.newValue,
              lastActivity: new Date().toISOString()
            }
          };
        });
      }
    } catch (err) {
      console.error('Error incrementing usage statistic:', err);
      // Don't show error to user for this non-critical operation
    }
  };

  // Auto-fetch when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUsageStats();
    } else {
      setUsageData(null);
    }
  }, [isAuthenticated, user, fetchUsageStats]);

  return {
    usageData,
    loading,
    error,
    fetchUsageStats,
    incrementUsage
  };
}
