// Agent types
export interface Agent {
  agent_user_id: string;
  first_name: string;
  email: string | null;
  department: string | null;
  extension: string | null;
  active: boolean;
  admin: boolean;
  created_at: string;
}

export interface AgentWithStats extends Agent {
  total_calls?: number;
}

// User and Team types for Admin Panel
export type UserRole = 'agent' | 'manager' | 'admin';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  role: UserRole;
  team_id: string | null;
  team?: Team;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Call types
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
  is_inbound_call: boolean;
}

export interface CallTurn {
  id: number;
  call_id: string;
  agent_user_id: string;
  turn_number: number;
  speaker: 'Agent' | 'Customer';
  text: string;
  timestamp_start: string;
  timestamp_end: string;
  duration_seconds: number;
}

export interface CallTranscript {
  call_id: string;
  agent_name: string;
  call_date: string;
  total_duration_formatted: string;
  turns: CallTurn[];
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

export interface TeamSummary {
  department: string;
  total_agents: number;
  total_calls: number;
  total_duration_minutes: number;
  avg_calls_per_agent: number;
  avg_duration_seconds: number;
  avg_agent_talk_percentage: number;
  top_performer: {
    agent_name: string;
    call_count: number;
  } | null;
}

export interface SearchResult {
  call_id: string;
  agent_user_id: string;
  agent_name: string;
  call_date: string;
  chunk_text: string;
  similarity: number;
  start_timestamp: string;
  end_timestamp: string;
}

// Intent types
export enum Intent {
  LIST_CALLS = 'LIST_CALLS',
  AGENT_STATS = 'AGENT_STATS',
  TEAM_SUMMARY = 'TEAM_SUMMARY',
  GET_TRANSCRIPT = 'GET_TRANSCRIPT',
  SEARCH_CALLS = 'SEARCH_CALLS',
  COACHING = 'COACHING',
  GENERAL = 'GENERAL',
}

// Chat types
export interface ChatContext {
  agent_user_id?: string;
  call_id?: string;
  department?: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  context?: ChatContext;
}

export interface ChatResponseData {
  type: 'call_list' | 'agent_stats' | 'team_summary' | 'transcript' | 'search_results' | 'general';
  calls?: CallSummary[];
  agent?: Agent;
  performance?: AgentPerformance;
  team_summary?: TeamSummary;
  transcript?: CallTranscript;
  search_results?: SearchResult[];
  [key: string]: unknown;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  data?: ChatResponseData;
  intent: Intent;
  timestamp: string;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// UI types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: ChatResponseData;
  intent?: Intent;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  context: ChatContext;
}

// Chat history types for API responses
export interface ChatMessageRecord {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent: string | null;
  data: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
}

export interface ChatSessionRecord {
  id: string;
  session_id: string;
  context: ChatContext;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  message_count: number;
  is_active: boolean;
}

export interface ChatHistoryResponse {
  session: ChatSessionRecord | null;
  messages: ChatMessageRecord[];
}

// Rubric types
export type RedFlagSeverity = 'critical' | 'high' | 'medium';
export type ThresholdType = 'boolean' | 'percentage';

export interface RubricScoringCriteria {
  id: string;
  category_id: string;
  score: number;
  criteria_text: string;
  created_at: string;
}

export interface ScoringCriteriaInput {
  score: number;
  criteria_text: string;
}

export interface RubricCategory {
  id: string;
  rubric_config_id: string;
  name: string;
  slug: string;
  description: string | null;
  weight: number;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
  scoring_criteria?: RubricScoringCriteria[];
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  weight: number;
  sort_order: number;
  is_enabled?: boolean;
  scoring_criteria?: ScoringCriteriaInput[];
}

export interface RubricRedFlag {
  id: string;
  rubric_config_id: string;
  flag_key: string;
  display_name: string;
  description: string;
  severity: RedFlagSeverity;
  threshold_type: ThresholdType | null;
  threshold_value: number | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface RedFlagInput {
  flag_key: string;
  display_name: string;
  description: string;
  severity: RedFlagSeverity;
  threshold_type?: ThresholdType;
  threshold_value?: number;
  is_enabled?: boolean;
  sort_order?: number;
}

export interface RubricConfig {
  id: string;
  name: string;
  description: string | null;
  version: number;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  categories?: RubricCategory[];
  red_flags?: RubricRedFlag[];
}

export interface RubricConfigWithRelations extends RubricConfig {
  categories: (RubricCategory & {
    scoring_criteria: RubricScoringCriteria[];
  })[];
  red_flags: RubricRedFlag[];
}

export interface RubricVersionSummary {
  id: string;
  name: string;
  version: number;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRubricConfigInput {
  name: string;
  description?: string;
  is_draft?: boolean;
  clone_from_id?: string;
  categories?: CategoryInput[];
  red_flags?: RedFlagInput[];
}

export interface UpdateRubricConfigInput {
  name?: string;
  description?: string;
  categories?: CategoryInput[];
  red_flags?: RedFlagInput[];
}

export interface WeightValidation {
  isValid: boolean;
  total: number;
  remaining: number;
  message?: string;
}

export function validateCategoryWeights(categories: { weight: number; is_enabled?: boolean }[]): WeightValidation {
  const enabledCategories = categories.filter(c => c.is_enabled !== false);
  const total = enabledCategories.reduce((sum, c) => sum + c.weight, 0);
  const remaining = 100 - total;

  return {
    isValid: Math.abs(remaining) < 0.01,
    total: Math.round(total * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    message: remaining === 0
      ? undefined
      : remaining > 0
        ? `${remaining}% remaining to allocate`
        : `${Math.abs(remaining)}% over the limit`,
  };
}

// Auth types - re-export from auth.types.ts
export type {
  AuthUser,
  AuthSession,
  SignInResponse,
  SignUpResponse,
  MeResponse,
} from './auth.types';
