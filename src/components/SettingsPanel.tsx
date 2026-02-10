import { useState } from 'react';
import { Settings, User, Shield, Palette, Database, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/Form';
import type { User as UserType } from '../contexts/AuthContext';

interface SettingsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
}

export function SettingsPanel({ isOpen = true, onClose, isStandalone = false }: SettingsPanelProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'data'>('profile');

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
    { id: 'data' as const, label: 'Data', icon: Database }
  ];

  const content = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Close settings"
            aria-label="Close settings panel"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'profile' && (
          <ProfileSettings user={user} />
        )}
        {activeTab === 'security' && (
          <SecuritySettings onLogout={logout} />
        )}
        {activeTab === 'preferences' && (
          <PreferencesSettings theme={theme} setTheme={setTheme} />
        )}
        {activeTab === 'data' && (
          <DataSettings />
        )}
      </div>
    </div>
  );

  // Standalone mode (for settings page)
  if (isStandalone) {
    return content;
  }

  // Panel mode (overlay)
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        {content}
      </div>
    </div>
  );
}

// Profile Settings Tab
function ProfileSettings({ user }: { user: UserType | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
              {user?.name || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
              {user?.email || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                user?.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                user?.role === 'auditor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              )}>
                {user?.role || 'N/A'}
              </span>
            </div>
          </div>
          {user?.organization && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                {user.organization}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Security Settings Tab
function SecuritySettings({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Session</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your current session</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preferences Settings Tab
function PreferencesSettings({ theme, setTheme }: { theme: string; setTheme: (theme: 'light' | 'dark' | 'system') => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <div className="space-y-2">
              {[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={theme === option.value}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Data Settings Tab
function DataSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Auto-delete uploaded data</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Automatically delete uploaded files after analysis completion for privacy
            </p>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm text-gray-900 dark:text-white">Enable auto-delete</span>
            </label>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Export preferences</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Default settings for report generation
            </p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-900 dark:text-white">Include AI summary in reports</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-900 dark:text-white">Include charts in PDF exports</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
