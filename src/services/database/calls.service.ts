import { getSupabaseClient } from '../../config/database.js';
import { CallMetadata, CallSummary, AgentPerformance, AgentDailyCalls } from '../../types/index.js';

/**
 * Get calls for a specific agent within a date range
 * Calls the get_agent_calls PostgreSQL function
 */
export async function getAgentCalls(
  agentUserId: string,
  startDate: string,
  endDate: string,
  limit: number = 50
): Promise<CallSummary[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('get_agent_calls', {
      p_agent_user_id: agentUserId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: limit,
    });

  if (error) {
    throw new Error(`Failed to get agent calls: ${error.message}`);
  }

  return data || [];
}

/**
 * Get performance metrics for an agent
 * Calls the get_agent_performance PostgreSQL function
 */
export async function getAgentPerformance(
  agentUserId: string,
  startDate: string,
  endDate: string
): Promise<AgentPerformance | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('get_agent_performance', {
      p_agent_user_id: agentUserId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

  if (error) {
    throw new Error(`Failed to get agent performance: ${error.message}`);
  }

  // Function returns array, take first result
  if (data && data.length > 0) {
    return data[0];
  }

  return null;
}

/**
 * Get daily call counts for an agent
 * Calls the get_agent_daily_calls PostgreSQL function
 */
export async function getAgentDailyCalls(
  agentUserId: string,
  startDate: string,
  endDate: string
): Promise<AgentDailyCalls[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('get_agent_daily_calls', {
      p_agent_user_id: agentUserId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

  if (error) {
    throw new Error(`Failed to get agent daily calls: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single call by ID
 */
export async function getCallById(callId: string): Promise<CallMetadata | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('call_metadata')
    .select('*')
    .eq('call_id', callId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get call: ${error.message}`);
  }

  return data;
}

export const callsService = {
  getAgentCalls,
  getAgentPerformance,
  getAgentDailyCalls,
  getCallById,
};
