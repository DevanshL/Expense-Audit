import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, AlertTriangle, Users, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { VendorAnalysis } from '../../types';

interface VendorsTableProps {
  vendors: VendorAnalysis[];
  className?: string;
  onVendorSelect?: (vendor: VendorAnalysis) => void;
}

type SortField = 'vendor' | 'transactionCount' | 'mad' | 'chiSquare' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case 'critical': return 'text-red-700 bg-red-100';
    case 'high': return 'text-red-600 bg-red-50';
    case 'medium': return 'text-amber-600 bg-amber-50';
    case 'low': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

function getRiskPriority(riskLevel: string): number {
  switch (riskLevel) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

export function VendorsTable({ vendors, className, onVendorSelect }: VendorsTableProps) {
  const [sortField, setSortField] = useState<SortField>('riskLevel');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string[]>([]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRiskFilterChange = (risk: string, checked: boolean) => {
    if (checked) {
      setRiskFilter([...riskFilter, risk]);
    } else {
      setRiskFilter(riskFilter.filter(r => r !== risk));
    }
  };

  const sortedAndFilteredVendors = useMemo(() => {
    const filtered = vendors.filter(vendor => {
      const matchesSearch = vendor.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter.length === 0 || riskFilter.includes(vendor.riskLevel);
      return matchesSearch && matchesRisk;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'vendor':
          aValue = a.vendor;
          bValue = b.vendor;
          break;
        case 'transactionCount':
          aValue = a.transactionCount;
          bValue = b.transactionCount;
          break;
        case 'mad':
          aValue = a.mad;
          bValue = b.mad;
          break;
        case 'chiSquare':
          aValue = a.chiSquare;
          bValue = b.chiSquare;
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
  }, [vendors, sortField, sortDirection, searchTerm, riskFilter]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className={cn('glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-md', className)}>
      <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Suspicious Vendors Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Vendors with unusual transaction patterns ({vendors.length} flagged)
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-sm transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Risk Level:</span>
            {RISK_LEVELS.map(risk => (
              <label key={risk} className="flex items-center space-x-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskFilter.includes(risk)}
                  onChange={(e) => handleRiskFilterChange(risk, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={cn('px-2 py-1 rounded text-xs font-medium capitalize', getRiskColor(risk))}>
                  {risk}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/50">
            <tr>
              <th 
                className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('vendor')}
              >
                <div className="flex items-center space-x-1">
                  <span>Vendor</span>
                  <SortIcon field="vendor" />
                </div>
              </th>
              <th 
                className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('transactionCount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Transactions</span>
                  <SortIcon field="transactionCount" />
                </div>
              </th>
              <th 
                className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('mad')}
              >
                <div className="flex items-center space-x-1">
                  <span>MAD Score</span>
                  <SortIcon field="mad" />
                </div>
              </th>
              <th 
                className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('chiSquare')}
              >
                <div className="flex items-center space-x-1">
                  <span>Chi-Square</span>
                  <SortIcon field="chiSquare" />
                </div>
              </th>
              <th 
                className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                onClick={() => handleSort('riskLevel')}
              >
                <div className="flex items-center space-x-1">
                  <span>Risk Level</span>
                  <SortIcon field="riskLevel" />
                </div>
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Suspicious Patterns
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/50">
            {sortedAndFilteredVendors.map((vendor, index) => (
              <tr 
                key={vendor.vendor + index}
                className={cn(
                  'hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 transition-colors',
                  onVendorSelect && 'cursor-pointer'
                )}
                onClick={() => onVendorSelect?.(vendor)}
              >
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {vendor.vendor}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {vendor.transactionCount.toLocaleString()}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className={cn(
                    'text-sm font-bold',
                    vendor.mad > 15 ? 'text-red-500 dark:text-red-400' : vendor.mad > 8 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {vendor.mad.toFixed(2)}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className={cn(
                    'text-sm font-bold',
                    vendor.chiSquare > 15.51 ? 'text-red-500 dark:text-red-400' : vendor.chiSquare > 10 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {vendor.chiSquare.toFixed(2)}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex px-2.5 py-1 text-xs font-bold rounded-full capitalize',
                    getRiskColor(vendor.riskLevel)
                  )}>
                    {vendor.riskLevel}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm text-slate-600 dark:text-slate-300 max-w-xs">
                    {vendor.suspiciousPatterns.length > 0 ? (
                      <div className="space-y-1">
                        {vendor.suspiciousPatterns.slice(0, 2).map((pattern, i) => (
                          <div key={i} className="flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span className="text-xs">{pattern}</span>
                          </div>
                        ))}
                        {vendor.suspiciousPatterns.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{vendor.suspiciousPatterns.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">No specific patterns detected</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedAndFilteredVendors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No vendors match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
