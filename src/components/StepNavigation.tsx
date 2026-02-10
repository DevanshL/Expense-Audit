import { CheckCircle, Upload, BarChart3, PieChart, Brain, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useCurrentStep, useCompletedSteps } from '../hooks/useWorkflowStep';
import type { WorkflowStep } from '../hooks/useWorkflowStep';

interface StepNavigationProps {
  className?: string;
}

const STEPS = [
  {
    key: 'upload' as const,
    title: 'Upload',
    description: 'Data Upload',
    icon: Upload,
    path: '/upload'
  },
  {
    key: 'analysis' as const,
    title: 'Analysis',
    description: 'Benford\'s Law',
    icon: BarChart3,
    path: '/analysis'
  },
  {
    key: 'dashboard' as const,
    title: 'Dashboard',
    description: 'Visualization',
    icon: PieChart,
    path: '/dashboard'
  },
  {
    key: 'report' as const,
    title: 'AI Summary',
    description: 'Natural Language',
    icon: Brain,
    path: '/report'
  },
  {
    key: 'export' as const,
    title: 'Export',
    description: 'Reports',
    icon: FileDown,
    path: '/export'
  }
];

export function StepNavigation({ className }: StepNavigationProps) {
  const navigate = useNavigate();
  const currentStep = useCurrentStep();
  const completedSteps = useCompletedSteps();

  const handleStepClick = (step: WorkflowStep, path: string) => {
    // Allow navigation to completed steps or current step
    if (completedSteps.includes(step) || step === currentStep) {
      navigate(path);
    }
  };
  return (
    <nav className={cn('bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Step Progress */}
          <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.key);
              const isCurrent = currentStep === step.key;
              const isClickable = isCompleted || isCurrent;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center">
                  {/* Step Item */}
                  <button
                    onClick={() => isClickable && handleStepClick(step.key, step.path)}
                    disabled={!isClickable}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200',
                      'min-w-0 flex-shrink-0',
                      isCompleted && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
                      isCurrent && !isCompleted && 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
                      !isCompleted && !isCurrent && 'text-gray-400 dark:text-gray-600',
                      isClickable && 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
                      !isClickable && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {/* Icon or Check */}
                    <div className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all',
                      isCompleted && 'border-green-500 bg-green-500',
                      isCurrent && !isCompleted && 'border-primary-500 bg-primary-500',
                      !isCompleted && !isCurrent && 'border-gray-300 dark:border-gray-600'
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className={cn(
                          'w-3 h-3',
                          isCurrent && 'text-white',
                          !isCurrent && 'text-current'
                        )} />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="hidden sm:block text-left min-w-0">
                      <p className="text-xs font-medium truncate">{step.title}</p>
                      <p className="text-xs opacity-75 truncate">{step.description}</p>
                    </div>
                  </button>

                  {/* Connector */}
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      'w-6 sm:w-8 h-px mx-1 sm:mx-2 transition-colors',
                      completedSteps.includes(STEPS[index + 1].key) || 
                      (isCompleted && (currentStep === STEPS[index + 1].key))
                        ? 'bg-green-300 dark:bg-green-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Percentage */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {Math.round(((completedSteps.length + 1) / STEPS.length) * 100)}% Complete
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Step {STEPS.findIndex(s => s.key === currentStep) + 1} of {STEPS.length}
              </p>
            </div>
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full bg-primary-500 transition-all duration-300 ease-out',
                  completedSteps.length === 4 ? 'w-full' : 
                  completedSteps.length === 3 ? 'w-4/5' :
                  completedSteps.length === 2 ? 'w-3/5' :
                  completedSteps.length === 1 ? 'w-2/5' :
                  completedSteps.length === 0 ? 'w-1/5' : 'w-0'
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
