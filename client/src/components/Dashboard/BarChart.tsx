import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  loading?: boolean;
  height?: number;
  color?: string;
  title?: string;
  valueLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  showValues?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  loading = false,
  height = 300,
  color = '#6366f1',
  title,
  valueLabel = 'Value',
  showGrid = true,
  showLegend = false,
  horizontal = false,
  showValues = false,
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

  const layout = horizontal ? 'vertical' : 'horizontal';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: horizontal ? 100 : 0, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
                width={90}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          {showLegend && <Legend />}
          <Bar
            dataKey="value"
            name={valueLabel}
            radius={[4, 4, 0, 0]}
            label={showValues ? { position: 'top', fontSize: 12, fill: '#64748b' } : false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
