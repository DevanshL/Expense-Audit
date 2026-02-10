import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';

export function UserDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSettingsClick = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-3 p-2 rounded-lg transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          isOpen && "bg-gray-100 dark:bg-gray-700"
        )}
      >
        {/* User Info (hidden on mobile) */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
          <span className="text-primary-600 dark:text-primary-300 font-medium text-sm">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-300 font-medium">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                {user.role && (
                  <div className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1",
                    user.role === 'admin' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                    user.role === 'auditor' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    user.role === 'viewer' && "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  )}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleSettingsClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
