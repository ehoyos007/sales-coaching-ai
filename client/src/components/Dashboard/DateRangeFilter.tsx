import React from 'react';
import type { TimeRangePreset, DateRange } from '../../types';

interface DateRangeFilterProps {
  preset: TimeRangePreset;
  dateRange: DateRange;
  onPresetChange: (preset: TimeRangePreset) => void;
  onCustomRangeChange?: (range: DateRange) => void;
  showCustomInputs?: boolean;
}

const PRESET_OPTIONS: { value: TimeRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  preset,
  dateRange,
  onPresetChange,
  onCustomRangeChange,
  showCustomInputs = true,
}) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomRangeChange) {
      onCustomRangeChange({
        startDate: e.target.value,
        endDate: dateRange.endDate,
      });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomRangeChange) {
      onCustomRangeChange({
        startDate: dateRange.startDate,
        endDate: e.target.value,
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Preset Buttons */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        {PRESET_OPTIONS.filter(opt => opt.value !== 'custom' || showCustomInputs).map(option => (
          <button
            key={option.value}
            onClick={() => onPresetChange(option.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              preset === option.value
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {showCustomInputs && preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={handleStartDateChange}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={handleEndDateChange}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {/* Date Range Display */}
      <div className="text-sm text-slate-500">
        {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        {' - '}
        {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
};

export default DateRangeFilter;
