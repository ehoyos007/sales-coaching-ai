import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRubricConfig } from '../../hooks';
import { CategoryWeightsEditor } from './components/CategoryWeightsEditor';
import { ScoringCriteriaEditor } from './components/ScoringCriteriaEditor';
import { RedFlagsEditor } from './components/RedFlagsEditor';
import { VersionHistory } from './components/VersionHistory';
import { WeightDistributionBar } from './components/WeightDistributionBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

type TabId = 'categories' | 'criteria' | 'flags' | 'history';

export const RubricSettings: React.FC = () => {
  const {
    activeConfig,
    draftConfig,
    versions,
    isLoading,
    isSaving,
    isActivating,
    error,
    weightValidation,
    localDraft,
    hasUnsavedChanges,
    createDraft,
    saveDraft,
    activateDraft,
    deleteDraft,
    restoreVersion,
    updateLocalCategory,
    updateLocalRedFlag,
    addLocalCategory,
    removeLocalCategory,
    addLocalRedFlag,
    removeLocalRedFlag,
  } = useRubricConfig();

  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');

  const handleCreateDraft = async () => {
    if (!newDraftName.trim()) return;
    await createDraft(newDraftName, activeConfig?.id);
    setShowCreateModal(false);
    setNewDraftName('');
  };

  const handleSave = async () => {
    if (!weightValidation?.isValid) {
      return;
    }
    await saveDraft();
  };

  const handleActivate = async () => {
    if (!draftConfig) return;
    if (!weightValidation?.isValid) {
      return;
    }
    await activateDraft();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  const config = localDraft || activeConfig;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back to Chat</span>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-semibold text-slate-900">Rubric Configuration</h1>
            </div>

            <div className="flex items-center gap-3">
              {draftConfig ? (
                <>
                  <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Editing Draft v{draftConfig.version}
                  </span>
                  <button
                    onClick={deleteDraft}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Discard Draft
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges || !weightValidation?.isValid}
                    className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={handleActivate}
                    disabled={isActivating || !weightValidation?.isValid}
                    className="px-4 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isActivating ? 'Activating...' : 'Activate'}
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                    Active v{activeConfig?.version || 1}
                  </span>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    Create New Version
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Weight Validation Warning */}
      {weightValidation && !weightValidation.isValid && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{weightValidation.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Config Summary */}
        {config && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{config.name}</h2>
                {config.description && (
                  <p className="text-slate-500 mt-1">{config.description}</p>
                )}
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>Version {config.version}</p>
                <p>Last updated: {new Date(config.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Weight Distribution Bar */}
            <WeightDistributionBar categories={config.categories || []} />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-8">
            {([
              { id: 'categories', label: 'Category Weights' },
              { id: 'criteria', label: 'Scoring Criteria' },
              { id: 'flags', label: 'Red Flags' },
              { id: 'history', label: 'Version History' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {config && (
          <div className="bg-white rounded-xl border border-slate-200">
            {activeTab === 'categories' && (
              <CategoryWeightsEditor
                categories={config.categories || []}
                onUpdateCategory={updateLocalCategory}
                onAddCategory={addLocalCategory}
                onRemoveCategory={removeLocalCategory}
                isEditable={!!draftConfig}
                weightValidation={weightValidation}
              />
            )}
            {activeTab === 'criteria' && (
              <ScoringCriteriaEditor
                categories={config.categories || []}
                onUpdateCategory={updateLocalCategory}
                isEditable={!!draftConfig}
              />
            )}
            {activeTab === 'flags' && (
              <RedFlagsEditor
                redFlags={config.red_flags || []}
                onUpdateRedFlag={updateLocalRedFlag}
                onAddRedFlag={addLocalRedFlag}
                onRemoveRedFlag={removeLocalRedFlag}
                isEditable={!!draftConfig}
              />
            )}
            {activeTab === 'history' && (
              <VersionHistory
                versions={versions}
                activeVersionId={activeConfig?.id}
                onRestoreVersion={restoreVersion}
              />
            )}
          </div>
        )}
      </main>

      {/* Create Draft Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Version</h3>
            <p className="text-sm text-slate-500 mb-4">
              Create a new draft version based on the current active rubric. You can make changes and activate it when ready.
            </p>
            <input
              type="text"
              value={newDraftName}
              onChange={e => setNewDraftName(e.target.value)}
              placeholder="Version name (e.g., Q1 2026 Updates)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewDraftName('');
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDraft}
                disabled={!newDraftName.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricSettings;
