import { captureError } from '../lib/sentry';
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
  ChatHistoryResponse,
  RubricConfigWithRelations,
  RubricVersionSummary,
  CreateRubricConfigInput,
  UpdateRubricConfigInput,
  SignInResponse,
  SignUpResponse,
  MeResponse,
  UserProfile,
  UserRole,
  Team,
  ScriptsByProductType,
  ScriptWithSyncStatus,
  SalesScript,
  ProductType,
  RubricSyncLog,
  SyncAnalysisResponse,
  ApplySyncInput,
  TeamOverviewData,
  AgentOverviewData,
  DailyTrend,
  ComplianceSummary,
  GoalProgress,
  CreateGoalInput,
} from '../types';

// Use environment variable for API URL, fallback to relative path for dev proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const TOKEN_KEY = 'auth_token';

// Token management functions
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Auto-attach Authorization header if token exists
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle 401 responses by clearing token and redirecting to login
      if (response.status === 401) {
        clearToken();
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      throw new ApiError(
        data.error || `HTTP error ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      // Capture 5xx errors to Sentry
      if (error.status >= 500) {
        captureError(error, { endpoint, status: error.status });
      }
      throw error;
    }
    // Capture unexpected errors
    const apiError = new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
    captureError(apiError, { endpoint, originalError: error });
    throw apiError;
  }
}

// Auth API
export async function signUp(
  email: string,
  password: string,
  fullName?: string
): Promise<SignUpResponse> {
  return request<SignUpResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
}

export async function signIn(
  email: string,
  password: string
): Promise<SignInResponse> {
  const response = await request<SignInResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Store token on successful sign in
  if (response.success && response.data?.session.access_token) {
    setToken(response.data.session.access_token);
  }

  return response;
}

export async function signOut(): Promise<ApiResponse<{ message: string }>> {
  const response = await request<ApiResponse<{ message: string }>>('/auth/signout', {
    method: 'POST',
  });

  // Clear token on sign out
  clearToken();

  return response;
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>('/auth/me');
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

export async function getChatHistory(
  sessionId: string
): Promise<ApiResponse<ChatHistoryResponse>> {
  return request<ApiResponse<ChatHistoryResponse>>(`/chat/history/${sessionId}`);
}

// Agents API
export async function getAgents(): Promise<ApiResponse<{ agents: Agent[]; count: number }>> {
  return request<ApiResponse<{ agents: Agent[]; count: number }>>('/agents');
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

// Rubric API
export async function getActiveRubric(): Promise<ApiResponse<RubricConfigWithRelations>> {
  return request<ApiResponse<RubricConfigWithRelations>>('/rubric');
}

export async function getRubricVersions(): Promise<ApiResponse<{ versions: RubricVersionSummary[]; count: number }>> {
  return request<ApiResponse<{ versions: RubricVersionSummary[]; count: number }>>('/rubric/versions');
}

export async function getRubricById(id: string): Promise<ApiResponse<RubricConfigWithRelations>> {
  return request<ApiResponse<RubricConfigWithRelations>>(`/rubric/${id}`);
}

export async function createRubric(
  input: CreateRubricConfigInput
): Promise<ApiResponse<RubricConfigWithRelations>> {
  return request<ApiResponse<RubricConfigWithRelations>>('/rubric', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateRubric(
  id: string,
  input: UpdateRubricConfigInput
): Promise<ApiResponse<RubricConfigWithRelations>> {
  return request<ApiResponse<RubricConfigWithRelations>>(`/rubric/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function activateRubric(
  id: string
): Promise<ApiResponse<RubricConfigWithRelations>> {
  return request<ApiResponse<RubricConfigWithRelations>>(`/rubric/${id}/activate`, {
    method: 'POST',
  });
}

export async function deleteRubric(id: string): Promise<ApiResponse<{ message: string }>> {
  return request<ApiResponse<{ message: string }>>(`/rubric/${id}`, {
    method: 'DELETE',
  });
}

// Admin API - User Management
export async function getAdminUsers(): Promise<ApiResponse<{ users: UserProfile[]; count: number }>> {
  return request<ApiResponse<{ users: UserProfile[]; count: number }>>('/admin/users');
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<ApiResponse<{ profile: UserProfile }>> {
  return request<ApiResponse<{ profile: UserProfile }>>(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function updateUserTeam(
  userId: string,
  teamId: string | null
): Promise<ApiResponse<{ profile: UserProfile }>> {
  return request<ApiResponse<{ profile: UserProfile }>>(`/admin/users/${userId}/team`, {
    method: 'PUT',
    body: JSON.stringify({ team_id: teamId }),
  });
}

// Admin API - Team Management
export async function getAdminTeams(): Promise<ApiResponse<{ teams: Team[]; count: number }>> {
  return request<ApiResponse<{ teams: Team[]; count: number }>>('/admin/teams');
}

export async function createTeam(
  name: string,
  description?: string,
  managerId?: string
): Promise<ApiResponse<{ team: Team }>> {
  return request<ApiResponse<{ team: Team }>>('/admin/teams', {
    method: 'POST',
    body: JSON.stringify({ name, description, manager_id: managerId }),
  });
}

export async function updateTeam(
  teamId: string,
  updates: { name?: string; description?: string; manager_id?: string | null }
): Promise<ApiResponse<{ team: Team }>> {
  return request<ApiResponse<{ team: Team }>>(`/admin/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTeam(teamId: string): Promise<ApiResponse<void>> {
  return request<ApiResponse<void>>(`/admin/teams/${teamId}`, {
    method: 'DELETE',
  });
}

// Admin API - Agent Management (Sales Agents)
export async function getAdminAgents(): Promise<ApiResponse<{ agents: Agent[]; count: number }>> {
  return request<ApiResponse<{ agents: Agent[]; count: number }>>('/admin/agents');
}

export async function updateAgentTeam(
  agentUserId: string,
  teamId: string | null
): Promise<ApiResponse<{ agent: Agent }>> {
  return request<ApiResponse<{ agent: Agent }>>(`/admin/agents/${agentUserId}/team`, {
    method: 'PUT',
    body: JSON.stringify({ teamId }),
  });
}

// Sales Scripts API
export async function getScripts(): Promise<ApiResponse<ScriptsByProductType>> {
  return request<ApiResponse<ScriptsByProductType>>('/scripts');
}

export async function getScriptById(id: string): Promise<ApiResponse<ScriptWithSyncStatus>> {
  return request<ApiResponse<ScriptWithSyncStatus>>(`/scripts/${id}`);
}

export async function uploadScript(
  file: File,
  name: string,
  productType: ProductType,
  versionNotes?: string
): Promise<ApiResponse<SalesScript>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('product_type', productType);
  if (versionNotes) {
    formData.append('version_notes', versionNotes);
  }

  const url = `${API_BASE_URL}/scripts`;
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || `HTTP error ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

export async function updateScript(
  id: string,
  updates: { name?: string; version_notes?: string }
): Promise<ApiResponse<SalesScript>> {
  return request<ApiResponse<SalesScript>>(`/scripts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteScript(id: string): Promise<ApiResponse<{ message: string }>> {
  return request<ApiResponse<{ message: string }>>(`/scripts/${id}`, {
    method: 'DELETE',
  });
}

export async function activateScript(id: string): Promise<ApiResponse<SalesScript>> {
  return request<ApiResponse<SalesScript>>(`/scripts/${id}/activate`, {
    method: 'POST',
  });
}

export async function startScriptSync(scriptId: string): Promise<ApiResponse<SyncAnalysisResponse>> {
  return request<ApiResponse<SyncAnalysisResponse>>(`/scripts/${scriptId}/sync`, {
    method: 'POST',
  });
}

export async function getSyncStatus(syncLogId: string): Promise<ApiResponse<RubricSyncLog>> {
  return request<ApiResponse<RubricSyncLog>>(`/scripts/sync/${syncLogId}`);
}

export async function applySyncChanges(
  syncLogId: string,
  approvedChanges: ApplySyncInput
): Promise<ApiResponse<RubricConfigWithRelations>> {
  return request<ApiResponse<RubricConfigWithRelations>>(`/scripts/sync/${syncLogId}/apply`, {
    method: 'POST',
    body: JSON.stringify(approvedChanges),
  });
}

export async function rejectSync(syncLogId: string): Promise<ApiResponse<RubricSyncLog>> {
  return request<ApiResponse<RubricSyncLog>>(`/scripts/sync/${syncLogId}/reject`, {
    method: 'POST',
  });
}

// Dashboard API

export async function getTeamOverview(
  teamId: string,
  params?: { start_date?: string; end_date?: string }
): Promise<ApiResponse<TeamOverviewData>> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  const endpoint = `/dashboard/teams/${teamId}/overview${query ? `?${query}` : ''}`;

  return request<ApiResponse<TeamOverviewData>>(endpoint);
}

export async function getAgentOverview(
  agentId: string,
  params?: { start_date?: string; end_date?: string }
): Promise<ApiResponse<AgentOverviewData>> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  const endpoint = `/dashboard/agents/${agentId}/overview${query ? `?${query}` : ''}`;

  return request<ApiResponse<AgentOverviewData>>(endpoint);
}

export async function getCallVolumeTrend(params?: {
  agent_id?: string;
  team_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ApiResponse<DailyTrend[]>> {
  const searchParams = new URLSearchParams();
  if (params?.agent_id) searchParams.set('agent_id', params.agent_id);
  if (params?.team_id) searchParams.set('team_id', params.team_id);
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  const endpoint = `/dashboard/trends/call-volume${query ? `?${query}` : ''}`;

  return request<ApiResponse<DailyTrend[]>>(endpoint);
}

export async function getDashboardComplianceSummary(params: {
  agent_id?: string;
  team_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ApiResponse<ComplianceSummary>> {
  const searchParams = new URLSearchParams();
  if (params.agent_id) searchParams.set('agent_id', params.agent_id);
  if (params.team_id) searchParams.set('team_id', params.team_id);
  if (params.start_date) searchParams.set('start_date', params.start_date);
  if (params.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  const endpoint = `/dashboard/compliance/summary${query ? `?${query}` : ''}`;

  return request<ApiResponse<ComplianceSummary>>(endpoint);
}

export async function getGoalsProgress(params?: {
  agent_id?: string;
  team_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ApiResponse<GoalProgress[]>> {
  const searchParams = new URLSearchParams();
  if (params?.agent_id) searchParams.set('agent_id', params.agent_id);
  if (params?.team_id) searchParams.set('team_id', params.team_id);
  if (params?.start_date) searchParams.set('start_date', params.start_date);
  if (params?.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  const endpoint = `/dashboard/goals/progress${query ? `?${query}` : ''}`;

  return request<ApiResponse<GoalProgress[]>>(endpoint);
}

export async function createGoal(input: CreateGoalInput): Promise<ApiResponse<GoalProgress>> {
  return request<ApiResponse<GoalProgress>>('/dashboard/goals', {
    method: 'POST',
    body: JSON.stringify({
      agent_user_id: input.agentUserId,
      team_id: input.teamId,
      goal_type: input.goalType,
      target_value: input.targetValue,
      period_start: input.periodStart,
      period_end: input.periodEnd,
    }),
  });
}

export async function updateGoal(
  goalId: string,
  updates: { target_value?: number; actual_value?: number; is_active?: boolean }
): Promise<ApiResponse<GoalProgress>> {
  return request<ApiResponse<GoalProgress>>(`/dashboard/goals/${goalId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteGoal(goalId: string): Promise<ApiResponse<{ message: string }>> {
  return request<ApiResponse<{ message: string }>>(`/dashboard/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export { ApiError };
