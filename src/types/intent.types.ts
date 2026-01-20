export enum Intent {
  LIST_CALLS = 'LIST_CALLS',
  AGENT_STATS = 'AGENT_STATS',
  TEAM_SUMMARY = 'TEAM_SUMMARY',
  GET_TRANSCRIPT = 'GET_TRANSCRIPT',
  SEARCH_CALLS = 'SEARCH_CALLS',
  COACHING = 'COACHING',
  GENERAL = 'GENERAL',
}

export interface IntentClassification {
  intent: Intent;
  agent_name: string | null;
  days_back: number;
  call_id: string | null;
  search_query: string | null;
  confidence: number;
}

export interface HandlerParams {
  agentId?: string;
  agentName?: string;
  daysBack: number;
  callId?: string;
  searchQuery?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface HandlerResult {
  success: boolean;
  data: unknown;
  error?: string;
}
