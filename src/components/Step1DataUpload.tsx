import { ArrowRight, CheckCircle2, Upload, Settings, Eye, HelpCircle } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { ColumnMapping } from './ColumnMapping';
import { DataPreview } from './DataPreview';
import { SampleDataGenerator } from './SampleDataGenerator';
import { useDataUpload } from '../hooks/useDataUpload';
import { cn } from '../utils/cn';
import type { ProcessedDataset } from '../types';

interface Step1DataUploadProps {
  onComplete: (dataset: ProcessedDataset) => void;
  className?: string;
}

interface StepIndicatorProps {
  step: number;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

function StepIndicator({ step, title, description, isActive, isCompleted, icon: Icon }: StepIndicatorProps) {
  return (
    <div className={cn(
      'flex items-center space-x-4 p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden',
      'glass-panel shadow-md hover:shadow-lg',
      isActive && 'border-l-4 border-l-indigo-500 dark:border-l-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/5 shadow-[0_4px_25px_rgba(99,102,241,0.08)] scale-[1.01]',
      isCompleted && 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/5',
      !isActive && !isCompleted && 'border-l-4 border-l-slate-300/30 dark:border-l-slate-800/30 opacity-60 hover:opacity-85'
    )}>
      {/* Glow highlight for active panel */}
      {isActive && (
        <div className="absolute -inset-x-20 -top-40 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none z-0" />
      )}

      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 relative z-10 shadow-sm flex-shrink-0',
        isCompleted 
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
          : isActive 
            ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50 text-slate-400'
      )}>
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className={cn(
            'text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 w-max border border-slate-200/50 dark:border-slate-700/50',
            isCompleted ? 'text-emerald-600 dark:text-emerald-400' : isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          )}>
            Step {step}
          </span>
          <span className={cn(
            'font-bold text-base tracking-tight',
            isCompleted ? 'text-slate-800 dark:text-slate-100' : isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          )}>
            {title}
          </span>
        </div>
        <p className={cn(
          'text-xs sm:text-sm mt-1 font-medium',
          isCompleted ? 'text-slate-500 dark:text-slate-400' : isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
        )}>
          {description}
        </p>
      </div>
    </div>
  );
}

