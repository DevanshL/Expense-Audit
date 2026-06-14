import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DigitFrequency } from '../../types';

interface BenfordChartProps {
  frequencies: DigitFrequency[];
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      digit: number;
      observed: number;
      expected: number;
      deviation: number;
      count: number;
    };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const deviationColor = data.deviation > 5 ? 'text-red-400' : data.deviation > 2 ? 'text-amber-400' : 'text-emerald-400';
    
    return (
      <div className="glass-panel border border-slate-200/60 dark:border-slate-700/50 p-4 rounded-xl shadow-xl">
        <p className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Digit {label}</p>
        <div className="space-y-1 text-xs">
          <p>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Observed:</span>{' '}
            <span className="text-slate-700 dark:text-slate-300">{data.observed.toFixed(1)}% ({data.count})</span>
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Expected:</span>{' '}
            <span className="text-slate-700 dark:text-slate-300">{data.expected.toFixed(1)}%</span>
          </p>
          <p>
            <span className={cn('font-semibold', deviationColor)}>Deviation: {data.deviation.toFixed(1)}%</span>
          </p>
        </div>
        {data.deviation > 5 && (
          <p className="text-xs text-red-400 mt-2 font-semibold">⚠ Significant deviation detected</p>
        )}
      </div>
    );
  }
  return null;
}

export function BenfordChart({ frequencies, className }: BenfordChartProps) {
  const chartData = frequencies.map(freq => ({
    digit: freq.digit,
    observed: freq.observed,
    expected: freq.expected,
    deviation: freq.deviation,
    count: freq.count,
  }));

  return (
    <div className={cn('glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-md', className)}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Benford's Law Distribution Analysis
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Comparing observed vs expected first digit frequencies
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="digit"
            tick={{ fontSize: 11, fill: 'rgb(100,116,139)' }}
            axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
            tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'rgb(100,116,139)' }}
            axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
            tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
            label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft', fill: 'rgb(100,116,139)', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'rgb(100,116,139)' }}
            iconType="square"
            iconSize={10}
          />
          <Bar
            dataKey="expected"
            fill="rgba(148,163,184,0.5)"
            name="Expected (Benford's Law)"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="observed"
            fill="#6366f1"
            name="Observed in Data"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/50 pt-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-400/50"></div>
            <span>Expected (Benford's Law)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Observed in Data</span>
          </div>
        </div>
        <span className="italic">Larger deviations may indicate data irregularities</span>
      </div>
    </div>
  );
}
