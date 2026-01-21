import React, { useState } from 'react';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import type { RubricVersionSummary } from '../../../types';

interface VersionHistoryProps {
  versions: RubricVersionSummary[];
  activeVersionId: string | undefined;
  onRestoreVersion: (id: string) => Promise<void>;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  activeVersionId,
  onRestoreVersion,
}) => {
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    if (restoringId) return;
    setRestoringId(id);
    try {
      await onRestoreVersion(id);
    } finally {
      setRestoringId(null);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Version History</h3>
        <p className="text-sm text-slate-500 mt-1">
          View all rubric versions and restore previous configurations.
        </p>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <svg className="h-12 w-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No version history available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => {
            const isActive = version.id === activeVersionId;
            const isLatest = index === 0;

            return (
              <div
                key={version.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isActive
                    ? 'border-green-200 bg-green-50'
                    : version.is_draft
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Version Number */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                      isActive
                        ? 'bg-green-200 text-green-800'
                        : version.is_draft
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      v{version.version}
                    </div>

                    {/* Version Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900">{version.name}</h4>
                        {isActive && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                        {version.is_draft && (
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                            Draft
                          </span>
                        )}
                        {isLatest && !version.is_draft && !isActive && (
                          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        Created: {formatDate(version.created_at)}
                        {version.updated_at !== version.created_at && (
                          <> · Updated: {formatDate(version.updated_at)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isActive && !version.is_draft && (
                      <button
                        onClick={() => handleRestore(version.id)}
                        disabled={restoringId !== null}
                        className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-busy={restoringId === version.id}
                      >
                        {restoringId === version.id ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-slate-50 rounded-lg">
        <h4 className="text-sm font-medium text-slate-700 mb-2">About Versioning</h4>
        <ul className="text-sm text-slate-500 space-y-1">
          <li>• Each time you save changes, a new version is created</li>
          <li>• Only one version can be active at a time</li>
          <li>• Restoring a version creates a new draft based on that version</li>
          <li>• Draft versions can be edited before activation</li>
        </ul>
      </div>
    </div>
  );
};

export default VersionHistory;
