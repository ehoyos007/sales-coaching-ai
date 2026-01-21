// =============================================
// DASHBOARD TYPES - Team & Agent Overview
// =============================================

// =============================================
// TIME RANGE TYPES
// =============================================

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface PeriodComparison {
  current: DateRange;
  previous: DateRange;
}

// =============================================
// METRIC SUMMARY TYPES
// =============================================

export interface CallSummaryMetrics {
  totalCalls: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  avgTalkRatio: number;
  inboundCalls: number;
  outboundCalls: number;
  uniqueAgents?: number;
}

export interface ComplianceMetrics {
  avgScore: number;
  totalAnalyzed: number;
  criticalViolations?: number;
  violations?: ViolationSummary[];
}

export interface ViolationSummary {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
}

// =============================================
// AGENT BREAKDOWN TYPES
// =============================================

export interface AgentBreakdown {
  agentUserId: string;
  firstName: string | null;
  email: string | null;
  totalCalls: number;
  avgDuration: number;
  avgTalkRatio: number;
  avgComplianceScore: number;
}

// =============================================
// TEAM OVERVIEW TYPES
// =============================================

export interface TeamOverviewData {
  teamId: string;
  period: DateRange;
  summary: CallSummaryMetrics;
  compliance: ComplianceMetrics;
  agentBreakdown: AgentBreakdown[];
  previousPeriod: {
    totalCalls: number;
    avgDurationSeconds: number;
    avgTalkRatio: number;
  };
  objections?: ObjectionSummary;
  goals?: GoalProgress[];
}

// =============================================
// AGENT OVERVIEW TYPES
// =============================================

export interface TeamComparison {
  teamAvgCalls: number;
  teamAvgDuration: number;
  teamAvgTalkRatio: number;
  teamAvgCompliance: number;
  agentPercentileCalls: number;
  agentPercentileCompliance: number;
}

export interface AgentOverviewData {
  agentUserId: string;
  period: DateRange;
  summary: CallSummaryMetrics;
  compliance: ComplianceMetrics;
  previousPeriod: {
    totalCalls: number;
    avgDurationSeconds: number;
    avgTalkRatio: number;
    avgComplianceScore: number;
  };
  teamComparison: TeamComparison | null;
  objections?: ObjectionSummary;
  goals?: GoalProgress[];
  improvementAreas?: ImprovementArea[];
}

// =============================================
// TREND DATA TYPES
// =============================================

export interface DailyTrend {
  callDate: string; // YYYY-MM-DD
  callCount: number;
  inboundCount: number;
  outboundCount: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
}

export interface WeeklyTrend {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  callCount: number;
  avgDurationSeconds: number;
  avgComplianceScore: number;
}

// =============================================
// COMPLIANCE TYPES
// =============================================

export interface ComplianceScore {
  id: string;
  callId: string;
  agentUserId: string;
  overallScore: number;
  analyzedAt: string;
  rubricConfigId: string | null;
  violations: ComplianceViolation[];
  complianceNotes: string | null;
  createdAt: string;
}

export interface ComplianceViolation {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp?: string;
}

export interface ComplianceSummary {
  avgScore: number;
  totalAnalyzed: number;
  scoreDistribution: ScoreDistributionItem[];
  violationsByCategory: ViolationsByCategory[];
}

export interface ScoreDistributionItem {
  rating: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  count: number;
}

export interface ViolationsByCategory {
  category: string;
  severity: string;
  count: number;
}

// =============================================
// GOALS TYPES
// =============================================

export type GoalType = 'calls' | 'duration' | 'compliance_score' | 'objection_resolution';

export interface AgentGoal {
  id: string;
  agentUserId: string | null;
  teamId: string | null;
  goalType: GoalType;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
  actualValue: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  id: string;
  goalType: GoalType;
  targetValue: number;
  actualValue: number;
  progressPercentage: number;
  periodStart: string;
  periodEnd: string;
  isActive: boolean;
}

export interface CreateGoalInput {
  agentUserId?: string;
  teamId?: string;
  goalType: GoalType;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
}

export interface UpdateGoalInput {
  targetValue?: number;
  actualValue?: number;
  isActive?: boolean;
}

// =============================================
// OBJECTION TYPES
// =============================================

export interface ObjectionSummary {
  topObjections: ObjectionItem[];
  overallStats: {
    totalObjections: number;
    avgResponseQuality: number;
    overallResolutionRate: number;
  };
}

export interface ObjectionItem {
  objectionType: string;
  totalOccurrences: number;
  avgScore: number;
  resolutionRate: number;
}

// =============================================
// IMPROVEMENT AREAS
// =============================================

export interface ImprovementArea {
  area: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
}

// =============================================
// PERFORMANCE DELTA TYPES
// =============================================

export interface PerformanceDelta {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface TeamOverviewResponse {
  success: boolean;
  data?: TeamOverviewData;
  error?: string;
}

export interface AgentOverviewResponse {
  success: boolean;
  data?: AgentOverviewData;
  error?: string;
}

export interface CallVolumeTrendResponse {
  success: boolean;
  data?: DailyTrend[];
  error?: string;
}

export interface ComplianceSummaryResponse {
  success: boolean;
  data?: ComplianceSummary;
  error?: string;
}

export interface GoalsProgressResponse {
  success: boolean;
  data?: GoalProgress[];
  error?: string;
}

// =============================================
// DATABASE RESPONSE TYPES (from RPC functions)
// =============================================

export interface TeamOverviewRpcResult {
  team_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_calls: number;
    total_duration_seconds: number;
    avg_duration_seconds: number;
    avg_talk_ratio: number;
    inbound_calls: number;
    outbound_calls: number;
    unique_agents: number;
  };
  compliance: {
    avg_score: number;
    total_analyzed: number;
    critical_violations: number;
  };
  agent_breakdown: Array<{
    agent_user_id: string;
    first_name: string | null;
    email: string | null;
    total_calls: number;
    avg_duration: number;
    avg_talk_ratio: number;
    avg_compliance_score: number;
  }>;
  previous_period: {
    total_calls: number;
    avg_duration_seconds: number;
    avg_talk_ratio: number;
  };
}

export interface AgentOverviewRpcResult {
  agent_user_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_calls: number;
    total_duration_seconds: number;
    avg_duration_seconds: number;
    avg_talk_ratio: number;
    inbound_calls: number;
    outbound_calls: number;
  };
  compliance: {
    avg_score: number;
    total_analyzed: number;
    violations: Array<{
      category: string;
      severity: string;
      count: number;
    }>;
  };
  previous_period: {
    total_calls: number;
    avg_duration_seconds: number;
    avg_talk_ratio: number;
    avg_compliance_score: number;
  };
  team_comparison: {
    team_avg_calls: number;
    team_avg_duration: number;
    team_avg_talk_ratio: number;
    team_avg_compliance: number;
    agent_percentile_calls: number;
    agent_percentile_compliance: number;
  } | null;
}

export interface CallVolumeTrendRpcResult {
  call_date: string;
  call_count: number;
  inbound_count: number;
  outbound_count: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
}

export interface GoalsProgressRpcResult {
  id: string;
  goal_type: string;
  target_value: number;
  actual_value: number;
  progress_percentage: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
}
