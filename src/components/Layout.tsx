import type { ReactNode } from 'react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { SettingsPanel } from './SettingsPanel';
import { StepNavigation } from './StepNavigation';
import { UserDropdown } from './UserDropdown';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { InteractiveMeshBackground } from './ui/InteractiveMeshBackground';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPlan, isPro } = useAuth();

  const showStepNav = !['/login', '/settings'].includes(location.pathname);

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
      {/* Soft Interactive Background Connection Mesh */}
      <div className="opacity-45 dark:opacity-65 pointer-events-none">
        <InteractiveMeshBackground />
      </div>

      {/* Subtle Floating Ambient Glow Blobs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-[100px] animate-drift-slow pointer-events-none z-0" />
      <div className="absolute bottom-20 left-10 w-[450px] h-[450px] bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-[120px] animate-drift-slower pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-200/50 dark:border-slate-800/40 relative">
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">
                  ExpenseAudit AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fraud Detection & Analysis
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-3">

              {/* Upgrade button — only shown to free users */}
              {!isPro && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
                    bg-gradient-to-r from-violet-600 to-purple-600
                    hover:from-violet-700 hover:to-purple-700
                    text-white transition-all duration-200 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade to Pro
                </button>
              )}

              {/* Current plan badge — shown to paid users */}
              {isPro && (
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-semibold',
                  currentPlan === 'enterprise'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                )}>
                  {currentPlan === 'enterprise' ? '⭐ Enterprise' : '✦ Pro'}
                </span>
              )}

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Open settings"
              >
                <Settings className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Dropdown */}
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
      <footer className="glass-panel border-t border-slate-200/50 dark:border-slate-800/40 mt-auto relative z-10">
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
    </div>
  );
}

// Theme Toggle Component
function ThemeToggle() {
  const { setTheme, isDark, updatePreferences } = useTheme();

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await updatePreferences({ theme: newTheme });
    } catch {
      // fail silently — local state already updated
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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