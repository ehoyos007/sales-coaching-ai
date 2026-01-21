/**
 * Script Sync Service
 * Orchestrates the sync workflow between sales scripts and coaching rubric
 */

import { claudeService } from '../ai/claude.service.js';
import { rubricService } from '../database/rubric.service.js';
import { scriptsService } from '../database/scripts.service.js';
import { buildScriptRubricComparisonPrompt } from '../../prompts/script-rubric-comparison.js';
import {
  RubricSyncLog,
  ProposedChanges,
  SyncAnalysisResponse,
  ApplySyncInput,
  PRODUCT_TYPE_LABELS,
} from '../../types/scripts.types.js';
import { RubricConfigWithRelations, CategoryInput, RedFlagInput } from '../../types/rubric.types.js';

const SYSTEM_PROMPT = 'You are an expert sales training analyst. Analyze the provided sales script and compare it to the coaching rubric. Return only valid JSON.';

/**
 * Start the sync analysis process
 */
export async function startSyncAnalysis(scriptId: string): Promise<SyncAnalysisResponse> {
  // Get the script
  const script = await scriptsService.getScriptById(scriptId);
  if (!script) {
    throw new Error('Script not found');
  }

  // Get the active rubric
  const rubric = await rubricService.getActiveConfig();
  if (!rubric) {
    throw new Error('No active rubric configuration found. Please create and activate a rubric first.');
  }

  // Create a sync log entry
  const syncLog = await scriptsService.createSyncLog(scriptId, rubric.id);

  // Update status to analyzing
  await scriptsService.updateSyncLogStatus(syncLog.id, 'analyzing');

  try {
    // Build the comparison prompt
    const productLabel = PRODUCT_TYPE_LABELS[script.product_type];
    const prompt = buildScriptRubricComparisonPrompt(script.content, rubric, productLabel);

    // Call Claude for analysis
    const proposedChanges = await claudeService.chatJSON<ProposedChanges>(
      SYSTEM_PROMPT,
      prompt,
      { maxTokens: 4096 }
    );

    // Validate the response structure
    validateProposedChanges(proposedChanges);

    // Calculate totals
    proposedChanges.total_changes =
      proposedChanges.category_changes.length +
      proposedChanges.criteria_changes.length +
      proposedChanges.red_flag_changes.length;

    proposedChanges.high_confidence_count = [
      ...proposedChanges.category_changes,
      ...proposedChanges.criteria_changes,
      ...proposedChanges.red_flag_changes,
    ].filter(c => c.confidence >= 0.8).length;

    // Update sync log with proposed changes
    await scriptsService.updateSyncLogStatus(syncLog.id, 'pending_approval', {
      changes_proposed: proposedChanges,
    });

    return {
      sync_log_id: syncLog.id,
      status: 'pending_approval',
      proposed_changes: proposedChanges,
      error_message: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis';
    console.error('[Sync] Analysis error:', error);

    // Update sync log with error
    await scriptsService.updateSyncLogStatus(syncLog.id, 'rejected', {
      error_message: errorMessage,
    });

    return {
      sync_log_id: syncLog.id,
      status: 'rejected',
      proposed_changes: null,
      error_message: errorMessage,
    };
  }
}

/**
 * Get the current status of a sync operation
 */
export async function getSyncStatus(syncLogId: string): Promise<RubricSyncLog | null> {
  return scriptsService.getSyncLogById(syncLogId);
}

/**
 * Apply approved changes to the rubric
 */
export async function applySyncChanges(
  syncLogId: string,
  approvedChanges: ApplySyncInput,
  approvedBy: string
): Promise<RubricConfigWithRelations> {
  // Get the sync log
  const syncLog = await scriptsService.getSyncLogById(syncLogId);
  if (!syncLog) {
    throw new Error('Sync log not found');
  }

  if (syncLog.status !== 'pending_approval') {
    throw new Error(`Cannot apply changes: sync status is ${syncLog.status}`);
  }

  const proposedChanges = syncLog.changes_proposed as ProposedChanges;
  if (!proposedChanges) {
    throw new Error('No proposed changes found');
  }

  // Get the current active rubric
  const currentRubric = await rubricService.getConfigById(syncLog.rubric_config_id);
  if (!currentRubric) {
    throw new Error('Associated rubric not found');
  }

  // Filter approved changes
  const approvedCategoryChanges = proposedChanges.category_changes.filter((_, i) =>
    approvedChanges.approved_category_changes.includes(String(i))
  );
  const approvedCriteriaChanges = proposedChanges.criteria_changes.filter((_, i) =>
    approvedChanges.approved_criteria_changes.includes(String(i))
  );
  const approvedRedFlagChanges = proposedChanges.red_flag_changes.filter((_, i) =>
    approvedChanges.approved_red_flag_changes.includes(String(i))
  );

  // Filter rejected changes
  const rejectedCategoryChanges = proposedChanges.category_changes.filter((_, i) =>
    !approvedChanges.approved_category_changes.includes(String(i))
  );
  const rejectedCriteriaChanges = proposedChanges.criteria_changes.filter((_, i) =>
    !approvedChanges.approved_criteria_changes.includes(String(i))
  );
  const rejectedRedFlagChanges = proposedChanges.red_flag_changes.filter((_, i) =>
    !approvedChanges.approved_red_flag_changes.includes(String(i))
  );

  // Build the new rubric configuration
  const newCategories = applyCategories(currentRubric.categories, approvedCategoryChanges, approvedCriteriaChanges);
  const newRedFlags = applyRedFlags(currentRubric.red_flags, approvedRedFlagChanges);

  // Get script for version notes
  const script = await scriptsService.getScriptById(syncLog.script_id);

  // Create a new rubric version with the changes
  const newRubric = await rubricService.createVersion({
    name: `Synced from ${script?.name || 'Script'} v${script?.version || '?'}`,
    description: `Auto-generated from script sync. Applied ${approvedCategoryChanges.length + approvedCriteriaChanges.length + approvedRedFlagChanges.length} changes.`,
    is_draft: true,
    categories: newCategories,
    red_flags: newRedFlags,
  });

  // Update sync log
  const changesApproved: ProposedChanges = {
    summary: 'Approved changes',
    analysis_notes: '',
    category_changes: approvedCategoryChanges,
    criteria_changes: approvedCriteriaChanges,
    red_flag_changes: approvedRedFlagChanges,
    total_changes: approvedCategoryChanges.length + approvedCriteriaChanges.length + approvedRedFlagChanges.length,
    high_confidence_count: 0,
  };

  const changesRejected: ProposedChanges = {
    summary: 'Rejected changes',
    analysis_notes: '',
    category_changes: rejectedCategoryChanges,
    criteria_changes: rejectedCriteriaChanges,
    red_flag_changes: rejectedRedFlagChanges,
    total_changes: rejectedCategoryChanges.length + rejectedCriteriaChanges.length + rejectedRedFlagChanges.length,
    high_confidence_count: 0,
  };

  await scriptsService.updateSyncLogStatus(syncLogId, 'applied', {
    changes_approved: changesApproved,
    changes_rejected: changesRejected,
    approved_by: approvedBy,
  });

  // Link the script to the new rubric
  await scriptsService.linkScriptToRubric(syncLog.script_id, newRubric.id);

  return newRubric;
}

/**
 * Reject sync and cancel all proposed changes
 */
export async function rejectSync(syncLogId: string, approvedBy: string): Promise<RubricSyncLog> {
  const syncLog = await scriptsService.getSyncLogById(syncLogId);
  if (!syncLog) {
    throw new Error('Sync log not found');
  }

  if (syncLog.status !== 'pending_approval') {
    throw new Error(`Cannot reject: sync status is ${syncLog.status}`);
  }

  return scriptsService.updateSyncLogStatus(syncLogId, 'rejected', {
    approved_by: approvedBy,
    changes_rejected: syncLog.changes_proposed as ProposedChanges,
  });
}

/**
 * Apply category changes to existing categories
 */
function applyCategories(
  currentCategories: RubricConfigWithRelations['categories'],
  categoryChanges: ProposedChanges['category_changes'],
  criteriaChanges: ProposedChanges['criteria_changes']
): CategoryInput[] {
  // Start with current categories
  const categoriesMap = new Map(
    currentCategories.map(cat => [
      cat.slug,
      {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || undefined,
        weight: cat.weight,
        sort_order: cat.sort_order,
        is_enabled: cat.is_enabled,
        scoring_criteria: cat.scoring_criteria?.map(sc => ({
          score: sc.score,
          criteria_text: sc.criteria_text,
        })) || [],
      },
    ])
  );

  // Apply category changes
  for (const change of categoryChanges) {
    if (change.change_type === 'add') {
      const newSlug = change.category_slug;
      categoriesMap.set(newSlug, {
        name: change.proposed_name || newSlug,
        slug: newSlug,
        description: change.proposed_description,
        weight: change.proposed_weight || 10,
        sort_order: categoriesMap.size,
        is_enabled: true,
        scoring_criteria: [],
      });
    } else if (change.change_type === 'modify') {
      const existing = categoriesMap.get(change.category_slug);
      if (existing) {
        if (change.proposed_name) existing.name = change.proposed_name;
        if (change.proposed_weight !== undefined) existing.weight = change.proposed_weight;
        if (change.proposed_description !== undefined) existing.description = change.proposed_description;
      }
    } else if (change.change_type === 'remove') {
      categoriesMap.delete(change.category_slug);
    }
  }

  // Apply criteria changes
  for (const change of criteriaChanges) {
    const category = categoriesMap.get(change.category_slug);
    if (!category) continue;

    const criteria = category.scoring_criteria || [];

    if (change.change_type === 'add') {
      const existing = criteria.find(c => c.score === change.score);
      if (!existing && change.proposed_text) {
        criteria.push({
          score: change.score,
          criteria_text: change.proposed_text,
        });
      }
    } else if (change.change_type === 'modify') {
      const existing = criteria.find(c => c.score === change.score);
      if (existing && change.proposed_text) {
        existing.criteria_text = change.proposed_text;
      }
    } else if (change.change_type === 'remove') {
      const index = criteria.findIndex(c => c.score === change.score);
      if (index >= 0) {
        criteria.splice(index, 1);
      }
    }

    category.scoring_criteria = criteria;
  }

  return Array.from(categoriesMap.values());
}

/**
 * Apply red flag changes to existing flags
 */
function applyRedFlags(
  currentFlags: RubricConfigWithRelations['red_flags'],
  flagChanges: ProposedChanges['red_flag_changes']
): RedFlagInput[] {
  // Start with current flags
  const flagsMap = new Map(
    currentFlags.map(flag => [
      flag.flag_key,
      {
        flag_key: flag.flag_key,
        display_name: flag.display_name,
        description: flag.description,
        severity: flag.severity,
        threshold_type: flag.threshold_type || undefined,
        threshold_value: flag.threshold_value || undefined,
        is_enabled: flag.is_enabled,
        sort_order: flag.sort_order,
      },
    ])
  );

  // Apply flag changes
  for (const change of flagChanges) {
    if (change.change_type === 'add') {
      flagsMap.set(change.flag_key, {
        flag_key: change.flag_key,
        display_name: change.proposed_display_name || change.flag_key,
        description: change.proposed_description || '',
        severity: (change.proposed_severity as 'critical' | 'high' | 'medium') || 'medium',
        threshold_type: undefined,
        threshold_value: undefined,
        is_enabled: true,
        sort_order: flagsMap.size,
      });
    } else if (change.change_type === 'modify') {
      const existing = flagsMap.get(change.flag_key);
      if (existing) {
        if (change.proposed_display_name) existing.display_name = change.proposed_display_name;
        if (change.proposed_description) existing.description = change.proposed_description;
        if (change.proposed_severity) existing.severity = change.proposed_severity as 'critical' | 'high' | 'medium';
      }
    } else if (change.change_type === 'remove') {
      flagsMap.delete(change.flag_key);
    }
  }

  return Array.from(flagsMap.values());
}

/**
 * Validate the proposed changes structure
 */
function validateProposedChanges(changes: ProposedChanges): void {
  if (!changes.summary || typeof changes.summary !== 'string') {
    throw new Error('Invalid response: missing summary');
  }
  if (!Array.isArray(changes.category_changes)) {
    changes.category_changes = [];
  }
  if (!Array.isArray(changes.criteria_changes)) {
    changes.criteria_changes = [];
  }
  if (!Array.isArray(changes.red_flag_changes)) {
    changes.red_flag_changes = [];
  }
}

export const scriptSyncService = {
  startSyncAnalysis,
  getSyncStatus,
  applySyncChanges,
  rejectSync,
};
