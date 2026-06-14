import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, Flag, BarChart3, HelpCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { BenfordResult, DigitFrequency } from '../types';
import { Interactive3DTiltCard } from './ui/Interactive3DTiltCard';

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
    good: 'border-emerald-500/25 bg-emerald-500/5 text-slate-800 dark:text-slate-100 shadow-[0_4px_20px_rgba(16,185,129,0.05)] hover:border-emerald-500/40',
    warning: 'border-amber-500/25 bg-amber-500/5 text-slate-800 dark:text-slate-100 shadow-[0_4px_20px_rgba(245,158,11,0.05)] hover:border-amber-500/40',
    danger: 'border-rose-500/25 bg-rose-500/5 text-slate-800 dark:text-slate-100 shadow-[0_4px_20px_rgba(244,63,94,0.05)] hover:border-rose-500/40',
  };

  const iconStyles = {
    good: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
  };

  return (
    <Interactive3DTiltCard
      maxTilt={6}
      scale={1.015}
      glareOpacity={0.12}
      className={cn('border rounded-2xl p-5 transition-all duration-300 ease-out cursor-default', statusStyles[status])}
    >
      <div className="flex items-center space-x-3.5 relative z-10">
        <div className={cn('p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10', iconStyles[status])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</h3>
          <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">{value}</p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">{description}</p>
        </div>
      </div>
    </Interactive3DTiltCard>
  );
}

interface DigitFrequencyChartProps {
  frequencies: DigitFrequency[];
}

