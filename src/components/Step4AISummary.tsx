import { useState, useEffect } from 'react';
import { ArrowLeft, Brain, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { useBenfordAnalysis } from '../hooks/useBenfordAnalysis';
import { AISummaryPanel } from './ai/AISummaryPanel';
import { RiskSummary } from './dashboard/RiskSummary';
import { UsageCounter } from '../components/UsageCounter';
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
      <div className={cn('max-w-5xl mx-auto py-12 animate-fadeIn', className)}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <Brain className="w-7 h-7 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Preparing AI Intelligence...
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Running advanced natural language generation and compiling ledger trends
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
              AI Processing Failed
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {analysisError}
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
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
            <Brain className="w-16 h-16 text-slate-450 mx-auto animate-pulse" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Missing Ledger Analytics
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Please complete the Step 2/3 ledger analysis first to trigger AI reviews.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-7xl mx-auto space-y-8 animate-fadeIn', className)}>
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
              AI-Powered Fraud Analysis Summary
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Step 4: Natural language insights and ledger threat assessments
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {/* Status Badge */}
          <div className={cn(
            'inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border',
            benfordResult.riskLevel === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
            benfordResult.riskLevel === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-405' :
            benfordResult.riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            <span className="capitalize">{benfordResult.riskLevel} Profile</span>
          </div>

          {/* Continue Button */}
          {onContinue && (
            <button
              onClick={onContinue}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer relative overflow-hidden group border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Reports</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Pill styled */}
      <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center space-x-1 backdrop-blur-md w-max">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5',
            activeTab === 'overview'
              ? 'bg-indigo-650 text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analysis Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_summary')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5',
            activeTab === 'ai_summary'
              ? 'bg-indigo-650 text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>AI Summary & Insights</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Risk Summary */}
          <RiskSummary result={benfordResult} />

          {/* Key Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transactions Analyzed</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{benfordResult.totalAnalyzed.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MAD Score</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{benfordResult.mad.toFixed(3)}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Mean Absolute Deviation</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flagged Vendors</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{benfordResult.suspiciousVendors.length}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Suspicious Transactions</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{benfordResult.flaggedTransactions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Readiness Check */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/10 rounded-2xl p-6 shadow-lg shadow-indigo-500/5 animate-pulse">
            <div className="flex items-start space-x-3.5">
              <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1" />
              <div>
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Ready for AI Analysis</h3>
                <p className="text-indigo-800 dark:text-indigo-400 mb-4 font-semibold text-sm">
                  Your Benford's Law analysis is complete. Switch to the "AI Summary & Insights" tab to generate 
                  natural language explanations and actionable recommendations from these findings.
                </p>
                <button
                  onClick={() => setActiveTab('ai_summary')}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md font-semibold text-sm active:scale-[0.98] transition-all"
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
        <div className="space-y-6">
          <UsageCounter action="ai_summary" />
          <AISummaryPanel result={benfordResult} dataset={dataset} />
        </div>
      )}
    </div>
  );
}
