import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'analyst' | 'viewer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    // Redirect to upload page if user doesn't have required role
    // In a real app, you might show an unauthorized page instead
    return <Navigate to="/upload" replace />;
  }

  return <>{children}</>;
}
