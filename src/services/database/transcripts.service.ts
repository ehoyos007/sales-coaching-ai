import { getSupabaseClient } from '../../config/database.js';
import { CallTranscript, CallTurn } from '../../types/index.js';

/**
 * Get the full transcript for a call
 * Calls the get_call_transcript PostgreSQL function
 */
export async function getCallTranscript(callId: string): Promise<CallTranscript | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('get_call_transcript', {
      p_call_id: callId,
    });

  if (error) {
    throw new Error(`Failed to get call transcript: ${error.message}`);
  }

  // Function returns array, take first result
  if (data && data.length > 0) {
    return data[0];
  }

  return null;
}

/**
 * Get raw turns for a call (alternative to using the function)
 */
export async function getCallTurns(callId: string): Promise<CallTurn[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('call_turns')
    .select('*')
    .eq('call_id', callId)
    .order('turn_number');

  if (error) {
    throw new Error(`Failed to get call turns: ${error.message}`);
  }

  return data || [];
}

/**
 * Format transcript turns into readable text
 */
export function formatTranscript(turns: CallTurn[]): string {
  return turns
    .map((turn) => {
      const speaker = turn.speaker === 'Agent' ? '🎯 Agent' : '👤 Customer';
      const timestamp = turn.timestamp_start ? `[${turn.timestamp_start}]` : '';
      return `${speaker} ${timestamp}:\n${turn.text}`;
    })
    .join('\n\n');
}

export const transcriptsService = {
  getCallTranscript,
  getCallTurns,
  formatTranscript,
};
