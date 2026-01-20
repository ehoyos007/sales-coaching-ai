import type {
  Agent,
  ApiResponse,
  CallMetadata,
  CallTranscript,
  ChatRequest,
  ChatResponse,
  AgentPerformance,
  TeamSummary,
  SearchResult,
  CallSummary,
} from '../types';

// Use environment variable for API URL, fallback to relative path for dev proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP error ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// Chat API
export async function sendChatMessage(
  message: string,
  sessionId?: string,
  context?: ChatRequest['context']
): Promise<ChatResponse> {
  const payload: ChatRequest = {
    message,
    session_id: sessionId,
    context,
  };

  return request<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Agents API
export async function getAgents(): Promise<ApiResponse<Agent[]>> {
  return request<ApiResponse<Agent[]>>('/agents');
}

export async function getAgentCalls(
  agentId: string,
  params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<ApiResponse<CallSummary[]>> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const query = searchParams.toString();
  const endpoint = `/agents/${agentId}/calls${query ? `?${query}` : ''}`;

  return request<ApiResponse<CallSummary[]>>(endpoint);
}

export async function getAgentPerformance(
  agentId: string,
  params?: {
    start_date?: string;
    end_date?: string;
  }
): Promise<ApiResponse<AgentPerformance>> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  const endpoint = `/agents/${agentId}/performance${query ? `?${query}` : ''}`;

  return request<ApiResponse<AgentPerformance>>(endpoint);
}

// Calls API
export async function getCallDetails(
  callId: string
): Promise<ApiResponse<CallMetadata>> {
  return request<ApiResponse<CallMetadata>>(`/calls/${callId}`);
}

export async function getCallTranscript(
  callId: string
): Promise<ApiResponse<CallTranscript>> {
  return request<ApiResponse<CallTranscript>>(`/calls/${callId}/transcript`);
}

// Search API
export async function searchCalls(params: {
  query: string;
  agent_user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<ApiResponse<SearchResult[]>> {
  return request<ApiResponse<SearchResult[]>>('/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Team API
export async function getTeamSummary(params?: {
  department?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ApiResponse<TeamSummary>> {
  const searchParams = new URLSearchParams();
  if (params?.department) searchParams.set('department', params.department);
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  const endpoint = `/team/summary${query ? `?${query}` : ''}`;

  return request<ApiResponse<TeamSummary>>(endpoint);
}

export { ApiError };
