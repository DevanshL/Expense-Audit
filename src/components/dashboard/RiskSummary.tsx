import { TrendingUp, Shield, AlertTriangle, XCircle, BarChart3, Users, Flag } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { BenfordResult } from '../../types';
import { Interactive3DTiltCard } from '../ui/Interactive3DTiltCard';

interface RiskSummaryProps {
  result: BenfordResult;
  className?: string;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'good' | 'warning' | 'danger';
  trend?: {
    direction: 'up' | 'down';
    label: string;
  };
}

function SummaryCard({ title, value, subtitle, icon: Icon, status, trend }: SummaryCardProps) {
  const statusStyles = {
    good: 'border-green-500/20 dark:border-green-500/10 bg-green-500/10 dark:bg-green-950/20 shadow-lg shadow-green-500/5',
    warning: 'border-amber-500/20 dark:border-amber-500/10 bg-amber-500/10 dark:bg-amber-950/20 shadow-lg shadow-amber-500/5',
    danger: 'border-red-500/20 dark:border-red-500/10 bg-red-500/10 dark:bg-red-950/20 shadow-lg shadow-red-500/5',
  };

  const iconStyles = {
    good: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  const textStyles = {
    good: 'text-green-900 dark:text-green-300',
    warning: 'text-amber-900 dark:text-amber-300',
    danger: 'text-red-900 dark:text-red-300',
  };

  return (
    <Interactive3DTiltCard maxTilt={8} className="w-full">
      <div className={cn('border rounded-2xl p-6 transition-all duration-300 backdrop-blur-md h-full', statusStyles[status])}>
        <div className="flex items-center justify-between mb-4">
          <div className="bg-white/40 dark:bg-slate-900/30 rounded-xl p-2.5 shadow-sm border border-white/20 dark:border-slate-800/10">
            <Icon className={cn('w-7 h-7', iconStyles[status])} />
          </div>
          {trend && (
            <div className={cn('flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full bg-white/30 dark:bg-slate-900/20', textStyles[status])}>
              <TrendingUp className={cn('w-3 h-3', trend.direction === 'down' && 'rotate-180')} />
              <span>{trend.label}</span>
            </div>
          )}
        </div>
        
        <div className={cn('space-y-1.5', textStyles[status])}>
          <h3 className="font-bold text-xs uppercase tracking-wider opacity-75">{title}</h3>
          <p className="text-3xl font-black tracking-tight">{value}</p>
          <p className="text-sm font-semibold opacity-90">{subtitle}</p>
        </div>
      </div>
    </Interactive3DTiltCard>
  );
}

function getOverallStatus(assessment: string): 'good' | 'warning' | 'danger' {
  switch (assessment) {
    case 'compliant': return 'good';
    case 'acceptable': return 'good';
    case 'suspicious': return 'warning';
    case 'highly_suspicious': return 'danger';
    default: return 'warning';
  }
}

function getAssessmentText(assessment: string): string {
  switch (assessment) {
    case 'compliant': return 'Compliant';
    case 'acceptable': return 'Acceptable';
    case 'suspicious': return 'Suspicious';
    case 'highly_suspicious': return 'Highly Suspicious';
    default: return 'Unknown';
  }
}

export function RiskSummary({ result, className }: RiskSummaryProps) {
  const overallStatus = getOverallStatus(result.overallAssessment);
  
  const criticalVendors = result.suspiciousVendors.filter(v => v.riskLevel === 'critical').length;
  const highRiskTransactions = result.flaggedTransactions.filter(t => t.riskLevel === 'critical' || t.riskLevel === 'high').length;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="animate-fadeIn">
        <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white mb-2">Risk Assessment Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Comprehensive analysis of {result.totalAnalyzed.toLocaleString()} transactions using Benford's Law
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
        <SummaryCard
          title="Overall Assessment"
          value={getAssessmentText(result.overallAssessment)}
          subtitle={`Risk Level: ${result.riskLevel.toUpperCase()}`}
          icon={overallStatus === 'good' ? Shield : overallStatus === 'warning' ? AlertTriangle : XCircle}
          status={overallStatus}
        />

        <SummaryCard
          title="Data Compliance"
          value={`${result.mad.toFixed(1)}`}
          subtitle={`MAD Score (target: <8.0)`}
          icon={BarChart3}
          status={result.mad < 8 ? 'good' : result.mad < 15 ? 'warning' : 'danger'}
          trend={{
            direction: result.mad < 8 ? 'down' : 'up',
            label: result.mad < 8 ? 'Within normal range' : 'Above threshold'
          }}
        />

        <SummaryCard
          title="Flagged Vendors"
          value={result.suspiciousVendors.length}
          subtitle={`${criticalVendors} critical risk`}
          icon={Users}
          status={result.suspiciousVendors.length === 0 ? 'good' : criticalVendors > 0 ? 'danger' : 'warning'}
        />

        <SummaryCard
          title="Flagged Transactions"
          value={result.flaggedTransactions.length}
          subtitle={`${highRiskTransactions} high/critical risk`}
          icon={Flag}
          status={result.flaggedTransactions.length === 0 ? 'good' : highRiskTransactions > 0 ? 'danger' : 'warning'}
        />
      </div>

      {/* Statistical Summary */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl border border-white/20 dark:border-slate-800/40 animate-fadeIn">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Statistical Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">
              {result.chiSquare.toFixed(2)}
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chi-Square Statistic</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">
              {result.chiSquare > 15.51 ? 'Significant deviation' : 'Within acceptable range'}
            </div>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">
              {((result.flaggedTransactions.length / result.totalAnalyzed) * 100).toFixed(1)}%
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Flagged Transaction Rate</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">
              {result.flaggedTransactions.length} of {result.totalAnalyzed.toLocaleString()}
            </div>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
            <div className="text-3xl font-extrabold text-orange-600 dark:text-orange-400 mb-1">
              {result.suspiciousVendors.length > 0 ? 
                (result.suspiciousVendors.reduce((acc, v) => acc + v.transactionCount, 0) / result.totalAnalyzed * 100).toFixed(1) 
                : '0.0'
              }%
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Suspicious Vendor Volume</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">
              Percentage of total transaction volume
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl p-5 shadow-lg shadow-amber-500/5 animate-fadeIn">
          <div className="flex items-center space-x-2.5 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h4 className="font-bold text-amber-900 dark:text-amber-300">Analysis Warnings</h4>
          </div>
          <ul className="space-y-1.5">
            {result.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-amber-800 dark:text-amber-400 flex items-start space-x-2 font-medium">
                <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
