import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings, 
  User, 
  Key, 
  Shield, 
  Brain, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Save,
  Building,
  Mail,
  Lock,
  Trash2,
  Users,
  BarChart3,
  Database,
  Activity,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/cn';
import { testAPIKey } from '../utils/aiModelManager';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface AIConfig {
  preferredProvider: 'openai' | 'gemini' | 'anthropic' | 'azure';
  models: {
    openai: { model: string; apiKey?: string };
    gemini: { model: string; apiKey?: string };
    anthropic: { model: string; apiKey?: string };
    azure: { model: string; apiKey?: string; endpoint?: string; deploymentName?: string };
  };
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  organization: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const aiConfigSchema = z.object({
  preferredProvider: z.enum(['openai', 'gemini', 'anthropic', 'azure']),
  apiKey: z.string().min(1, 'API key is required'),
  model: z.string().min(1, 'Model selection is required'),
  azureEndpoint: z.string().optional(),
  azureDeployment: z.string().optional(),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  density: z.enum(['compact', 'comfortable']),
  language: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type AIConfigFormData = z.infer<typeof aiConfigSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface AIProvider {
  id: string;
  name: string;
  description: string;
  models: { id: string; name: string; description: string }[];
  keyFormat: string;
  icon: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Latest GPT models with advanced reasoning',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest and most capable model (Nov 2024)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective latest model' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation, reliable' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Legacy model, basic tasks' },
    ],
    keyFormat: 'sk-...',
    icon: '🤖'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Latest Claude models with advanced reasoning',
    models: [
      { id: 'claude-4-opus', name: 'Claude 4 Opus', description: 'Latest flagship model with enhanced capabilities (2025)' },
      { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', description: 'Advanced balanced model (2025)' },
      { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Enhanced reasoning model (Dec 2024)' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Previous generation with enhanced reasoning' },
      { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', description: 'Fast and efficient latest model' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Previous flagship for complex tasks' },
    ],
    keyFormat: 'sk-ant-...',
    icon: '🎭'
  },
  {
    id: 'gemini',
    name: 'Google AI',
    description: 'Latest Gemini models with advanced capabilities',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Latest production model with enhanced reasoning' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast latest generation model' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Experimental cutting-edge model' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Production-ready with long context' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast processing, good for analysis' },
    ],
    keyFormat: 'AIza...',
    icon: '🔷'
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    description: 'Enterprise OpenAI models through Microsoft Azure',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Azure)', description: 'Latest model via Azure deployment' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Azure)', description: 'Azure-hosted GPT-4 Turbo' },
      { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo (Azure)', description: 'Azure-hosted GPT-3.5' },
    ],
    keyFormat: 'Azure API Key',
    icon: '☁️'
  }
];

