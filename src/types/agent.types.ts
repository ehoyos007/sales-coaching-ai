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

export interface ResolvedAgent {
  agent_user_id: string;
  first_name: string;
  similarity_score: number;
}
