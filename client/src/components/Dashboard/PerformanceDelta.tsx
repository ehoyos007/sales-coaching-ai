import React from 'react';

interface PerformanceDeltaProps {
  currentValue: number;
  previousValue: number;
  label?: string;
  format?: 'number' | 'percentage' | 'duration' | 'custom';
  formatFn?: (value: number) => string;
  positiveIsGood?: boolean;
  showAbsoluteChange?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PerformanceDelta: React.FC<PerformanceDeltaProps> = ({
  currentValue,
  previousValue,
  label,
  format = 'number',
  formatFn,
  positiveIsGood = true,
  showAbsoluteChange = false,
  size = 'md',
  className = '',
}) => {
  const calculateChange = () => {
    if (previousValue === 0) {
      return {
        percentage: currentValue > 0 ? 100 : 0,
        absolute: currentValue,
        trend: currentValue > 0 ? 'up' : currentValue < 0 ? 'down' : 'stable',
      };
    }

    const absolute = currentValue - previousValue;
    const percentage = (absolute / previousValue) * 100;
    const trend = percentage > 1 ? 'up' : percentage < -1 ? 'down' : 'stable';

    return { percentage, absolute, trend };
  };

  const { percentage, absolute, trend } = calculateChange();

  const formatValue = (value: number) => {
    if (formatFn) return formatFn(value);

    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        if (value < 60) return `${Math.round(value)}s`;
        return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
      default:
        return value.toLocaleString();
    }
  };

  const isPositive = trend === 'up';
  const isGood = positiveIsGood ? isPositive : !isPositive;

  const colorClass = trend === 'stable'
    ? 'text-slate-500'
    : isGood
      ? 'text-green-600'
      : 'text-red-600';

  const bgClass = trend === 'stable'
    ? 'bg-slate-50'
    : isGood
      ? 'bg-green-50'
      : 'bg-red-50';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  }[size];

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const TrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return (
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  return (
    <div className={`inline-flex items-center rounded-full ${bgClass} ${colorClass} ${sizeClasses} ${className}`}>
      <TrendIcon />
      <span className="font-semibold">
        {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
      </span>
      {showAbsoluteChange && (
        <span className="opacity-75">
          ({absolute > 0 ? '+' : ''}{formatValue(absolute)})
        </span>
      )}
      {label && <span className="text-slate-500 ml-1">{label}</span>}
    </div>
  );
};

// Compact comparison display
interface ComparisonDisplayProps {
  currentValue: number;
  previousValue: number;
  currentLabel?: string;
  previousLabel?: string;
  format?: 'number' | 'percentage' | 'duration';
  formatFn?: (value: number) => string;
  positiveIsGood?: boolean;
  className?: string;
}

export const ComparisonDisplay: React.FC<ComparisonDisplayProps> = ({
  currentValue,
  previousValue,
  currentLabel = 'This Period',
  previousLabel = 'Last Period',
  format = 'number',
  formatFn,
  positiveIsGood = true,
  className = '',
}) => {
  const formatValue = (value: number) => {
    if (formatFn) return formatFn(value);

    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        if (value < 60) return `${Math.round(value)}s`;
        const minutes = Math.floor(value / 60);
        const seconds = Math.round(value % 60);
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-900">{formatValue(currentValue)}</p>
        <p className="text-xs text-slate-500">{currentLabel}</p>
      </div>
      <div className="flex-shrink-0">
        <PerformanceDelta
          currentValue={currentValue}
          previousValue={previousValue}
          format={format}
          formatFn={formatFn}
          positiveIsGood={positiveIsGood}
          size="sm"
        />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-slate-400">{formatValue(previousValue)}</p>
        <p className="text-xs text-slate-400">{previousLabel}</p>
      </div>
    </div>
  );
};

export default PerformanceDelta;
