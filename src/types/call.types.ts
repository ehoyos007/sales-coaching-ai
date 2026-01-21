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
  // Optional fields returned from call_metadata queries
  agent_user_id?: string;
  duration_seconds?: number;
  total_duration_seconds?: number;
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

export interface AgentDailyCalls {
  call_date: string;
  call_count: number;
  total_duration_minutes: number;
  avg_duration_seconds: number;
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
