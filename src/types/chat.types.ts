import { Intent } from './intent.types.js';

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

export interface ChatResponse {
  success: boolean;
  response: string;
  data?: {
    type: string;
    [key: string]: unknown;
  };
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
