import { useState } from 'react';
import { Brain, Copy, Download, Sparkles, AlertCircle, CheckCircle, Clock, Zap, FileText, Table, BarChart } from 'lucide-react';
import { cn } from '../../utils/cn';
import { generateAISummary } from '../../utils/aiSummary';
import { createFallbackSummary, type GeminiSummary } from '../../utils/geminiIntegration';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { 
  generateExecutiveReport, 
  exportFlaggedTransactionsCSV, 
  exportSuspiciousVendorsCSV, 
  generateJSONExport,
  downloadFile,
  generateFilename 
} from '../../utils/reportExporter';
import type { BenfordResult, ProcessedDataset } from '../../types';

interface AISummaryPanelProps {
  result: BenfordResult;
  dataset: ProcessedDataset;
  className?: string;
}

export function AISummaryPanel({ result, dataset, className }: AISummaryPanelProps) {
  const { incrementUsage } = useUsageTracking();
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiSummary, setGeminiSummary] = useState<GeminiSummary | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Generate rule-based summary
  const aiSummary = generateAISummary(result, dataset);

  const handleGenerateGeminiSummary = async () => {
    // Validate inputs before making API call
    if (!result || !dataset) {
      setGeminiError('Missing analysis data. Please ensure you have completed the Benford analysis first.');
      return;
    }

    if (!result.digitFrequencies || result.digitFrequencies.length === 0) {
      setGeminiError('No digit frequency data available. Please run the analysis again.');
      return;
    }

    // Check authentication token
    const token = localStorage.getItem('expense-audit-token');
    if (!token) {
      setGeminiError('Authentication required. Please log in again.');
      return;
    }

    setIsGeneratingGemini(true);
    setGeminiError(null);

    try {
      // Use the backend AI configuration API to generate summary
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          result,
          dataset: {
            preview: dataset.preview
          }
        })
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Server error (${response.status}): ${responseText || 'Unable to parse response'}`);
        }
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      let summaryData;
      try {
        summaryData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Failed to parse server response.');
      }

      if (!summaryData.success || !summaryData.data || !summaryData.data.summary) {
        throw new Error('Invalid response format from server');
      }

      setGeminiSummary(summaryData.data.summary);
      localStorage.setItem('expense-audit-ai-summary', JSON.stringify(summaryData.data.summary));
      
      // Track AI summary generation
      incrementUsage('aiSummariesGenerated');
    } catch (error) {
      let errorMessage = 'Failed to generate AI summary';
      
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes('quota') || message.includes('limit')) {
          errorMessage = 'API quota exceeded. Please check backend API usage limits.';
        } else if (message.includes('blocked') || message.includes('safety')) {
          errorMessage = 'Content was blocked by safety filters. Please try rephrasing your request.';
        } else {
          errorMessage = `AI analysis failed: ${message}`;
        }
      }
      
      console.error('Gemini API Error:', error);
      setGeminiError(errorMessage);
      
      // Fallback to rule-based summary
      const fallback = createFallbackSummary(aiSummary);
      setGeminiSummary(fallback);
      localStorage.setItem('expense-audit-ai-summary', JSON.stringify(fallback));
    } finally {
      setIsGeneratingGemini(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Toast notice handled silently
    });
  };

  const handleExportSummary = () => {
    const exportData = {
      type: 'AI_Analysis_Summary',
      generatedAt: new Date().toISOString(),
      dataset: {
        totalTransactions: result.totalAnalyzed,
        analysisDate: new Date().toISOString()
      },
      ruleBasedSummary: aiSummary,
      aiSummary: geminiSummary,
      rawAnalysis: {
        mad: result.mad,
        chiSquare: result.chiSquare,
        riskLevel: result.riskLevel,
        overallAssessment: result.overallAssessment
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_fraud_analysis_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    incrementUsage('reportsGenerated');
  };

  const handleExportExecutiveReport = () => {
    const report = generateExecutiveReport(result, dataset, aiSummary, geminiSummary);
    downloadFile(report, generateFilename('executive_report', 'md'), 'text/markdown');
    incrementUsage('reportsGenerated');
  };

  const handleExportFlaggedTransactions = () => {
    const csv = exportFlaggedTransactionsCSV(result, dataset);
    downloadFile(csv, generateFilename('flagged_transactions', 'csv'), 'text/csv');
    incrementUsage('reportsGenerated');
  };

  const handleExportSuspiciousVendors = () => {
    const csv = exportSuspiciousVendorsCSV(result);
    downloadFile(csv, generateFilename('suspicious_vendors', 'csv'), 'text/csv');
    incrementUsage('reportsGenerated');
  };

  const handleExportFullAnalysis = () => {
    const jsonData = generateJSONExport(result, dataset, aiSummary, geminiSummary);
    downloadFile(JSON.stringify(jsonData, null, 2), generateFilename('full_analysis', 'json'), 'application/json');
    incrementUsage('reportsGenerated');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl glass-panel border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-md shadow-indigo-500/5">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none z-0" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI-Powered Analysis Summary</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Natural language diagnostics generated directly on our cloud computing infrastructure.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportSummary}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Summary</span>
            </button>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(aiSummary.keyMetrics).map(([key, value]) => (
          <div key={key} className="glass-panel border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl shadow-sm">
            <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-lg font-extrabold text-slate-905 dark:text-slate-100 mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* Rule-based AI Summary */}
      <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-md">
        <div className="bg-slate-100/50 dark:bg-slate-900/60 px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Zap className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">Intelligent Analysis Summary</h3>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{aiSummary.riskAssessment.confidence}% confidence</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              <span>Executive Summary</span>
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-750 dark:text-slate-200 leading-relaxed">
              {aiSummary.executiveSummary}
            </p>
            <button
              onClick={() => handleCopyToClipboard(aiSummary.executiveSummary)}
              className="mt-3 inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy text</span>
            </button>
          </div>

          {/* Key Findings */}
          {aiSummary.overallFindings.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span>Key Findings</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                {aiSummary.overallFindings.map((finding, index) => (
                  <li key={index} className="flex items-start space-x-3 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vendor Insights */}
          {aiSummary.vendorInsights.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                <span>Vendor Analysis</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                {aiSummary.vendorInsights.map((insight, index) => (
                  <li key={index} className="flex items-start space-x-3 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transaction Insights */}
          {aiSummary.transactionInsights.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                <span>Transaction Patterns</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                {aiSummary.transactionInsights.map((insight, index) => (
                  <li key={index} className="flex items-start space-x-3 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {aiSummary.recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                <span>Recommendations</span>
              </h4>
              <ol className="space-y-3">
                {aiSummary.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-3 text-xs sm:text-sm font-semibold text-slate-755 dark:text-slate-300 leading-relaxed">
                    <div className="w-5 h-5 bg-purple-500/10 text-purple-650 dark:text-purple-300 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5 border border-purple-500/20">
                      {index + 1}
                    </div>
                    <span dangerouslySetInnerHTML={{ __html: recommendation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Gemini Cloud Analysis Trigger Section */}
      <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-md">
        <div className="bg-slate-100/50 dark:bg-slate-900/60 px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-850 dark:text-slate-100">Advanced AI Engine</span>
              <span className="text-[10px] text-slate-450 dark:text-slate-500">Provider: Google Cloud AI • Model: Gemini 1.5 Pro</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!geminiSummary && (
            <div className="text-center py-8">
              <div className="bg-indigo-500/5 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-indigo-500/10">
                <Brain className="w-8 h-8 text-indigo-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-2">Cloud-Managed AI Diagnostics Ready</h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                Generate highly advanced summaries using Google Gemini's reasoning. No API key is required on your part — our platform manages models securely in the cloud.
              </p>
              
              <button
                onClick={handleGenerateGeminiSummary}
                disabled={isGeneratingGemini}
                className="inline-flex items-center space-x-3 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(99,102,241,0.35)] relative overflow-hidden group cursor-pointer border border-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shine_1.8s_ease-in-out_infinite]" />
                {isGeneratingGemini ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Cloud Analysis...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4.5 h-4.5 text-white" />
                    <span>Run Advanced AI Diagnostics</span>
                  </>
                )}
              </button>
            </div>
          )}

          {geminiError && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm">System Warning</h4>
                  <p className="text-rose-800 dark:text-rose-400 text-xs mt-1 leading-relaxed">{geminiError}</p>
                </div>
              </div>
            </div>
          )}

          {geminiSummary && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Generated: {new Date(geminiSummary.generatedAt).toLocaleString()}</span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="text-emerald-500">Cloud AI Model Response</span>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(geminiSummary.executiveSummary)}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy executive brief</span>
                </button>
              </div>

              <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-xl">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">Executive AI Briefing</h4>
                <p className="text-xs sm:text-sm font-semibold text-slate-750 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {geminiSummary.executiveSummary}
                </p>
              </div>

              {geminiSummary.keyFindings && geminiSummary.keyFindings.length > 0 && (
                <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-xl">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">AI Findings List</h4>
                  <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {geminiSummary.keyFindings.map((finding, index) => (
                      <li key={index} className="flex items-start space-x-3 leading-relaxed">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {geminiSummary.recommendedActions && geminiSummary.recommendedActions.length > 0 && (
                <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-xl">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">Auditor Action Guidelines</h4>
                  <ol className="space-y-3">
                    {geminiSummary.recommendedActions.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-3 text-xs sm:text-sm font-semibold text-slate-755 dark:text-slate-300 leading-relaxed">
                        <div className="w-5 h-5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5 border border-indigo-500/20">
                          {index + 1}
                        </div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button
                onClick={() => { setGeminiSummary(null); setGeminiError(null); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Clear Response
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Menu */}
      {showExportMenu && (
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-lg animate-fadeIn">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-4 flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-indigo-550" />
            <span>Professional Reports & Exports</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleExportExecutiveReport}
              className="flex flex-col items-center p-4 border border-slate-200/50 dark:border-slate-800/40 bg-slate-500/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer text-center group"
            >
              <FileText className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-sm text-slate-850 dark:text-slate-150">Executive Report</span>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 leading-snug">Comprehensive markdown report for stakeholders</span>
            </button>
            
            <button
              onClick={handleExportFlaggedTransactions}
              className="flex flex-col items-center p-4 border border-slate-200/50 dark:border-slate-800/40 bg-slate-500/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer text-center group"
            >
              <Table className="w-8 h-8 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-sm text-slate-850 dark:text-slate-150">Flagged Ledgers</span>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 leading-snug">CSV export of suspicious transactions</span>
            </button>
            
            <button
              onClick={handleExportSuspiciousVendors}
              className="flex flex-col items-center p-4 border border-slate-200/50 dark:border-slate-800/40 bg-slate-500/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer text-center group"
            >
              <BarChart className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-sm text-slate-850 dark:text-slate-150">Vendor Analysis</span>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 leading-snug">CSV export of vendor risk assessment profiles</span>
            </button>
            
            <button
              onClick={handleExportFullAnalysis}
              className="flex flex-col items-center p-4 border border-slate-200/50 dark:border-slate-800/40 bg-slate-500/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer text-center group"
            >
              <Download className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-sm text-slate-850 dark:text-slate-150">Full Analysis DB</span>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 leading-snug">Complete JSON export with all metadata included</span>
            </button>
          </div>
        </div>
      )}

      {/* Smart Summary Intelligence Comparison Panel */}
      {(aiSummary && geminiSummary) && (
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-5 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
            <span>Summary Intelligence Correlation</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence Comparison */}
            <div className="bg-slate-500/5 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800/40">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-150 mb-3">Model Accuracy Level</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Rule-based Ledger Confidence</span>
                    <span className="font-bold text-indigo-500">{aiSummary.riskAssessment.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                      style={{ width: `${aiSummary.riskAssessment.confidence}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Advanced Gemini Reasoner</span>
                    <span className="font-bold text-purple-500">100% Core</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(168,85,247,0.4)] w-full"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Level Comparison */}
            <div className="bg-slate-500/5 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800/40">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-150 mb-3">Consensus Verification</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Statistical Engine Check:</span>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border',
                    aiSummary.riskAssessment.level === 'low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    aiSummary.riskAssessment.level === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                    'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455'
                  )}>
                    {aiSummary.riskAssessment.level} Risk
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Advanced AI Check:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400">
                    Verified Risk
                  </span>
                </div>
                {aiSummary.riskAssessment.level === result.riskLevel && (
                  <div className="mt-2.5 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Cross-model consensus verified successfully.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Insights Extraction */}
          <div className="mt-6 bg-slate-500/5 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800/40">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-150 mb-3">Audit Summary Highlights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div>
                <span className="font-bold text-indigo-500 uppercase tracking-wider text-[10px] block mb-1">Total volume</span>
                <p className="text-slate-800 dark:text-slate-205 text-sm font-extrabold">{result.totalAnalyzed.toLocaleString()} transactions</p>
              </div>
              <div>
                <span className="font-bold text-orange-500 uppercase tracking-wider text-[10px] block mb-1">Flagged indicators</span>
                <p className="text-slate-800 dark:text-slate-205 text-sm font-extrabold">{result.flaggedTransactions.length} entries • {result.suspiciousVendors.length} merchants</p>
              </div>
              <div>
                <span className="font-bold text-purple-500 uppercase tracking-wider text-[10px] block mb-1">Anomalous MAD index</span>
                <p className="text-slate-800 dark:text-slate-205 text-sm font-extrabold">MAD: {result.mad.toFixed(2)}% ({result.mad > 2.2 ? 'Critical' : result.mad > 1.5 ? 'Medium' : 'Compliant'})</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
