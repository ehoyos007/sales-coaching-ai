import { getSupabaseClient } from '../../config/database.js';
import {
  RubricConfig,
  RubricScoringCriteria,
  RubricConfigWithRelations,
  RubricVersionSummary,
  CreateRubricConfigInput,
  UpdateRubricConfigInput,
} from '../../types/index.js';

/**
 * Get the currently active rubric configuration with all relations
 */
export async function getActiveConfig(): Promise<RubricConfigWithRelations | null> {
  const supabase = getSupabaseClient();

  // Get active config
  const { data: config, error: configError } = await supabase
    .from('coaching_rubric_config')
    .select('*')
    .eq('is_active', true)
    .single();

  if (configError) {
    if (configError.code === 'PGRST116') {
      return null; // No active config
    }
    throw new Error(`Failed to get active rubric config: ${configError.message}`);
  }

  // Fetch categories with scoring criteria
  const { data: categories, error: catError } = await supabase
    .from('rubric_categories')
    .select('*')
    .eq('rubric_config_id', config.id)
    .order('sort_order', { ascending: true });

  if (catError) {
    throw new Error(`Failed to get rubric categories: ${catError.message}`);
  }

  // Fetch scoring criteria for all categories
  const categoryIds = categories?.map(c => c.id) || [];
  const { data: allCriteria, error: critError } = await supabase
    .from('rubric_scoring_criteria')
    .select('*')
    .in('category_id', categoryIds)
    .order('score', { ascending: true });

  if (critError) {
    throw new Error(`Failed to get scoring criteria: ${critError.message}`);
  }

  // Fetch red flags
  const { data: redFlags, error: flagError } = await supabase
    .from('rubric_red_flags')
    .select('*')
    .eq('rubric_config_id', config.id)
    .order('sort_order', { ascending: true });

  if (flagError) {
    throw new Error(`Failed to get red flags: ${flagError.message}`);
  }

  // Assemble the full config with relations
  const categoriesWithCriteria = (categories || []).map(cat => ({
    ...cat,
    scoring_criteria: (allCriteria || []).filter(c => c.category_id === cat.id),
  }));

  return {
    ...config,
    categories: categoriesWithCriteria,
    red_flags: redFlags || [],
  };
}

/**
 * Get a specific rubric configuration by ID with all relations
 */
