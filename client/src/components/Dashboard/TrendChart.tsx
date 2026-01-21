import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  loading?: boolean;
  height?: number;
  color?: string;
  title?: string;
  valueLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  loading = false,
  height = 300,
  color = '#6366f1',
  title,
  valueLabel = 'Value',
  showGrid = true,
  showLegend = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
        <div className="animate-pulse" style={{ height }}>
          <div className="h-full bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
        <div className="flex items-center justify-center text-slate-400" style={{ height }}>
          No data available
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelFormatter={(label) => formatDate(String(label))}
          />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="value"
            name={valueLabel}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
