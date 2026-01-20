import React from 'react';
import type { RubricCategory } from '../../../types';

interface WeightDistributionBarProps {
  categories: RubricCategory[];
}

// Color palette for categories
const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
];

export const WeightDistributionBar: React.FC<WeightDistributionBarProps> = ({ categories }) => {
  const enabledCategories = categories.filter(c => c.is_enabled);
  const totalWeight = enabledCategories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Weight Distribution</span>
        <span className={`text-sm font-medium ${Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
          {totalWeight}% / 100%
        </span>
      </div>

      {/* Distribution Bar */}
      <div className="h-8 bg-slate-100 rounded-lg overflow-hidden flex">
        {enabledCategories.map((category, index) => (
          <div
            key={category.id}
            className={`${CATEGORY_COLORS[index % CATEGORY_COLORS.length]} transition-all duration-300 flex items-center justify-center`}
            style={{ width: `${category.weight}%` }}
            title={`${category.name}: ${category.weight}%`}
          >
            {category.weight >= 10 && (
              <span className="text-xs text-white font-medium truncate px-1">
                {category.weight}%
              </span>
            )}
          </div>
        ))}
        {totalWeight < 100 && (
          <div
            className="bg-slate-200 flex items-center justify-center"
            style={{ width: `${100 - totalWeight}%` }}
          >
            <span className="text-xs text-slate-500 font-medium">
              {Math.round((100 - totalWeight) * 10) / 10}%
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {enabledCategories.map((category, index) => (
          <div key={category.id} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`} />
            <span className="text-xs text-slate-600">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeightDistributionBar;