export async function getConfigById(id: string): Promise<RubricConfigWithRelations | null> {
  const supabase = getSupabaseClient();

  const { data: config, error: configError } = await supabase
    .from('coaching_rubric_config')
    .select('*')
    .eq('id', id)
    .single();

  if (configError) {
    if (configError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get rubric config: ${configError.message}`);
  }

  // Fetch categories with scoring criteria
  const { data: categories, error: catError } = await supabase
    .from('rubric_categories')
    .select('*')
    .eq('rubric_config_id', config.id)
    .order('sort_order', { ascending: true });

  if (catError) {
    throw new Error(`Failed to get rubric categories: ${catError.message}`);
  }

  // Fetch scoring criteria for all categories
  const categoryIds = categories?.map(c => c.id) || [];
  let allCriteria: RubricScoringCriteria[] = [];

  if (categoryIds.length > 0) {
    const { data: criteria, error: critError } = await supabase
      .from('rubric_scoring_criteria')
      .select('*')
      .in('category_id', categoryIds)
      .order('score', { ascending: true });

    if (critError) {
      throw new Error(`Failed to get scoring criteria: ${critError.message}`);
    }
    allCriteria = criteria || [];
  }

  // Fetch red flags
  const { data: redFlags, error: flagError } = await supabase
    .from('rubric_red_flags')
    .select('*')
    .eq('rubric_config_id', config.id)
    .order('sort_order', { ascending: true });

  if (flagError) {
    throw new Error(`Failed to get red flags: ${flagError.message}`);
  }

  // Assemble the full config with relations
  const categoriesWithCriteria = (categories || []).map(cat => ({
    ...cat,
    scoring_criteria: allCriteria.filter(c => c.category_id === cat.id),
  }));

  return {
    ...config,
    categories: categoriesWithCriteria,
    red_flags: redFlags || [],
  };
}

/**
 * List all rubric versions (summary only, no relations)
 */
export async function listVersions(): Promise<RubricVersionSummary[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('coaching_rubric_config')
    .select('id, name, version, is_active, is_draft, created_at, updated_at')
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to list rubric versions: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new rubric configuration version
 */
export async function createVersion(input: CreateRubricConfigInput): Promise<RubricConfigWithRelations> {
  const supabase = getSupabaseClient();

  // If cloning, get the source config first
  let sourceConfig: RubricConfigWithRelations | null = null;
  if (input.clone_from_id) {
    sourceConfig = await getConfigById(input.clone_from_id);
    if (!sourceConfig) {
      throw new Error(`Source config not found: ${input.clone_from_id}`);
    }
  }

  // Get the max version number
  const { data: maxVersion } = await supabase
    .from('coaching_rubric_config')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = (maxVersion?.version || 0) + 1;

  // Create the new config
  const { data: config, error: configError } = await supabase
    .from('coaching_rubric_config')
    .insert({
      name: input.name,
      description: input.description || sourceConfig?.description,
      version: newVersion,
      is_active: false,
      is_draft: input.is_draft !== false,
    })
    .select()
    .single();

  if (configError) {
    throw new Error(`Failed to create rubric config: ${configError.message}`);
  }

  // Determine categories to insert
  const categoriesToInsert = input.categories || (sourceConfig?.categories.map(c => ({
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
  })) || []);

  // Insert categories
  for (const cat of categoriesToInsert) {
    const { data: category, error: catError } = await supabase
      .from('rubric_categories')
      .insert({
        rubric_config_id: config.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        weight: cat.weight,
        sort_order: cat.sort_order,
        is_enabled: cat.is_enabled !== false,
      })
      .select()
      .single();

    if (catError) {
      throw new Error(`Failed to create category: ${catError.message}`);
    }

    // Insert scoring criteria if provided
    if (cat.scoring_criteria && cat.scoring_criteria.length > 0) {
      const criteriaToInsert = cat.scoring_criteria.map(sc => ({
        category_id: category.id,
        score: sc.score,
        criteria_text: sc.criteria_text,
      }));

      const { error: critError } = await supabase
        .from('rubric_scoring_criteria')
        .insert(criteriaToInsert);

      if (critError) {
        throw new Error(`Failed to create scoring criteria: ${critError.message}`);
      }
    }
  }

  // Determine red flags to insert
  const redFlagsToInsert = input.red_flags || (sourceConfig?.red_flags.map(rf => ({
    flag_key: rf.flag_key,
    display_name: rf.display_name,
    description: rf.description,
    severity: rf.severity,
    threshold_type: rf.threshold_type || undefined,
    threshold_value: rf.threshold_value || undefined,
    is_enabled: rf.is_enabled,
    sort_order: rf.sort_order,
  })) || []);

  // Insert red flags
  if (redFlagsToInsert.length > 0) {
    const flagsToInsert = redFlagsToInsert.map((rf, index) => ({
      rubric_config_id: config.id,
      flag_key: rf.flag_key,
      display_name: rf.display_name,
      description: rf.description,
      severity: rf.severity,
      threshold_type: rf.threshold_type,
      threshold_value: rf.threshold_value,
      is_enabled: rf.is_enabled !== false,
      sort_order: rf.sort_order ?? index,
    }));

    const { error: flagError } = await supabase
      .from('rubric_red_flags')
      .insert(flagsToInsert);

    if (flagError) {
      throw new Error(`Failed to create red flags: ${flagError.message}`);
    }
  }

  // Return the full config with relations
  return (await getConfigById(config.id))!;
}

/**
 * Update an existing draft rubric configuration
 */
export async function updateVersion(id: string, input: UpdateRubricConfigInput): Promise<RubricConfigWithRelations> {
  const supabase = getSupabaseClient();

  // Verify config exists and is a draft
  const existing = await getConfigById(id);
  if (!existing) {
    throw new Error(`Rubric config not found: ${id}`);
  }
  if (!existing.is_draft) {
    throw new Error('Cannot update a non-draft rubric config. Create a new version instead.');
  }

  // Update the config
  const updates: Partial<RubricConfig> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('coaching_rubric_config')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to update rubric config: ${updateError.message}`);
    }
  }

  // Update categories if provided
  if (input.categories) {
    // Delete existing categories (cascade will delete scoring criteria)
    const { error: deleteError } = await supabase
      .from('rubric_categories')
      .delete()
      .eq('rubric_config_id', id);

    if (deleteError) {
      throw new Error(`Failed to delete existing categories: ${deleteError.message}`);
    }

    // Insert new categories
    for (const cat of input.categories) {
      const { data: category, error: catError } = await supabase
        .from('rubric_categories')
        .insert({
          rubric_config_id: id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          weight: cat.weight,
          sort_order: cat.sort_order,
          is_enabled: cat.is_enabled !== false,
        })
        .select()
        .single();

      if (catError) {
        throw new Error(`Failed to create category: ${catError.message}`);
      }

      // Insert scoring criteria if provided
      if (cat.scoring_criteria && cat.scoring_criteria.length > 0) {
        const criteriaToInsert = cat.scoring_criteria.map(sc => ({
          category_id: category.id,
          score: sc.score,
          criteria_text: sc.criteria_text,
        }));

        const { error: critError } = await supabase
          .from('rubric_scoring_criteria')
          .insert(criteriaToInsert);

        if (critError) {
          throw new Error(`Failed to create scoring criteria: ${critError.message}`);
        }
      }
    }
  }

  // Update red flags if provided
  if (input.red_flags) {
    // Delete existing red flags
    const { error: deleteError } = await supabase
      .from('rubric_red_flags')
      .delete()
      .eq('rubric_config_id', id);

    if (deleteError) {
      throw new Error(`Failed to delete existing red flags: ${deleteError.message}`);
    }

    // Insert new red flags
    if (input.red_flags.length > 0) {
      const flagsToInsert = input.red_flags.map((rf, index) => ({
        rubric_config_id: id,
        flag_key: rf.flag_key,
        display_name: rf.display_name,
        description: rf.description,
        severity: rf.severity,
        threshold_type: rf.threshold_type,
        threshold_value: rf.threshold_value,
        is_enabled: rf.is_enabled !== false,
        sort_order: rf.sort_order ?? index,
      }));

      const { error: flagError } = await supabase
        .from('rubric_red_flags')
        .insert(flagsToInsert);

      if (flagError) {
        throw new Error(`Failed to create red flags: ${flagError.message}`);
      }
    }
  }

  return (await getConfigById(id))!;
}

