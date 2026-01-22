/**
 * Calls Service for Vercel serverless functions
 * Handles call data retrieval and queries
 */
import { getSupabaseClient } from '../database';

// =============================================
// TYPES
// =============================================

export interface CallMetadata {
  call_id: string;
  agent_user_id: string;
  lead_id: string | null;
  call_date: string;
  call_datetime: string;
  department: string | null;
  total_duration_seconds: number;
  total_duration_formatted: string;
  total_turns: number;
  agent_turns: number;
  customer_turns: number;
  agent_talk_percentage: number;
  customer_talk_percentage: number;
  full_transcript: string | null;
  agent_only_transcript: string | null;
  customer_only_transcript: string | null;
  is_inbound_call: boolean;
  is_redacted: boolean;
}

export interface CallSummary {
  call_id: string;
  call_date: string;
  call_datetime: string;
  total_duration_formatted: string;
  total_turns: number;
  agent_talk_percentage: number;
  customer_talk_percentage: number;
  is_inbound_call: boolean;
  agent_user_id?: string;
  duration_seconds?: number;
  total_duration_seconds?: number;
}

export interface AgentPerformance {
  agent_user_id: string;
  agent_name: string;
  total_calls: number;
  total_duration_minutes: number;
  avg_duration_seconds: number;
  avg_agent_talk_percentage: number;
  avg_customer_talk_percentage: number;
  avg_turns_per_call: number;
  inbound_calls: number;
  outbound_calls: number;
}

export interface AgentDailyCalls {
  call_date: string;
  call_count: number;
  total_duration_minutes: number;
  avg_duration_seconds: number;
}

// =============================================
// SERVICE CLASS
// =============================================

export class CallsService {
  private supabase = getSupabaseClient();

  /**
   * Get calls for a specific agent within a date range
   * Calls the get_agent_calls PostgreSQL function
   */
  async getAgentCalls(
    agentUserId: string,
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<CallSummary[]> {
    const { data, error } = await this.supabase.rpc('get_agent_calls', {
      p_agent_user_id: agentUserId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: limit,
    });

    if (error) {
      console.error('[calls.service] getAgentCalls error:', error);
      throw new Error(`Failed to get agent calls: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single call by ID
   */
  async getCallById(callId: string): Promise<CallMetadata | null> {
    const { data, error } = await this.supabase
      .from('call_metadata')
      .select('*')
      .eq('call_id', callId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[calls.service] getCallById error:', error);
      throw new Error(`Failed to get call: ${error.message}`);
    }

    return data;
  }

  /**
   * Get performance metrics for an agent
   * Calls the get_agent_performance PostgreSQL function
   */
  async getAgentPerformance(
    agentUserId: string,
    startDate: string,
    endDate: string
  ): Promise<AgentPerformance | null> {
    const { data, error } = await this.supabase.rpc('get_agent_performance', {
      p_agent_user_id: agentUserId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('[calls.service] getAgentPerformance error:', error);
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
  async getAgentDailyCalls(
    agentUserId: string,
    startDate: string,
    endDate: string
  ): Promise<AgentDailyCalls[]> {
    const { data, error } = await this.supabase.rpc('get_agent_daily_calls', {
      p_agent_user_id: agentUserId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('[calls.service] getAgentDailyCalls error:', error);
      throw new Error(`Failed to get agent daily calls: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent calls across all agents within a date range
   * For admin-level views without agent filtering
   */
  async getRecentCalls(
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<CallSummary[]> {
    const { data, error } = await this.supabase
      .from('call_metadata')
      .select('*')
      .gte('call_date', startDate)
      .lte('call_date', endDate)
      .order('call_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[calls.service] getRecentCalls error:', error);
      throw new Error(`Failed to get recent calls: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get calls filtered by minimum duration (in seconds)
   * For finding long calls across all agents
   */
  async getCallsByDuration(
    minDurationSeconds: number,
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<CallSummary[]> {
    const { data, error } = await this.supabase
      .from('call_metadata')
      .select('*')
      .gte('call_date', startDate)
      .lte('call_date', endDate)
      .gte('duration_seconds', minDurationSeconds)
      .order('duration_seconds', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[calls.service] getCallsByDuration error:', error);
      throw new Error(`Failed to get calls by duration: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get calls for multiple agents (for team views)
   */
  async getCallsForAgents(
    agentUserIds: string[],
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<CallSummary[]> {
    if (agentUserIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('call_metadata')
      .select('*')
      .in('agent_user_id', agentUserIds)
      .gte('call_date', startDate)
      .lte('call_date', endDate)
      .order('call_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[calls.service] getCallsForAgents error:', error);
      throw new Error(`Failed to get calls for agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Count calls for an agent in a date range
   */
  async countAgentCalls(
    agentUserId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const { count, error } = await this.supabase
      .from('call_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('agent_user_id', agentUserId)
      .gte('call_date', startDate)
      .lte('call_date', endDate);

    if (error) {
      console.error('[calls.service] countAgentCalls error:', error);
      throw new Error(`Failed to count agent calls: ${error.message}`);
    }

    return count || 0;
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let callsServiceInstance: CallsService | null = null;

export function getCallsService(): CallsService {
  if (!callsServiceInstance) {
    callsServiceInstance = new CallsService();
  }
  return callsServiceInstance;
}

export const callsService = getCallsService();
