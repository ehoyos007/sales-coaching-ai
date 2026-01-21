import React from 'react';

interface ComplianceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

type Rating = 'excellent' | 'good' | 'needs_improvement' | 'critical';

const getRating = (score: number): Rating => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'needs_improvement';
  return 'critical';
};

const RATING_CONFIG: Record<Rating, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  excellent: {
    label: 'Excellent',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  good: {
    label: 'Good',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  needs_improvement: {
    label: 'Needs Improvement',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  critical: {
    label: 'Critical',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
};

export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const rating = getRating(score);
  const config = RATING_CONFIG[rating];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses} ${className}`}
    >
      <span className="font-bold">{score.toFixed(1)}</span>
      {showLabel && <span className="opacity-75">| {config.label}</span>}
    </span>
  );
};

// Compliance Score Circle Component
interface ComplianceScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showRating?: boolean;
  className?: string;
}

export const ComplianceScoreCircle: React.FC<ComplianceScoreCircleProps> = ({
  score,
  size = 100,
  strokeWidth = 8,
  showRating = true,
  className = '',
}) => {
  const rating = getRating(score);
  const config = RATING_CONFIG[rating];

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const colorMap: Record<Rating, string> = {
    excellent: '#22c55e',
    good: '#3b82f6',
    needs_improvement: '#f59e0b',
    critical: '#ef4444',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorMap[rating]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score.toFixed(0)}</span>
        {showRating && (
          <span className={`text-xs ${config.textColor}`}>{config.label}</span>
        )}
      </div>
    </div>
  );
};

// Compact compliance indicator for tables
interface ComplianceIndicatorProps {
  score: number;
  className?: string;
}

export const ComplianceIndicator: React.FC<ComplianceIndicatorProps> = ({
  score,
  className = '',
}) => {
  const rating = getRating(score);

  const dotColorMap: Record<Rating, string> = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    needs_improvement: 'bg-amber-500',
    critical: 'bg-red-500',
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${dotColorMap[rating]}`} />
      <span className="font-medium text-slate-700">{score.toFixed(1)}</span>
    </span>
  );
};

export default ComplianceBadge;
