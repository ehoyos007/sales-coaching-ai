import { getSupabaseClient } from '../../config/database.js';
import { Agent, ResolvedAgent, AgentWithStats } from '../../types/index.js';

/**
 * Get all active agents
 */
export async function listAgents(): Promise<AgentWithStats[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('active', true)
    .order('first_name');

  if (error) {
    throw new Error(`Failed to list agents: ${error.message}`);
  }

  return data || [];
}

/**
 * Get an agent by their user ID
 */
export async function getAgentById(agentUserId: string): Promise<Agent | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('agent_user_id', agentUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get agent: ${error.message}`);
  }

  return data;
}

/**
 * Resolve an agent name to agent_user_id using fuzzy matching
 * Calls the resolve_agent_name PostgreSQL function
 */
export async function resolveByName(name: string): Promise<ResolvedAgent | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('resolve_agent_name', { p_name: name });

  if (error) {
    throw new Error(`Failed to resolve agent name: ${error.message}`);
  }

  // Function returns array of matches, take the best one
  if (data && data.length > 0) {
    const best = data[0];
    return {
      agent_user_id: best.agent_user_id,
      first_name: best.first_name,
      similarity_score: best.similarity_score || 1.0,
    };
  }

  return null;
}

/**
 * Get multiple agent matches for ambiguous names
 */
export async function resolveAgentMatches(name: string): Promise<ResolvedAgent[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('resolve_agent_name', { p_name: name });

  if (error) {
    throw new Error(`Failed to resolve agent name: ${error.message}`);
  }

  return (data || []).map((match: { agent_user_id: string; first_name: string; similarity_score?: number }) => ({
    agent_user_id: match.agent_user_id,
    first_name: match.first_name,
    similarity_score: match.similarity_score || 1.0,
  }));
}

/**
 * Update an agent's team assignment
 */
export async function updateAgentTeam(
  agentUserId: string,
  teamId: string | null
): Promise<Agent | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('agents')
    .update({ team_id: teamId })
    .eq('agent_user_id', agentUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update agent team: ${error.message}`);
  }

  return data;
}

/**
 * Get agents by team ID
 */
export async function getAgentsByTeam(teamId: string): Promise<Agent[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('team_id', teamId)
    .eq('active', true)
    .order('first_name');

  if (error) {
    throw new Error(`Failed to get agents by team: ${error.message}`);
  }

  return data || [];
}

/**
 * Get agents not assigned to any team
 */
export async function getUnassignedAgents(): Promise<Agent[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .is('team_id', null)
    .eq('active', true)
    .order('first_name');

  if (error) {
    throw new Error(`Failed to get unassigned agents: ${error.message}`);
  }

  return data || [];
}

/**
 * Resolve agent name but only from a list of allowed agent IDs
 * Used to scope name resolution to a manager's team or specific agents
 */
export async function resolveByNameScoped(
  name: string,
  allowedAgentIds: string[]
): Promise<ResolvedAgent | null> {
  if (allowedAgentIds.length === 0) {
    return null;
  }

  const supabase = getSupabaseClient();

  // Get all matches from global fuzzy search
  const { data, error } = await supabase.rpc('resolve_agent_name', { p_name: name });

  if (error) {
    throw new Error(`Failed to resolve agent name: ${error.message}`);
  }

  // Filter to only allowed agents
  const allowedMatches = (data || []).filter(
    (match: { agent_user_id: string }) => allowedAgentIds.includes(match.agent_user_id)
  );

  // Return the best match within allowed agents
  if (allowedMatches.length > 0) {
    const best = allowedMatches[0];
    return {
      agent_user_id: best.agent_user_id,
      first_name: best.first_name,
      similarity_score: best.similarity_score || 1.0,
    };
  }

  return null;
}

/**
 * Get agent names by their IDs (for error messages)
 */
export async function getAgentNamesByIds(agentIds: string[]): Promise<string[]> {
  if (agentIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('agents')
    .select('first_name')
    .in('agent_user_id', agentIds)
    .eq('active', true)
    .order('first_name');

  if (error) {
    throw new Error(`Failed to get agent names: ${error.message}`);
  }

  return (data || []).map(a => a.first_name);
}

export const agentsService = {
  listAgents,
  getAgentById,
  resolveByName,
  resolveByNameScoped,
  resolveAgentMatches,
  updateAgentTeam,
  getAgentsByTeam,
  getUnassignedAgents,
  getAgentNamesByIds,
};
