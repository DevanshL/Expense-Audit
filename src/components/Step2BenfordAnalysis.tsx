import { ArrowLeft, ArrowRight, Play, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import { BenfordResults } from './BenfordResults';
import { useBenfordAnalysis } from '../hooks/useBenfordAnalysis';
import { cn } from '../utils/cn';
import type { ProcessedDataset } from '../types';
import { useEffect } from 'react';

interface Step2BenfordAnalysisProps {
  dataset: ProcessedDataset;
  onBack: () => void;
  onContinue: () => void;
  className?: string;
}

export function Step2BenfordAnalysis({ dataset, onBack, onContinue, className }: Step2BenfordAnalysisProps) {
  const {
    benfordResult,
    isAnalyzing,
    analysisError,
    runAnalysis,
    resetAnalysis,
    hasResult,
    isCompliant,
    needsInvestigation,
  } = useBenfordAnalysis();

  const handleRunAnalysis = () => {
    runAnalysis(dataset);
  };

  const handleReset = () => {
    resetAnalysis();
    // Scroll to top when resetting
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to results when analysis completes
  useEffect(() => {
    if (hasResult && benfordResult) {
      // Small delay to allow DOM to update
      setTimeout(() => {
        const resultsElement = document.getElementById('benford-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        } else {
          // Fallback to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [hasResult, benfordResult]);

  // Remove unused scrollToTop function and use effect instead

  if (!hasResult && !isAnalyzing) {
    return (
      <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            ExpenseAudit AI
          </h1>
          <p className="text-lg text-gray-600">
            Step 2: Benford's Law Analysis
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Apply statistical analysis to detect fraud patterns and anomalies in your financial data using Benford's Law.
          </p>
        </div>

        {/* Dataset Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Ready to Analyze Your Data
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {dataset.validation.validRows.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">Valid Transactions</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {dataset.data.filter(d => d.vendor).length.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">With Vendors</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {new Set(dataset.data.map(d => d.vendor).filter(Boolean)).size}
              </p>
              <p className="text-sm text-blue-700">Unique Vendors</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {Math.round((dataset.validation.validRows / dataset.validation.totalRows) * 100)}%
              </p>
              <p className="text-sm text-blue-700">Data Quality</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleRunAnalysis}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Play className="w-5 h-5" />
              <span>Run Benford's Law Analysis</span>
            </button>
          </div>
        </div>

        {/* What We'll Analyze */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>What We'll Analyze</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">First Digit Distribution</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Extract first digits from all transaction amounts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Compare with Benford's Law expected frequencies</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Calculate deviation scores (MAD, Chi-square)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Fraud Detection</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Flag vendors with suspicious patterns</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Identify unusual transaction amounts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Generate risk assessments and recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Data Upload</span>
          </button>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Analyzing Your Data...
          </h2>
          
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-600">
              Applying Benford's Law analysis to {dataset.validation.validRows.toLocaleString()} transactions...
            </p>
            
            <div className="max-w-md mx-auto space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Extracting first digits</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-200"></div>
                <span>Calculating statistical deviations</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-400"></div>
                <span>Identifying suspicious patterns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">
            Analysis Failed
          </h2>
          
          <p className="text-gray-600 max-w-md mx-auto">
            {analysisError}
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show results
  return (
    <div className={cn('max-w-7xl mx-auto space-y-8', className)}>
      {/* Header with summary */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Analysis Complete
        </h1>
        
        <div className="flex items-center justify-center space-x-4">
          {isCompliant ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Data appears compliant with Benford's Law</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                {needsInvestigation ? 'Significant anomalies detected' : 'Minor deviations found'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {benfordResult && (
        <BenfordResults result={benfordResult} />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-8 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Data Upload</span>
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Run New Analysis
          </button>
          
          <button
            onClick={onContinue}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-all duration-200 transform hover:scale-105"
          >
            <span>Continue to Visualization</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
