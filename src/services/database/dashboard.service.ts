// =============================================
// DASHBOARD SERVICE - Team & Agent Overview Metrics
// =============================================

import { getSupabaseClient } from '../../config/database.js';
import type {
  TeamOverviewData,
  AgentOverviewData,
  DailyTrend,
  TeamOverviewRpcResult,
  AgentOverviewRpcResult,
  CallVolumeTrendRpcResult,
  ObjectionSummary,
} from '../../types/index.js';

// =============================================
// TEAM OVERVIEW METRICS
// =============================================

/**
 * Get aggregated team overview metrics
 */
export async function getTeamOverviewMetrics(
  teamId: string,
  startDate: string,
  endDate: string
): Promise<TeamOverviewData | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_team_overview_metrics', {
    p_team_id: teamId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('[dashboard.service] Error fetching team overview:', error);
    throw new Error(`Failed to get team overview: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const rpcResult = data as TeamOverviewRpcResult;

  return transformTeamOverviewData(rpcResult);
}

/**
 * Transform RPC result to TeamOverviewData
 */
function transformTeamOverviewData(rpcResult: TeamOverviewRpcResult): TeamOverviewData {
  return {
    teamId: rpcResult.team_id,
    period: {
      startDate: rpcResult.period.start_date,
      endDate: rpcResult.period.end_date,
    },
    summary: {
      totalCalls: rpcResult.summary.total_calls || 0,
      totalDurationSeconds: rpcResult.summary.total_duration_seconds || 0,
      avgDurationSeconds: rpcResult.summary.avg_duration_seconds || 0,
      avgTalkRatio: rpcResult.summary.avg_talk_ratio || 0,
      inboundCalls: rpcResult.summary.inbound_calls || 0,
      outboundCalls: rpcResult.summary.outbound_calls || 0,
      uniqueAgents: rpcResult.summary.unique_agents || 0,
    },
    compliance: {
      avgScore: rpcResult.compliance.avg_score || 0,
      totalAnalyzed: rpcResult.compliance.total_analyzed || 0,
      criticalViolations: rpcResult.compliance.critical_violations || 0,
    },
    agentBreakdown: (rpcResult.agent_breakdown || []).map(agent => ({
      agentUserId: agent.agent_user_id,
      firstName: agent.first_name,
      email: agent.email,
      totalCalls: agent.total_calls || 0,
      avgDuration: agent.avg_duration || 0,
      avgTalkRatio: agent.avg_talk_ratio || 0,
      avgComplianceScore: agent.avg_compliance_score || 0,
    })),
    previousPeriod: {
      totalCalls: rpcResult.previous_period.total_calls || 0,
      avgDurationSeconds: rpcResult.previous_period.avg_duration_seconds || 0,
      avgTalkRatio: rpcResult.previous_period.avg_talk_ratio || 0,
    },
  };
}

// =============================================
// AGENT OVERVIEW METRICS
// =============================================

/**
 * Get individual agent overview metrics
 */
export async function getAgentOverviewMetrics(
  agentUserId: string,
  startDate: string,
  endDate: string
): Promise<AgentOverviewData | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_agent_overview_metrics', {
    p_agent_user_id: agentUserId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('[dashboard.service] Error fetching agent overview:', error);
    throw new Error(`Failed to get agent overview: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const rpcResult = data as AgentOverviewRpcResult;

  return transformAgentOverviewData(rpcResult);
}

/**
 * Transform RPC result to AgentOverviewData
 */
