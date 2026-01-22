/**
 * Semantic Search Service for Vercel serverless functions
 */
import { getSupabaseClient } from '../database';

// =============================================
// TYPES
// =============================================

export interface SearchOptions {
  embedding: number[];
  agentUserIds?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  call_id: string;
  chunk_id: string;
  chunk_text: string;
  similarity: number;
  agent_user_id: string;
  agent_name?: string;
  call_date?: string;
  call_duration?: number;
  customer_name?: string;
  chunk_start_time?: number;
  chunk_end_time?: number;
}

// =============================================
// SEARCH SERVICE CLASS
// =============================================

export class SearchService {
  private supabase = getSupabaseClient();

  /**
   * Perform semantic search on call transcript chunks
   */
  async semanticSearch(options: SearchOptions): Promise<SearchResult[]> {
    const {
      embedding,
      agentUserIds,
      startDate,
      endDate,
      limit = 10,
      threshold = 0.7,
    } = options;

    // Call the semantic search RPC function
    const { data, error } = await this.supabase.rpc('semantic_search_calls', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_agent_ids: agentUserIds || null,
      filter_start_date: startDate || null,
      filter_end_date: endDate || null,
    });

    if (error) {
      console.error('[search.service] Semantic search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    return (data as SearchResult[]) || [];
  }

  /**
   * Search with text query (handles embedding generation)
   */
  async searchByText(
    query: string,
    getEmbedding: (text: string) => Promise<number[]>,
    options?: Omit<SearchOptions, 'embedding'>
  ): Promise<SearchResult[]> {
    const embedding = await getEmbedding(query);
    return this.semanticSearch({ ...options, embedding });
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let searchServiceInstance: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new SearchService();
  }
  return searchServiceInstance;
}

export const searchService = getSearchService();
