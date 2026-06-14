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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to results when analysis completes
  useEffect(() => {
    if (hasResult && benfordResult) {
      setTimeout(() => {
        const resultsElement = document.getElementById('benford-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [hasResult, benfordResult]);

  if (!hasResult && !isAnalyzing) {
    return (
      <div className={cn('max-w-4xl mx-auto space-y-8 animate-fadeIn', className)}>
        {/* Header */}
        <div className="text-center space-y-3 relative py-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent blur-xl pointer-events-none -z-10 h-32" />
          
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent sm:text-5xl">
            ExpenseAudit AI
          </h1>
          <p className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200">
            Step 2: Benford's Law Analysis
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-450 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Apply advanced statistical testing to extract first digit frequencies and immediately map fraud deviations.
          </p>
        </div>

        {/* Dataset Summary Board */}
        <div className="relative overflow-hidden rounded-2xl glass-panel border border-indigo-200/50 dark:border-indigo-850/40 p-6 shadow-md shadow-indigo-500/5">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-500" />
            Auditable Dataset Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-500/10 text-center">
              <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {dataset.validation.validRows.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Valid Transactions</p>
            </div>
            
            <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-500/10 text-center">
              <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {dataset.data.filter(d => d.vendor).length.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Named Vendors</p>
            </div>
            
            <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-500/10 text-center">
              <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {new Set(dataset.data.map(d => d.vendor).filter(Boolean)).size}
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Unique Vendors</p>
            </div>
            
            <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-500/10 text-center">
              <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {Math.round((dataset.validation.validRows / dataset.validation.totalRows) * 100)}%
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Data Quality</p>
            </div>
          </div>

          <div className="text-center relative z-10">
            <button
              onClick={handleRunAnalysis}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold rounded-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-[0_4px_25px_rgba(99,102,241,0.35)] relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shine_1.8s_ease-in-out_infinite]" />
              <Play className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform duration-300" />
              <span>Run Benford's Law Analysis</span>
            </button>
          </div>
        </div>

        {/* What We'll Analyze Summary Box */}
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-4 flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span>What We'll Analyze</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 uppercase tracking-wider">First Digit Frequency</h4>
              <ul className="text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <span>Extract mathematical leading digits from all positive ledger amounts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <span>Map occurrence rates against the logarithmic Benford scale.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <span>Measure compliance indicators including Mean Absolute Deviation (MAD).</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 uppercase tracking-wider">Anomalous Risk Isolation</h4>
              <ul className="text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <span>Flag merchant indexes and vendors with aberrant digit profiles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <span>Isolate duplicate transaction clusters and round numbers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <span>Output structured summaries for instant executive review.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="flex justify-between pt-6 border-t border-slate-200/50 dark:border-slate-800/40">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-350 bg-white/70 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Upload</span>
          </button>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className={cn('max-w-4xl mx-auto space-y-8 py-12 animate-fadeIn', className)}>
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Running Audit Engine Analysis...
          </h2>
          
          <div className="flex justify-center py-4">
            <div className="relative">
              {/* Spinning outer neon grid ring */}
              <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              {/* Pulsing inner ring */}
              <div className="absolute inset-3 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Applying Benford's Law statistics to {dataset.validation.validRows.toLocaleString()} transactions...
            </p>
            
            <div className="max-w-xs mx-auto space-y-2.5 text-xs font-semibold text-slate-450 dark:text-slate-500">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  <span>Leading Digits Extraction</span>
                </span>
                <span className="text-[10px] text-indigo-500">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  <span>Deviation Calculations</span>
                </span>
                <span className="text-[10px]">Processing</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                  <span>Vendor Risk Mapping</span>
                </span>
                <span className="text-[10px]">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className={cn('max-w-4xl mx-auto space-y-8 py-12 animate-fadeIn', className)}>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
            </div>
          </div>
          
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Analysis Pipeline Failed
          </h2>
          
          <p className="text-sm font-semibold text-slate-550 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {analysisError}
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md"
            >
              Retry Engine
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-750 rounded-xl transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show complete results
  return (
    <div className={cn('max-w-7xl mx-auto space-y-8 animate-fadeIn', className)}>
      {/* Header with compliance summary */}
      <div className="text-center space-y-4 py-4 relative">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Analysis Complete
        </h1>
        
        <div className="flex items-center justify-center">
          {isCompliant ? (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm shadow-sm animate-fadeIn">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>Dataset complies structurally with Benford's Law</span>
            </div>
          ) : (
            <div className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm animate-fadeIn border',
              needsInvestigation 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
            )}>
              <AlertTriangle className="w-4.5 h-4.5" />
              <span>
                {needsInvestigation ? 'Significant audit anomalies detected' : 'Minor statistical deviations observed'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Benford Results Component */}
      {benfordResult && (
        <BenfordResults result={benfordResult} />
      )}

      {/* Navigation and reset options */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200/50 dark:border-slate-800/40">
        <button
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-350 bg-white/70 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Upload</span>
        </button>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            Run New Analysis
          </button>
          
          <button
            onClick={onContinue}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold rounded-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.35)] relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shine_1.8s_ease-in-out_infinite]" />
            <span>Continue to Visualization</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
