/**
 * Scripts Database Service
 * CRUD operations for sales scripts and sync logs
 */

import { getSupabaseClient } from '../../config/database.js';
import {
  SalesScript,
  ScriptVersionSummary,
  ScriptWithSyncStatus,
  ScriptsByProductType,
  CreateScriptInput,
  UpdateScriptInput,
  RubricSyncLog,
  ProposedChanges,
  SyncStatus,
  ProductType,
} from '../../types/scripts.types.js';

/**
 * Get all scripts grouped by product type
 */
export async function getAllScripts(): Promise<ScriptsByProductType> {
  const supabase = getSupabaseClient();

  // Get all scripts with their latest sync status
  const { data: scripts, error: scriptsError } = await supabase
    .from('sales_scripts')
    .select('*')
    .order('product_type')
    .order('version', { ascending: false });

  if (scriptsError) {
    throw new Error(`Failed to get scripts: ${scriptsError.message}`);
  }

  // Get all sync logs for these scripts
  const scriptIds = scripts?.map(s => s.id) || [];
  let syncLogs: RubricSyncLog[] = [];

  if (scriptIds.length > 0) {
    const { data: logs, error: logsError } = await supabase
      .from('rubric_sync_log')
      .select('*')
      .in('script_id', scriptIds)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('[Scripts] Failed to get sync logs:', logsError);
    } else {
      syncLogs = logs || [];
    }
  }

  // Group by product type and attach sync status
  const result: ScriptsByProductType = {
    aca: [],
    limited_medical: [],
    life_insurance: [],
  };

  for (const script of scripts || []) {
    const latestSync = syncLogs.find(l => l.script_id === script.id);
    const scriptWithSync: ScriptWithSyncStatus = {
      ...script,
      latest_sync: latestSync,
      rubric_aligned: latestSync?.status === 'applied',
    };

    result[script.product_type as ProductType].push(scriptWithSync);
  }

  return result;
}

/**
 * Get a specific script by ID
 */
export async function getScriptById(id: string): Promise<ScriptWithSyncStatus | null> {
  const supabase = getSupabaseClient();

  const { data: script, error: scriptError } = await supabase
    .from('sales_scripts')
    .select('*')
    .eq('id', id)
    .single();

  if (scriptError) {
    if (scriptError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get script: ${scriptError.message}`);
  }

  // Get latest sync status
  const { data: syncLogs } = await supabase
    .from('rubric_sync_log')
    .select('*')
    .eq('script_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  const latestSync = syncLogs?.[0] || null;

  return {
    ...script,
    latest_sync: latestSync,
    rubric_aligned: latestSync?.status === 'applied',
  };
}

/**
 * Get version history for a product type
 */
export async function getVersionHistory(productType: ProductType): Promise<ScriptVersionSummary[]> {
  const supabase = getSupabaseClient();

  const { data: scripts, error } = await supabase
    .from('sales_scripts')
    .select('id, name, product_type, version, is_active, file_name, file_size_bytes, created_at, version_notes')
    .eq('product_type', productType)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to get version history: ${error.message}`);
  }

  // Get sync statuses for all versions
  const scriptIds = scripts?.map(s => s.id) || [];
  let syncLogs: Array<{ script_id: string; status: SyncStatus }> = [];

  if (scriptIds.length > 0) {
    const { data: logs } = await supabase
      .from('rubric_sync_log')
      .select('script_id, status')
      .in('script_id', scriptIds)
      .order('created_at', { ascending: false });

    syncLogs = logs || [];
  }

  return (scripts || []).map(script => ({
    ...script,
    sync_status: syncLogs.find(l => l.script_id === script.id)?.status || null,
  }));
}

/**
 * Create a new script
 */
export async function createScript(
  input: CreateScriptInput,
  uploadedBy?: string
): Promise<SalesScript> {
  const supabase = getSupabaseClient();

  // Get the max version for this product type
  const { data: maxVersion } = await supabase
    .from('sales_scripts')
    .select('version')
    .eq('product_type', input.product_type)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = (maxVersion?.version || 0) + 1;

  const { data: script, error } = await supabase
    .from('sales_scripts')
    .insert({
      name: input.name,
      product_type: input.product_type,
      version: newVersion,
      content: input.content,
      file_url: input.file_url,
      file_name: input.file_name,
      file_size_bytes: input.file_size_bytes,
      file_type: input.file_type,
      version_notes: input.version_notes,
      is_active: false, // New scripts start inactive
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create script: ${error.message}`);
  }

  return script;
}

/**
 * Update script metadata
 */
export async function updateScript(
  id: string,
  input: UpdateScriptInput
): Promise<SalesScript> {
  const supabase = getSupabaseClient();

  const updates: Partial<SalesScript> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.version_notes !== undefined) updates.version_notes = input.version_notes;

  const { data: script, error } = await supabase
    .from('sales_scripts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update script: ${error.message}`);
  }

  return script;
}

