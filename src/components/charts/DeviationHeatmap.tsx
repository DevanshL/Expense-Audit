import { TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { VendorAnalysis } from '../../types';

interface DeviationHeatmapProps {
  vendors: VendorAnalysis[];
  className?: string;
}

interface HeatmapCellProps {
  value: number;
  vendor: string;
  digit: string;
}

function HeatmapCell({ value, vendor, digit }: HeatmapCellProps) {
  const getCellColor = (deviation: number) => {
    if (deviation > 5) return 'bg-red-500 dark:bg-red-600 text-white font-bold';
    if (deviation > 2) return 'bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-300 font-semibold';
    if (deviation > -2) return 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400';
    if (deviation > -5) return 'bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold';
    return 'bg-blue-500 dark:bg-blue-600 text-white font-bold';
  };

  return (
    <div
      className={cn(
        'w-full h-10 flex items-center justify-center text-xs font-medium rounded transition-all hover:scale-105 cursor-pointer',
        getCellColor(value)
      )}
      title={`${vendor} - Digit ${digit}: ${value > 0 ? '+' : ''}${value.toFixed(1)}% deviation from expected`}
    >
      {Math.abs(value) > 1 ? `${value > 0 ? '+' : ''}${value.toFixed(1)}` : ''}
    </div>
  );
}

export function DeviationHeatmap({ vendors, className }: DeviationHeatmapProps) {
  // Prepare data for heatmap - first 10 vendors with most transactions
  const topVendors = vendors
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 10);

  if (topVendors.length === 0) {
    return (
      <div className={cn('glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-md', className)}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/15">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Deviation Heatmap</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No vendor data available for heatmap visualization
            </p>
          </div>
        </div>
      </div>
    );
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  // Calculate deviations for each vendor and digit
  const heatmapData = topVendors.map(vendor => {
    const digitCounts = vendor.digitDistribution;
    const totalTransactions = vendor.transactionCount;
    
    return digits.map(digit => {
      const count = digitCounts[parseInt(digit)] || 0;
      const percentage = totalTransactions > 0 ? (count / totalTransactions) * 100 : 0;
      
      // Calculate expected percentage for this digit (Benford's Law)
      const expectedPercentage = Math.log10(1 + 1/parseInt(digit)) * 100;
      
      // Return deviation percentage (positive = higher than expected)
      return percentage - expectedPercentage;
    });
  });

  return (
    <div className={cn('glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-md', className)}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/15">
          <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Vendor-Digit Deviation Heatmap
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Deviation from Benford's Law by vendor and digit (top 10 vendors by volume)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header */}
            <div className="grid grid-cols-10 gap-1 mb-2">
              <div className="text-xs font-medium text-slate-400 p-2"></div>
              {digits.map(digit => (
                <div key={digit} className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center p-2">
                  Digit {digit}
                </div>
              ))}
            </div>
            
            {/* Rows */}
            {topVendors.map((vendor, vendorIndex) => (
              <div key={vendor.vendor} className="grid grid-cols-10 gap-1 mb-1">
                <div className="text-xs text-slate-600 dark:text-slate-300 p-2 font-semibold text-right pr-4 flex items-center justify-end">
                  <span className="truncate max-w-32" title={vendor.vendor}>
                    {vendor.vendor.length > 15 ? vendor.vendor.substring(0, 15) + '...' : vendor.vendor}
                  </span>
                </div>
                {heatmapData[vendorIndex].map((deviation, digitIndex) => (
                  <HeatmapCell
                    key={`${vendorIndex}-${digitIndex}`}
                    value={deviation}
                    vendor={vendor.vendor}
                    digit={digits[digitIndex]}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/50 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <span>Much lower (-5%+)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900/60 rounded-sm"></div>
              <span>Lower (-2% to -5%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm"></div>
              <span>Near expected (-2% to +2%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 bg-red-200 dark:bg-red-900/60 rounded-sm"></div>
              <span>Higher (+2% to +5%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
              <span>Much higher (+5%+)</span>
            </div>
          </div>
          <span className="italic">Red areas may indicate suspicious patterns</span>
        </div>
      </div>
    </div>
  );
}
