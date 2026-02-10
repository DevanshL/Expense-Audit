import { useLocation } from 'react-router-dom';
import { useDataStore } from './useDataStore';

export type WorkflowStep = 'upload' | 'analysis' | 'dashboard' | 'report' | 'export';

export function useCurrentStep(): WorkflowStep {
  const location = useLocation();
  
  // Map routes to steps
  const routeToStep: Record<string, WorkflowStep> = {
    '/upload': 'upload',
    '/analysis': 'analysis',
    '/dashboard': 'dashboard',
    '/report': 'report',
    '/export': 'export',
  };
  
  return routeToStep[location.pathname] || 'upload';
}

export function useCompletedSteps(): WorkflowStep[] {
  const { dataset } = useDataStore();
  const currentStep = useCurrentStep();
  
  const completed: WorkflowStep[] = [];
  
  if (dataset) completed.push('upload');
  
  // If we're on a later step, mark earlier steps as complete
  if (currentStep === 'dashboard' || currentStep === 'report' || currentStep === 'export') {
    completed.push('analysis');
  }
  if (currentStep === 'report' || currentStep === 'export') {
    completed.push('dashboard');
  }
  if (currentStep === 'export') {
    completed.push('report');
  }
  
  return completed;
}
