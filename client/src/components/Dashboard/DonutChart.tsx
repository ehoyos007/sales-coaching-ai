import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  loading?: boolean;
  height?: number;
  title?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

const DEFAULT_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  loading = false,
  height = 250,
  title,
  showLegend = true,
  showLabels = false,
  innerRadius = 60,
  outerRadius = 90,
  centerLabel,
  centerValue,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
        <div className="animate-pulse flex items-center justify-center" style={{ height }}>
          <div className="w-40 h-40 bg-slate-100 rounded-full"></div>
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

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    name?: string;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, name = '' } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#64748b"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              label={showLabels ? renderCustomLabel : false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [`${numValue} (${total > 0 ? ((numValue / total) * 100).toFixed(1) : 0}%)`];
              }}
            />
            {showLegend && (
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {centerValue && (
                <p className="text-2xl font-bold text-slate-900">{centerValue}</p>
              )}
              {centerLabel && (
                <p className="text-xs text-slate-500">{centerLabel}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
