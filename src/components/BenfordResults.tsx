import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, Flag, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';
import type { BenfordResult, DigitFrequency } from '../types';

interface BenfordResultsProps {
  result: BenfordResult;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'good' | 'warning' | 'danger';
}

function MetricCard({ title, value, description, icon: Icon, status }: MetricCardProps) {
  const statusStyles = {
    good: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  };

  const iconStyles = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <div className={cn('border rounded-lg p-4', statusStyles[status])}>
      <div className="flex items-center space-x-3">
        <Icon className={cn('w-6 h-6', iconStyles[status])} />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs mt-1 opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface DigitFrequencyChartProps {
  frequencies: DigitFrequency[];
}

function DigitFrequencyChart({ frequencies }: DigitFrequencyChartProps) {
  const maxPercentage = Math.max(...frequencies.map(f => Math.max(f.observed, f.expected)));
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
        <BarChart3 className="w-5 h-5" />
        <span>Digit Frequency Analysis</span>
      </h3>
      
      <div className="space-y-3">
        {frequencies.map((freq) => (
          <div key={freq.digit} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Digit {freq.digit}</span>
              <div className="space-x-4 text-xs">
                <span className="text-blue-600">Observed: {freq.observed.toFixed(1)}%</span>
                <span className="text-gray-600">Expected: {freq.expected.toFixed(1)}%</span>
                <span className={cn(
                  freq.deviation > 5 ? 'text-red-600' : freq.deviation > 2 ? 'text-amber-600' : 'text-green-600'
                )}>
                  Δ {freq.deviation.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
              {/* Expected frequency bar (background) */}
              <div
                className="absolute top-0 left-0 h-full bg-gray-300 rounded-full"
                style={{ width: `${(freq.expected / maxPercentage) * 100}%` }}
              />
              
              {/* Observed frequency bar (foreground) */}
              <div
                className={cn(
                  'absolute top-0 left-0 h-full rounded-full transition-all',
                  freq.deviation > 5 
                    ? 'bg-red-500' 
                    : freq.deviation > 2 
                      ? 'bg-amber-500' 
                      : 'bg-blue-500'
                )}
                style={{ width: `${(freq.observed / maxPercentage) * 100}%` }}
              />
              
              {/* Count label */}
              <div className="absolute inset-0 flex items-center justify-end pr-2">
                <span className="text-xs font-medium text-gray-700">
                  {freq.count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 mt-4 space-y-1">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Observed frequency</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span>Expected frequency (Benford's Law)</span>
        </div>
      </div>
    </div>
  );
}

export function BenfordResults({ result, className }: BenfordResultsProps) {
  const getOverallStatus = () => {
    switch (result.overallAssessment) {
      case 'compliant':
        return { status: 'good' as const, icon: CheckCircle, text: 'Compliant' };
      case 'acceptable':
        return { status: 'good' as const, icon: CheckCircle, text: 'Acceptable' };
      case 'suspicious':
        return { status: 'warning' as const, icon: AlertTriangle, text: 'Suspicious' };
      case 'highly_suspicious':
        return { status: 'danger' as const, icon: XCircle, text: 'Highly Suspicious' };
    }
  };

  const getRiskLevel = () => {
    switch (result.riskLevel) {
      case 'low':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Low Risk' };
      case 'medium':
        return { color: 'text-amber-600', bg: 'bg-amber-100', text: 'Medium Risk' };
      case 'high':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'High Risk' };
      case 'critical':
        return { color: 'text-red-800', bg: 'bg-red-200', text: 'Critical Risk' };
    }
  };

  const overallStatus = getOverallStatus();
  const riskLevel = getRiskLevel();

  return (
    <div id="benford-results" className={cn('space-y-8 animate-fadeIn', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center space-x-3">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          <span>Benford's Law Analysis Results</span>
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className={cn('px-4 py-2 rounded-full font-semibold text-sm', riskLevel.bg, riskLevel.color)}>
            {riskLevel.text}
          </div>
          <div className="text-gray-500">•</div>
          <span className="text-gray-600">{result.totalAnalyzed.toLocaleString()} transactions analyzed</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Assessment"
          value={overallStatus.text}
          description="Compliance with Benford's Law"
          icon={overallStatus.icon}
          status={overallStatus.status}
        />
        
        <MetricCard
          title="MAD Score"
          value={result.mad.toFixed(2)}
          description="Mean Absolute Deviation (%)"
          icon={TrendingUp}
          status={result.mad < 1.2 ? 'good' : result.mad < 2.2 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Suspicious Vendors"
          value={result.suspiciousVendors.length}
          description="Vendors flagged for review"
          icon={Users}
          status={result.suspiciousVendors.length === 0 ? 'good' : result.suspiciousVendors.length < 3 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Flagged Transactions"
          value={result.flaggedTransactions.length}
          description="Individual transactions flagged"
          icon={Flag}
          status={result.flaggedTransactions.length === 0 ? 'good' : result.flaggedTransactions.length < 10 ? 'warning' : 'danger'}
        />
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Warnings & Recommendations</h3>
          </div>
          <ul className="space-y-1 text-sm text-amber-800">
            {result.warnings.map((warning, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Digit Frequency Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DigitFrequencyChart frequencies={result.digitFrequencies} />
      </div>

      {/* Suspicious Vendors */}
      {result.suspiciousVendors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Suspicious Vendors</span>
          </h3>
          
          <div className="space-y-4">
            {result.suspiciousVendors.slice(0, 10).map((vendor, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{vendor.vendor}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      vendor.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                      vendor.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                      vendor.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {vendor.riskLevel.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {vendor.transactionCount} transactions
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  MAD Score: <span className="font-medium">{vendor.mad.toFixed(4)}</span>
                </div>
                
                {vendor.suspiciousPatterns.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-700">Suspicious Patterns:</span>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {vendor.suspiciousPatterns.map((pattern, patternIndex) => (
                        <li key={patternIndex} className="flex items-start space-x-1">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Transactions */}
      {result.flaggedTransactions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Flag className="w-5 h-5" />
            <span>Flagged Transactions</span>
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    First Digit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk Level
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {result.flaggedTransactions.slice(0, 20).map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {transaction.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {transaction.vendor || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {transaction.firstDigit}
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        transaction.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        transaction.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      )}>
                        {transaction.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {transaction.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {result.flaggedTransactions.length > 20 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing top 20 of {result.flaggedTransactions.length} flagged transactions
            </div>
          )}
        </div>
      )}
    </div>
  );
}
