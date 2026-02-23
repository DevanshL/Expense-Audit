import type { ReactNode } from 'react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings, MessageSquare, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { SettingsPanel } from './SettingsPanel';
import { StepNavigation } from './StepNavigation';
import { ToastContainer } from './Toast';
import { UserDropdown } from './UserDropdown';
import { AuditChat } from './AuditChat';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '../hooks/useToast';
import { useDataStore } from '../hooks/useDataStore';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toasts, dismissToast } = useToast();
  const { dataset, auditId } = useDataStore();
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

      {/* Floating Global Audit Chat */}
      {dataset && auditId && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {isChatOpen && (
            <div className="mb-4 w-96 h-[550px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <AuditChat 
                auditId={auditId} 
                auditSnapshot={dataset.validation?.isValid ? {
                  totalAnalyzed: dataset.preview.totalRows,
                  digitFrequencies: [],
                  chiSquare: 0,
                  mad: 0,
                  overallAssessment: 'acceptable',
                  riskLevel: 'low',
                  suspiciousVendors: [],
                  flaggedTransactions: [],
                  warnings: []
                } : null} 
              />
            </div>
          )}
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all hover:scale-105 hover:shadow-2xl",
              isChatOpen ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            title={isChatOpen ? "Close AI Chat" : "Ask AI about your audit"}
          >
            {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          </button>
        </div>
      )}
    </div>
  );
}
