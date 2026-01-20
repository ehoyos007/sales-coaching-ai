import React, { useState } from 'react';
import type { RubricCategory, CategoryInput, WeightValidation } from '../../../types';

interface CategoryWeightsEditorProps {
  categories: RubricCategory[];
  onUpdateCategory: (index: number, updates: Partial<CategoryInput>) => void;
  onAddCategory: (category: CategoryInput) => void;
  onRemoveCategory: (index: number) => void;
  isEditable: boolean;
  weightValidation: WeightValidation | null;
}

export const CategoryWeightsEditor: React.FC<CategoryWeightsEditorProps> = ({
  categories,
  onUpdateCategory,
  onAddCategory,
  onRemoveCategory,
  isEditable,
  weightValidation,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<CategoryInput>>({
    name: '',
    slug: '',
    description: '',
    weight: 0,
  });

  const handleWeightChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdateCategory(index, { weight: Math.max(0, Math.min(100, numValue)) });
  };

  const handleSliderChange = (index: number, value: number) => {
    onUpdateCategory(index, { weight: Math.round(value * 10) / 10 });
  };

  const handleToggleEnabled = (index: number, enabled: boolean) => {
    onUpdateCategory(index, { is_enabled: enabled });
  };

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.slug) return;

    onAddCategory({
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description,
      weight: newCategory.weight || 0,
      sort_order: categories.length + 1,
      is_enabled: true,
      scoring_criteria: [
        { score: 1, criteria_text: 'Needs significant improvement' },
        { score: 2, criteria_text: 'Below standard' },
        { score: 3, criteria_text: 'Meets standard' },
        { score: 4, criteria_text: 'Above standard' },
        { score: 5, criteria_text: 'Excellent performance' },
      ],
    });

    setNewCategory({ name: '', slug: '', description: '', weight: 0 });
    setShowAddForm(false);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Category Weights</h3>
          <p className="text-sm text-slate-500 mt-1">
            Adjust the weight of each scoring category. Weights must sum to 100%.
          </p>
        </div>
        {isEditable && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        )}
      </div>

      {/* Weight Summary */}
      {weightValidation && (
        <div className={`mb-6 p-4 rounded-lg ${weightValidation.isValid ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${weightValidation.isValid ? 'text-green-700' : 'text-amber-700'}`}>
              Total Weight: {weightValidation.total}%
            </span>
            {!weightValidation.isValid && (
              <span className="text-sm text-amber-600">
                {weightValidation.message}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className={`border rounded-lg p-4 transition-opacity ${
              category.is_enabled ? 'border-slate-200' : 'border-slate-100 opacity-50'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Enable/Disable Toggle */}
              {isEditable && (
                <button
                  onClick={() => handleToggleEnabled(index, !category.is_enabled)}
                  className={`mt-1 p-1 rounded transition-colors ${
                    category.is_enabled ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title={category.is_enabled ? 'Disable category' : 'Enable category'}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    {category.is_enabled ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>
              )}

              {/* Category Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900">{category.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">({category.slug})</span>
                </div>
                {category.description && (
                  <p className="text-sm text-slate-500 mb-3">{category.description}</p>
                )}

                {/* Weight Slider */}
                {isEditable && category.is_enabled ? (
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={category.weight}
                      onChange={e => handleSliderChange(index, parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={category.weight}
                        onChange={e => handleWeightChange(index, e.target.value)}
                        className="w-16 px-2 py-1 text-sm text-center border border-slate-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="text-sm text-slate-500">%</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-lg"
                        style={{ width: `${category.weight}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-12 text-right">
                      {category.weight}%
                    </span>
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {isEditable && (
                <button
                  onClick={() => onRemoveCategory(index)}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove category"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="mt-6 border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
          <h4 className="font-medium text-slate-900 mb-4">Add New Category</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={newCategory.name || ''}
                onChange={e => setNewCategory({
                  ...newCategory,
                  name: e.target.value,
                  slug: generateSlug(e.target.value),
                })}
                placeholder="e.g., Follow-up Quality"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={newCategory.slug || ''}
                onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })}
                placeholder="e.g., follow_up_quality"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={newCategory.description || ''}
              onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Describe what this category evaluates..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Weight (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newCategory.weight || 0}
              onChange={e => setNewCategory({ ...newCategory, weight: parseFloat(e.target.value) || 0 })}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCategory({ name: '', slug: '', description: '', weight: 0 });
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.name || !newCategory.slug}
              className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Add Category
            </button>
          </div>
        </div>
      )}

      {!isEditable && (
        <p className="mt-6 text-sm text-slate-500 text-center italic">
          Create a new version to edit category weights
        </p>
      )}
    </div>
  );
};

export default CategoryWeightsEditor;
