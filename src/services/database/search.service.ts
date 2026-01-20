import { getSupabaseClient } from '../../config/database.js';
import { SearchResult } from '../../types/index.js';

/**
 * Search calls using semantic similarity
 * Calls the semantic_search_calls PostgreSQL function
 */
export async function semanticSearch(
  queryEmbedding: number[],
  options: {
    agentUserId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    similarityThreshold?: number;
  } = {}
): Promise<SearchResult[]> {
  const supabase = getSupabaseClient();

  const {
    agentUserId = null,
    startDate = null,
    endDate = null,
    limit = 10,
    similarityThreshold = 0.5,
  } = options;

  const { data, error } = await supabase
    .rpc('semantic_search_calls', {
      query_embedding: queryEmbedding,
      p_agent_user_id: agentUserId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: limit,
      similarity_threshold: similarityThreshold,
    });

  if (error) {
    throw new Error(`Failed to perform semantic search: ${error.message}`);
  }

  return data || [];
}

/**
 * Search for calls by text matching (simple keyword search as fallback)
 */
export async function textSearch(
  searchText: string,
  options: {
    agentUserId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<SearchResult[]> {
  const supabase = getSupabaseClient();

  const {
    agentUserId,
    startDate,
    endDate,
    limit = 10,
  } = options;

  let query = supabase
    .from('call_transcript_chunks')
    .select(`
      call_id,
      agent_user_id,
      call_date,
      chunk_text,
      start_timestamp_formatted,
      end_timestamp_formatted
    `)
    .ilike('chunk_text', `%${searchText}%`)
    .limit(limit);

  if (agentUserId) {
    query = query.eq('agent_user_id', agentUserId);
  }

  if (startDate) {
    query = query.gte('call_date', startDate);
  }

  if (endDate) {
    query = query.lte('call_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to perform text search: ${error.message}`);
  }

  // Format results to match SearchResult interface
  return (data || []).map((row) => ({
    call_id: row.call_id,
    agent_user_id: row.agent_user_id,
    agent_name: '', // Would need to join with agents table
    call_date: row.call_date,
    chunk_text: row.chunk_text,
    similarity: 1.0, // Text match, not similarity-based
    start_timestamp: row.start_timestamp_formatted || '',
    end_timestamp: row.end_timestamp_formatted || '',
  }));
}

export const searchService = {
  semanticSearch,
  textSearch,
};
