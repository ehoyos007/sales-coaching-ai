// =============================================
// COMPLIANCE SERVICE - Compliance Score Management
// =============================================

import { getSupabaseClient } from '../../config/database.js';
import type {
  ComplianceScore,
  ComplianceSummary,
  ComplianceViolation,
} from '../../types/index.js';

// =============================================
// SAVE COMPLIANCE SCORE
// =============================================

/**
 * Save a compliance score for a call
 */
export async function saveComplianceScore(
  callId: string,
  agentUserId: string,
  overallScore: number,
  violations: ComplianceViolation[],
  rubricConfigId?: string,
  complianceNotes?: string
): Promise<ComplianceScore> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compliance_scores')
    .upsert({
      call_id: callId,
      agent_user_id: agentUserId,
      overall_score: overallScore,
      violations: JSON.stringify(violations),
      rubric_config_id: rubricConfigId || null,
      compliance_notes: complianceNotes || null,
      analyzed_at: new Date().toISOString(),
    }, {
      onConflict: 'call_id',
    })
    .select()
    .single();

  if (error) {
    console.error('[compliance.service] Error saving compliance score:', error);
    throw new Error(`Failed to save compliance score: ${error.message}`);
  }

  return transformComplianceScore(data);
}

// =============================================
// GET COMPLIANCE SCORE BY CALL
// =============================================

/**
 * Get compliance score for a specific call
 */
export async function getComplianceScoreByCall(
  callId: string
): Promise<ComplianceScore | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compliance_scores')
    .select('*')
    .eq('call_id', callId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[compliance.service] Error fetching compliance score:', error);
    throw new Error(`Failed to get compliance score: ${error.message}`);
  }

  return transformComplianceScore(data);
}

// =============================================
// GET AGENT COMPLIANCE HISTORY
// =============================================

/**
 * Get compliance scores for an agent within a date range
 */
export async function getAgentComplianceHistory(
  agentUserId: string,
  startDate: string,
  endDate: string
): Promise<ComplianceScore[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compliance_scores')
    .select('*')
    .eq('agent_user_id', agentUserId)
    .gte('analyzed_at', startDate)
    .lte('analyzed_at', `${endDate}T23:59:59.999Z`)
    .order('analyzed_at', { ascending: false });

  if (error) {
    console.error('[compliance.service] Error fetching agent compliance history:', error);
    throw new Error(`Failed to get agent compliance history: ${error.message}`);
  }

  return (data || []).map(transformComplianceScore);
}

// =============================================
// GET TEAM COMPLIANCE AGGREGATES
// =============================================

/**
 * Get aggregated compliance metrics for a team
 */
export async function getTeamComplianceAggregates(
  teamId: string,
  startDate: string,
  endDate: string
): Promise<ComplianceSummary> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_compliance_summary', {
    p_agent_user_id: null,
    p_team_id: teamId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('[compliance.service] Error fetching team compliance aggregates:', error);
    throw new Error(`Failed to get team compliance aggregates: ${error.message}`);
  }

  const result = data as {
    avg_score: number;
    total_analyzed: number;
    score_distribution: Array<{ rating: string; count: number }>;
    violations_by_category: Array<{ category: string; severity: string; count: number }>;
  };

  return {
    avgScore: result.avg_score || 0,
    totalAnalyzed: result.total_analyzed || 0,
    scoreDistribution: (result.score_distribution || []).map(item => ({
      rating: item.rating as 'excellent' | 'good' | 'needs_improvement' | 'critical',
      count: item.count || 0,
    })),
    violationsByCategory: (result.violations_by_category || []).map(item => ({
      category: item.category,
      severity: item.severity,
      count: item.count || 0,
    })),
  };
}

// =============================================
// GET AGENT COMPLIANCE SUMMARY
// =============================================

/**
 * Get compliance summary for a specific agent
 */
export async function getAgentComplianceSummary(
  agentUserId: string,
  startDate: string,
  endDate: string
): Promise<ComplianceSummary> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_compliance_summary', {
    p_agent_user_id: agentUserId,
    p_team_id: null,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('[compliance.service] Error fetching agent compliance summary:', error);
    throw new Error(`Failed to get agent compliance summary: ${error.message}`);
  }

  const result = data as {
    avg_score: number;
    total_analyzed: number;
    score_distribution: Array<{ rating: string; count: number }>;
    violations_by_category: Array<{ category: string; severity: string; count: number }>;
  };

  return {
    avgScore: result.avg_score || 0,
    totalAnalyzed: result.total_analyzed || 0,
    scoreDistribution: (result.score_distribution || []).map(item => ({
      rating: item.rating as 'excellent' | 'good' | 'needs_improvement' | 'critical',
      count: item.count || 0,
    })),
    violationsByCategory: (result.violations_by_category || []).map(item => ({
      category: item.category,
      severity: item.severity,
      count: item.count || 0,
    })),
  };
}

// =============================================
// DELETE COMPLIANCE SCORE
// =============================================

/**
 * Delete a compliance score
 */
export async function deleteComplianceScore(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('compliance_scores')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[compliance.service] Error deleting compliance score:', error);
    throw new Error(`Failed to delete compliance score: ${error.message}`);
  }
}

// =============================================
// TRANSFORM HELPERS
// =============================================

interface ComplianceScoreRow {
  id: string;
  call_id: string;
  agent_user_id: string;
  overall_score: number;
  analyzed_at: string;
  rubric_config_id: string | null;
  violations: string | ComplianceViolation[];
  compliance_notes: string | null;
  created_at: string;
}

function transformComplianceScore(row: ComplianceScoreRow): ComplianceScore {
  let violations: ComplianceViolation[] = [];

  if (typeof row.violations === 'string') {
    try {
      violations = JSON.parse(row.violations);
    } catch {
      violations = [];
    }
  } else if (Array.isArray(row.violations)) {
    violations = row.violations;
  }

  return {
    id: row.id,
    callId: row.call_id,
    agentUserId: row.agent_user_id,
    overallScore: row.overall_score,
    analyzedAt: row.analyzed_at,
    rubricConfigId: row.rubric_config_id,
    violations,
    complianceNotes: row.compliance_notes,
    createdAt: row.created_at,
  };
}

// =============================================
// EXPORT SERVICE
// =============================================

export const complianceService = {
  saveComplianceScore,
  getComplianceScoreByCall,
  getAgentComplianceHistory,
  getTeamComplianceAggregates,
  getAgentComplianceSummary,
  deleteComplianceScore,
};
