import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Flag, Download, Eye } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { FlaggedTransaction } from '../../types';

interface TransactionsTableProps {
  transactions: FlaggedTransaction[];
  className?: string;
  onTransactionSelect?: (transaction: FlaggedTransaction) => void;
}

type SortField = 'amount' | 'vendor' | 'firstDigit' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

const RISK_LEVELS = ['medium', 'high', 'critical'] as const;
const ITEMS_PER_PAGE = 20;

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case 'critical': return 'text-red-700 bg-red-100 border-red-200';
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function getRiskPriority(riskLevel: string): number {
  switch (riskLevel) {
    case 'critical': return 3;
    case 'high': return 2;
    case 'medium': return 1;
    default: return 0;
  }
}

export function TransactionsTable({ transactions, className, onTransactionSelect }: TransactionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('riskLevel');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleRiskFilterChange = (risk: string, checked: boolean) => {
    if (checked) {
      setRiskFilter([...riskFilter, risk]);
    } else {
      setRiskFilter(riskFilter.filter(r => r !== risk));
    }
    setCurrentPage(1);
  };

  const sortedAndFilteredTransactions = useMemo(() => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = !searchTerm || 
        (transaction.vendor?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        transaction.amount.toString().includes(searchTerm) ||
        transaction.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter.length === 0 || riskFilter.includes(transaction.riskLevel);
      return matchesSearch && matchesRisk;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'vendor':
          aValue = a.vendor || '';
          bValue = b.vendor || '';
          break;
        case 'firstDigit':
          aValue = a.firstDigit;
          bValue = b.firstDigit;
          break;
        case 'riskLevel':
          aValue = getRiskPriority(a.riskLevel);
          bValue = getRiskPriority(b.riskLevel);
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  }, [transactions, sortField, sortDirection, searchTerm, riskFilter]);

  const totalPages = Math.ceil(sortedAndFilteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = sortedAndFilteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleExport = () => {
    const csvHeaders = ['Amount', 'Vendor', 'First Digit', 'Risk Level', 'Reason'];
    const csvData = sortedAndFilteredTransactions.map(tx => [
      tx.amount,
      tx.vendor || '',
      tx.firstDigit,
      tx.riskLevel,
      tx.reason
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flagged_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Flag className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Flagged Transactions
              </h3>
              <p className="text-sm text-gray-600">
                Transactions with suspicious patterns ({transactions.length} flagged)
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by amount, vendor, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Risk Level:</span>
            {RISK_LEVELS.map(risk => (
              <label key={risk} className="flex items-center space-x-1 text-sm">
                <input
                  type="checkbox"
                  checked={riskFilter.includes(risk)}
                  onChange={(e) => handleRiskFilterChange(risk, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={cn('px-2 py-1 rounded text-xs font-medium capitalize border', getRiskColor(risk))}>
                  {risk}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Amount</span>
                  <SortIcon field="amount" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('vendor')}
              >
                <div className="flex items-center space-x-1">
                  <span>Vendor</span>
                  <SortIcon field="vendor" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('firstDigit')}
              >
                <div className="flex items-center space-x-1">
                  <span>First Digit</span>
                  <SortIcon field="firstDigit" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('riskLevel')}
              >
                <div className="flex items-center space-x-1">
                  <span>Risk Level</span>
                  <SortIcon field="riskLevel" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.map((transaction, index) => (
              <tr 
                key={`${transaction.index}-${index}`}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.vendor || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.firstDigit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize border',
                    getRiskColor(transaction.riskLevel)
                  )}>
                    {transaction.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs">
                    {transaction.reason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onTransactionSelect?.(transaction)}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedTransactions.length === 0 && (
          <div className="text-center py-8">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No transactions match your current filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedAndFilteredTransactions.length)} of{' '}
            {sortedAndFilteredTransactions.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'px-3 py-1 border rounded-md',
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={cn(
                      'px-3 py-1 border rounded-md',
                      totalPages === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