function DigitFrequencyChart({ frequencies }: DigitFrequencyChartProps) {
  const maxPercentage = Math.max(...frequencies.map(f => Math.max(f.observed, f.expected)));
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
          <BarChart3 className="w-4.5 h-4.5" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Leading Digit Frequency Distribution
        </h3>
      </div>
      
      <div className="space-y-4">
        {frequencies.map((freq) => (
          <div key={freq.digit} className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="font-bold text-slate-800 dark:text-slate-200">Digit {freq.digit}</span>
              <div className="space-x-4">
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Observed: {freq.observed.toFixed(1)}%</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold">Expected: {freq.expected.toFixed(1)}%</span>
                <span className={cn(
                  'font-bold',
                  freq.deviation > 5 ? 'text-rose-600 dark:text-rose-455' : freq.deviation > 2 ? 'text-amber-600 dark:text-amber-450' : 'text-emerald-600 dark:text-emerald-450'
                )}>
                  Δ {freq.deviation.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="relative h-6 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
              {/* Expected frequency bar (background) */}
              <div
                className="absolute top-0 left-0 h-full bg-slate-355/15 dark:bg-slate-800/40 border-r border-slate-300/30 rounded-full"
                style={{ width: `${(freq.expected / maxPercentage) * 100}%` }}
              />
              
              {/* Observed frequency bar (foreground) */}
              <div
                className={cn(
                  'absolute top-0 left-0 h-full rounded-full transition-all duration-500 shadow-sm',
                  freq.deviation > 5 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
                    : freq.deviation > 2 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                      : 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                )}
                style={{ width: `${(freq.observed / maxPercentage) * 100}%` }}
              />
              
              {/* Count label */}
              <div className="absolute inset-0 flex items-center justify-end pr-3">
                <span className="text-[10px] font-extrabold text-slate-655 dark:text-slate-400">
                  {freq.count.toLocaleString()} TXs
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-row items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-sm"></div>
          <span>Observed Distribution</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-slate-355/20 border border-slate-300/30 rounded-sm"></div>
          <span>Benford Expected Scale</span>
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
        return { status: 'good' as const, icon: CheckCircle, text: 'Acceptable Compliance' };
      case 'suspicious':
        return { status: 'warning' as const, icon: AlertTriangle, text: 'Suspicious Deviations' };
      case 'highly_suspicious':
        return { status: 'danger' as const, icon: XCircle, text: 'Highly Anomalous' };
    }
  };

  const getRiskLevel = () => {
    switch (result.riskLevel) {
      case 'low':
        return { color: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10', text: 'Low Risk Profile' };
      case 'medium':
        return { color: 'text-amber-700 dark:text-amber-400 border-amber-500/20 bg-amber-500/10', text: 'Medium Risk Profile' };
      case 'high':
        return { color: 'text-rose-700 dark:text-rose-455 border-rose-500/20 bg-rose-500/10', text: 'High Risk Profile' };
      case 'critical':
        return { color: 'text-rose-800 dark:text-rose-300 border-rose-600/30 bg-rose-600/20', text: '⭐ Critical Risk Profile' };
    }
  };

  const overallStatus = getOverallStatus();
  const riskLevel = getRiskLevel();

  return (
    <div id="benford-results" className={cn('space-y-8 animate-fadeIn', className)}>
      {/* Overview Glass Panel */}
      <div className="relative overflow-hidden rounded-2xl glass-panel border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-md shadow-indigo-500/5">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
              <span>Statistical Audit Assessment</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Computed structural anomalies based on {result.totalAnalyzed.toLocaleString()} records.
            </p>
          </div>
          <div className={cn('px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider border w-max', riskLevel.color)}>
            {riskLevel.text}
          </div>
        </div>
      </div>

      {/* 3D Key Metrics Grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Audit Compliance"
          value={overallStatus.text}
          description="Algorithmic rating of ledger structure compared to Benford's scale"
          icon={overallStatus.icon}
          status={overallStatus.status}
        />
        
        <MetricCard
          title="Mean Deviation"
          value={`${result.mad.toFixed(2)}%`}
          description="Mean Absolute Deviation (MAD) score of first digit anomalies"
          icon={TrendingUp}
          status={result.mad < 1.2 ? 'good' : result.mad < 2.2 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Flagged Vendors"
          value={result.suspiciousVendors.length}
          description="Merchant files containing suspicious round numbers or duplicate entries"
          icon={Users}
          status={result.suspiciousVendors.length === 0 ? 'good' : result.suspiciousVendors.length < 3 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Flagged Ledger Rows"
          value={result.flaggedTransactions.length}
          description="Individual journal entries flagged for manual human auditor validation"
          icon={Flag}
          status={result.flaggedTransactions.length === 0 ? 'good' : result.flaggedTransactions.length < 10 ? 'warning' : 'danger'}
        />
      </div>

      {/* Warnings & Audit Recommendations */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 animate-fadeIn">
          <div className="flex items-center space-x-2.5 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-300 uppercase tracking-wider">Warnings & Audit Guidelines</h3>
          </div>
          <ul className="space-y-2 text-xs font-semibold text-amber-800 dark:text-amber-400 pl-1 leading-relaxed">
            {result.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Digit Frequency Plot Card */}
      <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <DigitFrequencyChart frequencies={result.digitFrequencies} />
      </div>

      {/* Suspicious Merchants Card List */}
      {result.suspiciousVendors.length > 0 && (
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-5 flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>High Risk Vendors & Merchants</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.suspiciousVendors.slice(0, 10).map((vendor, index) => (
              <div key={index} className="border border-slate-200/50 dark:border-slate-800/40 bg-slate-500/5 rounded-2xl p-4 transition-all hover:scale-[1.005] hover:border-slate-350 dark:hover:border-slate-700">
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-150 truncate max-w-[60%]">{vendor.vendor}</h4>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border',
                      vendor.riskLevel === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-650 dark:text-rose-300' :
                      vendor.riskLevel === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                      vendor.riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    )}>
                      {vendor.riskLevel}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {vendor.transactionCount} TXs
                    </span>
                  </div>
                </div>
                
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                  Vendor Mean Deviation: <span className="font-bold text-indigo-600 dark:text-indigo-400">{vendor.mad.toFixed(4)}%</span>
                </div>
                
                {vendor.suspiciousPatterns.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      Anomalous Indicators:
                    </span>
                    <ul className="text-xs font-medium text-slate-600 dark:text-slate-350 space-y-1 pl-1">
                      {vendor.suspiciousPatterns.map((pattern, patternIndex) => (
                        <li key={patternIndex} className="flex items-start space-x-1.5">
                          <span className="text-rose-500 mt-1 flex-shrink-0">•</span>
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

      {/* Flagged Transactions Ledger List */}
      {result.flaggedTransactions.length > 0 && (
        <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-4 flex items-center space-x-2.5">
            <Flag className="w-5 h-5 text-indigo-500" />
            <span>Individual Flagged Ledger Entries</span>
          </h3>
          
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/40">
              <thead className="bg-slate-100/50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
                    Amount
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
                    Vendor Merchant
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
                    Leading Digit
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
                    Risk Assessment
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
                    Reason / Explanation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 bg-white/20 dark:bg-slate-900/10">
                {result.flaggedTransactions.slice(0, 20).map((transaction, index) => (
                  <tr 
                    key={index} 
                    className={cn(
                      'transition-colors duration-150',
                      index % 2 === 0 ? 'bg-transparent' : 'bg-slate-100/20 dark:bg-slate-900/25'
                    )}
                  >
                    <td className="px-4 py-3 text-sm font-extrabold text-rose-600 dark:text-rose-400">
                      {transaction.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-850 dark:text-slate-200">
                      {transaction.vendor || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-350">
                      {transaction.firstDigit}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border',
                        transaction.riskLevel === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-650 dark:text-rose-300' :
                        transaction.riskLevel === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                      )}>
                        {transaction.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-450 leading-relaxed">
                      {transaction.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {result.flaggedTransactions.length > 20 && (
            <div className="mt-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
              Showing top 20 of {result.flaggedTransactions.length.toLocaleString()} flagged ledger entries
            </div>
          )}
        </div>
      )}
    </div>
  );
}
