import { claudeService } from './claude.service.js';
import { buildIntentPrompt } from '../../prompts/intent-classification.js';
import { Intent, IntentClassification } from '../../types/index.js';

const CLASSIFICATION_SYSTEM_PROMPT = `You are an intent classifier. Your job is to analyze user messages and classify them into predefined categories.
You must respond ONLY with valid JSON. No explanations, no markdown, just the JSON object.
Be accurate and consistent in your classifications.`;

/**
 * Classify a user message into an intent with extracted parameters
 */
export async function classify(message: string): Promise<IntentClassification> {
  const userPrompt = buildIntentPrompt(message);

  try {
    const result = await claudeService.chatJSON<{
      intent: string;
      agent_name: string | null;
      days_back: number;
      call_id: string | null;
      search_query: string | null;
      min_duration_minutes: number | null;
      confidence: number;
    }>(CLASSIFICATION_SYSTEM_PROMPT, userPrompt, { maxTokens: 256 });

    // Validate and normalize the intent
    const intent = normalizeIntent(result.intent);

    return {
      intent,
      agent_name: result.agent_name || null,
      days_back: result.days_back || 7,
      call_id: result.call_id || null,
      search_query: result.search_query || null,
      min_duration_minutes: result.min_duration_minutes || null,
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    // If classification fails, default to GENERAL
    console.error('Intent classification failed:', error);
    return {
      intent: Intent.GENERAL,
      agent_name: null,
      days_back: 7,
      call_id: null,
      search_query: null,
      min_duration_minutes: null,
      confidence: 0.0,
    };
  }
}

/**
 * Normalize intent string to Intent enum
 */
function normalizeIntent(intentStr: string): Intent {
  const normalized = intentStr.toUpperCase().replace(/[^A-Z_]/g, '');

  if (Object.values(Intent).includes(normalized as Intent)) {
    return normalized as Intent;
  }

  // Map common variations
  const intentMap: Record<string, Intent> = {
    'LISTCALLS': Intent.LIST_CALLS,
    'CALLS': Intent.LIST_CALLS,
    'SHOWCALLS': Intent.LIST_CALLS,
    'AGENTSTATS': Intent.AGENT_STATS,
    'STATS': Intent.AGENT_STATS,
    'PERFORMANCE': Intent.AGENT_STATS,
    'TEAMSUMMARY': Intent.TEAM_SUMMARY,
    'TEAM': Intent.TEAM_SUMMARY,
    'GETTRANSCRIPT': Intent.GET_TRANSCRIPT,
    'TRANSCRIPT': Intent.GET_TRANSCRIPT,
    'SEARCHCALLS': Intent.SEARCH_CALLS,
    'SEARCH': Intent.SEARCH_CALLS,
    'FIND': Intent.SEARCH_CALLS,
    'COACH': Intent.COACHING,
    'FEEDBACK': Intent.COACHING,
  };

  return intentMap[normalized] || Intent.GENERAL;
}

/**
 * Quick check if message looks like a greeting
 */
export function isGreeting(message: string): boolean {
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'];
  const lower = message.toLowerCase().trim();
  return greetings.some(g => lower.startsWith(g) || lower === g);
}

/**
 * Quick check if message is asking for help
 */
export function isHelpRequest(message: string): boolean {
  const helpPhrases = ['help', 'what can you do', 'how do i', 'can you help', 'capabilities'];
  const lower = message.toLowerCase().trim();
  return helpPhrases.some(h => lower.includes(h));
}

export const intentService = {
  classify,
  isGreeting,
  isHelpRequest,
};
