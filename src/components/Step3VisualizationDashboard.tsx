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
      <div className={cn('max-w-5xl mx-auto py-12 animate-fadeIn', className)}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <BarChart3 className="w-7 h-7 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Generating Interactive Dashboard...
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Applying final statistical mappings for interactive visual diagnostics
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className={cn('max-w-5xl mx-auto py-12 animate-fadeIn', className)}>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-max mx-auto">
              <FileText className="w-12 h-12 text-rose-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard Generation Failed
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {analysisError}
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Analysis</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!benfordResult) {
    return (
      <div className={cn('max-w-5xl mx-auto py-12 animate-fadeIn', className)}>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center space-y-6">
            <BarChart3 className="w-16 h-16 text-slate-450 mx-auto" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Missing Ledger Analytics
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Please complete the Step 2 Benford analysis first to explore findings.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Analysis</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="visualization-dashboard" className={cn('max-w-7xl mx-auto space-y-8 animate-fadeIn', className)}>
      {/* Header */}
      <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl px-6 py-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Interactive Fraud Detection Dashboard
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Step 3: High-fidelity visualizations of statistical Benford anomalies
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={handleExportReport}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-550 text-white text-xs font-bold rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report JSON</span>
          </button>
          
          {onContinue && (
            <button
              onClick={onContinue}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-650 via-purple-650 to-indigo-650 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-extrabold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer relative overflow-hidden group border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
              <span>Continue to AI Summary</span>
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
        <div className="fixed inset-0 backdrop-blur-md bg-slate-950/40 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel shadow-2xl border border-white/20 dark:border-slate-800/40 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/40">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Vendor Analysis: {selectedVendor.vendor}
                </h3>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-500/10 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-500/20 transition-all font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Transaction Count</label>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedVendor.transactionCount.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Risk Level</label>
                  <p className={cn(
                    'text-2xl font-black capitalize',
                    selectedVendor.riskLevel === 'critical' ? 'text-red-600 dark:text-red-400' :
                    selectedVendor.riskLevel === 'high' ? 'text-red-500 dark:text-red-450' :
                    selectedVendor.riskLevel === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                  )}>
                    {selectedVendor.riskLevel}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">MAD Score</label>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedVendor.mad.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Chi-Square</label>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedVendor.chiSquare.toFixed(2)}</p>
                </div>
              </div>
              
              {selectedVendor.suspiciousPatterns.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Suspicious Patterns</label>
                  <ul className="space-y-2">
                    {selectedVendor.suspiciousPatterns.map((pattern, index) => (
                      <li key={index} className="text-sm font-semibold text-red-700 dark:text-red-400 bg-red-500/10 dark:bg-red-950/20 border border-red-550/10 px-3 py-2.5 rounded-xl">
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
 
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Digit Distribution</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {Object.entries(selectedVendor.digitDistribution).map(([digit, count]) => (
                    <div key={digit} className="bg-slate-500/5 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800/60 px-3 py-2 rounded-xl text-center text-slate-800 dark:text-slate-200 font-bold">
                      <span className="opacity-60">Digit {digit}:</span> {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {selectedTransaction && (
        <div className="fixed inset-0 backdrop-blur-md bg-slate-950/40 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel shadow-2xl border border-white/20 dark:border-slate-800/40 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/40">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-500/10 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-500/20 transition-all font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Amount</label>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  ${selectedTransaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              {selectedTransaction.vendor && (
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Vendor</label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedTransaction.vendor}</p>
                </div>
              )}
 
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">First Digit</label>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedTransaction.firstDigit}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/30">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Risk Level</label>
                  <p className={cn(
                    'text-xl font-black capitalize',
                    selectedTransaction.riskLevel === 'critical' ? 'text-red-600 dark:text-red-400' :
                    selectedTransaction.riskLevel === 'high' ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                  )}>
                    {selectedTransaction.riskLevel}
                  </p>
                </div>
              </div>
 
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Reason for Flagging</label>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-550/20 rounded-xl p-3.5 mt-1">
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
