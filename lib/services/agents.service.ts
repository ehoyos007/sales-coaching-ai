/**
 * Agents Service for Vercel serverless functions
 * Handles agent listing, lookup, and name resolution
 */
import { getSupabaseClient } from '../database';

// =============================================
// TYPES
// =============================================

export interface Agent {
  agent_user_id: string;
  first_name: string;
  email: string | null;
  department: string | null;
  extension: string | null;
  active: boolean;
  admin: boolean;
  team_id: string | null;
  created_at: string;
}

export interface AgentWithStats extends Agent {
  total_calls?: number;
}

export interface ResolvedAgent {
  agent_user_id: string;
  first_name: string;
  similarity_score: number;
}

// =============================================
// SERVICE CLASS
// =============================================

export class AgentsService {
  private supabase = getSupabaseClient();

  /**
   * Get all active agents
   */
  async listAgents(): Promise<AgentWithStats[]> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('active', true)
      .order('first_name');

    if (error) {
      console.error('[agents.service] listAgents error:', error);
      throw new Error(`Failed to list agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get an agent by their user ID
   */
  async getAgentById(agentUserId: string): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('agent_user_id', agentUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[agents.service] getAgentById error:', error);
      throw new Error(`Failed to get agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Resolve an agent name to agent_user_id using fuzzy matching
   * Calls the resolve_agent_name PostgreSQL function
   */
  async resolveByName(name: string): Promise<ResolvedAgent | null> {
    const { data, error } = await this.supabase.rpc('resolve_agent_name', {
      p_name: name,
    });

    if (error) {
      console.error('[agents.service] resolveByName error:', error);
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
  async resolveAgentMatches(name: string): Promise<ResolvedAgent[]> {
    const { data, error } = await this.supabase.rpc('resolve_agent_name', {
      p_name: name,
    });

    if (error) {
      console.error('[agents.service] resolveAgentMatches error:', error);
      throw new Error(`Failed to resolve agent name: ${error.message}`);
    }

    return (data || []).map(
      (match: { agent_user_id: string; first_name: string; similarity_score?: number }) => ({
        agent_user_id: match.agent_user_id,
        first_name: match.first_name,
        similarity_score: match.similarity_score || 1.0,
      })
    );
  }

  /**
   * Resolve agent name but only from a list of allowed agent IDs
   * Used to scope name resolution to a manager's team or specific agents
   */
  async resolveByNameScoped(
    name: string,
    allowedAgentIds: string[]
  ): Promise<ResolvedAgent | null> {
    if (allowedAgentIds.length === 0) {
      return null;
    }

    // Get all matches from global fuzzy search
    const { data, error } = await this.supabase.rpc('resolve_agent_name', {
      p_name: name,
    });

    if (error) {
      console.error('[agents.service] resolveByNameScoped error:', error);
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
   * Get agents by team ID
   */
  async getAgentsByTeam(teamId: string): Promise<Agent[]> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('team_id', teamId)
      .eq('active', true)
      .order('first_name');

    if (error) {
      console.error('[agents.service] getAgentsByTeam error:', error);
      throw new Error(`Failed to get agents by team: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get agents not assigned to any team
   */
  async getUnassignedAgents(): Promise<Agent[]> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .is('team_id', null)
      .eq('active', true)
      .order('first_name');

    if (error) {
      console.error('[agents.service] getUnassignedAgents error:', error);
      throw new Error(`Failed to get unassigned agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get agent names by their IDs (for error messages)
   */
  async getAgentNamesByIds(agentIds: string[]): Promise<string[]> {
    if (agentIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('agents')
      .select('first_name')
      .in('agent_user_id', agentIds)
      .eq('active', true)
      .order('first_name');

    if (error) {
      console.error('[agents.service] getAgentNamesByIds error:', error);
      throw new Error(`Failed to get agent names: ${error.message}`);
    }

    return (data || []).map((a) => a.first_name);
  }

  /**
   * Update an agent's team assignment
   */
  async updateAgentTeam(agentUserId: string, teamId: string | null): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .update({ team_id: teamId })
      .eq('agent_user_id', agentUserId)
      .select()
      .single();

    if (error) {
      console.error('[agents.service] updateAgentTeam error:', error);
      throw new Error(`Failed to update agent team: ${error.message}`);
    }

    return data;
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let agentsServiceInstance: AgentsService | null = null;

export function getAgentsService(): AgentsService {
  if (!agentsServiceInstance) {
    agentsServiceInstance = new AgentsService();
  }
  return agentsServiceInstance;
}

export const agentsService = getAgentsService();
