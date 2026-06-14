import { CheckCircle, Upload, BarChart3, PieChart, Brain, FileDown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useCurrentStep, useCompletedSteps } from '../hooks/useWorkflowStep';
import { useAuth } from '../hooks/useAuth';
import type { WorkflowStep } from '../hooks/useWorkflowStep';

interface StepNavigationProps {
  className?: string;
}

// Steps that require a paid plan
const PRO_STEPS: WorkflowStep[] = ['report', 'export'];

const STEP_ORDER: WorkflowStep[] = ['upload', 'analysis', 'dashboard', 'report', 'export'];

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
    description: "Benford's Law",
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
  const { isPro } = useAuth();

  const handleStepClick = (step: WorkflowStep, path: string) => {
    const isClickable = 
      step === 'upload' ||
      completedSteps.includes(step) ||
      step === currentStep ||
      (() => {
        const idx = STEP_ORDER.indexOf(step);
        return idx > 0 && completedSteps.includes(STEP_ORDER[idx - 1]);
      })();

    if (isClickable) {
      navigate(path);
    }
  };

  return (
    <nav className={cn('mx-auto my-4 w-[calc(100%-2rem)] max-w-7xl rounded-2xl glass-panel shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] border border-slate-200/60 dark:border-slate-800/50 backdrop-blur-md transition-all duration-300 relative z-30', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 md:py-4 gap-4">
          {/* Step Progress */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 overflow-x-auto w-full md:w-auto scrollbar-thin py-1">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.key);
              const isCurrent = currentStep === step.key;
              const isProStep = PRO_STEPS.includes(step.key);
              const isLocked = isProStep && !isPro;
              
              // A step is clickable only in proper sequential workflow order
              const isClickable = 
                step.key === 'upload' ||
                isCompleted ||
                isCurrent ||
                (() => {
                  const idx = STEP_ORDER.indexOf(step.key);
                  return idx > 0 && completedSteps.includes(STEP_ORDER[idx - 1]);
                })();
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => handleStepClick(step.key, step.path)}
                    disabled={!isClickable}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300',
                      'min-w-0 flex-shrink-0 relative border border-transparent outline-none',
                      isCurrent && 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)] scale-[1.02]',
                      isCompleted && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                      !isCompleted && !isCurrent && 'text-slate-400 dark:text-slate-500',
                      isClickable && !isCurrent && 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:scale-[1.01] hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer',
                      !isClickable && 'cursor-not-allowed opacity-45'
                    )}
                  >
                    {/* Icon or Check */}
                    <div className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-300 relative shadow-sm',
                      isCompleted && 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
                      isCurrent && 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
                      !isCompleted && !isCurrent && 'border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50'
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className={cn(
                          'w-3.5 h-3.5 transition-transform duration-300',
                          isCurrent && 'text-white scale-110',
                          !isCurrent && 'text-current'
                        )} />
                      )}
                      {/* Lock badge for pro steps when on free plan */}
                      {isLocked && !isCompleted && (
                        <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-4 h-4 flex items-center justify-center border border-white dark:border-slate-900 shadow-md">
                          <Lock className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="hidden sm:block text-left min-w-0">
                      <p className={cn(
                        'text-xs font-semibold truncate flex items-center gap-1.5',
                        isCurrent && 'text-slate-900 dark:text-white',
                        isCompleted && 'text-slate-800 dark:text-slate-200',
                        !isCurrent && !isCompleted && 'text-slate-500 dark:text-slate-400'
                      )}>
                        {step.title}
                        {isLocked && !isCompleted && (
                          <span className="px-1 py-0.2 text-[8px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded">Pro</span>
                        )}
                      </p>
                      <p className="text-[10px] opacity-75 truncate font-medium text-slate-400 dark:text-slate-500">{step.description}</p>
                    </div>
                  </button>

                  {/* Connector */}
                  {index < STEPS.length - 1 && (
                    <div className="w-5 sm:w-7 md:w-8 flex items-center justify-center mx-0.5 sm:mx-1">
                      <div className={cn(
                        'w-full h-[2px] rounded-full transition-all duration-500',
                        completedSteps.includes(STEPS[index + 1].key) || (isCompleted && currentStep === STEPS[index + 1].key)
                          ? 'bg-gradient-to-r from-emerald-500 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                          : isCompleted && !isCurrent
                          ? 'bg-emerald-400/50'
                          : isCurrent
                          ? 'bg-gradient-to-r from-indigo-500/40 to-slate-200/40 dark:to-slate-800/40 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-850'
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Percentage */}
          <div className="hidden md:flex items-center space-x-4 border-l border-slate-200/60 dark:border-slate-800/60 pl-6 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {Math.round(((completedSteps.length + 1) / STEPS.length) * 100)}% Complete
              </p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Step {STEPS.findIndex(s => s.key === currentStep) + 1} of {STEPS.length}
              </p>
            </div>
            <div className="w-20 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-300/10 dark:border-slate-700/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.6)] relative overflow-hidden"
                style={{
                  width: `${((completedSteps.length + 1) / STEPS.length) * 100}%`
                }}
              >
                {/* Glossy glare animation sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shine_2.5s_infinite]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}