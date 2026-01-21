import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  loading = false,
  className = '',
}) => {
  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.direction === 'stable') return 'text-slate-500';
    if (trend.isPositive === undefined) {
      return trend.direction === 'up' ? 'text-green-600' : 'text-red-600';
    }
    return trend.isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    }
    if (trend.direction === 'down') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg text-primary-600">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="font-medium">
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
          </span>
          <span className="text-slate-400">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
