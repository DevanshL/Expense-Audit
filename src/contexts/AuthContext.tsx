import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export type UserRole = 'admin' | 'auditor' | 'viewer';
export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface UserStripe {
  customerId?: string;
  subscriptionId?: string;
  plan: UserPlan;
  planInterval?: 'monthly' | 'yearly' | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  avatar?: string;
  googleId?: string;
  isEmailVerified: boolean;
  lastLogin?: string;
  stripe?: UserStripe;
  stats?: {
    aiSummariesGenerated: number;
    filesUploaded: number;
    reportsGenerated: number;
    lastActivity?: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    density: 'compact' | 'comfortable';
    language: string;
  };
  aiConfig?: {
    preferredProvider: 'gemini' | 'ollama';
    models: {
      gemini: { model: string; hasApiKey: boolean };
      ollama: { model: string; hasApiKey: boolean };
    };
  };
}

export interface AIConfig {
  preferredProvider: 'gemini' | 'ollama';
  models: {
    gemini: { model: string; apiKey?: string };
    ollama: { model: string; apiKey?: string };
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  checkPasswordStatus: () => Promise<{ hasPassword: boolean; isOAuthUser: boolean; authMethod: string } | null>;
  updateAIConfig: (config: Partial<AIConfig>) => Promise<boolean>;
  updatePreferences: (preferences: Partial<{ theme: string; density: string; language: string }>) => Promise<boolean>;
  getAIConfig: () => Promise<AIConfig | null>;
  // Billing helpers
  currentPlan: UserPlan;
  isPro: boolean;
  isEnterprise: boolean;
  createCheckout: (priceId: string) => Promise<void>;
  openBillingPortal: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  error: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  organization?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem('expense-audit-refresh-token');
    if (!refreshTokenValue) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('expense-audit-token', data.data.accessToken);
        localStorage.setItem('expense-audit-refresh-token', data.data.refreshToken);
        return true;
      } else {
        localStorage.removeItem('expense-audit-token');
        localStorage.removeItem('expense-audit-refresh-token');
        return false;
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      localStorage.removeItem('expense-audit-token');
      localStorage.removeItem('expense-audit-refresh-token');
      return false;
    }
  }, []);

  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('expense-audit-token');

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers as Record<string, string>) }
    });

    if (response.status === 401) {
      const refreshed = await refreshTokenFn();
      if (refreshed) {
        const newToken = localStorage.getItem('expense-audit-token');
        return fetch(`${API_BASE}${url}`, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...(newToken && { Authorization: `Bearer ${newToken}` }),
            ...(options.headers as Record<string, string>)
          }
        });
      } else {
        setUser(null);
        localStorage.removeItem('expense-audit-token');
        localStorage.removeItem('expense-audit-refresh-token');
        throw new Error('Session expired');
      }
    }

    return response;
  }, [refreshTokenFn]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('expense-audit-token');
      if (token) {
        try {
          const response = await apiRequest('/auth/me');
          if (response.ok) {
            const data = await response.json();
            setUser(data.data.user);
          } else {
            localStorage.removeItem('expense-audit-token');
            localStorage.removeItem('expense-audit-refresh-token');
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
          localStorage.removeItem('expense-audit-token');
          localStorage.removeItem('expense-audit-refresh-token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [apiRequest]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        const { user, tokens } = data.data;
        setUser(user);
        localStorage.setItem('expense-audit-token', tokens.accessToken);
        localStorage.setItem('expense-audit-refresh-token', tokens.refreshToken);
        setIsLoading(false);
        return true;
      } else {
        setError(data.message || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (response.ok) {
        const { user, tokens } = data.data;
        setUser(user);
        localStorage.setItem('expense-audit-token', tokens.accessToken);
        localStorage.setItem('expense-audit-refresh-token', tokens.refreshToken);
        setIsLoading(false);
        return true;
      } else {
        setError(data.message || 'Registration failed');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshTokenValue = localStorage.getItem('expense-audit-refresh-token');
      if (refreshTokenValue) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refreshTokenValue })
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('expense-audit-token');
      localStorage.removeItem('expense-audit-refresh-token');
      localStorage.removeItem('expense-audit-data');
      localStorage.removeItem('expense-audit-ai-summary');
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const result = await response.json();
        setUser(result.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Profile update error:', err);
      return false;
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
          confirmPassword
        })
      });
      if (response.ok) return true;
      const errorData = await response.json();
      setError(errorData.message || 'Password update failed');
      return false;
    } catch (err) {
      console.error('Password update error:', err);
      setError('Password update failed');
      return false;
    }
  };

  const checkPasswordStatus = async (): Promise<{
    hasPassword: boolean;
    isOAuthUser: boolean;
    authMethod: string;
  } | null> => {
    try {
      const response = await apiRequest('/auth/password-status');
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('Password status check error:', err);
      return null;
    }
  };

  const updateAIConfig = async (config: Partial<AIConfig>): Promise<boolean> => {
    try {
      const requestBody = {
        preferredProvider: config.preferredProvider,
        model: config.models?.[config.preferredProvider!]?.model,
        apiKey: config.models?.[config.preferredProvider!]?.apiKey
      };
      const response = await apiRequest('/auth/ai-config', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });
      if (response.ok) {
        const userResponse = await apiRequest('/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.data.user);
        }
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'AI configuration update failed');
        return false;
      }
    } catch (err) {
      console.error('AI config update error:', err);
      setError('AI configuration update failed');
      return false;
    }
  };

  const getAIConfig = async (): Promise<AIConfig | null> => {
    try {
      const response = await apiRequest('/auth/ai-config');
      if (response.ok) {
        const data = await response.json();
        return data.data.aiConfig;
      }
      return null;
    } catch (err) {
      console.error('Get AI config error:', err);
      return null;
    }
  };

  const updatePreferences = async (
    preferences: Partial<{ theme: string; density: string; language: string }>
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      if (response.ok) {
        const result = await response.json();
        setUser(result.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Preferences update error:', err);
      return false;
    }
  };

  // ── Billing helpers ──────────────────────────────────────────────────────

  const currentPlan: UserPlan = user?.stripe?.plan ?? 'free';
  const isPro = currentPlan === 'pro' || currentPlan === 'enterprise';
  const isEnterprise = currentPlan === 'enterprise';

  const createCheckout = async (priceId: string): Promise<void> => {
    try {
      const response = await apiRequest('/billing/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId })
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout');
    }
  };

  const openBillingPortal = async (): Promise<void> => {
    try {
      const response = await apiRequest('/billing/create-portal', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const err = await response.json();
        setError(err.message || 'Failed to open billing portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      setError('Failed to open billing portal');
    }
  };

  // ────────────────────────────────────────────────────────────────────────

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions: Record<UserRole, string[]> = {
      admin: ['read', 'write', 'delete', 'manage_users', 'export'],
      auditor: ['read', 'write', 'export'],
      viewer: ['read']
    };
    return permissions[user.role]?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshToken: refreshTokenFn,
        updateProfile,
        updatePassword,
        checkPasswordStatus,
        updateAIConfig,
        updatePreferences,
        getAIConfig,
        currentPlan,
        isPro,
        isEnterprise,
        createCheckout,
        openBillingPortal,
        isLoading,
        isAuthenticated: !!user,
        hasPermission,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}