import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, AlertCircle, CheckCircle2, XCircle, FileText, Database } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ProcessedDataset, CleanedDataRow } from '../types';

interface DataPreviewProps {
  dataset: ProcessedDataset;
  className?: string;
}

const ROWS_PER_PAGE = 10;

export function DataPreview({ dataset, className }: DataPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showCleaned, setShowCleaned] = useState(false);

  const { preview, data, validation } = dataset;
  const totalPages = Math.ceil((showCleaned ? data.length : preview.sampleRows.length) / ROWS_PER_PAGE);

  const getCurrentData = () => {
    const sourceData = showCleaned ? data : preview.sampleRows;
    const start = currentPage * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return sourceData.slice(start, end);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });
    }
    return String(value);
  };

  const renderRawDataTable = () => (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/40">
        <thead className="bg-slate-100/50 dark:bg-slate-900/60">
          <tr>
            {preview.columns.map((column) => (
              <th
                key={column}
                className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 bg-white/20 dark:bg-slate-900/10">
          {getCurrentData().map((row, index) => (
            <tr 
              key={index} 
              className={cn(
                'transition-colors duration-150',
                index % 2 === 0 ? 'bg-transparent' : 'bg-slate-100/20 dark:bg-slate-900/25'
              )}
            >
              {preview.columns.map((column) => (
                <td
                  key={column}
                  className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  {formatValue((row as Record<string, unknown>)[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCleanedDataTable = () => (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/40">
        <thead className="bg-slate-100/50 dark:bg-slate-900/60">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
              Amount
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
              Vendor
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
              Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 bg-white/20 dark:bg-slate-900/10">
          {(getCurrentData() as CleanedDataRow[]).map((row, index) => (
            <tr 
              key={index} 
              className={cn(
                'transition-colors duration-150',
                index % 2 === 0 ? 'bg-transparent' : 'bg-slate-100/20 dark:bg-slate-900/25'
              )}
            >
              <td className="px-6 py-3.5 whitespace-nowrap text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatValue(row.amount)}
              </td>
              <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-850 dark:text-slate-200">
                {formatValue(row.vendor)}
              </td>
              <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-350">
                {formatValue(row.date)}
              </td>
              <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-350">
                {formatValue(row.category)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={cn('space-y-6 relative overflow-hidden', className)}>
      {/* Background soft lighting */}
      <div className="absolute top-0 left-0 w-60 h-60 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[70px] pointer-events-none -z-10" />

      {/* Header with Segmented Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/10">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Data Preview & Validation
            </h3>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-400">
              Inspect transaction details and check structural status.
            </p>
          </div>
        </div>
        
        {/* Premium Segmented Controls Pill */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center space-x-1 backdrop-blur-md">
          <button
            onClick={() => { setShowCleaned(false); setCurrentPage(0); }}
            className={cn(
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5',
              !showCleaned
                ? 'bg-indigo-600 text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Database className="w-3.5 h-3.5" />
            Raw Uploaded
          </button>
          <button
            onClick={() => { setShowCleaned(true); setCurrentPage(0); }}
            className={cn(
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5',
              showCleaned
                ? 'bg-indigo-600 text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Cleaned & Standardized
          </button>
        </div>
      </div>

      {/* Validation Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 dark:border-indigo-400/10 rounded-2xl relative overflow-hidden">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Rows Detected</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {validation.totalRows.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-400/10 rounded-2xl relative overflow-hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valid Parsed Rows</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {validation.validRows.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-rose-500/5 border border-rose-500/20 dark:border-rose-400/10 rounded-2xl relative overflow-hidden">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-rose-555 dark:text-rose-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Removed / Anomalous</span>
          </div>
          <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-455 mt-2">
            {validation.removedRows.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Errors and Warnings Group */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-3">
          {validation.errors.length > 0 && (
            <div className="p-4 bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/25 rounded-2xl animate-fadeIn">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
                <span className="text-sm font-bold text-rose-900 dark:text-rose-300">
                  Critical Processing Errors ({validation.errors.length})
                </span>
              </div>
              <ul className="text-xs font-medium text-rose-800 dark:text-rose-400 space-y-1 pl-1 leading-relaxed">
                {validation.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {validation.errors.length > 5 && (
                  <li className="text-rose-600 dark:text-rose-455 font-bold mt-1">
                    ... and {validation.errors.length - 5} more structural errors
                  </li>
                )}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="p-4 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/25 rounded-2xl animate-fadeIn">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  Data Quality Warnings ({validation.warnings.length})
                </span>
              </div>
              <ul className="text-xs font-medium text-amber-800 dark:text-amber-400 space-y-1 pl-1 leading-relaxed">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Glassmorphic Data Table Card */}
      <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-md">
        <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {showCleaned ? 'Standardized Audit Table' : 'Raw Input Table'} 
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">({showCleaned ? data.length : preview.sampleRows.length} rows total)</span>
            </h4>
            
            {/* Elegant Glowing Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-3 bg-white/50 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 transition-colors"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-bold text-slate-600 dark:text-slate-350 px-1">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 transition-colors"
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {showCleaned ? renderCleanedDataTable() : renderRawDataTable()}
      </div>
    </div>
  );
}
