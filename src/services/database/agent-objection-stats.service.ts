import { getSupabaseClient } from '../../config/database.js';
import {
  AgentObjectionStats,
  ObjectionArea,
  TeamObjectionTrend,
  RecordObjectionInput,
  RecordObjectionResult,
  AgentObjectionHistory,
} from '../../types/index.js';

/**
 * Record a single objection (non-blocking - returns null on error)
 */
export async function recordObjection(
  input: RecordObjectionInput
): Promise<RecordObjectionResult | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('record_objection', {
      p_agent_user_id: input.agent_user_id,
      p_call_id: input.call_id,
      p_objection_type: input.objection_type,
      p_response_quality: input.response_quality,
      p_was_resolved: input.was_resolved,
      p_customer_sentiment: input.customer_sentiment || null,
      p_objection_snippet: input.objection_snippet || null,
      p_rebuttal_snippet: input.rebuttal_snippet || null,
      p_full_exchange: input.full_exchange || null,
    });

    if (error) {
      console.error('[agent-objection-stats] Error recording objection:', error.message);
      return null;
    }

    return data as RecordObjectionResult;
  } catch (error) {
    console.error('[agent-objection-stats] Exception recording objection:', error);
    return null;
  }
}

/**
 * Record multiple objections (uses Promise.allSettled for resilience)
 */
export async function recordObjections(
  inputs: RecordObjectionInput[]
): Promise<{ succeeded: number; failed: number }> {
  if (inputs.length === 0) {
    return { succeeded: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    inputs.map((input) => recordObjection(input))
  );

  let succeeded = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      succeeded++;
    } else {
      failed++;
    }
  }

  console.log(`[agent-objection-stats] Recorded ${succeeded}/${inputs.length} objections`);
  return { succeeded, failed };
}

/**
 * Get all objection stats for an agent
 */
export async function getAgentStats(
  agentUserId: string
): Promise<AgentObjectionStats[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_agent_objection_stats', {
    p_agent_user_id: agentUserId,
  });

  if (error) {
    console.error('[agent-objection-stats] Error getting agent stats:', error.message);
    return [];
  }

  return (data || []) as AgentObjectionStats[];
}

/**
 * Get weakest objection handling areas for an agent
 */
export async function getWeakestAreas(
  agentUserId: string,
  minOccurrences: number = 2,
  limit: number = 3
): Promise<ObjectionArea[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_agent_weak_areas', {
    p_agent_user_id: agentUserId,
    p_min_occurrences: minOccurrences,
    p_limit: limit,
  });

  if (error) {
    console.error('[agent-objection-stats] Error getting weak areas:', error.message);
    return [];
  }

  return (data || []) as ObjectionArea[];
}

/**
 * Get strongest objection handling areas for an agent
 */
export async function getStrongestAreas(
  agentUserId: string,
  minOccurrences: number = 2,
  limit: number = 3
): Promise<ObjectionArea[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_agent_strong_areas', {
    p_agent_user_id: agentUserId,
    p_min_occurrences: minOccurrences,
    p_limit: limit,
  });

  if (error) {
    console.error('[agent-objection-stats] Error getting strong areas:', error.message);
    return [];
  }

  return (data || []) as ObjectionArea[];
}

/**
 * Get team-wide objection trends
 */
export async function getTeamObjectionTrends(
  startDate?: string,
  endDate?: string
): Promise<TeamObjectionTrend[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_team_objection_trends', {
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    console.error('[agent-objection-stats] Error getting team trends:', error.message);
    return [];
  }

  return (data || []) as TeamObjectionTrend[];
}

/**
 * Get aggregated objection history for coaching context
 * Used to provide pattern-aware coaching in prompts
 */
export async function getAgentObjectionHistory(
  agentUserId: string
): Promise<AgentObjectionHistory | null> {
  try {
    // Fetch all data in parallel for efficiency
    const [stats, weakAreas, strongAreas] = await Promise.all([
      getAgentStats(agentUserId),
      getWeakestAreas(agentUserId, 2, 3),
      getStrongestAreas(agentUserId, 2, 3),
    ]);

    // Calculate totals
    const totalAnalyzed = stats.reduce((sum, s) => sum + s.total_occurrences, 0);

    // Calculate overall average score (weighted by occurrences)
    let overallAvgScore: number | null = null;
    if (totalAnalyzed > 0) {
      const weightedSum = stats.reduce(
        (sum, s) => sum + (s.avg_score * s.total_occurrences),
        0
      );
      overallAvgScore = Math.round((weightedSum / totalAnalyzed) * 100) / 100;
    }

    return {
      agent_user_id: agentUserId,
      stats,
      weak_areas: weakAreas,
      strong_areas: strongAreas,
      total_analyzed: totalAnalyzed,
      overall_avg_score: overallAvgScore,
    };
  } catch (error) {
    console.error('[agent-objection-stats] Error getting agent history:', error);
    return null;
  }
}

export const agentObjectionStatsService = {
  recordObjection,
  recordObjections,
  getAgentStats,
  getWeakestAreas,
  getStrongestAreas,
  getTeamObjectionTrends,
  getAgentObjectionHistory,
};
