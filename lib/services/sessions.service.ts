/**
 * Sessions Service for Vercel serverless functions
 * Handles chat session management and message persistence
 */
import { getSupabaseClient } from '../database';

// =============================================
// TYPES
// =============================================

export interface ChatContext {
  agent_user_id?: string;
  call_id?: string;
  department?: string;
  user_id?: string;
  user_role?: string;
}

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

export interface CreateSessionInput {
  session_id: string;
  user_id?: string;
  context?: ChatContext;
}

export interface SaveMessageInput {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  data?: Record<string, unknown>;
  token_count?: number;
}

export interface SessionWithMessages {
  session: ChatSessionRow;
  messages: ChatMessageRow[];
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

// =============================================
// SERVICE CLASS
// =============================================

export class SessionsService {
  private supabase = getSupabaseClient();

  /**
   * Get or create a chat session
   * If session exists, returns it; otherwise creates a new one
   */
  async getOrCreateSession(input: CreateSessionInput): Promise<ChatSessionRow> {
    const { session_id, context } = input;

    // Try to get existing session
    const { data: existing, error: fetchError } = await this.supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (existing && !fetchError) {
      console.log(`[sessions.service] Found existing session: ${session_id}`);

      // Update context if provided and different
      if (context && JSON.stringify(existing.context) !== JSON.stringify(context)) {
        const { data: updated, error: updateError } = await this.supabase
          .from('chat_sessions')
          .update({
            context: { ...existing.context, ...context },
            last_activity_at: new Date().toISOString(),
          })
          .eq('session_id', session_id)
          .select()
          .single();

        if (updateError) {
          console.error('[sessions.service] Error updating session context:', updateError);
        } else if (updated) {
          return updated as ChatSessionRow;
        }
      }

      return existing as ChatSessionRow;
    }

    // Create new session
    console.log(`[sessions.service] Creating new session: ${session_id}`);

    const { data: newSession, error: createError } = await this.supabase
      .from('chat_sessions')
      .insert({
        session_id,
        context: context || {},
      })
      .select()
      .single();

    if (createError) {
      console.error('[sessions.service] Error creating session:', createError);
      throw new Error(`Failed to create session: ${createError.message}`);
    }

    return newSession as ChatSessionRow;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<ChatSessionRow | null> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[sessions.service] getSession error:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data as ChatSessionRow;
  }

  /**
   * Save a chat message to the database
   */
  async saveMessage(input: SaveMessageInput): Promise<ChatMessageRow> {
    const { session_id, role, content, intent, data, token_count } = input;

    console.log(`[sessions.service] Saving ${role} message for session: ${session_id}`);

    const { data: message, error } = await this.supabase
      .from('chat_messages')
      .insert({
        session_id,
        role,
        content,
        intent: intent || null,
        data: data || null,
        token_count: token_count || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[sessions.service] saveMessage error:', error);
      throw new Error(`Failed to save message: ${error.message}`);
    }

    return message as ChatMessageRow;
  }

  /**
   * Get all messages for a session
   */
  async getMessages(sessionId: string, limit?: number): Promise<ChatMessageRow[]> {
    let query = this.supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[sessions.service] getMessages error:', error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return (data || []) as ChatMessageRow[];
  }

  /**
   * Get session with all messages
   */
  async getSessionWithMessages(sessionId: string): Promise<SessionWithMessages | null> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const messages = await this.getMessages(sessionId);

    return {
      session,
      messages,
    };
  }

  /**
   * Get recent messages formatted for Claude API
   * Returns messages in the format Claude expects
   */
  async getClaudeMessageHistory(
    sessionId: string,
    maxMessages: number = 20
  ): Promise<ClaudeMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(maxMessages);

    if (error) {
      console.error('[sessions.service] getClaudeMessageHistory error:', error);
      return [];
    }

    // Reverse to get chronological order and format for Claude
    return (data || [])
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
  }

  /**
   * Update session context
   */
  async updateSessionContext(
    sessionId: string,
    context: Partial<ChatContext>
  ): Promise<ChatSessionRow | null> {
    const existing = await this.getSession(sessionId);

    if (!existing) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('chat_sessions')
      .update({
        context: { ...existing.context, ...context },
        last_activity_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[sessions.service] updateSessionContext error:', error);
      throw new Error(`Failed to update session context: ${error.message}`);
    }

    return data as ChatSessionRow;
  }

  /**
   * Deactivate a session
   */
  async deactivateSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .eq('session_id', sessionId);

    if (error) {
      console.error('[sessions.service] deactivateSession error:', error);
      throw new Error(`Failed to deactivate session: ${error.message}`);
    }
  }

  /**
   * Get recent active sessions (for admin/debugging)
   */
  async getRecentSessions(limit: number = 50): Promise<ChatSessionRow[]> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .select('*')
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[sessions.service] getRecentSessions error:', error);
      throw new Error(`Failed to get recent sessions: ${error.message}`);
    }

    return (data || []) as ChatSessionRow[];
  }

  /**
   * Delete old inactive sessions (cleanup job)
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from('chat_sessions')
      .delete()
      .lt('last_activity_at', cutoffDate.toISOString())
      .eq('is_active', false)
      .select('id');

    if (error) {
      console.error('[sessions.service] cleanupOldSessions error:', error);
      throw new Error(`Failed to cleanup old sessions: ${error.message}`);
    }

    const deletedCount = data?.length || 0;
    console.log(`[sessions.service] Cleaned up ${deletedCount} old sessions`);
    return deletedCount;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    total_sessions: number;
    active_sessions: number;
    total_messages: number;
  }> {
    const [sessionsResult, messagesResult] = await Promise.all([
      this.supabase.from('chat_sessions').select('is_active', { count: 'exact' }),
      this.supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
    ]);

    const sessions = sessionsResult.data || [];
    const activeSessions = sessions.filter((s) => s.is_active).length;

    return {
      total_sessions: sessionsResult.count || 0,
      active_sessions: activeSessions,
      total_messages: messagesResult.count || 0,
    };
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let sessionsServiceInstance: SessionsService | null = null;

export function getSessionsService(): SessionsService {
  if (!sessionsServiceInstance) {
    sessionsServiceInstance = new SessionsService();
  }
  return sessionsServiceInstance;
}

export const sessionsService = getSessionsService();
