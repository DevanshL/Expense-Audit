import { Navigate, useNavigate } from 'react-router-dom';
import { Step5ExportReporting } from '../components/Step5ExportReporting';
import { useDataStore } from '../hooks/useDataStore';
import { useAuth } from '../hooks/useAuth';
import { PlanGuard } from '../components/PlanGuard';

export function ExportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dataset } = useDataStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!dataset) {
    return <Navigate to="/upload" replace />;
  }

  const handleBack = () => {
    navigate('/report');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <PlanGuard required="pro" onBack={handleBack}>
        <Step5ExportReporting
          dataset={dataset}
          onBack={handleBack}
          className="min-h-full"
        />
      </PlanGuard>
    </div>
  );
}

