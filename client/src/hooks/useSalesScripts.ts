import { useState, useCallback, useEffect } from 'react';
import {
  getScripts,
  getScriptById,
  uploadScript,
  deleteScript as deleteScriptApi,
  activateScript as activateScriptApi,
  startScriptSync,
  getSyncStatus,
  applySyncChanges,
  rejectSync,
} from '../services/api';
import type {
  ScriptsByProductType,
  ScriptWithSyncStatus,
  ProductType,
  RubricSyncLog,
  ApplySyncInput,
  RubricConfigWithRelations,
} from '../types';

interface UseSalesScriptsReturn {
  // Data
  scripts: ScriptsByProductType | null;
  selectedScript: ScriptWithSyncStatus | null;
  currentSync: RubricSyncLog | null;

  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  isSyncing: boolean;
  isApplying: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchScripts: () => Promise<void>;
  selectScript: (id: string) => Promise<void>;
  clearSelectedScript: () => void;
  upload: (file: File, name: string, productType: ProductType, versionNotes?: string) => Promise<ScriptWithSyncStatus | null>;
  deleteScript: (id: string) => Promise<boolean>;
  activateScript: (id: string) => Promise<boolean>;
  startSync: (scriptId: string) => Promise<RubricSyncLog | null>;
  checkSyncStatus: (syncLogId: string) => Promise<RubricSyncLog | null>;
  applyChanges: (syncLogId: string, approvedChanges: ApplySyncInput) => Promise<RubricConfigWithRelations | null>;
  rejectChanges: (syncLogId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useSalesScripts(): UseSalesScriptsReturn {
  // Data state
  const [scripts, setScripts] = useState<ScriptsByProductType | null>(null);
  const [selectedScript, setSelectedScript] = useState<ScriptWithSyncStatus | null>(null);
  const [currentSync, setCurrentSync] = useState<RubricSyncLog | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch all scripts
  const fetchScripts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getScripts();
      if (response.success && response.data) {
        setScripts(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch scripts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scripts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a specific script
  const selectScript = useCallback(async (id: string) => {
    setError(null);

    try {
      const response = await getScriptById(id);
      if (response.success && response.data) {
        setSelectedScript(response.data);
        if (response.data.latest_sync) {
          setCurrentSync(response.data.latest_sync);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch script');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch script');
    }
  }, []);

  // Clear selected script
  const clearSelectedScript = useCallback(() => {
    setSelectedScript(null);
    setCurrentSync(null);
  }, []);

  // Upload a new script
  const upload = useCallback(async (
    file: File,
    name: string,
    productType: ProductType,
    versionNotes?: string
  ): Promise<ScriptWithSyncStatus | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadScript(file, name, productType, versionNotes);
      if (response.success && response.data) {
        // Refresh scripts list
        await fetchScripts();
        return response.data as unknown as ScriptWithSyncStatus;
      } else {
        throw new Error(response.error || 'Failed to upload script');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload script';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [fetchScripts]);

  // Delete a script
  const deleteScriptFn = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await deleteScriptApi(id);
      if (response.success) {
        // Refresh scripts list
        await fetchScripts();
        // Clear selection if deleted script was selected
        if (selectedScript?.id === id) {
          clearSelectedScript();
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete script');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete script');
      return false;
    }
  }, [fetchScripts, selectedScript, clearSelectedScript]);

  // Activate a script
  const activateScriptFn = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await activateScriptApi(id);
      if (response.success) {
        // Refresh scripts list
        await fetchScripts();
        // Update selected script if it was activated
        if (selectedScript?.id === id && response.data) {
          setSelectedScript({
            ...response.data,
            latest_sync: selectedScript.latest_sync,
            rubric_aligned: selectedScript.rubric_aligned,
          });
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to activate script');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate script');
      return false;
    }
  }, [fetchScripts, selectedScript]);

  // Start sync analysis
  const startSyncFn = useCallback(async (scriptId: string): Promise<RubricSyncLog | null> => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await startScriptSync(scriptId);
      if (response.success && response.data) {
        // Poll for status if analyzing
        if (response.data.status === 'analyzing') {
          // Start polling
          const syncLogId = response.data.sync_log_id;
          const poll = async (): Promise<RubricSyncLog | null> => {
            const statusResponse = await getSyncStatus(syncLogId);
            if (statusResponse.success && statusResponse.data) {
              setCurrentSync(statusResponse.data);
              if (statusResponse.data.status === 'analyzing') {
                // Continue polling
                await new Promise(resolve => setTimeout(resolve, 2000));
                return poll();
              }
              return statusResponse.data;
            }
            return null;
          };
          const finalSync = await poll();
          return finalSync;
        }

        // Already completed
        const syncLog: RubricSyncLog = {
          id: response.data.sync_log_id,
          script_id: scriptId,
          rubric_config_id: '',
          status: response.data.status,
          changes_proposed: response.data.proposed_changes,
          changes_approved: null,
          changes_rejected: null,
          error_message: response.data.error_message,
          approved_by: null,
          approved_at: null,
          applied_at: null,
          created_at: new Date().toISOString(),
        };
        setCurrentSync(syncLog);
        return syncLog;
      } else {
        throw new Error(response.error || 'Failed to start sync');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sync');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Check sync status
  const checkSyncStatusFn = useCallback(async (syncLogId: string): Promise<RubricSyncLog | null> => {
    try {
      const response = await getSyncStatus(syncLogId);
      if (response.success && response.data) {
        setCurrentSync(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get sync status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get sync status');
      return null;
    }
  }, []);

  // Apply approved changes
  const applyChangesFn = useCallback(async (
    syncLogId: string,
    approvedChanges: ApplySyncInput
  ): Promise<RubricConfigWithRelations | null> => {
    setIsApplying(true);
    setError(null);

    try {
      const response = await applySyncChanges(syncLogId, approvedChanges);
      if (response.success && response.data) {
        // Refresh scripts to update sync status
        await fetchScripts();
        // Update current sync
        const statusResponse = await getSyncStatus(syncLogId);
        if (statusResponse.success && statusResponse.data) {
          setCurrentSync(statusResponse.data);
        }
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to apply changes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
      return null;
    } finally {
      setIsApplying(false);
    }
  }, [fetchScripts]);

  // Reject sync changes
  const rejectChangesFn = useCallback(async (syncLogId: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await rejectSync(syncLogId);
      if (response.success && response.data) {
        setCurrentSync(response.data);
        // Refresh scripts
        await fetchScripts();
        return true;
      } else {
        throw new Error(response.error || 'Failed to reject sync');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject sync');
      return false;
    }
  }, [fetchScripts]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  return {
    scripts,
    selectedScript,
    currentSync,
    isLoading,
    isUploading,
    isSyncing,
    isApplying,
    error,
    fetchScripts,
    selectScript,
    clearSelectedScript,
    upload,
    deleteScript: deleteScriptFn,
    activateScript: activateScriptFn,
    startSync: startSyncFn,
    checkSyncStatus: checkSyncStatusFn,
    applyChanges: applyChangesFn,
    rejectChanges: rejectChangesFn,
    clearError,
  };
}

export default useSalesScripts;