function transformAgentOverviewData(rpcResult: AgentOverviewRpcResult): AgentOverviewData {
  return {
    agentUserId: rpcResult.agent_user_id,
    period: {
      startDate: rpcResult.period.start_date,
      endDate: rpcResult.period.end_date,
    },
    summary: {
      totalCalls: rpcResult.summary.total_calls || 0,
      totalDurationSeconds: rpcResult.summary.total_duration_seconds || 0,
      avgDurationSeconds: rpcResult.summary.avg_duration_seconds || 0,
      avgTalkRatio: rpcResult.summary.avg_talk_ratio || 0,
      inboundCalls: rpcResult.summary.inbound_calls || 0,
      outboundCalls: rpcResult.summary.outbound_calls || 0,
    },
    compliance: {
      avgScore: rpcResult.compliance.avg_score || 0,
      totalAnalyzed: rpcResult.compliance.total_analyzed || 0,
      violations: (rpcResult.compliance.violations || []).map(v => ({
        category: v.category,
        severity: v.severity as 'critical' | 'high' | 'medium' | 'low',
        count: v.count,
      })),
    },
    previousPeriod: {
      totalCalls: rpcResult.previous_period.total_calls || 0,
      avgDurationSeconds: rpcResult.previous_period.avg_duration_seconds || 0,
      avgTalkRatio: rpcResult.previous_period.avg_talk_ratio || 0,
      avgComplianceScore: rpcResult.previous_period.avg_compliance_score || 0,
    },
    teamComparison: rpcResult.team_comparison ? {
      teamAvgCalls: rpcResult.team_comparison.team_avg_calls || 0,
      teamAvgDuration: rpcResult.team_comparison.team_avg_duration || 0,
      teamAvgTalkRatio: rpcResult.team_comparison.team_avg_talk_ratio || 0,
      teamAvgCompliance: rpcResult.team_comparison.team_avg_compliance || 0,
      agentPercentileCalls: rpcResult.team_comparison.agent_percentile_calls || 0,
      agentPercentileCompliance: rpcResult.team_comparison.agent_percentile_compliance || 0,
    } : null,
  };
}

// =============================================
// CALL VOLUME TREND
// =============================================

/**
 * Get call volume trend data for charts
 */
export async function getCallVolumeTrend(
  agentUserId?: string,
  teamId?: string,
  startDate?: string,
  endDate?: string
): Promise<DailyTrend[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_call_volume_trend', {
    p_agent_user_id: agentUserId || null,
    p_team_id: teamId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    console.error('[dashboard.service] Error fetching call volume trend:', error);
    throw new Error(`Failed to get call volume trend: ${error.message}`);
  }

  const rpcResults = (data || []) as CallVolumeTrendRpcResult[];

  return rpcResults.map(row => ({
    callDate: row.call_date,
    callCount: row.call_count || 0,
    inboundCount: row.inbound_count || 0,
    outboundCount: row.outbound_count || 0,
    totalDurationSeconds: row.total_duration_seconds || 0,
    avgDurationSeconds: row.avg_duration_seconds || 0,
  }));
}

// =============================================
// OBJECTION SUMMARY
// =============================================

/**
 * Get objection handling summary for dashboard
 */
export async function getObjectionSummary(
  agentUserId?: string,
  teamId?: string,
  startDate?: string,
  endDate?: string
): Promise<ObjectionSummary> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_objection_summary', {
    p_agent_user_id: agentUserId || null,
    p_team_id: teamId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    console.error('[dashboard.service] Error fetching objection summary:', error);
    throw new Error(`Failed to get objection summary: ${error.message}`);
  }

  const result = data as {
    top_objections: Array<{
      objection_type: string;
      total_occurrences: number;
      avg_score: number;
      resolution_rate: number;
    }>;
    overall_stats: {
      total_objections: number;
      avg_response_quality: number;
      overall_resolution_rate: number;
    };
  };

  return {
    topObjections: (result.top_objections || []).map(obj => ({
      objectionType: obj.objection_type,
      totalOccurrences: obj.total_occurrences || 0,
      avgScore: obj.avg_score || 0,
      resolutionRate: obj.resolution_rate || 0,
    })),
    overallStats: {
      totalObjections: result.overall_stats?.total_objections || 0,
      avgResponseQuality: result.overall_stats?.avg_response_quality || 0,
      overallResolutionRate: result.overall_stats?.overall_resolution_rate || 0,
    },
  };
}

// =============================================
// EXPORT SERVICE
// =============================================

export const dashboardService = {
  getTeamOverviewMetrics,
  getAgentOverviewMetrics,
  getCallVolumeTrend,
  getObjectionSummary,
};
