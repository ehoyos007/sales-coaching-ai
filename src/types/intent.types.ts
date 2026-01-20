export enum Intent {
  LIST_CALLS = 'LIST_CALLS',
  AGENT_STATS = 'AGENT_STATS',
  TEAM_SUMMARY = 'TEAM_SUMMARY',
  GET_TRANSCRIPT = 'GET_TRANSCRIPT',
  SEARCH_CALLS = 'SEARCH_CALLS',
  COACHING = 'COACHING',
  OBJECTION_ANALYSIS = 'OBJECTION_ANALYSIS',
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

export interface DataAccessScope {
  agentUserIds: string[];
  isFloorWide: boolean;
  isTeamScope: boolean;
  teamId: string | null;
  teamName: string | null;
}

export interface UserContext {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  teamId: string | null;
  agentUserId: string | null;
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
  // Auth context
  dataScope?: DataAccessScope;
  userContext?: UserContext;
}

export interface HandlerResult {
  success: boolean;
  data: unknown;
  error?: string;
}
