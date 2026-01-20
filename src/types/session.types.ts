import { ChatContext } from './chat.types.js';
import { Intent } from './intent.types.js';

/**
 * Database row type for chat_sessions table
 */
export interface ChatSessionRow {
  id: string;
  session_id: string;
  context: ChatContext;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  message_count: number;
  is_active: boolean;
}

/**
 * Database row type for chat_messages table
 */
export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent: string | null;
  data: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
}

/**
 * Input for creating a new chat session
 */
export interface CreateSessionInput {
  session_id: string;
  context?: ChatContext;
}

/**
 * Input for saving a chat message
 */
export interface SaveMessageInput {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: Intent;
  data?: Record<string, unknown>;
  token_count?: number;
}

/**
 * Formatted message for Claude's message history
 */
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Session with messages for API responses
 */
export interface SessionWithMessages {
  session: ChatSessionRow;
  messages: ChatMessageRow[];
}
