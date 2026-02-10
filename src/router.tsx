import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportPage } from './pages/ReportPage';
import { ExportPage } from './pages/ExportPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/upload" replace />,
      },
      {
        path: 'upload',
        element: <UploadPage />,
      },
      {
        path: 'analysis',
        element: <AnalysisPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'report',
        element: <ReportPage />,
      },
      {
        path: 'export',
        element: <ExportPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
