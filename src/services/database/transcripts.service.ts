import { getSupabaseClient } from '../../config/database.js';
import { CallTurn } from '../../types/index.js';

// Raw response from get_call_transcript RPC function
interface TranscriptRpcResponse {
  call_id: string;
  agent_user_id: string;
  agent_name: string;
  lead_id: string | null;
  call_date: string;
  call_datetime: string;
  total_duration_formatted: string;
  agent_talk_percentage: number;
  customer_talk_percentage: number;
  total_turns: number;
  full_transcript: string | null;
  agent_only_transcript: string | null;
  customer_only_transcript: string | null;
  department: string | null;
}

/**
 * Get the full transcript for a call
 * Calls the get_call_transcript PostgreSQL function
 */
export async function getCallTranscript(callId: string): Promise<TranscriptRpcResponse | null> {
  const supabase = getSupabaseClient();

  console.log(`[transcripts.service] Fetching transcript for call: ${callId}`);

  const { data, error } = await supabase
    .rpc('get_call_transcript', {
      p_call_id: callId,
    });

  if (error) {
    console.error(`[transcripts.service] RPC error:`, error);
    throw new Error(`Failed to get call transcript: ${error.message}`);
  }

  console.log(`[transcripts.service] RPC returned ${data?.length || 0} results`);

  // Function returns array, take first result
  if (data && data.length > 0) {
    const result = data[0] as TranscriptRpcResponse;
    console.log(`[transcripts.service] Transcript metadata:`, {
      call_id: result.call_id,
      agent_name: result.agent_name,
      total_turns: result.total_turns,
      has_full_transcript: !!result.full_transcript,
      transcript_length: result.full_transcript?.length || 0,
    });
    return result;
  }

  return null;
}

/**
 * Parse full_transcript text into CallTurn objects
 * Handles formats like:
 * - "Agent: Hello..." / "Customer: Hi..."
 * - "Agent (00:00:00): Hello..."
 * - "[00:00:00] Agent: Hello..."
 */
export function parseTranscriptText(
  fullTranscript: string,
  callId: string,
  agentUserId: string
): CallTurn[] {
  if (!fullTranscript || fullTranscript.trim() === '') {
    console.log(`[transcripts.service] No transcript text to parse`);
    return [];
  }

  console.log(`[transcripts.service] Parsing transcript text (${fullTranscript.length} chars)`);

  const turns: CallTurn[] = [];

  // Pattern to match speaker turns with optional timestamps
  // Matches: "Agent:", "Customer:", "Agent (00:00:00):", "[00:00:00] Agent:", etc.
  const turnPattern = /(?:(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?(Agent|Customer)(?:\s*\((\d{1,2}:\d{2}(?::\d{2})?)\))?:\s*)/gi;

  const parts = fullTranscript.split(turnPattern).filter(Boolean);

  let turnNumber = 1;
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];

    // Check if this part is a speaker identifier
    if (part.toLowerCase() === 'agent' || part.toLowerCase() === 'customer') {
      const speaker = part.toLowerCase() === 'agent' ? 'Agent' : 'Customer';

      // Look for timestamp before or after speaker
      let timestamp = '';
      if (i > 0 && /^\d{1,2}:\d{2}(:\d{2})?$/.test(parts[i - 1])) {
        timestamp = parts[i - 1];
      } else if (i + 1 < parts.length && /^\d{1,2}:\d{2}(:\d{2})?$/.test(parts[i + 1])) {
        timestamp = parts[i + 1];
        i++; // Skip the timestamp
      }

      // Get the text content (next non-timestamp, non-speaker part)
      let text = '';
      for (let j = i + 1; j < parts.length; j++) {
        const nextPart = parts[j];
        if (nextPart.toLowerCase() === 'agent' || nextPart.toLowerCase() === 'customer') {
          break;
        }
        if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(nextPart)) {
          text = nextPart.trim();
          i = j;
          break;
        }
      }

      if (text) {
        turns.push({
          id: turnNumber,
          call_id: callId,
          agent_user_id: agentUserId,
          turn_number: turnNumber,
          speaker: speaker as 'Agent' | 'Customer',
          text: text,
          timestamp_start: timestamp || '',
          timestamp_end: '',
          duration_seconds: 0,
        });
        turnNumber++;
      }
    }
    i++;
  }

  // If the pattern-based parsing failed, try line-by-line parsing
  if (turns.length === 0) {
    console.log(`[transcripts.service] Pattern parsing failed, trying line-by-line`);
    const lines = fullTranscript.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const lineMatch = line.match(/^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?(Agent|Customer)(?:\s*\((\d{1,2}:\d{2}(?::\d{2})?)\))?:\s*(.+)$/i);

      if (lineMatch) {
        const [, timestamp1, speaker, timestamp2, text] = lineMatch;
        turns.push({
          id: turnNumber,
          call_id: callId,
          agent_user_id: agentUserId,
          turn_number: turnNumber,
          speaker: speaker.toLowerCase() === 'agent' ? 'Agent' : 'Customer',
          text: text.trim(),
          timestamp_start: timestamp1 || timestamp2 || '',
          timestamp_end: '',
          duration_seconds: 0,
        });
        turnNumber++;
      }
    }
  }

  console.log(`[transcripts.service] Parsed ${turns.length} turns from transcript`);
  return turns;
}

/**
 * Get raw turns for a call from call_turns table
 * Note: This table may not exist in all deployments
 */
export async function getCallTurns(callId: string): Promise<CallTurn[]> {
  const supabase = getSupabaseClient();

  console.log(`[transcripts.service] Fetching turns from call_turns table for: ${callId}`);

  const { data, error } = await supabase
    .from('call_turns')
    .select('*')
    .eq('call_id', callId)
    .order('turn_number');

  if (error) {
    console.error(`[transcripts.service] call_turns query error:`, error);
    // Return empty array instead of throwing - table might not exist
    return [];
  }

  console.log(`[transcripts.service] Found ${data?.length || 0} turns in call_turns table`);
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
  parseTranscriptText,
  formatTranscript,
};
