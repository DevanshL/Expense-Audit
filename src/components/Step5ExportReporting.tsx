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
      await generatePDFReport(benfordResult, dataset, aiSummary, null, reportConfig);
      
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
          row.date?.toLocaleDateString() || '',
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
      <div className={cn('max-w-7xl mx-auto', className)}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <FileText className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Preparing Analysis for Export...
            </h2>
            <p className="text-gray-600">
              Running Benford's Law analysis to generate comprehensive reports
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
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Analysis Error</h2>
            <p className="text-gray-600 max-w-md">{analysisError}</p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
      <div className={cn('max-w-7xl mx-auto', className)}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <FileText className="w-16 h-16 text-gray-400 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">No Analysis Results</h2>
            <p className="text-gray-600">Please complete the analysis first</p>
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
    <div className={cn('max-w-7xl mx-auto', className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Export & Reporting</h1>
              <p className="text-gray-600">Generate professional audit reports and export data</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Step 5 of 5
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Status Messages */}
        {exportSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-800">{exportSuccess}</span>
            </div>
          </div>
        )}

        {exportError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-800">{exportError}</span>
            </div>
          </div>
        )}

        {/* Report Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Report Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportConfig.reportTitle || ''}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, reportTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Fraud Detection Audit Report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name (Optional)
                </label>
                <input
                  type="text"
                  value={reportConfig.organizationName || ''}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Your Organization"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auditor Name (Optional)
                </label>
                <input
                  type="text"
                  value={reportConfig.auditorName || ''}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, auditorName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Content Options */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Include in Report:</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeCharts}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Charts and Visualizations</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeAISummary}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeAISummary: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">AI-Generated Summary</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeRawData}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeRawData: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Raw Dataset Information</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeMetadata}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Audit Trail & Metadata</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-3">
            <Download className="w-6 h-6 text-gray-600" />
            <span>Export Options</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Comprehensive PDF Report */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Comprehensive PDF Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete audit report with executive summary, charts, and findings
                </p>
                <button
                  onClick={handleGeneratePDFReport}
                  disabled={isGeneratingPDF}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Generate PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Flagged Transactions CSV */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Flagged Transactions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  CSV export of all suspicious transactions for detailed review
                </p>
                <button
                  onClick={handleExportFlaggedTransactions}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {benfordResult.flaggedTransactions.length} transactions
                </p>
              </div>
            </div>

            {/* Suspicious Vendors CSV */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
              <div className="text-center">
                <Settings className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Vendor Analysis</h3>
                <p className="text-sm text-gray-600 mb-4">
                  CSV export of vendor risk analysis and suspicious patterns
                </p>
                <button
                  onClick={handleExportSuspiciousVendors}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {benfordResult.suspiciousVendors.length} vendors analyzed
                </p>
              </div>
            </div>

            {/* Cleaned Dataset CSV */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Cleaned Dataset</h3>
                <p className="text-sm text-gray-600 mb-4">
                  CSV export of the processed and cleaned transaction data
                </p>
                <button
                  onClick={handleExportCleanedDataset}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {dataset.data.length} records
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{benfordResult.totalAnalyzed.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Transactions Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{benfordResult.flaggedTransactions.length}</div>
              <div className="text-sm text-gray-600">Flagged Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{benfordResult.suspiciousVendors.length}</div>
              <div className="text-sm text-gray-600">Suspicious Vendors</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                benfordResult.riskLevel === 'low' && 'text-green-600',
                benfordResult.riskLevel === 'medium' && 'text-yellow-600',
                benfordResult.riskLevel === 'high' && 'text-orange-600',
                benfordResult.riskLevel === 'critical' && 'text-red-600'
              )}>
                {benfordResult.riskLevel.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">Risk Level</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
