import { TrendingUp, Shield, AlertTriangle, XCircle, BarChart3, Users, Flag } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { BenfordResult } from '../../types';

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
    good: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
    danger: 'border-red-200 bg-red-50',
  };

  const iconStyles = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  const textStyles = {
    good: 'text-green-900',
    warning: 'text-amber-900',
    danger: 'text-red-900',
  };

  return (
    <div className={cn('border rounded-lg p-6 transition-all hover:shadow-md', statusStyles[status])}>
      <div className="flex items-center justify-between mb-4">
        <Icon className={cn('w-8 h-8', iconStyles[status])} />
        {trend && (
          <div className={cn('flex items-center space-x-1 text-xs', textStyles[status])}>
            <TrendingUp className={cn('w-3 h-3', trend.direction === 'down' && 'rotate-180')} />
            <span>{trend.label}</span>
          </div>
        )}
      </div>
      
      <div className={cn('space-y-2', textStyles[status])}>
        <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{subtitle}</p>
      </div>
    </div>
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Risk Assessment Dashboard</h2>
        <p className="text-gray-600">
          Comprehensive analysis of {result.totalAnalyzed.toLocaleString()} transactions using Benford's Law
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {result.chiSquare.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Chi-Square Statistic</div>
            <div className="text-xs text-gray-500 mt-1">
              {result.chiSquare > 15.51 ? 'Significant deviation' : 'Within acceptable range'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {((result.flaggedTransactions.length / result.totalAnalyzed) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Flagged Transaction Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              {result.flaggedTransactions.length} of {result.totalAnalyzed.toLocaleString()}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {result.suspiciousVendors.length > 0 ? 
                (result.suspiciousVendors.reduce((acc, v) => acc + v.transactionCount, 0) / result.totalAnalyzed * 100).toFixed(1) 
                : '0.0'
              }%
            </div>
            <div className="text-sm text-gray-600">Suspicious Vendor Volume</div>
            <div className="text-xs text-gray-500 mt-1">
              Percentage of total transaction volume
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">Analysis Warnings</h4>
          </div>
          <ul className="space-y-1">
            {result.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-amber-800 flex items-start space-x-2">
                <span className="w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
