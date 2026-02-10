import type { ReactNode } from 'react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import { SettingsPanel } from './SettingsPanel';
import { StepNavigation } from './StepNavigation';
import { ToastContainer } from './Toast';
import { UserDropdown } from './UserDropdown';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { toasts, dismissToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show step navigation on login or settings pages
  const showStepNav = !['/login', '/settings'].includes(location.pathname);

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                <span className="text-white font-bold text-sm">EA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  ExpenseAudit AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fraud Detection & Analysis
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-4">
              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Open settings"
              >
                <Settings className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
              
              {/* Theme Toggle Button */}
              <ThemeToggle />
              
              {/* User Dropdown Menu */}
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Step Navigation */}
      {showStepNav && <StepNavigation />}

      {/* Main Content */}
      <main className={cn('flex-1', className)}>
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <span>© 2025 ExpenseAudit AI</span>
              <span>•</span>
              <span>Powered by Benford's Law</span>
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
// Theme Toggle Component
function ThemeToggle() {
  const { setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