/**
 * Delete a script
 */
export async function deleteScript(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Check if it's the active script
  const existing = await getScriptById(id);
  if (!existing) {
    throw new Error('Script not found');
  }
  if (existing.is_active) {
    throw new Error('Cannot delete the active script. Activate another version first.');
  }

  const { error } = await supabase
    .from('sales_scripts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete script: ${error.message}`);
  }
}

/**
 * Activate a script (deactivates other scripts for the same product type)
 */
export async function activateScript(id: string): Promise<SalesScript> {
  const supabase = getSupabaseClient();

  // Get the script to activate
  const script = await getScriptById(id);
  if (!script) {
    throw new Error('Script not found');
  }

  // Deactivate other scripts for this product type
  const { error: deactivateError } = await supabase
    .from('sales_scripts')
    .update({ is_active: false })
    .eq('product_type', script.product_type)
    .eq('is_active', true);

  if (deactivateError) {
    throw new Error(`Failed to deactivate current script: ${deactivateError.message}`);
  }

  // Activate the new script
  const { data: activated, error: activateError } = await supabase
    .from('sales_scripts')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (activateError) {
    throw new Error(`Failed to activate script: ${activateError.message}`);
  }

  return activated;
}

// ============================================================================
// Sync Log Operations
// ============================================================================

/**
 * Create a new sync log entry
 */
export async function createSyncLog(
  scriptId: string,
  rubricConfigId: string
): Promise<RubricSyncLog> {
  const supabase = getSupabaseClient();

  const { data: log, error } = await supabase
    .from('rubric_sync_log')
    .insert({
      script_id: scriptId,
      rubric_config_id: rubricConfigId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sync log: ${error.message}`);
  }

  return log;
}

/**
 * Update sync log status
 */
export async function updateSyncLogStatus(
  logId: string,
  status: SyncStatus,
  additionalData?: {
    changes_proposed?: ProposedChanges;
    changes_approved?: ProposedChanges;
    changes_rejected?: ProposedChanges;
    error_message?: string;
    approved_by?: string;
  }
): Promise<RubricSyncLog> {
  const supabase = getSupabaseClient();

  const updates: Record<string, unknown> = { status };

  if (additionalData?.changes_proposed !== undefined) {
    updates.changes_proposed = additionalData.changes_proposed;
  }
  if (additionalData?.changes_approved !== undefined) {
    updates.changes_approved = additionalData.changes_approved;
  }
  if (additionalData?.changes_rejected !== undefined) {
    updates.changes_rejected = additionalData.changes_rejected;
  }
  if (additionalData?.error_message !== undefined) {
    updates.error_message = additionalData.error_message;
  }
  if (additionalData?.approved_by !== undefined) {
    updates.approved_by = additionalData.approved_by;
    updates.approved_at = new Date().toISOString();
  }
  if (status === 'applied') {
    updates.applied_at = new Date().toISOString();
  }

  const { data: log, error } = await supabase
    .from('rubric_sync_log')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sync log: ${error.message}`);
  }

  return log;
}

/**
 * Get sync log by ID
 */
export async function getSyncLogById(logId: string): Promise<RubricSyncLog | null> {
  const supabase = getSupabaseClient();

  const { data: log, error } = await supabase
    .from('rubric_sync_log')
    .select('*')
    .eq('id', logId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get sync log: ${error.message}`);
  }

  return log;
}

/**
 * Get sync logs for a script
 */
export async function getSyncLogsForScript(scriptId: string): Promise<RubricSyncLog[]> {
  const supabase = getSupabaseClient();

  const { data: logs, error } = await supabase
    .from('rubric_sync_log')
    .select('*')
    .eq('script_id', scriptId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get sync logs: ${error.message}`);
  }

  return logs || [];
}

/**
 * Link a script to a rubric config
 */
export async function linkScriptToRubric(
  scriptId: string,
  rubricConfigId: string
): Promise<SalesScript> {
  const supabase = getSupabaseClient();

  const { data: script, error } = await supabase
    .from('sales_scripts')
    .update({ linked_rubric_id: rubricConfigId })
    .eq('id', scriptId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to link script to rubric: ${error.message}`);
  }

  return script;
}

export const scriptsService = {
  getAllScripts,
  getScriptById,
  getVersionHistory,
  createScript,
  updateScript,
  deleteScript,
  activateScript,
  createSyncLog,
  updateSyncLogStatus,
  getSyncLogById,
  getSyncLogsForScript,
  linkScriptToRubric,
};
