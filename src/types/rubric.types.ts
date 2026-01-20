/**
 * Rubric Configuration Types
 * Types for the configurable coaching rubric system
 */

/**
 * Severity levels for red flags
 */
export type RedFlagSeverity = 'critical' | 'high' | 'medium';

/**
 * Threshold types for red flags
 */
export type ThresholdType = 'boolean' | 'percentage';

/**
 * Category slugs for identifying categories programmatically
 */
export type CategorySlug =
  | 'opening_rapport'
  | 'needs_discovery'
  | 'product_presentation'
  | 'objection_handling'
  | 'compliance_disclosures'
  | 'closing_enrollment'
  | string;

/**
 * Scoring criteria for a specific score level (1-5)
 */
export interface RubricScoringCriteria {
  id: string;
  category_id: string;
  score: number;
  criteria_text: string;
  created_at: string;
}

/**
 * Create/Update input for scoring criteria
 */
export interface ScoringCriteriaInput {
  score: number;
  criteria_text: string;
}

/**
 * Rubric category with weight and description
 */
export interface RubricCategory {
  id: string;
  rubric_config_id: string;
  name: string;
  slug: CategorySlug;
  description: string | null;
  weight: number;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
  scoring_criteria?: RubricScoringCriteria[];
}

/**
 * Create/Update input for categories
 */
export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  weight: number;
  sort_order: number;
  is_enabled?: boolean;
  scoring_criteria?: ScoringCriteriaInput[];
}

/**
 * Red flag definition
 */
export interface RubricRedFlag {
  id: string;
  rubric_config_id: string;
  flag_key: string;
  display_name: string;
  description: string;
  severity: RedFlagSeverity;
  threshold_type: ThresholdType | null;
  threshold_value: number | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

/**
 * Create/Update input for red flags
 */
export interface RedFlagInput {
  flag_key: string;
  display_name: string;
  description: string;
  severity: RedFlagSeverity;
  threshold_type?: ThresholdType;
  threshold_value?: number;
  is_enabled?: boolean;
  sort_order?: number;
}

/**
 * Main rubric configuration
 */
export interface RubricConfig {
  id: string;
  name: string;
  description: string | null;
  version: number;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  categories?: RubricCategory[];
  red_flags?: RubricRedFlag[];
}

/**
 * Create input for new rubric configuration
 */
export interface CreateRubricConfigInput {
  name: string;
  description?: string;
  is_draft?: boolean;
  clone_from_id?: string;
  categories?: CategoryInput[];
  red_flags?: RedFlagInput[];
}

/**
 * Update input for existing rubric configuration
 */
export interface UpdateRubricConfigInput {
  name?: string;
  description?: string;
  categories?: CategoryInput[];
  red_flags?: RedFlagInput[];
}

/**
 * Version summary for version history list
 */
export interface RubricVersionSummary {
  id: string;
  name: string;
  version: number;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Full rubric configuration with all related data
 */
export interface RubricConfigWithRelations extends RubricConfig {
  categories: (RubricCategory & {
    scoring_criteria: RubricScoringCriteria[];
  })[];
  red_flags: RubricRedFlag[];
}

/**
 * Category weight validation result
 */
export interface WeightValidation {
  isValid: boolean;
  total: number;
  remaining: number;
  message?: string;
}

/**
 * Helper to validate category weights sum to 100
 */
export function validateCategoryWeights(categories: { weight: number; is_enabled?: boolean }[]): WeightValidation {
  const enabledCategories = categories.filter(c => c.is_enabled !== false);
  const total = enabledCategories.reduce((sum, c) => sum + c.weight, 0);
  const remaining = 100 - total;

  return {
    isValid: Math.abs(remaining) < 0.01, // Allow for floating point errors
    total: Math.round(total * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    message: remaining === 0
      ? undefined
      : remaining > 0
        ? `${remaining}% remaining to allocate`
        : `${Math.abs(remaining)}% over the limit`,
  };
}
