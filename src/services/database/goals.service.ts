// =============================================
// GOALS SERVICE - Agent/Team Goal Management
// =============================================

import { getSupabaseClient } from '../../config/database.js';
import type {
  AgentGoal,
  GoalProgress,
  CreateGoalInput,
  UpdateGoalInput,
  GoalsProgressRpcResult,
  GoalType,
} from '../../types/index.js';

// =============================================
// CREATE GOAL
// =============================================

/**
 * Create a new goal for an agent or team
 */
export async function createGoal(
  input: CreateGoalInput,
  createdBy?: string
): Promise<AgentGoal> {
  const supabase = getSupabaseClient();

  // Validate that either agentUserId or teamId is provided, but not both
  if ((!input.agentUserId && !input.teamId) || (input.agentUserId && input.teamId)) {
    throw new Error('Either agentUserId or teamId must be provided, but not both');
  }

  const { data, error } = await supabase
    .from('agent_goals')
    .insert({
      agent_user_id: input.agentUserId || null,
      team_id: input.teamId || null,
      goal_type: input.goalType,
      target_value: input.targetValue,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      actual_value: 0,
      is_active: true,
      created_by: createdBy || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[goals.service] Error creating goal:', error);
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return transformGoal(data);
}

// =============================================
// GET GOAL BY ID
// =============================================

/**
 * Get a goal by its ID
 */
export async function getGoalById(id: string): Promise<AgentGoal | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('agent_goals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[goals.service] Error fetching goal:', error);
    throw new Error(`Failed to get goal: ${error.message}`);
  }

  return transformGoal(data);
}

// =============================================
// GET ACTIVE GOALS
// =============================================

/**
 * Get active goals for an agent or team
 */
export async function getActiveGoals(
  agentUserId?: string,
  teamId?: string
): Promise<AgentGoal[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('agent_goals')
    .select('*')
    .eq('is_active', true)
    .order('period_start', { ascending: false });

  if (agentUserId) {
    query = query.eq('agent_user_id', agentUserId);
  }

  if (teamId) {
    query = query.eq('team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[goals.service] Error fetching active goals:', error);
    throw new Error(`Failed to get active goals: ${error.message}`);
  }

  return (data || []).map(transformGoal);
}

// =============================================
// GET GOALS PROGRESS
// =============================================

/**
 * Get goals progress with calculated percentages
 */
export async function getGoalsProgress(
  agentUserId?: string,
  teamId?: string,
  periodStart?: string,
  periodEnd?: string
): Promise<GoalProgress[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_goals_progress', {
    p_agent_user_id: agentUserId || null,
    p_team_id: teamId || null,
    p_period_start: periodStart || null,
    p_period_end: periodEnd || null,
  });

  if (error) {
    console.error('[goals.service] Error fetching goals progress:', error);
    throw new Error(`Failed to get goals progress: ${error.message}`);
  }

  const results = (data || []) as GoalsProgressRpcResult[];

  return results.map(row => ({
    id: row.id,
    goalType: row.goal_type as GoalType,
    targetValue: row.target_value,
    actualValue: row.actual_value,
    progressPercentage: row.progress_percentage,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    isActive: row.is_active,
  }));
}

// =============================================
// UPDATE GOAL
// =============================================

/**
 * Update a goal
 */
export async function updateGoal(
  id: string,
  input: UpdateGoalInput
): Promise<AgentGoal> {
  const supabase = getSupabaseClient();

  const updates: Record<string, unknown> = {};

  if (input.targetValue !== undefined) {
    updates.target_value = input.targetValue;
  }

  if (input.actualValue !== undefined) {
    updates.actual_value = input.actualValue;
  }

  if (input.isActive !== undefined) {
    updates.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from('agent_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[goals.service] Error updating goal:', error);
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return transformGoal(data);
}

// =============================================
// UPDATE GOAL PROGRESS
// =============================================

/**
 * Update the actual value of a goal
 */
export async function updateGoalProgress(
  id: string,
  actualValue: number
): Promise<AgentGoal> {
  return updateGoal(id, { actualValue });
}

// =============================================
// DEACTIVATE GOAL
// =============================================

/**
 * Deactivate a goal
 */
export async function deactivateGoal(id: string): Promise<AgentGoal> {
  return updateGoal(id, { isActive: false });
}

// =============================================
// DELETE GOAL
// =============================================

/**
 * Delete a goal
 */
export async function deleteGoal(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('agent_goals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[goals.service] Error deleting goal:', error);
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}

// =============================================
// GET GOALS FOR PERIOD
// =============================================

/**
 * Get all goals that overlap with a given date range
 */
export async function getGoalsForPeriod(
  periodStart: string,
  periodEnd: string,
  agentUserId?: string,
  teamId?: string
): Promise<AgentGoal[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('agent_goals')
    .select('*')
    .lte('period_start', periodEnd)
    .gte('period_end', periodStart)
    .order('period_start', { ascending: false });

  if (agentUserId) {
    query = query.eq('agent_user_id', agentUserId);
  }

  if (teamId) {
    query = query.eq('team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[goals.service] Error fetching goals for period:', error);
    throw new Error(`Failed to get goals for period: ${error.message}`);
  }

  return (data || []).map(transformGoal);
}

// =============================================
// BULK UPDATE GOAL PROGRESS
// =============================================

/**
 * Update actual values for multiple goals
 */
export async function bulkUpdateGoalProgress(
  updates: Array<{ id: string; actualValue: number }>
): Promise<void> {
  const supabase = getSupabaseClient();

  for (const update of updates) {
    const { error } = await supabase
      .from('agent_goals')
      .update({ actual_value: update.actualValue })
      .eq('id', update.id);

    if (error) {
      console.error(`[goals.service] Error updating goal ${update.id}:`, error);
      // Continue with other updates
    }
  }
}

// =============================================
// TRANSFORM HELPERS
// =============================================

interface GoalRow {
  id: string;
  agent_user_id: string | null;
  team_id: string | null;
  goal_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  actual_value: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function transformGoal(row: GoalRow): AgentGoal {
  return {
    id: row.id,
    agentUserId: row.agent_user_id,
    teamId: row.team_id,
    goalType: row.goal_type as GoalType,
    targetValue: row.target_value,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    actualValue: row.actual_value,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================
// EXPORT SERVICE
// =============================================

export const goalsService = {
  createGoal,
  getGoalById,
  getActiveGoals,
  getGoalsProgress,
  updateGoal,
  updateGoalProgress,
  deactivateGoal,
  deleteGoal,
  getGoalsForPeriod,
  bulkUpdateGoalProgress,
};