export function Step1DataUpload({ onComplete, className }: Step1DataUploadProps) {
  const {
    uploadState,
    availableColumns,
    suggestedMapping,
    processedDataset,
    handleFileSelect,
    updateColumnMapping,
    resetUpload,
    isFileUploaded,
    isColumnsMapped,
    isDataProcessed,
    canProceedToAnalysis,
  } = useDataUpload();

  // Determine current step
  const getCurrentStep = () => {
    if (!isFileUploaded) return 1;
    if (!isColumnsMapped) return 2;
    if (!isDataProcessed) return 3;
    return 3;
  };

  const currentStep = getCurrentStep();

  const handleProceedToAnalysis = () => {
    if (canProceedToAnalysis && processedDataset) {
      onComplete(processedDataset);
    }
  };

  return (
    <div className={cn('max-w-5xl mx-auto space-y-8 animate-fadeIn', className)}>
      {/* Header */}
      <div className="text-center space-y-3 relative py-4">
        {/* Subtle grid backing pattern for visual premium details */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent blur-xl pointer-events-none -z-10 h-32" />
        
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent sm:text-5xl">
          ExpenseAudit AI
        </h1>
        <p className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200">
          Step 1: Data Upload & Preprocessing
        </p>
        <p className="text-xs sm:text-sm font-medium text-slate-450 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your financial data and let us clean, validate, and structure it for high-fidelity Benford's Law analysis.
        </p>
      </div>

      {/* Progress Steps Grid */}
      <div className="grid grid-cols-1 gap-4">
        <StepIndicator
          step={1}
          title="Upload File"
          description="Upload your CSV, Excel, or JSON file containing financial data"
          isActive={currentStep === 1}
          isCompleted={isFileUploaded}
          icon={Upload}
        />
        
        <StepIndicator
          step={2}
          title="Map Columns"
          description="Map your data columns to the required fields for analysis"
          isActive={currentStep === 2}
          isCompleted={isColumnsMapped}
          icon={Settings}
        />
        
        <StepIndicator
          step={3}
          title="Preview & Validate"
          description="Review the cleaned data and ensure it's ready for analysis"
          isActive={currentStep === 3}
          isCompleted={canProceedToAnalysis}
          icon={Eye}
        />
      </div>

      {/* Content Area */}
      <div className="space-y-8">
        {/* Step 1: File Upload */}
        <div className={cn(
          'space-y-6 transition-all duration-300',
          currentStep > 1 && 'opacity-65 scale-[0.995] pointer-events-none'
        )}>
          {/* Sample Data Generator */}
          {!isFileUploaded && (
            <SampleDataGenerator className="mb-6" />
          )}
          
          <FileUpload
            onFileSelect={handleFileSelect}
            uploadState={uploadState}
          />
          
          {uploadState.error && (
            <div className="flex justify-center">
              <button
                onClick={resetUpload}
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 underline transition-all"
              >
                Try uploading a different file
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Column Mapping */}
        {isFileUploaded && (
          <div className={cn(
            'border-t border-slate-200/50 dark:border-slate-800/40 pt-8 space-y-6 transition-all duration-300',
            currentStep > 2 && 'opacity-65 scale-[0.995] pointer-events-none'
          )}>
            <ColumnMapping
              availableColumns={availableColumns}
              initialMapping={suggestedMapping}
              onMappingChange={updateColumnMapping}
            />
          </div>
        )}

        {/* Step 3: Data Preview */}
        {isColumnsMapped && processedDataset && (
          <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-8 space-y-6 animate-fadeIn">
            <DataPreview dataset={processedDataset} />
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/40">
              <button
                onClick={resetUpload}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                Start Over
              </button>
              
              <button
                onClick={handleProceedToAnalysis}
                disabled={!canProceedToAnalysis}
                className={cn(
                  'w-full sm:w-auto px-6 py-3 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 relative overflow-hidden group shadow-md',
                  canProceedToAnalysis
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed border border-slate-300/10'
                )}
              >
                {canProceedToAnalysis && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                )}
                <span>Proceed to Benford Analysis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Card (shown when data is processed) */}
      {isDataProcessed && processedDataset && (
        <div className="relative overflow-hidden rounded-2xl glass-panel border border-indigo-200/50 dark:border-indigo-850/40 p-6 shadow-md shadow-indigo-500/5 animate-fadeIn">
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
            Data Processing Complete
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">Total Rows</span>
              <p className="text-slate-800 dark:text-slate-200 font-extrabold text-xl mt-1">
                {processedDataset.validation.totalRows.toLocaleString()}
              </p>
            </div>
            
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-emerald-500 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">Valid Rows</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xl mt-1">
                {processedDataset.validation.validRows.toLocaleString()}
              </p>
            </div>
            
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
              <span className="text-red-500 dark:text-red-400 font-bold text-xs uppercase tracking-wider">Removed</span>
              <p className="text-red-600 dark:text-red-400 font-extrabold text-xl mt-1">
                {processedDataset.validation.removedRows.toLocaleString()}
              </p>
            </div>
            
            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <span className="text-indigo-500 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">Success Rate</span>
              <p className="text-indigo-600 dark:text-indigo-400 font-extrabold text-xl mt-1">
                {Math.round((processedDataset.validation.validRows / processedDataset.validation.totalRows) * 100)}%
              </p>
            </div>
          </div>
          
          {!canProceedToAnalysis && (
            <div className="mt-5 p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-amber-550 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300">
                <span className="font-bold">Notice:</span> Your dataset needs at least 10 valid rows for reliable Benford's Law analysis. 
                Consider uploading a larger dataset or checking your column mappings.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
