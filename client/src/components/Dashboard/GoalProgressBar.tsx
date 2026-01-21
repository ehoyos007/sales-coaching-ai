import React from 'react';
import type { GoalType, GOAL_TYPE_LABELS } from '../../types';

interface GoalProgressBarProps {
  goalType: GoalType;
  targetValue: number;
  actualValue: number;
  progressPercentage: number;
  periodStart?: string;
  periodEnd?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GOAL_LABELS: typeof GOAL_TYPE_LABELS = {
  calls: 'Total Calls',
  duration: 'Talk Time (minutes)',
  compliance_score: 'Compliance Score',
  objection_resolution: 'Objection Resolution Rate',
};

const GOAL_ICONS: Record<GoalType, React.ReactNode> = {
  calls: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  duration: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  compliance_score: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  objection_resolution: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
};

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  goalType,
  targetValue,
  actualValue,
  progressPercentage,
  periodStart,
  periodEnd,
  showDetails = true,
  size = 'md',
}) => {
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-primary-500';
    if (progressPercentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getProgressBgColor = () => {
    if (progressPercentage >= 100) return 'bg-green-100';
    if (progressPercentage >= 75) return 'bg-primary-100';
    if (progressPercentage >= 50) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const barHeight = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const formatValue = (value: number) => {
    if (goalType === 'compliance_score' || goalType === 'objection_resolution') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{GOAL_ICONS[goalType]}</span>
            <span className="text-sm font-medium text-slate-700">{GOAL_LABELS[goalType]}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-slate-900">
              {formatValue(actualValue)}
            </span>
            <span className="text-sm text-slate-400"> / {formatValue(targetValue)}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative">
        <div className={`w-full ${barHeight} ${getProgressBgColor()} rounded-full overflow-hidden`}>
          <div
            className={`${barHeight} ${getProgressColor()} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        {/* Percentage Label */}
        <div className="absolute -top-0.5 right-0 transform translate-x-1/2 -translate-y-full">
          <span className={`text-xs font-medium ${progressPercentage >= 100 ? 'text-green-600' : 'text-slate-500'}`}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Period */}
      {showDetails && periodStart && periodEnd && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{formatDate(periodStart)} - {formatDate(periodEnd)}</span>
          {progressPercentage >= 100 && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Goal achieved
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalProgressBar;
