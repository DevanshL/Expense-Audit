import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useBenfordAnalysis } from '../hooks/useBenfordAnalysis';
import { generateAISummary } from '../utils/aiSummary';
import { generatePDFReport, type ReportConfig } from '../utils/pdfReportGenerator';
import { 
  exportFlaggedTransactionsCSV, 
  exportSuspiciousVendorsCSV,
  downloadFile,
  generateFilename 
} from '../utils/reportExporter';
import { UsageCounter } from '../components/UsageCounter';
import type { ProcessedDataset } from '../types';

interface Step5ExportReportingProps {
  dataset: ProcessedDataset;
  onBack: () => void;
  className?: string;
}

export function Step5ExportReporting({ dataset, onBack, className }: Step5ExportReportingProps) {
  const { benfordResult, isAnalyzing, analysisError, runAnalysis, hasResult } = useBenfordAnalysis();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    includeCharts: true,
    includeRawData: false,
    includeAISummary: true,
    includeMetadata: true,
    reportTitle: 'Fraud Detection Audit Report',
    organizationName: '',
    auditorName: ''
  });

  // Run analysis if we don't have results
  useEffect(() => {
    if (!hasResult && !isAnalyzing) {
      runAnalysis(dataset);
    }
  }, [dataset, hasResult, isAnalyzing, runAnalysis]);

  const handleGeneratePDFReport = async () => {
    if (!benfordResult) return;
    setIsGeneratingPDF(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const aiSummary = generateAISummary(benfordResult, dataset);

      // Try cached summary first
      let geminiSummary = null;
      const cached = localStorage.getItem('expense-audit-ai-summary');
      if (cached) {
        try { geminiSummary = JSON.parse(cached); } catch {}
      }

      // If no cached summary, fetch from backend now
      if (!geminiSummary) {
        try {
          const token = localStorage.getItem('expense-audit-token');
          const res = await fetch('/api/ai/generate-summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ result: benfordResult, dataset })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data?.summary) {
              geminiSummary = data.data.summary;
              localStorage.setItem('expense-audit-ai-summary', JSON.stringify(geminiSummary));
            }
          }
        } catch (err) {
          console.warn('AI summary fetch failed, generating PDF without it:', err);
        }
      }

      await generatePDFReport(benfordResult, dataset, aiSummary, geminiSummary, reportConfig);
      setExportSuccess('PDF report generated successfully!');
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF report';
      setExportError(errorMessage);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportFlaggedTransactions = () => {
    if (!benfordResult) return;
    
    try {
      const csv = exportFlaggedTransactionsCSV(benfordResult, dataset);
      downloadFile(csv, generateFilename('flagged_transactions', 'csv'), 'text/csv');
      setExportSuccess('Flagged transactions exported successfully!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      setExportError('Failed to export flagged transactions');
      console.error('Export error:', error);
    }
  };

  const handleExportSuspiciousVendors = () => {
    if (!benfordResult) return;
    
    try {
      const csv = exportSuspiciousVendorsCSV(benfordResult);
      downloadFile(csv, generateFilename('suspicious_vendors', 'csv'), 'text/csv');
      setExportSuccess('Suspicious vendors exported successfully!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      setExportError('Failed to export suspicious vendors');
      console.error('Export error:', error);
    }
  };

  const handleExportCleanedDataset = () => {
    try {
      const csvData = [
        ['Amount', 'Vendor', 'Date', 'Category'],
        ...dataset.data.map(row => [
          row.amount.toString(),
          row.vendor || '',
          row.date ? (row.date instanceof Date ? row.date.toLocaleDateString() : new Date(row.date).toLocaleDateString()) : '',
          row.category || ''
        ])
      ].map(row => row.join(',')).join('\n');

      downloadFile(csvData, generateFilename('cleaned_dataset', 'csv'), 'text/csv');
      setExportSuccess('Cleaned dataset exported successfully!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      setExportError('Failed to export cleaned dataset');
      console.error('Export error:', error);
    }
  };

  if (isAnalyzing) {
    return (
      <div className={cn('max-w-5xl mx-auto py-12 animate-fadeIn', className)}>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <FileText className="w-7 h-7 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Preparing Analysis for Export...
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Running statistical models to generate high-fidelity audit reports
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
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Analysis Integration Error</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-md">{analysisError}</p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
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
            <FileText className="w-16 h-16 text-slate-400 mx-auto" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Missing Analysis Results</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Please complete the ledger audit stage first</p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-5xl mx-auto space-y-8 animate-fadeIn', className)}>
      {/* Header */}
      <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl px-6 py-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Export & Reporting</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Generate professional executive audit brief and download datasets</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-indigo-500 dark:text-indigo-400 uppercase px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            Step 5 of 5
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Messages */}
        {exportSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-xl p-4 animate-fadeIn">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-550 dark:text-emerald-455 animate-bounce" />
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">{exportSuccess}</span>
            </div>
          </div>
        )}

        {exportError && (
          <div className="bg-rose-500/10 border border-rose-500/35 rounded-xl p-4 animate-fadeIn">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 animate-bounce" />
              <span className="text-sm font-bold text-rose-800 dark:text-rose-455">{exportError}</span>
            </div>
          </div>
        )}

        {/* Report Configuration */}
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

          <div className="flex items-center space-x-3 mb-6 border-b border-slate-250/20 pb-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 tracking-tight">Report Document Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Report Title Header
                </label>
                <input
                  type="text"
                  value={reportConfig.reportTitle || ''}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, reportTitle: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-450 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-semibold shadow-inner"
                  placeholder="Fraud Detection Audit Report"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Organization / Entity Name
                </label>
                <input
                  type="text"
                  value={reportConfig.organizationName || ''}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-450 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-semibold shadow-inner"
                  placeholder="Company Legal Entity"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Auditor Name
                </label>
                <input
                  type="text"
                  value={reportConfig.auditorName || ''}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, auditorName: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-450 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-semibold shadow-inner"
                  placeholder="Signature / Certified Auditor"
                />
              </div>
            </div>

            {/* Content Options */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Include in PDF Document:</h3>
              
              <div className="space-y-2.5">
                <label className="flex items-center p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeCharts}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded border-slate-350 dark:border-slate-700 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 w-4 h-4 transition-all cursor-pointer bg-transparent"
                  />
                  <span className="ml-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Digit distribution frequency charts</span>
                </label>

                <label className="flex items-center p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeAISummary}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeAISummary: e.target.checked }))}
                    className="rounded border-slate-350 dark:border-slate-700 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 w-4 h-4 transition-all cursor-pointer bg-transparent"
                  />
                  <span className="ml-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Gemini LLM narrative text summary</span>
                </label>

                <label className="flex items-center p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeRawData}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeRawData: e.target.checked }))}
                    className="rounded border-slate-350 dark:border-slate-700 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 w-4 h-4 transition-all cursor-pointer bg-transparent"
                  />
                  <span className="ml-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Raw transaction metadata volume</span>
                </label>

                <label className="flex items-center p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeMetadata}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="rounded border-slate-350 dark:border-slate-700 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 w-4 h-4 transition-all cursor-pointer bg-transparent"
                  />
                  <span className="ml-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Audit trail generation timestamp</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-md">
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-6 flex items-center space-x-3 pb-3 border-b border-slate-250/20">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Download className="w-5 h-5" />
            </div>
            <span>Premium Exports</span>
          </h2>

          <UsageCounter action="pdf_export" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {/* Comprehensive PDF Report */}
            <div 
              onClick={handleGeneratePDFReport}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-indigo-200/50 dark:border-slate-800 bg-slate-500/5 p-5 transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-400 dark:hover:border-indigo-550 cursor-pointer"
            >
              <div className="text-center flex flex-col items-center h-full">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm border border-indigo-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors">
                  Comprehensive PDF Brief
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-5 leading-relaxed flex-grow">
                  Complete printable report including charts, executive MAD score, and audit logs.
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleGeneratePDFReport(); }}
                  disabled={isGeneratingPDF}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow-sm font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Assembling...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Flagged Transactions CSV */}
            <div 
              onClick={handleExportFlaggedTransactions}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-rose-200/50 dark:border-slate-800 bg-slate-500/5 p-5 transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:shadow-lg hover:shadow-rose-500/5 hover:border-rose-450 dark:hover:border-rose-550 cursor-pointer"
            >
              <div className="text-center flex flex-col items-center h-full">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm border border-rose-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-455 transition-colors">
                  Flagged Ledgers (CSV)
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-5 leading-relaxed flex-grow">
                  Download a structured spreadsheet containing all transactions flagged for manual review.
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExportFlaggedTransactions(); }}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl shadow-sm font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-3 block">
                  {benfordResult.flaggedTransactions.length.toLocaleString()} rows flagged
                </span>
              </div>
            </div>

            {/* Suspicious Vendors CSV */}
            <div 
              onClick={handleExportSuspiciousVendors}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-250/50 dark:border-slate-800 bg-slate-500/5 p-5 transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-450 dark:hover:border-amber-550 cursor-pointer"
            >
              <div className="text-center flex flex-col items-center h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm border border-amber-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-450 transition-colors">
                  Vendor Indexes (CSV)
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-5 leading-relaxed flex-grow">
                  Download statistical profiles mapping each merchant's custom deviation metrics.
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExportSuspiciousVendors(); }}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-sm font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-3 block">
                  {benfordResult.suspiciousVendors.length.toLocaleString()} merchant entries
                </span>
              </div>
            </div>

            {/* Cleaned Dataset CSV */}
            <div 
              onClick={handleExportCleanedDataset}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-250/50 dark:border-slate-800 bg-slate-500/5 p-5 transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-450 dark:hover:border-emerald-550 cursor-pointer"
            >
              <div className="text-center flex flex-col items-center h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-455 transition-colors">
                  Audited Ledgers (CSV)
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-5 leading-relaxed flex-grow">
                  Download the cleaned and formatted database file compiled from the preprocessing pipeline.
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExportCleanedDataset(); }}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-sm font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-3 block">
                  {dataset.data.length.toLocaleString()} sanitized entries
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Summary Info Grid */}
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-md">
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-6 pb-3 border-b border-slate-250/20">Auditor Executive Brief</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <div className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {benfordResult.totalAnalyzed.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-2">Transactions Analyzed</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <div className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {benfordResult.flaggedTransactions.length.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-2">Flagged Rows</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <div className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {benfordResult.suspiciousVendors.length.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-2">Flagged Merchants</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <div className={cn(
                "text-2xl font-extrabold tracking-tight",
                benfordResult.riskLevel === 'low' && 'text-emerald-500 dark:text-emerald-450',
                benfordResult.riskLevel === 'medium' && 'text-amber-500 dark:text-amber-450',
                benfordResult.riskLevel === 'high' && 'text-rose-500 dark:text-rose-455',
                benfordResult.riskLevel === 'critical' && 'text-rose-600 dark:text-rose-400'
              )}>
                {benfordResult.riskLevel.toUpperCase()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-2">Calculated Threat Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
