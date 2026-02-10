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
    const deviationColor = data.deviation > 5 ? 'text-red-600' : data.deviation > 2 ? 'text-amber-600' : 'text-green-600';
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">Digit {label}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-blue-600 font-medium">Observed:</span> {data.observed.toFixed(1)}% ({data.count} transactions)
          </p>
          <p>
            <span className="text-gray-600 font-medium">Expected:</span> {data.expected.toFixed(1)}%
          </p>
          <p>
            <span className={cn("font-medium", deviationColor)}>Deviation:</span> {data.deviation.toFixed(1)}%
          </p>
        </div>
        {data.deviation > 5 && (
          <p className="text-xs text-red-600 mt-2 font-medium">⚠ Significant deviation detected</p>
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
    <div className={cn('bg-white p-6 rounded-lg border border-gray-200', className)}>
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Benford's Law Distribution Analysis
          </h3>
          <p className="text-sm text-gray-600">
            Comparing observed vs expected first digit frequencies
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="digit" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="expected" 
            fill="#9ca3af" 
            name="Expected (Benford's Law)"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="observed" 
            fill="#3b82f6" 
            name="Observed in Data"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
            <span>Expected (Benford's Law)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span>Observed in Data</span>
          </div>
        </div>
        <div className="text-right">
          <p>Larger deviations may indicate data irregularities</p>
        </div>
      </div>
    </div>
  );
}
