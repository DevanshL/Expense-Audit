import { ArrowRight, CheckCircle2, Upload, Settings, Eye } from 'lucide-react';
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
      'flex items-center space-x-4 p-4 rounded-lg border transition-all',
      isActive ? 'border-primary-300 bg-primary-50' : 'border-gray-200',
      isCompleted ? 'border-green-300 bg-green-50' : ''
    )}>
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
        isCompleted 
          ? 'border-green-500 bg-green-500 text-white'
          : isActive 
            ? 'border-primary-500 bg-primary-500 text-white'
            : 'border-gray-300 bg-white text-gray-400'
      )}>
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className={cn(
            'text-sm font-medium',
            isCompleted ? 'text-green-900' : isActive ? 'text-primary-900' : 'text-gray-500'
          )}>
            Step {step}
          </span>
          <span className={cn(
            'font-semibold',
            isCompleted ? 'text-green-900' : isActive ? 'text-primary-900' : 'text-gray-700'
          )}>
            {title}
          </span>
        </div>
        <p className={cn(
          'text-sm mt-1',
          isCompleted ? 'text-green-700' : isActive ? 'text-primary-700' : 'text-gray-500'
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
    <div className={cn('max-w-6xl mx-auto space-y-8', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          ExpenseAudit AI
        </h1>
        <p className="text-lg text-gray-600">
          Step 1: Data Upload & Preprocessing
        </p>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto">
          Upload your financial data and let us clean and validate it for accurate Benford's Law analysis.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
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
          'space-y-6',
          currentStep > 1 && 'opacity-75'
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
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Try uploading a different file
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Column Mapping */}
        {isFileUploaded && (
          <div className={cn(
            'border-t border-gray-200 pt-8 space-y-6',
            currentStep > 2 && 'opacity-75'
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
          <div className="border-t border-gray-200 pt-8 space-y-6">
            <DataPreview dataset={processedDataset} />
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={resetUpload}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              
              <button
                onClick={handleProceedToAnalysis}
                disabled={!canProceedToAnalysis}
                className={cn(
                  'px-6 py-3 font-medium rounded-md transition-all duration-200 flex items-center space-x-2',
                  canProceedToAnalysis
                    ? 'bg-primary-600 text-white hover:bg-primary-700 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                <span>Proceed to Benford Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Card (shown when data is processed) */}
      {isDataProcessed && processedDataset && (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-3">
            Data Processing Complete
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-primary-700 font-medium">Total Rows:</span>
              <p className="text-primary-900 font-semibold">
                {processedDataset.validation.totalRows.toLocaleString()}
              </p>
            </div>
            
            <div>
              <span className="text-green-700 font-medium">Valid Rows:</span>
              <p className="text-green-900 font-semibold">
                {processedDataset.validation.validRows.toLocaleString()}
              </p>
            </div>
            
            <div>
              <span className="text-red-700 font-medium">Removed:</span>
              <p className="text-red-900 font-semibold">
                {processedDataset.validation.removedRows.toLocaleString()}
              </p>
            </div>
            
            <div>
              <span className="text-primary-700 font-medium">Success Rate:</span>
              <p className="text-primary-900 font-semibold">
                {Math.round((processedDataset.validation.validRows / processedDataset.validation.totalRows) * 100)}%
              </p>
            </div>
          </div>
          
          {!canProceedToAnalysis && (
            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-md">
              <p className="text-amber-800 text-sm">
                ⚠️ Your dataset needs at least 10 valid rows for reliable Benford's Law analysis. 
                Consider uploading a larger dataset or checking your data quality.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
