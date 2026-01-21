/**
 * Objection Analysis Types
 * Types for objection tracking, snippets, and agent stats
 */

// ============================================================================
// Snippet Types
// ============================================================================

/**
 * Verbatim transcript snippet for an objection
 */
export interface ObjectionSnippet {
  /** Customer's verbatim objection text */
  objection_text: string;
  /** Agent's verbatim rebuttal text */
  rebuttal_text: string;
  /** Optional full exchange context (surrounding turns) */
  full_exchange?: string;
}

/**
 * Enhanced objection with snippet field
 */
export interface EnhancedObjectionFound {
  objection_type: string;
  objection_text: string;
  customer_sentiment: 'mild' | 'moderate' | 'strong';
  agent_response: string;
  response_quality: number;
  techniques_used: string[];
  techniques_missed: string[];
  was_resolved: boolean;
  improvement_suggestion: string;
  /** Verbatim snippet from transcript */
  snippet?: ObjectionSnippet;
}

// ============================================================================
// Database Types
// ============================================================================

/**
 * Row from agent_objection_stats table
 */
export interface AgentObjectionStatsRow {
  id: string;
  agent_user_id: string;
  objection_type: string;
  total_occurrences: number;
  total_score_points: number;
  resolved_count: number;
  unresolved_count: number;
  first_seen_at: string;
  last_seen_at: string;
  updated_at: string;
}

/**
 * Row from objection_occurrences table
 */
export interface ObjectionOccurrenceRow {
  id: string;
  agent_user_id: string;
  call_id: string;
  objection_type: string;
  response_quality: number;
  was_resolved: boolean;
  customer_sentiment: 'mild' | 'moderate' | 'strong' | null;
  objection_snippet: string | null;
  rebuttal_snippet: string | null;
  full_exchange: string | null;
  created_at: string;
}

// ============================================================================
// Stats Response Types
// ============================================================================

/**
 * Agent objection stats with computed fields
 */
export interface AgentObjectionStats {
  objection_type: string;
  total_occurrences: number;
  avg_score: number;
  resolved_count: number;
  unresolved_count: number;
  resolution_rate: number;
  first_seen_at: string;
  last_seen_at: string;
}

/**
 * Weak/strong area summary
 */
export interface ObjectionArea {
  objection_type: string;
  total_occurrences: number;
  avg_score: number;
  resolution_rate: number;
  last_seen_at: string;
}

/**
 * Team-wide objection trend
 */
export interface TeamObjectionTrend {
  objection_type: string;
  total_occurrences: number;
  unique_agents: number;
  avg_score: number;
  avg_resolution_rate: number;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for recording a single objection
 */
export interface RecordObjectionInput {
  agent_user_id: string;
  call_id: string;
  objection_type: string;
  response_quality: number;
  was_resolved: boolean;
  customer_sentiment?: 'mild' | 'moderate' | 'strong';
  objection_snippet?: string;
  rebuttal_snippet?: string;
  full_exchange?: string;
}

/**
 * Result from record_objection RPC
 */
export interface RecordObjectionResult {
  occurrence_id: string;
  stats_id: string;
}

// ============================================================================
// History Types for Coaching Context
// ============================================================================

/**
 * Aggregated history for an agent's objection handling
 * Used to provide context in coaching prompts
 */
export interface AgentObjectionHistory {
  agent_user_id: string;
  /** All stats by objection type */
  stats: AgentObjectionStats[];
  /** Weakest areas (lowest avg scores with 2+ occurrences) */
  weak_areas: ObjectionArea[];
  /** Strongest areas (highest avg scores with 2+ occurrences) */
  strong_areas: ObjectionArea[];
  /** Total objections analyzed for this agent */
  total_analyzed: number;
  /** Overall average score across all objection types */
  overall_avg_score: number | null;
}

// ============================================================================
// Enhanced Analysis Types
// ============================================================================

/**
 * Enhanced objection analysis result with snippets
 */
export interface EnhancedObjectionAnalysis {
  objections_found: EnhancedObjectionFound[];
  overall_objection_handling_score: number | null;
  total_objections: number;
  resolved_count: number;
  missed_objections: Array<{
    description: string;
    where_in_call: 'early' | 'middle' | 'late';
    what_to_look_for: string;
  }>;
  strongest_moment: {
    description: string;
    quote: string;
  } | null;
  biggest_opportunity: {
    description: string;
    suggestion: string;
  } | null;
  patterns: {
    agent_tendencies: string[];
    customer_signals: string[];
  };
  no_objections_note?: string;
}
