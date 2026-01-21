/**
 * Sales Scripts Types
 * Types for the sales script management and rubric sync system
 */

/**
 * Product types supported by scripts
 */
export type ProductType = 'aca' | 'limited_medical' | 'life_insurance';

/**
 * Supported file types for script uploads
 */
export type ScriptFileType =
  | 'text/plain'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/markdown';

/**
 * Sync status for rubric synchronization
 */
export type SyncStatus = 'pending' | 'analyzing' | 'pending_approval' | 'applied' | 'rejected';

/**
 * Source type for rubric items
 */
export type SourceType = 'custom' | 'script_sync';

/**
 * Sales script entity
 */
export interface SalesScript {
  id: string;
  name: string;
  product_type: ProductType;
  version: number;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  file_type: ScriptFileType | null;
  version_notes: string | null;
  is_active: boolean;
  uploaded_by: string | null;
  linked_rubric_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Script version summary for list views
 */
export interface ScriptVersionSummary {
  id: string;
  name: string;
  product_type: ProductType;
  version: number;
  is_active: boolean;
  file_name: string | null;
  file_size_bytes: number | null;
  created_at: string;
  version_notes: string | null;
  sync_status: SyncStatus | null;
}

/**
 * Create input for new script
 */
export interface CreateScriptInput {
  name: string;
  product_type: ProductType;
  content: string;
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  file_type?: ScriptFileType;
  version_notes?: string;
}

/**
 * Update input for existing script
 */
export interface UpdateScriptInput {
  name?: string;
  version_notes?: string;
}

/**
 * Rubric sync log entry
 */
export interface RubricSyncLog {
  id: string;
  script_id: string;
  rubric_config_id: string;
  status: SyncStatus;
  changes_proposed: ProposedChanges | null;
  changes_approved: ProposedChanges | null;
  changes_rejected: ProposedChanges | null;
  error_message: string | null;
  approved_by: string | null;
  approved_at: string | null;
  applied_at: string | null;
  created_at: string;
}

/**
 * Proposed category change from AI analysis
 */
export interface ProposedCategoryChange {
  change_type: 'add' | 'modify' | 'remove';
  category_slug: string;
  current_name?: string;
  proposed_name?: string;
  current_weight?: number;
  proposed_weight?: number;
  current_description?: string;
  proposed_description?: string;
  reason: string;
  confidence: number; // 0-1
  script_reference?: string; // Quote from script that led to this suggestion
}

/**
 * Proposed scoring criteria change from AI analysis
 */
export interface ProposedCriteriaChange {
  change_type: 'add' | 'modify' | 'remove';
  category_slug: string;
  score: number;
  current_text?: string;
  proposed_text?: string;
  reason: string;
  confidence: number;
  script_reference?: string;
}

/**
 * Proposed red flag change from AI analysis
 */
export interface ProposedRedFlagChange {
  change_type: 'add' | 'modify' | 'remove';
  flag_key: string;
  current_display_name?: string;
  proposed_display_name?: string;
  current_description?: string;
  proposed_description?: string;
  current_severity?: string;
  proposed_severity?: string;
  reason: string;
  confidence: number;
  script_reference?: string;
}

/**
 * All proposed changes from AI analysis
 */
export interface ProposedChanges {
  summary: string;
  analysis_notes: string;
  category_changes: ProposedCategoryChange[];
  criteria_changes: ProposedCriteriaChange[];
  red_flag_changes: ProposedRedFlagChange[];
  total_changes: number;
  high_confidence_count: number; // Changes with confidence > 0.8
}

/**
 * Input for applying sync changes
 */
export interface ApplySyncInput {
  approved_category_changes: string[]; // Array of indices to approve
  approved_criteria_changes: string[];
  approved_red_flag_changes: string[];
}

/**
 * Script with latest sync status
 */
export interface ScriptWithSyncStatus extends SalesScript {
  latest_sync?: RubricSyncLog;
  rubric_aligned: boolean;
}

/**
 * Scripts grouped by product type
 */
export interface ScriptsByProductType {
  aca: ScriptWithSyncStatus[];
  limited_medical: ScriptWithSyncStatus[];
  life_insurance: ScriptWithSyncStatus[];
}

/**
 * Upload response
 */
export interface ScriptUploadResponse {
  script: SalesScript;
  storage_url: string;
}

/**
 * Sync analysis response
 */
export interface SyncAnalysisResponse {
  sync_log_id: string;
  status: SyncStatus;
  proposed_changes: ProposedChanges | null;
  error_message: string | null;
}

/**
 * Product type display names
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  aca: 'ACA (Affordable Care Act)',
  limited_medical: 'Limited Medical',
  life_insurance: 'Life Insurance',
};

/**
 * Supported file extensions and their MIME types
 */
export const SUPPORTED_FILE_TYPES: Record<string, ScriptFileType> = {
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.md': 'text/markdown',
};

/**
 * Max file size for uploads (10MB)
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
