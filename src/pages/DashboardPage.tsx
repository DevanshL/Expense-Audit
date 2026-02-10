import { Navigate, useNavigate } from 'react-router-dom';
import { Step3VisualizationDashboard } from '../components/Step3VisualizationDashboard';
import { useDataStore } from '../hooks/useDataStore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dataset } = useDataStore();
  const { success } = useToast();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!dataset) {
    return <Navigate to="/upload" replace />;
  }

  const handleBack = () => {
    navigate('/analysis');
  };

  const handleContinue = () => {
    success('Dashboard explored!', 'Generate AI-powered insights and summaries.');
    navigate('/report');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <Step3VisualizationDashboard
        dataset={dataset}
        onBack={handleBack}
        onContinue={handleContinue}
        className="min-h-full"
      />
    </div>
  );
}
