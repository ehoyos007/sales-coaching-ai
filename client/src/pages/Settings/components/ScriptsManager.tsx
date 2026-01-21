import React, { useState } from 'react';
import { useSalesScripts } from '../../../hooks/useSalesScripts';
import { ScriptUploadWizard } from './ScriptUploadWizard';
import { SyncReviewPanel } from './SyncReviewPanel';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import type { ScriptWithSyncStatus, ProductType } from '../../../types';
import { PRODUCT_TYPE_LABELS } from '../../../types';

interface ScriptsManagerProps {
  onRubricUpdated?: () => void;
}

export const ScriptsManager: React.FC<ScriptsManagerProps> = ({ onRubricUpdated }) => {
  const {
    scripts,
    selectedScript,
    currentSync,
    isLoading,
    isUploading,
    isSyncing,
    isApplying,
    error,
    selectScript,
    upload,
    deleteScript,
    activateScript,
    startSync,
    applyChanges,
    rejectChanges,
    clearError,
  } = useSalesScripts();

  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleUploadComplete = () => {
    setShowUploadWizard(false);
  };

  const handleStartSync = async (scriptId: string) => {
    const syncResult = await startSync(scriptId);
    if (syncResult && syncResult.status === 'pending_approval') {
      setShowSyncPanel(true);
    }
  };

  const handleApplyChanges = async (approvedChanges: {
    approved_category_changes: string[];
    approved_criteria_changes: string[];
    approved_red_flag_changes: string[];
  }) => {
    if (!currentSync) return;
    const result = await applyChanges(currentSync.id, approvedChanges);
    if (result) {
      setShowSyncPanel(false);
      onRubricUpdated?.();
    }
  };

  const handleRejectSync = async () => {
    if (!currentSync) return;
    const success = await rejectChanges(currentSync.id);
    if (success) {
      setShowSyncPanel(false);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteScript(id);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  const productTypes: ProductType[] = ['aca', 'limited_medical', 'life_insurance'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Sales Scripts</h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload and manage sales scripts. Sync scripts with the coaching rubric to keep evaluation criteria aligned.
          </p>
        </div>
        <button
          onClick={() => setShowUploadWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Script
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-700 hover:text-red-900">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Scripts by Product Type */}
      <div className="space-y-6">
        {productTypes.map(productType => (
          <div key={productType} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="font-medium text-slate-900">{PRODUCT_TYPE_LABELS[productType]}</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {scripts && scripts[productType].length > 0 ? (
                scripts[productType].map(script => (
                  <ScriptRow
                    key={script.id}
                    script={script}
                    onSelect={() => selectScript(script.id)}
                    onSync={() => handleStartSync(script.id)}
                    onActivate={() => activateScript(script.id)}
                    onDelete={() => setDeleteConfirm(script.id)}
                    isSyncing={isSyncing && selectedScript?.id === script.id}
                  />
                ))
              ) : (
                <div className="px-4 py-8 text-center text-slate-500">
                  <svg className="h-12 w-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">No scripts uploaded</p>
                  <button
                    onClick={() => setShowUploadWizard(true)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Upload a script
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Wizard Modal */}
      {showUploadWizard && (
        <ScriptUploadWizard
          onClose={() => setShowUploadWizard(false)}
          onUpload={upload}
          isUploading={isUploading}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Sync Review Panel */}
      {showSyncPanel && currentSync && currentSync.changes_proposed && (
        <SyncReviewPanel
          syncLog={currentSync}
          proposedChanges={currentSync.changes_proposed}
          onApply={handleApplyChanges}
          onReject={handleRejectSync}
          onClose={() => setShowSyncPanel(false)}
          isApplying={isApplying}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Script</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to delete this script? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Script Row Component
interface ScriptRowProps {
  script: ScriptWithSyncStatus;
  onSelect: () => void;
  onSync: () => void;
  onActivate: () => void;
  onDelete: () => void;
  isSyncing: boolean;
}

const ScriptRow: React.FC<ScriptRowProps> = ({
  script,
  onSelect,
  onSync,
  onActivate,
  onDelete,
  isSyncing,
}) => {
  const getSyncStatusBadge = () => {
    if (script.rubric_aligned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Rubric Aligned
        </span>
      );
    }
    if (script.latest_sync?.status === 'pending_approval') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          Pending Review
        </span>
      );
    }
    if (script.latest_sync?.status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
          Sync Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
        Not Synced
      </span>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0">
            {script.is_active ? (
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 truncate">{script.name}</span>
              <span className="text-xs text-slate-500">v{script.version}</span>
              {script.is_active && (
                <span className="text-xs text-green-600 font-medium">(Active)</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              {script.file_name && <span>{script.file_name}</span>}
              {script.file_size_bytes && <span>{formatFileSize(script.file_size_bytes)}</span>}
              <span>{new Date(script.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {getSyncStatusBadge()}

          <div className="flex items-center gap-1">
            <button
              onClick={onSelect}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="View Details"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {!script.rubric_aligned && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                title="Sync with Rubric"
              >
                {isSyncing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            )}

            {!script.is_active && (
              <>
                <button
                  onClick={onActivate}
                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Set as Active"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {script.version_notes && (
        <p className="text-xs text-slate-500 mt-2 pl-12">{script.version_notes}</p>
      )}
    </div>
  );
};

export default ScriptsManager;
