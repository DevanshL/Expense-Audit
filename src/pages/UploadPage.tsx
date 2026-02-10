import { Navigate, useNavigate } from 'react-router-dom';
import { Step1DataUpload } from '../components/Step1DataUpload';
import { useDataStore } from '../hooks/useDataStore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { ProcessedDataset } from '../types';

export function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setDataset } = useDataStore();
  const { success } = useToast();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleComplete = (processedDataset: ProcessedDataset) => {
    setDataset(processedDataset);
    success('Data processed successfully!', 'Your data is ready for Benford\'s Law analysis.');
    navigate('/analysis');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <Step1DataUpload
        onComplete={handleComplete}
        className="min-h-full"
      />
    </div>
  );
}