/**
 * Activate a rubric version (deactivates the current active version)
 */
export async function activateVersion(id: string): Promise<RubricConfigWithRelations> {
  const supabase = getSupabaseClient();

  // Verify config exists
  const existing = await getConfigById(id);
  if (!existing) {
    throw new Error(`Rubric config not found: ${id}`);
  }

  // Deactivate currently active config (if any)
  const { error: deactivateError } = await supabase
    .from('coaching_rubric_config')
    .update({ is_active: false })
    .eq('is_active', true);

  if (deactivateError) {
    throw new Error(`Failed to deactivate current config: ${deactivateError.message}`);
  }

  // Activate the new config and mark as non-draft
  const { error: activateError } = await supabase
    .from('coaching_rubric_config')
    .update({ is_active: true, is_draft: false })
    .eq('id', id);

  if (activateError) {
    throw new Error(`Failed to activate config: ${activateError.message}`);
  }

  return (await getConfigById(id))!;
}

/**
 * Delete a draft rubric configuration
 */
export async function deleteVersion(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Verify config exists and is a draft
  const existing = await getConfigById(id);
  if (!existing) {
    throw new Error(`Rubric config not found: ${id}`);
  }
  if (!existing.is_draft) {
    throw new Error('Cannot delete a non-draft rubric config');
  }
  if (existing.is_active) {
    throw new Error('Cannot delete the active rubric config');
  }

  // Delete the config (cascade will delete categories, criteria, and red flags)
  const { error } = await supabase
    .from('coaching_rubric_config')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete rubric config: ${error.message}`);
  }
}

export const rubricService = {
  getActiveConfig,
  getConfigById,
  listVersions,
  createVersion,
  updateVersion,
  activateVersion,
  deleteVersion,
};
