import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initializeUser } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refresh = urlParams.get('refresh');
        
        if (token && refresh) {
          localStorage.setItem('expense-audit-token', token);
          localStorage.setItem('expense-audit-refresh-token', refresh);
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Re-initialize the user context with the new tokens before redirecting
          await initializeUser();
          
          navigate('/upload', { replace: true });
        } else {
          // No tokens found, redirect to login
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleOAuthCallback();
  }, [navigate]); // explicitly excluded initializeUser to prevent double-firing loops if it changes reference

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Header */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3 animate-pulse">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ExpenseAudit AI</h1>
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-lg text-gray-700 font-medium">Authenticating...</p>
            <p className="text-sm text-gray-500">Please wait while we set up your account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
