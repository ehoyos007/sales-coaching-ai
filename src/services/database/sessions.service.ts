import { getSupabaseClient } from '../../config/database.js';
import {
  ChatSessionRow,
  ChatMessageRow,
  CreateSessionInput,
  SaveMessageInput,
  ClaudeMessage,
  ChatContext,
} from '../../types/index.js';
import { estimateMessageTokens, HISTORY_CONFIG } from '../../utils/tokens.js';

/**
 * Get or create a chat session
 */
export async function getOrCreateSession(
  input: CreateSessionInput
): Promise<ChatSessionRow> {
  const supabase = getSupabaseClient();

  // Try to get existing session first
  const { data: existing, error: getError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('session_id', input.session_id)
    .single();

  if (existing && !getError) {
    // Update context if provided and different
    if (input.context) {
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ context: input.context })
        .eq('session_id', input.session_id);

      if (updateError) {
        console.error('Failed to update session context:', updateError);
      }
    }
    return existing;
  }

  // Create new session
  const { data: created, error: createError } = await supabase
    .from('chat_sessions')
    .insert({
      session_id: input.session_id,
      context: input.context || {},
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create session: ${createError.message}`);
  }

  return created;
}

/**
 * Get a session by session_id
 */
export async function getSession(sessionId: string): Promise<ChatSessionRow | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get session: ${error.message}`);
  }

  return data;
}

/**
 * Save a chat message
 */
export async function saveMessage(input: SaveMessageInput): Promise<ChatMessageRow> {
  const supabase = getSupabaseClient();

  // Estimate tokens for the message
  const tokenCount = input.token_count ?? estimateMessageTokens(input.role, input.content);

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: input.session_id,
      role: input.role,
      content: input.content,
      intent: input.intent || null,
      data: input.data || null,
      token_count: tokenCount,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return data;
}

/**
 * Get messages for a session (most recent first, limited by count)
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = HISTORY_CONFIG.MAX_MESSAGES
): Promise<ChatMessageRow[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  // Return in chronological order
  return (data || []).reverse();
}

/**
 * Get messages formatted for Claude's API with token budget
 */
export async function getMessagesForClaude(
  sessionId: string,
  tokenBudget: number = HISTORY_CONFIG.MAX_HISTORY_TOKENS
): Promise<ClaudeMessage[]> {
  const messages = await getSessionMessages(sessionId, HISTORY_CONFIG.MAX_MESSAGES);

  // Build history from most recent, respecting token budget
  const result: ClaudeMessage[] = [];
  let totalTokens = 0;

  // Process from oldest to newest to maintain chronological order
  for (const msg of messages) {
    const msgTokens = msg.token_count || estimateMessageTokens(msg.role, msg.content);

    if (totalTokens + msgTokens > tokenBudget) {
      break;
    }

    result.push({
      role: msg.role,
      content: msg.content,
    });

    totalTokens += msgTokens;
  }

  return result;
}

/**
 * Update session context
 */
export async function updateSessionContext(
  sessionId: string,
  context: ChatContext
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('chat_sessions')
    .update({ context })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to update session context: ${error.message}`);
  }
}

/**
 * Mark session as inactive
 */
export async function deactivateSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('chat_sessions')
    .update({ is_active: false })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to deactivate session: ${error.message}`);
  }
}

/**
 * Get session with messages for API response
 */
export async function getSessionWithMessages(
  sessionId: string
): Promise<{ session: ChatSessionRow; messages: ChatMessageRow[] } | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const messages = await getSessionMessages(sessionId);

  return { session, messages };
}

export const sessionsService = {
  getOrCreateSession,
  getSession,
  saveMessage,
  getSessionMessages,
  getMessagesForClaude,
  updateSessionContext,
  deactivateSession,
  getSessionWithMessages,
};
