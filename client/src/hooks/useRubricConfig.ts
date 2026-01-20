import { useState, useEffect, useCallback } from 'react';
import {
  getActiveRubric,
  getRubricVersions,
  getRubricById,
  createRubric,
  updateRubric,
  activateRubric,
  deleteRubric,
} from '../services/api';
import {
  validateCategoryWeights,
  type RubricConfigWithRelations,
  type RubricVersionSummary,
  type CategoryInput,
  type RedFlagInput,
  type WeightValidation,
} from '../types';

interface UseRubricConfigReturn {
  // Active config (read-only)
  activeConfig: RubricConfigWithRelations | null;

  // Draft config (editable)
  draftConfig: RubricConfigWithRelations | null;

  // Version history
  versions: RubricVersionSummary[];

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isActivating: boolean;

  // Error state
  error: string | null;

  // Weight validation
  weightValidation: WeightValidation | null;

  // Actions
  fetchActiveConfig: () => Promise<void>;
  fetchVersions: () => Promise<void>;
  fetchConfigById: (id: string) => Promise<RubricConfigWithRelations | null>;
  createDraft: (name: string, cloneFromId?: string) => Promise<RubricConfigWithRelations | null>;
  updateDraft: (categories?: CategoryInput[], redFlags?: RedFlagInput[], name?: string, description?: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  activateDraft: () => Promise<void>;
  restoreVersion: (id: string) => Promise<void>;
  deleteDraft: () => Promise<void>;

  // Local draft editing (without saving to server)
  localDraft: RubricConfigWithRelations | null;
  setLocalDraft: (config: RubricConfigWithRelations | null) => void;
  updateLocalCategory: (index: number, updates: Partial<CategoryInput>) => void;
  updateLocalRedFlag: (index: number, updates: Partial<RedFlagInput>) => void;
  addLocalCategory: (category: CategoryInput) => void;
  removeLocalCategory: (index: number) => void;
  addLocalRedFlag: (flag: RedFlagInput) => void;
  removeLocalRedFlag: (index: number) => void;
  hasUnsavedChanges: boolean;
}

export function useRubricConfig(): UseRubricConfigReturn {
  // State
  const [activeConfig, setActiveConfig] = useState<RubricConfigWithRelations | null>(null);
  const [draftConfig, setDraftConfig] = useState<RubricConfigWithRelations | null>(null);
  const [localDraft, setLocalDraft] = useState<RubricConfigWithRelations | null>(null);
  const [versions, setVersions] = useState<RubricVersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Compute weight validation from local draft
  const weightValidation: WeightValidation | null = localDraft
    ? validateCategoryWeights(localDraft.categories)
    : null;

  // Fetch active config
  const fetchActiveConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getActiveRubric();
      if (response.success && response.data) {
        setActiveConfig(response.data);
        // Initialize local draft with active config if no draft exists
        if (!localDraft) {
          setLocalDraft(response.data);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch active rubric');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active rubric');
    } finally {
      setIsLoading(false);
    }
  }, [localDraft]);

  // Fetch all versions
  const fetchVersions = useCallback(async () => {
    try {
      const response = await getRubricVersions();
      if (response.success && response.data) {
        setVersions(response.data.versions);
      } else {
        throw new Error(response.error || 'Failed to fetch rubric versions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch versions');
    }
  }, []);

  // Fetch specific config by ID
  const fetchConfigById = useCallback(async (id: string): Promise<RubricConfigWithRelations | null> => {
    try {
      const response = await getRubricById(id);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch rubric');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rubric');
      return null;
    }
  }, []);

  // Create a new draft version
  const createDraftFn = useCallback(async (name: string, cloneFromId?: string): Promise<RubricConfigWithRelations | null> => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await createRubric({
        name,
        clone_from_id: cloneFromId,
        is_draft: true,
      });

      if (response.success && response.data) {
        setDraftConfig(response.data);
        setLocalDraft(response.data);
        setHasUnsavedChanges(false);
        await fetchVersions();
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create draft');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [fetchVersions]);

  // Update draft on server
  const updateDraftFn = useCallback(async (
    categories?: CategoryInput[],
    redFlags?: RedFlagInput[],
    name?: string,
    description?: string
  ) => {
    if (!draftConfig) {
      setError('No draft config to update');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await updateRubric(draftConfig.id, {
        categories,
        red_flags: redFlags,
        name,
        description,
      });

      if (response.success && response.data) {
        setDraftConfig(response.data);
        setLocalDraft(response.data);
        setHasUnsavedChanges(false);
      } else {
        throw new Error(response.error || 'Failed to update draft');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update draft');
    } finally {
      setIsSaving(false);
    }
  }, [draftConfig]);

  // Save local draft to server
  const saveDraft = useCallback(async () => {
    if (!localDraft || !draftConfig) {
      setError('No draft to save');
      return;
    }

    const categories: CategoryInput[] = localDraft.categories.map(c => ({
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
      weight: c.weight,
      sort_order: c.sort_order,
      is_enabled: c.is_enabled,
      scoring_criteria: c.scoring_criteria?.map(sc => ({
        score: sc.score,
        criteria_text: sc.criteria_text,
      })),
    }));

    const redFlags: RedFlagInput[] = localDraft.red_flags.map(rf => ({
      flag_key: rf.flag_key,
      display_name: rf.display_name,
      description: rf.description,
      severity: rf.severity,
      threshold_type: rf.threshold_type || undefined,
      threshold_value: rf.threshold_value || undefined,
      is_enabled: rf.is_enabled,
      sort_order: rf.sort_order,
    }));

    await updateDraftFn(categories, redFlags, localDraft.name, localDraft.description || undefined);
  }, [localDraft, draftConfig, updateDraftFn]);

  // Activate a draft
  const activateDraftFn = useCallback(async () => {
    if (!draftConfig) {
      setError('No draft to activate');
      return;
    }

    setIsActivating(true);
    setError(null);

    try {
      const response = await activateRubric(draftConfig.id);
      if (response.success && response.data) {
        setActiveConfig(response.data);
        setDraftConfig(null);
        setLocalDraft(response.data);
        setHasUnsavedChanges(false);
        await fetchVersions();
      } else {
        throw new Error(response.error || 'Failed to activate rubric');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate rubric');
    } finally {
      setIsActivating(false);
    }
  }, [draftConfig, fetchVersions]);

  // Restore a version by creating a new draft from it
  const restoreVersion = useCallback(async (id: string) => {
    const config = await fetchConfigById(id);
    if (config) {
      await createDraftFn(`${config.name} (Restored)`, id);
    }
  }, [fetchConfigById, createDraftFn]);

  // Delete draft
  const deleteDraftFn = useCallback(async () => {
    if (!draftConfig) {
      setError('No draft to delete');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await deleteRubric(draftConfig.id);
      if (response.success) {
        setDraftConfig(null);
        setLocalDraft(activeConfig);
        setHasUnsavedChanges(false);
        await fetchVersions();
      } else {
        throw new Error(response.error || 'Failed to delete draft');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
    } finally {
      setIsSaving(false);
    }
  }, [draftConfig, activeConfig, fetchVersions]);

  // Local editing functions
  const updateLocalCategory = useCallback((index: number, updates: Partial<CategoryInput>) => {
    if (!localDraft) return;

    setLocalDraft(prev => {
      if (!prev) return prev;
      const categories = [...prev.categories];
      categories[index] = { ...categories[index], ...updates } as typeof categories[0];
      return { ...prev, categories };
    });
    setHasUnsavedChanges(true);
  }, [localDraft]);

  const updateLocalRedFlag = useCallback((index: number, updates: Partial<RedFlagInput>) => {
    if (!localDraft) return;

    setLocalDraft(prev => {
      if (!prev) return prev;
      const red_flags = [...prev.red_flags];
      red_flags[index] = { ...red_flags[index], ...updates } as typeof red_flags[0];
      return { ...prev, red_flags };
    });
    setHasUnsavedChanges(true);
  }, [localDraft]);

  const addLocalCategory = useCallback((category: CategoryInput) => {
    if (!localDraft) return;

    setLocalDraft(prev => {
      if (!prev) return prev;
      const newCategory = {
        ...category,
        id: `temp-${Date.now()}`,
        rubric_config_id: prev.id,
        created_at: new Date().toISOString(),
        scoring_criteria: category.scoring_criteria?.map((sc, i) => ({
          ...sc,
          id: `temp-sc-${Date.now()}-${i}`,
          category_id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
        })) || [],
      };
      return { ...prev, categories: [...prev.categories, newCategory as typeof prev.categories[0]] };
    });
    setHasUnsavedChanges(true);
  }, [localDraft]);

  const removeLocalCategory = useCallback((index: number) => {
    if (!localDraft) return;

    setLocalDraft(prev => {
      if (!prev) return prev;
      const categories = prev.categories.filter((_, i) => i !== index);
      // Update sort order
      categories.forEach((c, i) => {
        c.sort_order = i + 1;
      });
      return { ...prev, categories };
    });
    setHasUnsavedChanges(true);
  }, [localDraft]);

  const addLocalRedFlag = useCallback((flag: RedFlagInput) => {
    if (!localDraft) return;

    setLocalDraft(prev => {
      if (!prev) return prev;
      const newFlag = {
        ...flag,
        id: `temp-${Date.now()}`,
        rubric_config_id: prev.id,
        created_at: new Date().toISOString(),
        sort_order: flag.sort_order ?? prev.red_flags.length,
      };
      return { ...prev, red_flags: [...prev.red_flags, newFlag as typeof prev.red_flags[0]] };
    });
    setHasUnsavedChanges(true);
  }, [localDraft]);

  const removeLocalRedFlag = useCallback((index: number) => {
    if (!localDraft) return;

    setLocalDraft(prev => {
      if (!prev) return prev;
      const red_flags = prev.red_flags.filter((_, i) => i !== index);
      // Update sort order
      red_flags.forEach((rf, i) => {
        rf.sort_order = i;
      });
      return { ...prev, red_flags };
    });
    setHasUnsavedChanges(true);
  }, [localDraft]);

  // Initial fetch
  useEffect(() => {
    fetchActiveConfig();
    fetchVersions();
  }, []);

  return {
    activeConfig,
    draftConfig,
    versions,
    isLoading,
    isSaving,
    isActivating,
    error,
    weightValidation,
    fetchActiveConfig,
    fetchVersions,
    fetchConfigById,
    createDraft: createDraftFn,
    updateDraft: updateDraftFn,
    saveDraft,
    activateDraft: activateDraftFn,
    restoreVersion,
    deleteDraft: deleteDraftFn,
    localDraft,
    setLocalDraft,
    updateLocalCategory,
    updateLocalRedFlag,
    addLocalCategory,
    removeLocalCategory,
    addLocalRedFlag,
    removeLocalRedFlag,
    hasUnsavedChanges,
  };
}

export default useRubricConfig;
