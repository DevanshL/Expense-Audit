import { useState, useEffect } from 'react';
import { ArrowLeft, Brain, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { useBenfordAnalysis } from '../hooks/useBenfordAnalysis';
import { AISummaryPanel } from './ai/AISummaryPanel';
import { RiskSummary } from './dashboard/RiskSummary';
import type { ProcessedDataset } from '../types';

interface Step4AISummaryProps {
  dataset: ProcessedDataset;
  onBack: () => void;
  onContinue?: () => void;
  className?: string;
}

export function Step4AISummary({ dataset, onBack, onContinue, className }: Step4AISummaryProps) {
  const { benfordResult, isAnalyzing, analysisError, runAnalysis, hasResult } = useBenfordAnalysis();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai_summary'>('overview');

  // Run analysis if we don't have results
  useEffect(() => {
    if (!hasResult && !isAnalyzing) {
      runAnalysis(dataset);
    }
  }, [dataset, hasResult, isAnalyzing, runAnalysis]);

  if (isAnalyzing) {
    return (
      <div className={cn('max-w-7xl mx-auto', className)}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <Brain className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Preparing AI Analysis...
            </h2>
            <p className="text-gray-600">
              Processing your data for intelligent fraud detection insights
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className={cn('max-w-7xl mx-auto', className)}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analysis Error
            </h2>
            <p className="text-gray-600 max-w-md">
              {analysisError}
            </p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!benfordResult) {
    return (
      <div className={cn('max-w-7xl mx-auto', className)}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Brain className="w-16 h-16 text-gray-400 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">
              No Analysis Results
            </h2>
            <p className="text-gray-600">
              Please run the analysis first to generate AI insights
            </p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-7xl mx-auto space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI-Powered Fraud Analysis Summary
            </h1>
            <p className="text-gray-600">
              Step 4: Natural language insights and recommendations from your analysis
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Status Badge */}
          <div className={cn(
            'inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium',
            benfordResult.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
            benfordResult.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
            benfordResult.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              benfordResult.riskLevel === 'critical' ? 'bg-red-500' :
              benfordResult.riskLevel === 'high' ? 'bg-orange-500' :
              benfordResult.riskLevel === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            )}></div>
            <span className="capitalize">{benfordResult.riskLevel} Risk</span>
          </div>

          {/* Continue Button */}
          {onContinue && (
            <button
              onClick={onContinue}
              className="inline-flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Reports</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analysis Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai_summary')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'ai_summary'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Summary & Insights</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Risk Summary */}
          <RiskSummary result={benfordResult} />

          {/* Key Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transactions Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900">{benfordResult.totalAnalyzed.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">MAD Score</p>
                  <p className="text-2xl font-bold text-gray-900">{benfordResult.mad.toFixed(3)}</p>
                  <p className="text-xs text-gray-500">Mean Absolute Deviation</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Flagged Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{benfordResult.suspiciousVendors.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Suspicious Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{benfordResult.flaggedTransactions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Readiness Check */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <Brain className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Ready for AI Analysis</h3>
                <p className="text-blue-800 mb-4">
                  Your Benford's Law analysis is complete. Switch to the "AI Summary & Insights" tab to generate 
                  natural language explanations and actionable recommendations from these findings.
                </p>
                <button
                  onClick={() => setActiveTab('ai_summary')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Insights</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai_summary' && (
        <AISummaryPanel result={benfordResult} dataset={dataset} />
      )}
    </div>
  );
}
