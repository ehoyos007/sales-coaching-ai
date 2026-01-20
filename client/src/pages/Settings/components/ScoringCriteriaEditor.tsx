import React, { useState } from 'react';
import type { RubricCategory, CategoryInput, ScoringCriteriaInput } from '../../../types';

interface ScoringCriteriaEditorProps {
  categories: (RubricCategory & { scoring_criteria: { id: string; score: number; criteria_text: string }[] })[];
  onUpdateCategory: (index: number, updates: Partial<CategoryInput>) => void;
  isEditable: boolean;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Below Standard',
  3: 'Meets Standard',
  4: 'Above Standard',
  5: 'Excellent',
};

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  5: 'bg-green-100 text-green-800 border-green-200',
};

export const ScoringCriteriaEditor: React.FC<ScoringCriteriaEditorProps> = ({
  categories,
  onUpdateCategory,
  isEditable,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(categories[0]?.id || null);

  const handleCriteriaChange = (categoryIndex: number, scoreIndex: number, text: string) => {
    const category = categories[categoryIndex];
    const newCriteria: ScoringCriteriaInput[] = category.scoring_criteria.map((sc, i) =>
      i === scoreIndex ? { score: sc.score, criteria_text: text } : { score: sc.score, criteria_text: sc.criteria_text }
    );
    onUpdateCategory(categoryIndex, { scoring_criteria: newCriteria });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Scoring Criteria</h3>
        <p className="text-sm text-slate-500 mt-1">
          Define what each score level (1-5) means for each category.
        </p>
      </div>

      {/* Category Accordion */}
      <div className="space-y-3">
        {categories.map((category, categoryIndex) => (
          <div key={category.id} className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">{category.name}</span>
                <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                  {category.weight}%
                </span>
              </div>
              <svg
                className={`h-5 w-5 text-slate-400 transition-transform ${
                  expandedCategory === category.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Criteria Content */}
            {expandedCategory === category.id && (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((score) => {
                  const criteria = category.scoring_criteria?.find(c => c.score === score);
                  const criteriaIndex = category.scoring_criteria?.findIndex(c => c.score === score) ?? -1;

                  return (
                    <div key={score} className="flex gap-4">
                      {/* Score Badge */}
                      <div className={`flex-shrink-0 w-24 px-3 py-2 rounded-lg border text-center ${SCORE_COLORS[score]}`}>
                        <div className="text-lg font-bold">{score}</div>
                        <div className="text-xs">{SCORE_LABELS[score]}</div>
                      </div>

                      {/* Criteria Text */}
                      <div className="flex-1">
                        {isEditable ? (
                          <textarea
                            value={criteria?.criteria_text || ''}
                            onChange={e => criteriaIndex >= 0 && handleCriteriaChange(categoryIndex, criteriaIndex, e.target.value)}
                            placeholder={`Describe what a score of ${score} looks like...`}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                          />
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-700 bg-slate-50 rounded-lg min-h-[76px]">
                            {criteria?.criteria_text || <span className="text-slate-400 italic">No criteria defined</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isEditable && (
        <p className="mt-6 text-sm text-slate-500 text-center italic">
          Create a new version to edit scoring criteria
        </p>
      )}
    </div>
  );
};

export default ScoringCriteriaEditor;
