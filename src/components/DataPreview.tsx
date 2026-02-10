import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
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

  const getRowClassName = (index: number) => {
    if (showCleaned) return '';
    
    // For raw data, we can't easily determine which rows were removed
    // This is a simplified approach
    return index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  };

  const renderRawDataTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {preview.columns.map((column) => (
              <th
                key={column}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {getCurrentData().map((row, index) => (
            <tr key={index} className={getRowClassName(index)}>
              {preview.columns.map((column) => (
                <td
                  key={column}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vendor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(getCurrentData() as CleanedDataRow[]).map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatValue(row.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatValue(row.vendor)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatValue(row.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatValue(row.category)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Data Preview
          </h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCleaned(false)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                !showCleaned
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Raw Data
            </button>
            <button
              onClick={() => setShowCleaned(true)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                showCleaned
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Cleaned Data
            </button>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Rows</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {validation.totalRows.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Valid Rows</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {validation.validRows.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">Removed</span>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {validation.removedRows.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Errors and Warnings */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-3">
          {validation.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">
                  Errors ({validation.errors.length})
                </span>
              </div>
              <ul className="text-sm text-red-800 space-y-1">
                {validation.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {validation.errors.length > 5 && (
                  <li className="text-red-600">
                    ... and {validation.errors.length - 5} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">
                  Warnings ({validation.warnings.length})
                </span>
              </div>
              <ul className="text-sm text-amber-800 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {showCleaned ? 'Cleaned Data' : 'Raw Data'} 
              ({showCleaned ? data.length : preview.sampleRows.length} rows)
            </h4>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
