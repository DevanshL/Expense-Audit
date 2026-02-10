import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { useBenfordAnalysis } from '../hooks/useBenfordAnalysis';
import { RiskSummary } from './dashboard/RiskSummary';
import { BenfordChart } from './charts/BenfordChart';
import { DeviationHeatmap } from './charts/DeviationHeatmap';
import { VendorsTable } from './tables/VendorsTable';
import { TransactionsTable } from './tables/TransactionsTable';
import type { ProcessedDataset, VendorAnalysis, FlaggedTransaction } from '../types';

interface Step3VisualizationDashboardProps {
  dataset: ProcessedDataset;
  onBack: () => void;
  onContinue?: () => void;
  className?: string;
}

export function Step3VisualizationDashboard({ dataset, onBack, onContinue, className }: Step3VisualizationDashboardProps) {
  const { benfordResult, isAnalyzing, analysisError, runAnalysis, hasResult } = useBenfordAnalysis();
  const [selectedVendor, setSelectedVendor] = useState<VendorAnalysis | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<FlaggedTransaction | null>(null);

  // Run analysis when component mounts if we don't have results
  useEffect(() => {
    if (!hasResult && !isAnalyzing) {
      runAnalysis(dataset);
    }
  }, [dataset, hasResult, isAnalyzing, runAnalysis]);

  // Scroll to top when component mounts and when results are ready
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (hasResult && benfordResult) {
      // Scroll to the dashboard element specifically
      const dashboardElement = document.getElementById('visualization-dashboard');
      if (dashboardElement) {
        dashboardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [hasResult, benfordResult]);

  const handleExportReport = () => {
    if (!benfordResult) return;

    const reportData = {
      summary: {
        totalAnalyzed: benfordResult.totalAnalyzed,
        overallAssessment: benfordResult.overallAssessment,
        riskLevel: benfordResult.riskLevel,
        mad: benfordResult.mad,
        chiSquare: benfordResult.chiSquare,
      },
      digitFrequencies: benfordResult.digitFrequencies,
      suspiciousVendors: benfordResult.suspiciousVendors,
      flaggedTransactions: benfordResult.flaggedTransactions,
      warnings: benfordResult.warnings,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benford_analysis_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isAnalyzing) {
    return (
      <div className={cn('max-w-7xl mx-auto', className)}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Generating Interactive Dashboard...
            </h2>
            <p className="text-gray-600">
              Processing your analysis results for visualization
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
              Dashboard Error
            </h2>
            <p className="text-gray-600 max-w-md">
              {analysisError}
            </p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Analysis
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
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">
              No Analysis Results
            </h2>
            <p className="text-gray-600">
              Please run the Benford analysis first to view the dashboard
            </p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="visualization-dashboard" className={cn('max-w-7xl mx-auto space-y-8 animate-fadeIn', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Analysis</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Interactive Fraud Detection Dashboard
            </h1>
            <p className="text-gray-600">
              Step 3: Comprehensive visualization of Benford's Law analysis results
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportReport}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          
          {onContinue && (
            <button
              onClick={onContinue}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Summary</span>
            </button>
          )}
        </div>
      </div>

      {/* Risk Summary Cards */}
      <RiskSummary result={benfordResult} />

      {/* Main Chart */}
      <BenfordChart frequencies={benfordResult.digitFrequencies} />

      {/* Deviation Heatmap */}
      {benfordResult.suspiciousVendors.length > 0 && (
        <DeviationHeatmap vendors={benfordResult.suspiciousVendors} />
      )}

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Vendors Table */}
        <VendorsTable 
          vendors={benfordResult.suspiciousVendors} 
          onVendorSelect={setSelectedVendor}
        />

        {/* Transactions Table */}
        <TransactionsTable 
          transactions={benfordResult.flaggedTransactions}
          onTransactionSelect={setSelectedTransaction}
        />
      </div>

      {/* Modal/Details Panel for Selected Items */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vendor Analysis: {selectedVendor.vendor}
                </h3>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Transaction Count</label>
                  <p className="text-xl font-bold text-gray-900">{selectedVendor.transactionCount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Risk Level</label>
                  <p className={cn(
                    'text-xl font-bold capitalize',
                    selectedVendor.riskLevel === 'critical' ? 'text-red-600' :
                    selectedVendor.riskLevel === 'high' ? 'text-red-500' :
                    selectedVendor.riskLevel === 'medium' ? 'text-amber-600' : 'text-green-600'
                  )}>
                    {selectedVendor.riskLevel}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">MAD Score</label>
                  <p className="text-xl font-bold text-gray-900">{selectedVendor.mad.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Chi-Square</label>
                  <p className="text-xl font-bold text-gray-900">{selectedVendor.chiSquare.toFixed(2)}</p>
                </div>
              </div>
              
              {selectedVendor.suspiciousPatterns.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Suspicious Patterns</label>
                  <ul className="space-y-1">
                    {selectedVendor.suspiciousPatterns.map((pattern, index) => (
                      <li key={index} className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md">
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Digit Distribution</label>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {Object.entries(selectedVendor.digitDistribution).map(([digit, count]) => (
                    <div key={digit} className="bg-gray-50 px-3 py-2 rounded text-center">
                      <span className="font-medium">Digit {digit}:</span> {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <p className="text-xl font-bold text-gray-900">
                  ${selectedTransaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              {selectedTransaction.vendor && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Vendor</label>
                  <p className="text-lg text-gray-900">{selectedTransaction.vendor}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Digit</label>
                  <p className="text-lg font-bold text-gray-900">{selectedTransaction.firstDigit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Risk Level</label>
                  <p className={cn(
                    'text-lg font-bold capitalize',
                    selectedTransaction.riskLevel === 'critical' ? 'text-red-600' :
                    selectedTransaction.riskLevel === 'high' ? 'text-red-500' : 'text-amber-600'
                  )}>
                    {selectedTransaction.riskLevel}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Reason for Flagging</label>
                <p className="text-sm text-gray-900 bg-amber-50 p-3 rounded-md mt-1">
                  {selectedTransaction.reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
