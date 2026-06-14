import { Navigate, useNavigate } from 'react-router-dom';
import { Step4AISummary } from '../components/Step4AISummary';
import { useDataStore } from '../hooks/useDataStore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PlanGuard } from '../components/PlanGuard';

export function ReportPage() {
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
    navigate('/dashboard');
  };

  const handleContinue = () => {
    success('Summary generated!', 'Create professional reports and exports.');
    navigate('/export');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <PlanGuard required="pro" onBack={handleBack}>
        <Step4AISummary
          dataset={dataset}
          onBack={handleBack}
          onContinue={handleContinue}
          className="min-h-full"
        />
      </PlanGuard>
    </div>
  );
}

