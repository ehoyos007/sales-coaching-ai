import React, { useState } from 'react';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import type {
  RubricSyncLog,
  ProposedChanges,
  ProposedCategoryChange,
  ProposedCriteriaChange,
  ProposedRedFlagChange,
  ApplySyncInput,
} from '../../../types';

interface SyncReviewPanelProps {
  syncLog: RubricSyncLog;
  proposedChanges: ProposedChanges;
  onApply: (approvedChanges: ApplySyncInput) => void;
  onReject: () => void;
  onClose: () => void;
  isApplying: boolean;
}

export const SyncReviewPanel: React.FC<SyncReviewPanelProps> = ({
  syncLog: _syncLog,
  proposedChanges,
  onApply,
  onReject,
  onClose,
  isApplying,
}) => {
  // Track which changes are selected (all selected by default)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(proposedChanges.category_changes.map((_, i) => String(i)))
  );
  const [selectedCriteria, setSelectedCriteria] = useState<Set<string>>(
    new Set(proposedChanges.criteria_changes.map((_, i) => String(i)))
  );
  const [selectedRedFlags, setSelectedRedFlags] = useState<Set<string>>(
    new Set(proposedChanges.red_flag_changes.map((_, i) => String(i)))
  );

  const toggleCategory = (index: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleCriteria = (index: string) => {
    setSelectedCriteria(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleRedFlag = (index: string) => {
    setSelectedRedFlags(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedCategories(new Set(proposedChanges.category_changes.map((_, i) => String(i))));
    setSelectedCriteria(new Set(proposedChanges.criteria_changes.map((_, i) => String(i))));
    setSelectedRedFlags(new Set(proposedChanges.red_flag_changes.map((_, i) => String(i))));
  };

  const selectNone = () => {
    setSelectedCategories(new Set());
    setSelectedCriteria(new Set());
    setSelectedRedFlags(new Set());
  };

  const handleApply = () => {
    onApply({
      approved_category_changes: Array.from(selectedCategories),
      approved_criteria_changes: Array.from(selectedCriteria),
      approved_red_flag_changes: Array.from(selectedRedFlags),
    });
  };

  const totalSelected = selectedCategories.size + selectedCriteria.size + selectedRedFlags.size;
  const totalChanges = proposedChanges.total_changes;

  const getChangeTypeBadge = (type: 'add' | 'modify' | 'remove') => {
    switch (type) {
      case 'add':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Add</span>;
      case 'modify':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Modify</span>;
      case 'remove':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Remove</span>;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <span className="text-xs text-green-600">High confidence</span>;
    }
    if (confidence >= 0.5) {
      return <span className="text-xs text-amber-600">Medium confidence</span>;
    }
    return <span className="text-xs text-red-600">Low confidence</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Review Proposed Changes</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {totalChanges} changes proposed - select which ones to apply
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-700">{proposedChanges.summary}</p>
          {proposedChanges.analysis_notes && (
            <p className="text-xs text-slate-500 mt-2">{proposedChanges.analysis_notes}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={selectAll}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Select All
            </button>
            <button
              onClick={selectNone}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Select None
            </button>
            <span className="text-xs text-slate-400">
              {totalSelected} of {totalChanges} selected
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Category Changes */}
          {proposedChanges.category_changes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Category Changes ({proposedChanges.category_changes.length})
              </h4>
              <div className="space-y-2">
                {proposedChanges.category_changes.map((change, index) => (
                  <CategoryChangeItem
                    key={index}
                    change={change}
                    isSelected={selectedCategories.has(String(index))}
                    onToggle={() => toggleCategory(String(index))}
                    getChangeTypeBadge={getChangeTypeBadge}
                    getConfidenceBadge={getConfidenceBadge}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Criteria Changes */}
          {proposedChanges.criteria_changes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scoring Criteria Changes ({proposedChanges.criteria_changes.length})
              </h4>
              <div className="space-y-2">
                {proposedChanges.criteria_changes.map((change, index) => (
                  <CriteriaChangeItem
                    key={index}
                    change={change}
                    isSelected={selectedCriteria.has(String(index))}
                    onToggle={() => toggleCriteria(String(index))}
                    getChangeTypeBadge={getChangeTypeBadge}
                    getConfidenceBadge={getConfidenceBadge}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Red Flag Changes */}
          {proposedChanges.red_flag_changes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Red Flag Changes ({proposedChanges.red_flag_changes.length})
              </h4>
              <div className="space-y-2">
                {proposedChanges.red_flag_changes.map((change, index) => (
                  <RedFlagChangeItem
                    key={index}
                    change={change}
                    isSelected={selectedRedFlags.has(String(index))}
                    onToggle={() => toggleRedFlag(String(index))}
                    getChangeTypeBadge={getChangeTypeBadge}
                    getConfidenceBadge={getConfidenceBadge}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Changes */}
          {totalChanges === 0 && (
            <div className="text-center py-8 text-slate-500">
              <svg className="h-12 w-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>The current rubric is well-aligned with the script.</p>
              <p className="text-sm mt-1">No changes are needed.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {totalSelected > 0
              ? `${totalSelected} change${totalSelected === 1 ? '' : 's'} will be applied as a new draft rubric.`
              : 'Select at least one change to apply.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onReject}
              disabled={isApplying}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Reject All
            </button>
            <button
              onClick={handleApply}
              disabled={totalSelected === 0 || isApplying}
              className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <LoadingSpinner size="sm" className="text-white" />
                  Applying...
                </>
              ) : (
                `Apply ${totalSelected} Change${totalSelected === 1 ? '' : 's'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Change Item Component
interface CategoryChangeItemProps {
  change: ProposedCategoryChange;
  isSelected: boolean;
  onToggle: () => void;
  getChangeTypeBadge: (type: 'add' | 'modify' | 'remove') => JSX.Element;
  getConfidenceBadge: (confidence: number) => JSX.Element;
}

const CategoryChangeItem: React.FC<CategoryChangeItemProps> = ({
  change,
  isSelected,
  onToggle,
  getChangeTypeBadge,
  getConfidenceBadge,
}) => (
  <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
    isSelected ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'
  }`}>
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getChangeTypeBadge(change.change_type)}
          <span className="font-medium text-slate-900">{change.proposed_name || change.current_name}</span>
          {change.proposed_weight !== undefined && (
            <span className="text-sm text-slate-500">
              Weight: {change.current_weight}% → {change.proposed_weight}%
            </span>
          )}
          {getConfidenceBadge(change.confidence)}
        </div>
        <p className="text-sm text-slate-600">{change.reason}</p>
        {change.script_reference && (
          <p className="text-xs text-slate-400 mt-1 italic">"{change.script_reference}"</p>
        )}
      </div>
    </div>
  </label>
);

// Criteria Change Item Component
interface CriteriaChangeItemProps {
  change: ProposedCriteriaChange;
  isSelected: boolean;
  onToggle: () => void;
  getChangeTypeBadge: (type: 'add' | 'modify' | 'remove') => JSX.Element;
  getConfidenceBadge: (confidence: number) => JSX.Element;
}

const CriteriaChangeItem: React.FC<CriteriaChangeItemProps> = ({
  change,
  isSelected,
  onToggle,
  getChangeTypeBadge,
  getConfidenceBadge,
}) => (
  <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
    isSelected ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'
  }`}>
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getChangeTypeBadge(change.change_type)}
          <span className="font-medium text-slate-900">{change.category_slug}</span>
          <span className="text-sm text-slate-500">Score: {change.score}</span>
          {getConfidenceBadge(change.confidence)}
        </div>
        {change.current_text && change.proposed_text && (
          <div className="text-sm space-y-1 mb-1">
            <div className="flex gap-2">
              <span className="text-slate-500 flex-shrink-0">Current:</span>
              <span className="text-slate-600 line-through">{change.current_text}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 flex-shrink-0">Proposed:</span>
              <span className="text-green-700">{change.proposed_text}</span>
            </div>
          </div>
        )}
        {!change.current_text && change.proposed_text && (
          <p className="text-sm text-green-700 mb-1">{change.proposed_text}</p>
        )}
        <p className="text-sm text-slate-600">{change.reason}</p>
      </div>
    </div>
  </label>
);

// Red Flag Change Item Component
interface RedFlagChangeItemProps {
  change: ProposedRedFlagChange;
  isSelected: boolean;
  onToggle: () => void;
  getChangeTypeBadge: (type: 'add' | 'modify' | 'remove') => JSX.Element;
  getConfidenceBadge: (confidence: number) => JSX.Element;
}

const RedFlagChangeItem: React.FC<RedFlagChangeItemProps> = ({
  change,
  isSelected,
  onToggle,
  getChangeTypeBadge,
  getConfidenceBadge,
}) => (
  <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
    isSelected ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'
  }`}>
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getChangeTypeBadge(change.change_type)}
          <span className="font-medium text-slate-900">{change.proposed_display_name || change.current_display_name}</span>
          {change.proposed_severity && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              change.proposed_severity === 'critical' ? 'bg-red-100 text-red-700' :
              change.proposed_severity === 'high' ? 'bg-orange-100 text-orange-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {change.proposed_severity}
            </span>
          )}
          {getConfidenceBadge(change.confidence)}
        </div>
        <p className="text-sm text-slate-600">{change.proposed_description || change.current_description}</p>
        <p className="text-sm text-slate-500 mt-1">{change.reason}</p>
        {change.script_reference && (
          <p className="text-xs text-slate-400 mt-1 italic">"{change.script_reference}"</p>
        )}
      </div>
    </div>
  </label>
);

export default SyncReviewPanel;