export function SettingsPage() {
  const { user, updateProfile, updatePassword, updateAIConfig, checkPasswordStatus, logout } = useAuth();
  const { usageData, loading: usageLoading, error: usageError, fetchUsageStats } = useUsageTracking();
  const { theme, density, language, updatePreferences: updateThemePreferences } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordStatus, setPasswordStatus] = useState<{ hasPassword: boolean; isOAuthUser: boolean; authMethod: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiTestResult, setApiTestResult] = useState<{success: boolean; message: string; responseTime?: number} | null>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      organization: user?.organization || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange'
  });

  // Check password status on component mount
  useEffect(() => {
    const fetchPasswordStatus = async () => {
      const status = await checkPasswordStatus();
      setPasswordStatus(status);
    };
    
    if (user) {
      fetchPasswordStatus();
    }
  }, [user, checkPasswordStatus]);

  // Update form validation based on password status
  useEffect(() => {
    if (passwordStatus) {
      // Clear current password field if user doesn't have a password
      if (!passwordStatus.hasPassword) {
        passwordForm.setValue('currentPassword', '');
      }
    }
  }, [passwordStatus, passwordForm]);

  const aiConfigForm = useForm<AIConfigFormData>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      preferredProvider: user?.aiConfig?.preferredProvider || 'openai',
      apiKey: '', // Never pre-populate API keys for security
      model: user?.aiConfig?.models?.[user?.aiConfig?.preferredProvider || 'openai']?.model || 'gpt-4o-mini',
    },
  });

  // Update AI config form when user data changes
  useEffect(() => {
    if (user?.aiConfig) {
      const currentProvider = user.aiConfig.preferredProvider || 'openai';
      aiConfigForm.setValue('preferredProvider', currentProvider);
      aiConfigForm.setValue('model', user.aiConfig.models?.[currentProvider]?.model || 'gpt-4o-mini');
      // Don't pre-populate API key for security reasons
      aiConfigForm.setValue('apiKey', '');
    }
  }, [user?.aiConfig, aiConfigForm]);

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: theme || 'light',
      density: density || 'comfortable',
      language: language || 'en',
    },
  });

  const selectedProvider = AI_PROVIDERS.find(p => p.id === aiConfigForm.watch('preferredProvider'));

  // Update form when user's AI config changes
  useEffect(() => {
    if (user?.aiConfig) {
      aiConfigForm.setValue('preferredProvider', user.aiConfig.preferredProvider);
      const currentModel = user.aiConfig.models?.[user.aiConfig.preferredProvider]?.model;
      if (currentModel) {
        aiConfigForm.setValue('model', currentModel);
      }
    }
  }, [user?.aiConfig, aiConfigForm]);

  // Fetch usage statistics when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log('SettingsPage: Calling fetchUsageStats for user:', user.email);
      fetchUsageStats();
    }
  }, [user, fetchUsageStats]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Update form values when theme context changes
  useEffect(() => {
    preferencesForm.reset({
      theme: theme || 'light',
      density: density || 'comfortable',
      language: language || 'en',
    });
  }, [theme, density, language, preferencesForm]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
  };

  const handleTestAPIKey = async (provider: string, apiKey: string, azureConfig?: { endpoint: string; deploymentName: string }) => {
    if (!apiKey.trim()) {
      setApiTestResult({ success: false, message: 'Please enter an API key to test' });
      return;
    }

    setIsTestingAPI(true);
    setApiTestResult(null);

    try {
      const result = await testAPIKey(provider as 'openai' | 'anthropic' | 'gemini' | 'azure', apiKey, azureConfig);
      setApiTestResult(result);
    } catch (error) {
      setApiTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test API key'
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const success = await updateProfile(data);
      if (success) {
        showSuccess('Profile updated successfully');
      } else {
        showError('Failed to update profile');
      }
    } catch {
      showError('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const hasPassword = passwordStatus?.hasPassword;
      const currentPassword = hasPassword ? data.currentPassword : '';
      
      const success = await updatePassword(currentPassword || '', data.newPassword, data.confirmPassword);
      if (success) {
        const message = hasPassword ? 'Password updated successfully' : 'Password set successfully';
        showSuccess(message);
        passwordForm.reset();
        // Refresh password status
        const newStatus = await checkPasswordStatus();
        setPasswordStatus(newStatus);
      } else {
        showError('Failed to update password');
      }
    } catch {
      showError('An error occurred while updating password');
    } finally {
      setIsLoading(false);
    }
  };

  const onAIConfigSubmit = async (data: AIConfigFormData) => {
    setIsLoading(true);
    try {
      // First, validate the API key before saving
      if (data.apiKey && data.apiKey.trim()) {
        console.log('Testing API key before saving...');
        
        // For Azure, prepare the config object
        const azureConfig = data.preferredProvider === 'azure' ? {
          endpoint: data.azureEndpoint || '',
          deploymentName: data.azureDeployment || ''
        } : undefined;
        
        const testResult = await testAPIKey(data.preferredProvider, data.apiKey, azureConfig);
        
        if (!testResult.success) {
          showError(`API Key validation failed: ${testResult.message}`);
          setIsLoading(false);
          return;
        }
        
        console.log('API key validation successful');
      }

      // Transform the form data to match the new backend API structure
      const configUpdate: Partial<AIConfig> = {
        preferredProvider: data.preferredProvider,
        models: {
          [data.preferredProvider]: {
            model: data.model,
            apiKey: data.apiKey,
            ...(data.preferredProvider === 'azure' && {
              endpoint: data.azureEndpoint,
              deploymentName: data.azureDeployment
            })
          }
        } as AIConfig['models']
      };
      
      const success = await updateAIConfig(configUpdate);
      if (success) {
        showSuccess('AI configuration saved successfully');
        aiConfigForm.setValue('apiKey', ''); // Clear API key field after save
        setApiTestResult(null); // Clear test result
      } else {
        showError('Failed to save AI configuration');
      }
    } catch (error) {
      console.error('Error in AI config submit:', error);
      showError('An error occurred while saving AI configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const onPreferencesSubmit = async (data: PreferencesFormData) => {
    setIsLoading(true);
    try {
      // Update theme context (which handles both local and backend storage)
      await updateThemePreferences(data);
      showSuccess('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      showError('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  // Export handlers
  const handleExportProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/export/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile_data_${user?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Profile data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export profile data');
    }
  };

  const handleExportAISummaries = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai/export-summaries`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_summaries_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('AI summaries exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export AI summaries');
    }
  };

  const handleExportActivity = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/export/activity`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_log_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Activity log exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export activity log');
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear localStorage cache
      localStorage.removeItem('expense-audit-cache');
      localStorage.removeItem('expense-audit-ai-cache');
      
      // Clear server cache
      const response = await fetch(`${API_BASE}/users/clear-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        }
      });

      if (response.ok) {
        showSuccess('Cache cleared successfully');
      } else {
        throw new Error('Server cache clear failed');
      }
    } catch (error) {
      console.error('Cache clear failed:', error);
      showError('Failed to clear cache');
    }
  };

  const handleDeleteReports = async () => {
    if (!window.confirm('Are you sure? This will permanently delete all your reports and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/reports`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        }
      });

      if (!response.ok) throw new Error('Delete failed');

      showSuccess('All reports deleted successfully');
      // Refresh usage stats
      fetchUsageStats();
    } catch (error) {
      console.error('Delete failed:', error);
      showError('Failed to delete reports');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
      return;
    }

    // Double confirmation for account deletion
    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      showError('Account deletion cancelled');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        }
      });

      if (!response.ok) throw new Error('Delete failed');

      // Clear all local storage and redirect to login
      localStorage.clear();
      showSuccess('Account deleted successfully');
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Delete failed:', error);
      showError('Failed to delete account');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'ai-config', label: 'AI Configuration', icon: Brain },
    { id: 'usage', label: 'Usage Stats', icon: BarChart3 },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'export', label: 'Export & Data', icon: Database },
    ...(user?.role === 'admin' ? [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'system', label: 'System Stats', icon: Database }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...profileForm.register('name')}
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your full name"
                        />
                      </div>
                      {profileForm.formState.errors.name && (
                        <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...profileForm.register('email')}
                          type="email"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      {profileForm.formState.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization <span className="text-gray-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...profileForm.register('organization')}
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your company or organization"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {passwordStatus?.hasPassword ? 'Change Password' : 'Set Password'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {passwordStatus?.hasPassword 
                        ? 'Update your existing password for enhanced security' 
                        : passwordStatus?.isOAuthUser 
                          ? 'Set a password to enable login with email and password in addition to Google OAuth'
                          : 'Create a secure password for your account'
                      }
                    </p>
                    {passwordStatus?.isOAuthUser && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>OAuth Account:</strong> You signed up with Google. 
                              {passwordStatus.hasPassword 
                                ? ' You can change your password or continue using Google sign-in.'
                                : ' Setting a password will allow you to sign in with either Google or email/password.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    {/* Current Password - only show if user has existing password */}
                    {passwordStatus?.hasPassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...passwordForm.register('currentPassword')}
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your current password"
                            required={passwordStatus?.hasPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {passwordStatus?.hasPassword ? 'New Password' : 'Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...passwordForm.register('newPassword')}
                          type={showNewPassword ? 'text' : 'password'}
                          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={passwordStatus?.hasPassword ? "Create a new password" : "Create a secure password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {passwordStatus?.hasPassword ? 'Confirm New Password' : 'Confirm Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...passwordForm.register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={passwordStatus?.hasPassword ? "Confirm your new password" : "Confirm your password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {isLoading 
                          ? (passwordStatus?.hasPassword ? 'Updating...' : 'Setting...') 
                          : (passwordStatus?.hasPassword ? 'Update Password' : 'Set Password')
                        }
                      </span>
                    </button>
                  </form>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                  <div className="space-y-4">
                    <button
                      onClick={logout}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
                          // TODO: Implement account deletion
                          showError('Account deletion is not yet implemented. Please contact support.');
                        }
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-config' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Provider Configuration</h3>
                  <p className="text-gray-600 mb-6">
                    Configure your preferred AI provider and API credentials for advanced financial analysis.
                  </p>
                  
                  <form onSubmit={aiConfigForm.handleSubmit(onAIConfigSubmit)} className="space-y-6">
                    {/* Provider Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        AI Provider
                      </label>
                      <div className="grid gap-4">
                        {AI_PROVIDERS.map((provider) => (
                          <label
                            key={provider.id}
                            className={cn(
                              "relative flex cursor-pointer rounded-lg border p-4 focus:outline-none",
                              aiConfigForm.watch('preferredProvider') === provider.id
                                ? "border-blue-600 ring-2 ring-blue-600 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400"
                            )}
                          >
                            <input
                              {...aiConfigForm.register('preferredProvider')}
                              type="radio"
                              value={provider.id}
                              className="sr-only"
                            />
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{provider.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-lg font-medium text-gray-900">{provider.name}</h4>
                                  {aiConfigForm.watch('preferredProvider') === provider.id && (
                                    <Check className="w-5 h-5 text-blue-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{provider.description}</p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {aiConfigForm.formState.errors.preferredProvider && (
                        <p className="mt-1 text-sm text-red-600">{aiConfigForm.formState.errors.preferredProvider.message}</p>
                      )}
                    </div>

                    {/* Model Selection */}
                    {selectedProvider && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model
                        </label>
                        <select
                          {...aiConfigForm.register('model')}
                          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {selectedProvider.models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} - {model.description}
                            </option>
                          ))}
                        </select>
                        {aiConfigForm.formState.errors.model && (
                          <p className="mt-1 text-sm text-red-600">{aiConfigForm.formState.errors.model.message}</p>
                        )}
                      </div>
                    )}

                    {/* API Key */}
                    {selectedProvider && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...aiConfigForm.register('apiKey')}
                            type={showApiKey ? 'text' : 'password'}
                            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`Enter your ${selectedProvider.name} API key (${selectedProvider.keyFormat})`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showApiKey ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Your API key is encrypted and stored securely. It will only be used for analysis requests.
                        </p>
                        
                        {/* API Test Section */}
                        {aiConfigForm.watch('apiKey') && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Test your API key:</span>
                              <button
                                type="button"
                                onClick={() => handleTestAPIKey(
                                  selectedProvider.id,
                                  aiConfigForm.watch('apiKey'),
                                  selectedProvider.id === 'azure' ? {
                                    endpoint: aiConfigForm.watch('azureEndpoint') || '',
                                    deploymentName: aiConfigForm.watch('azureDeployment') || ''
                                  } : undefined
                                )}
                                disabled={isTestingAPI}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isTestingAPI ? 'Testing...' : 'Test API Key'}
                              </button>
                            </div>
                            {apiTestResult && (
                              <div className={cn(
                                "mt-2 p-2 rounded text-sm",
                                apiTestResult.success 
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              )}>
                                <div className="flex items-center space-x-2">
                                  {apiTestResult.success ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4" />
                                  )}
                                  <span>{apiTestResult.message}</span>
                                  {apiTestResult.responseTime && (
                                    <span className="text-xs">({apiTestResult.responseTime}ms)</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {aiConfigForm.formState.errors.apiKey && (
                          <p className="mt-1 text-sm text-red-600">{aiConfigForm.formState.errors.apiKey.message}</p>
                        )}
                      </div>
                    )}

                    {/* Azure Configuration Fields */}
                    {selectedProvider?.id === 'azure' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Azure Endpoint
                          </label>
                          <input
                            {...aiConfigForm.register('azureEndpoint')}
                            type="text"
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://your-resource.openai.azure.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deployment Name
                          </label>
                          <input
                            {...aiConfigForm.register('azureDeployment')}
                            type="text"
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your-deployment-name"
                          />
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Configuration'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Current Configuration Status */}
                {user?.aiConfig?.preferredProvider && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Current Configuration</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {AI_PROVIDERS.find(p => p.id === user.aiConfig?.preferredProvider)?.name || 'Unknown Provider'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Model: {user.aiConfig.models?.[user.aiConfig.preferredProvider]?.model || 'Not configured'}
                          </p>
                          <p className="text-sm text-gray-600">
                            API Key: {user.aiConfig.models?.[user.aiConfig.preferredProvider]?.hasApiKey ? (
                              <span className="text-green-600 font-medium">Configured ✓</span>
                            ) : (
                              <span className="text-yellow-600 font-medium">Not configured</span>
                            )}
                          </p>
                          {user.aiConfig.preferredProvider === 'azure' && (
                            <>
                              <p className="text-sm text-gray-600">
                                Endpoint: {user.aiConfig.models?.azure?.hasEndpoint ? (
                                  <span className="text-green-600 font-medium">Configured ✓</span>
                                ) : (
                                  <span className="text-yellow-600 font-medium">Not configured</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                Deployment: {user.aiConfig.models?.azure?.model ? (
                                  <span className="text-green-600 font-medium">{user.aiConfig.models.azure.model} ✓</span>
                                ) : (
                                  <span className="text-yellow-600 font-medium">Not configured</span>
                                )}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.aiConfig.models?.[user.aiConfig.preferredProvider]?.hasApiKey ? (
                            <Check className="w-6 h-6 text-green-500" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Usage Stats Tab */}
            {activeTab === 'usage' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
                  <button
                    onClick={fetchUsageStats}
                    disabled={usageLoading}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
                  >
                    {usageLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                
                {usageError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">Error loading usage statistics</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{usageError}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-8 h-8 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {usageLoading ? '...' : (usageData?.stats?.aiSummariesGenerated || 0)}
                        </div>
                        <div className="text-sm text-purple-800">AI Summaries Generated</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {usageLoading ? '...' : (usageData?.stats?.filesUploaded || 0)}
                        </div>
                        <div className="text-sm text-green-800">Files Uploaded</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {usageLoading ? '...' : (usageData?.stats?.reportsGenerated || 0)}
                        </div>
                        <div className="text-sm text-blue-800">Reports Generated</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-8 h-8 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {usageLoading ? '...' : (usageData?.stats?.lastLogin ? new Date(usageData.stats.lastLogin).toLocaleDateString() : 'N/A')}
                        </div>
                        <div className="text-sm text-orange-800">Last Login</div>
                      </div>
                    </div>
                  </div>
                </div>

                {user?.role === 'viewer' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">Viewer Access</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      You can only view shared reports. Contact an admin to upgrade your access.
                    </p>
                  </div>
                )}

                {user?.role === 'auditor' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Auditor Access</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      You can upload and analyze your own data files.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* UI Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">UI Preferences</h3>
                  <p className="text-gray-600 mb-6">
                    Customize your interface to suit your preferences.
                  </p>
                  
                  <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                    {/* Theme Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {(['light', 'dark', 'system'] as const).map((theme) => (
                          <label
                            key={theme}
                            className={cn(
                              "relative flex cursor-pointer rounded-lg border p-4 focus:outline-none",
                              preferencesForm.watch('theme') === theme
                                ? "border-blue-600 ring-2 ring-blue-600 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400"
                            )}
                          >
                            <input
                              {...preferencesForm.register('theme')}
                              type="radio"
                              value={theme}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-center w-full">
                              <div className="text-center">
                                <div className="text-2xl mb-2">
                                  {theme === 'light' && '☀️'}
                                  {theme === 'dark' && '🌙'}
                                  {theme === 'system' && '🖥️'}
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 capitalize">{theme}</h4>
                                {preferencesForm.watch('theme') === theme && (
                                  <Check className="w-4 h-4 text-blue-600 mx-auto mt-1" />
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Interface Density */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Interface Density
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {(['compact', 'comfortable'] as const).map((density) => (
                          <label
                            key={density}
                            className={cn(
                              "relative flex cursor-pointer rounded-lg border p-4 focus:outline-none",
                              preferencesForm.watch('density') === density
                                ? "border-blue-600 ring-2 ring-blue-600 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400"
                            )}
                          >
                            <input
                              {...preferencesForm.register('density')}
                              type="radio"
                              value={density}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-center w-full">
                              <div className="text-center">
                                <div className="text-lg mb-1">
                                  {density === 'compact' && '📱'}
                                  {density === 'comfortable' && '🖥️'}
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 capitalize">{density}</h4>
                                <p className="text-xs text-gray-500">
                                  {density === 'compact' ? 'More content in less space' : 'Spacious and easy to read'}
                                </p>
                                {preferencesForm.watch('density') === density && (
                                  <Check className="w-4 h-4 text-blue-600 mx-auto mt-1" />
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Language Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select 
                        {...preferencesForm.register('language')}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        title="Select language preference"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="es">Español (Spanish)</option>
                        <option value="fr">Français (French)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Export & Data Tab */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Export & Data Management</h3>
                  <p className="text-gray-600 mb-6">
                    Download your data or manage your account information.
                  </p>
                  
                  <div className="space-y-6">
                    {/* Export Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                        <Database className="w-5 h-5 mr-2" />
                        Export Your Data
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={handleExportProfile}
                          className="flex items-center justify-center space-x-2 p-4 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Database className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">Export Profile Data (.json)</span>
                        </button>
                        <button 
                          onClick={handleExportAISummaries}
                          className="flex items-center justify-center space-x-2 p-4 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">Export AI Summaries (.json)</span>
                        </button>
                        <button 
                          onClick={handleExportActivity}
                          className="flex items-center justify-center space-x-2 p-4 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">Export Reports (.csv)</span>
                        </button>
                        <button 
                          onClick={handleExportActivity}
                          className="flex items-center justify-center space-x-2 p-4 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Activity className="w-5 h-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">Export Activity Log (.json)</span>
                        </button>
                      </div>
                      <p className="text-sm text-blue-700 mt-4">
                        Your exported data will include all reports, AI summaries, and account information in a secure format.
                      </p>
                    </div>

                    {/* Data Management */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Data Management
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">Clear AI Summary Cache</p>
                            <p className="text-sm text-gray-600">Remove locally cached AI analysis results</p>
                          </div>
                          <button 
                            onClick={handleClearCache}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Clear Cache
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">Download Account Data</p>
                            <p className="text-sm text-gray-600">Get a complete backup of your account information</p>
                          </div>
                          <button 
                            onClick={handleExportProfile}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-red-900 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Danger Zone
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-red-900">Delete All Reports</p>
                            <p className="text-sm text-red-700">Permanently remove all uploaded reports and analysis data</p>
                          </div>
                          <button 
                            onClick={handleDeleteReports}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete Reports
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-red-900">Delete Account</p>
                            <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                          </div>
                          <button 
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Tab (Admin Only) */}
            {activeTab === 'users' && user?.role === 'admin' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">User Management</h2>
                
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Admin Access Required</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    This section contains sensitive user management functions.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <Users className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">View All Users</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Add New User</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Manage Roles</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Stats Tab (Admin Only) */}
            {activeTab === 'system' && user?.role === 'admin' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">System Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="w-8 h-8 text-indigo-600" />
                      <div>
                        <div className="text-2xl font-bold text-indigo-600">
                          {user?.role === 'admin' ? 45 : 'N/A'}
                        </div>
                        <div className="text-sm text-indigo-800">Total Users</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="w-8 h-8 text-emerald-600" />
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {user?.role === 'admin' ? 234 : 'N/A'}
                        </div>
                        <div className="text-sm text-emerald-800">Total Reports</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-8 h-8 text-amber-600" />
                      <div>
                        <div className="text-2xl font-bold text-amber-600">
                          {user?.role === 'admin' ? '99.9%' : 'N/A'}
                        </div>
                        <div className="text-sm text-amber-800">System Uptime</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Recent Activity (Last 24h)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">New user registrations</span>
                      <span className="font-medium">{user?.role === 'admin' ? 3 : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reports generated</span>
                      <span className="font-medium">{user?.role === 'admin' ? 12 : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active sessions</span>
                      <span className="font-medium">{user?.role === 'admin' ? 8 : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">AI summaries generated</span>
                      <span className="font-medium">{user?.role === 'admin' ? 24 : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
