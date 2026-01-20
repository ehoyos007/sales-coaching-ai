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
