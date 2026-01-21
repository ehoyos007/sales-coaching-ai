// =============================================
// DASHBOARD TYPES - Frontend
// =============================================

// =============================================
// TIME RANGE TYPES
// =============================================

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export type TimeRangePreset = 'today' | 'week' | 'month' | 'quarter' | 'custom';

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

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// =============================================
// COMPLIANCE TYPES
// =============================================

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
// COMPONENT PROPS TYPES
// =============================================

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

export interface ChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  height?: number;
  color?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface DashboardApiParams {
  startDate?: string;
  endDate?: string;
  agentId?: string;
  teamId?: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  calls: 'Total Calls',
  duration: 'Talk Time (minutes)',
  compliance_score: 'Compliance Score',
  objection_resolution: 'Objection Resolution Rate',
};

export const SCORE_RATING_COLORS: Record<ScoreDistributionItem['rating'], string> = {
  excellent: '#22c55e',
  good: '#3b82f6',
  needs_improvement: '#f59e0b',
  critical: '#ef4444',
};

export const SEVERITY_COLORS: Record<ViolationSummary['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#6b7280',
};
