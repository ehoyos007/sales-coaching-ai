/**
 * Intent Classification Service for Vercel serverless functions
 */
import { claudeService } from './claude.service';

// =============================================
// TYPES
// =============================================

export type IntentType =
  | 'LIST_CALLS'
  | 'AGENT_STATS'
  | 'TEAM_SUMMARY'
  | 'GET_TRANSCRIPT'
  | 'SEARCH_CALLS'
  | 'COACHING'
  | 'OBJECTION_ANALYSIS'
  | 'GENERAL';

export interface ClassifiedIntent {
  intent: IntentType;
  agent_name?: string;
  agent_user_id?: string;
  days_back?: number;
  call_id?: string;
  search_query?: string;
  min_duration_minutes?: number;
  confidence: number;
}

// =============================================
// INTENT CLASSIFICATION PROMPT
// =============================================

const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for a sales coaching AI system.

Classify the user's message into one of these intents:
- LIST_CALLS: User wants to see a list of calls (recent, for a specific agent, with filters)
- AGENT_STATS: User wants statistics or performance data for a specific agent
- TEAM_SUMMARY: User wants summary metrics across all agents or the team
- GET_TRANSCRIPT: User wants to see a specific call transcript
- SEARCH_CALLS: User wants to search for specific content in calls
- COACHING: User wants coaching analysis for a call or agent
- OBJECTION_ANALYSIS: User wants analysis of objection handling
- GENERAL: Greeting, help, or anything that doesn't fit above

Extract relevant parameters:
- agent_name: Name of the agent mentioned (if any)
- agent_user_id: Agent ID if directly specified
- days_back: Number of days to look back (default 7)
- call_id: Specific call ID if mentioned
- search_query: Search terms for SEARCH_CALLS
- min_duration_minutes: Minimum call duration if specified

Respond with ONLY valid JSON:
{
  "intent": "INTENT_TYPE",
  "agent_name": "name or null",
  "agent_user_id": "id or null",
  "days_back": number or null,
  "call_id": "id or null",
  "search_query": "query or null",
  "min_duration_minutes": number or null,
  "confidence": 0.0-1.0
}`;

// =============================================
// INTENT SERVICE CLASS
// =============================================

export class IntentService {
  /**
   * Classify the intent of a user message
   */
  async classify(message: string): Promise<ClassifiedIntent> {
    try {
      const result = await claudeService.parseJsonResponse<ClassifiedIntent>(
        INTENT_CLASSIFICATION_PROMPT,
        message,
        { temperature: 0.1, maxTokens: 500 }
      );

      return {
        intent: result.intent || 'GENERAL',
        agent_name: result.agent_name || undefined,
        agent_user_id: result.agent_user_id || undefined,
        days_back: result.days_back || undefined,
        call_id: result.call_id || undefined,
        search_query: result.search_query || undefined,
        min_duration_minutes: result.min_duration_minutes || undefined,
        confidence: result.confidence || 0.5,
      };
    } catch (error) {
      console.error('[intent.service] Classification error:', error);
      // Default to GENERAL on error
      return {
        intent: 'GENERAL',
        confidence: 0.3,
      };
    }
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let intentServiceInstance: IntentService | null = null;

export function getIntentService(): IntentService {
  if (!intentServiceInstance) {
    intentServiceInstance = new IntentService();
  }
  return intentServiceInstance;
}

export const intentService = getIntentService();
