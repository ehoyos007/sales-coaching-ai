import { Intent } from '../../types/index.js';
import { claudeService } from '../ai/claude.service.js';
import { buildResponsePrompt } from '../../prompts/response-formatting.js';

interface FormatContext {
  intent: Intent;
  data: Record<string, unknown>;
  originalMessage: string;
}

/**
 * Format handler result data into a natural language response
 */
export async function formatResponse(context: FormatContext): Promise<string> {
  const { intent, data, originalMessage } = context;

  // Handle errors directly
  if (!data || (data as Record<string, unknown>).error) {
    return (data as Record<string, unknown>)?.error as string || 'An error occurred processing your request.';
  }

  // Handle pre-formatted responses (from general handler)
  if (data.type === 'general' && data.response) {
    return data.response as string;
  }

  // Format based on intent
  switch (intent) {
    case Intent.LIST_CALLS:
      return formatCallList(data);

    case Intent.AGENT_STATS:
      return formatAgentStats(data);

    case Intent.TEAM_SUMMARY:
      return formatTeamSummary(data);

    case Intent.GET_TRANSCRIPT:
    case Intent.COACHING:
      return formatTranscript(data);

    case Intent.SEARCH_CALLS:
      return formatSearchResults(data);

    case Intent.GENERAL:
    default:
      // Use Claude to generate a natural response
      return generateNaturalResponse(originalMessage, data);
  }
}

function formatCallList(data: Record<string, unknown>): string {
  const agentName = data.agent_name as string;
  const startDate = data.start_date as string;
  const endDate = data.end_date as string;
  const callCount = data.call_count as number;
  const calls = data.calls as Array<Record<string, unknown>>;

  if (!calls || calls.length === 0) {
    return `No calls found for ${agentName} between ${startDate} and ${endDate}.`;
  }

  let response = `Here are **${agentName}'s** calls from ${startDate} to ${endDate}:\n\n`;
  response += `**Total calls:** ${callCount}\n\n`;

  // Format call list
  const callLines = calls.slice(0, 10).map((call, i) => {
    const direction = call.is_inbound_call ? '📥 Inbound' : '📤 Outbound';
    const duration = call.total_duration_formatted || 'N/A';
    const turns = call.total_turns || 0;
    const callId = (call.call_id as string)?.slice(0, 8) || 'N/A';

    return `${i + 1}. **${call.call_date}** - ${duration} (${direction}, ${turns} turns)\n   ID: \`${callId}...\``;
  });

  response += callLines.join('\n\n');

  if (calls.length > 10) {
    response += `\n\n*...and ${calls.length - 10} more calls*`;
  }

  response += '\n\nWant to see the transcript for any of these calls?';

  return response;
}

function formatAgentStats(data: Record<string, unknown>): string {
  const agentName = data.agent_name as string;
  const startDate = data.start_date as string;
  const endDate = data.end_date as string;
  const performance = data.performance as Record<string, unknown> | null;

  if (!performance) {
    return data.message as string || `No performance data found for ${agentName}.`;
  }

  const totalCalls = performance.total_calls as number;
  const avgDuration = performance.avg_duration_seconds as number;
  const avgMins = Math.floor(avgDuration / 60);
  const avgSecs = Math.round(avgDuration % 60);
  const agentTalkPct = Math.round(performance.avg_agent_talk_percentage as number);
  const customerTalkPct = Math.round(performance.avg_customer_talk_percentage as number);
  const avgTurns = Math.round(performance.avg_turns_per_call as number);

  let response = `## ${agentName}'s Performance Summary\n`;
  response += `*${startDate} to ${endDate}*\n\n`;

  response += `| Metric | Value |\n`;
  response += `|--------|-------|\n`;
  response += `| Total Calls | ${totalCalls} |\n`;
  response += `| Avg Duration | ${avgMins}m ${avgSecs}s |\n`;
  response += `| Talk Ratio | Agent ${agentTalkPct}% / Customer ${customerTalkPct}% |\n`;
  response += `| Avg Turns | ${avgTurns} |\n`;

  if (performance.inbound_calls !== undefined) {
    response += `| Inbound Calls | ${performance.inbound_calls} |\n`;
    response += `| Outbound Calls | ${performance.outbound_calls} |\n`;
  }

  response += '\nWould you like to see their calls or search for specific patterns?';

  return response;
}

function formatTeamSummary(data: Record<string, unknown>): string {
  const department = data.department as string;
  const startDate = data.start_date as string;
  const endDate = data.end_date as string;
  const summary = data.summary as Record<string, unknown> | null;

  if (!summary) {
    return data.message as string || `No team data found for ${department}.`;
  }

  const totalAgents = summary.total_agents as number;
  const totalCalls = summary.total_calls as number;
  const avgCallsPerAgent = Math.round(summary.avg_calls_per_agent as number);
  const avgDuration = summary.avg_duration_seconds as number;
  const avgMins = Math.floor(avgDuration / 60);
  const avgSecs = Math.round(avgDuration % 60);
  const topPerformer = summary.top_performer as { agent_name: string; call_count: number } | null;

  let response = `## ${department} Team Summary\n`;
  response += `*${startDate} to ${endDate}*\n\n`;

  response += `| Metric | Value |\n`;
  response += `|--------|-------|\n`;
  response += `| Active Agents | ${totalAgents} |\n`;
  response += `| Total Calls | ${totalCalls} |\n`;
  response += `| Avg Calls/Agent | ${avgCallsPerAgent} |\n`;
  response += `| Avg Duration | ${avgMins}m ${avgSecs}s |\n`;

  if (topPerformer) {
    response += `\n🏆 **Top Performer:** ${topPerformer.agent_name} with ${topPerformer.call_count} calls`;
  }

  response += '\n\nWant to dive deeper into any agent\'s performance?';

  return response;
}

function formatTranscript(data: Record<string, unknown>): string {
  const agentName = data.agent_name as string;
  const callDate = data.call_date as string;
  const duration = data.duration as string;
  const isInbound = data.is_inbound as boolean;
  const talkRatio = data.talk_ratio as { agent: number; customer: number };
  const totalTurns = data.total_turns as number;

  let response = `## Call Transcript\n\n`;
  response += `| Detail | Value |\n`;
  response += `|--------|-------|\n`;
  response += `| Agent | ${agentName} |\n`;
  response += `| Date | ${callDate} |\n`;
  response += `| Duration | ${duration} |\n`;
  response += `| Type | ${isInbound ? 'Inbound' : 'Outbound'} |\n`;

  if (talkRatio) {
    response += `| Talk Ratio | Agent ${Math.round(talkRatio.agent)}% / Customer ${Math.round(talkRatio.customer)}% |\n`;
  }

  response += `| Total Turns | ${totalTurns} |\n\n`;

  // Format transcript text if available
  if (data.transcript_text) {
    response += `### Transcript\n\n${data.transcript_text}`;
  } else if (data.turns) {
    const turns = data.turns as Array<{ speaker: string; text: string; timestamp_start?: string }>;
    const formatted = turns.map(turn => {
      const speaker = turn.speaker === 'Agent' ? '🎯 **Agent**' : '👤 **Customer**';
      const timestamp = turn.timestamp_start ? ` [${turn.timestamp_start}]` : '';
      return `${speaker}${timestamp}:\n${turn.text}`;
    }).join('\n\n');

    response += `### Transcript\n\n${formatted}`;
  }

  return response;
}

function formatSearchResults(data: Record<string, unknown>): string {
  const searchQuery = data.search_query as string;
  const resultCount = data.result_count as number;
  const results = data.results as Array<Record<string, unknown>>;
  const searchType = data.search_type as string;

  if (resultCount === 0) {
    return data.message as string || `No calls found matching "${searchQuery}".`;
  }

  let response = `## Search Results for "${searchQuery}"\n\n`;
  response += `Found **${resultCount}** matching call${resultCount > 1 ? 's' : ''} (${searchType} search)\n\n`;

  // Format results
  const resultLines = results.slice(0, 5).map((result, i) => {
    const similarity = result.similarity ? ` (${Math.round((result.similarity as number) * 100)}% match)` : '';
    const agentName = result.agent_name || 'Unknown';
    const excerpt = truncateText(result.chunk_text as string, 150);

    return `### ${i + 1}. ${result.call_date} - ${agentName}${similarity}\n\n> "${excerpt}"\n\nCall ID: \`${(result.call_id as string).slice(0, 8)}...\``;
  });

  response += resultLines.join('\n\n---\n\n');

  if (resultCount > 5) {
    response += `\n\n*...and ${resultCount - 5} more results*`;
  }

  response += '\n\nWant to see the full transcript for any of these calls?';

  return response;
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

async function generateNaturalResponse(
  message: string,
  _data: Record<string, unknown>
): Promise<string> {
  // For general messages, use Claude to generate a response
  const prompt = buildResponsePrompt('GENERAL', { message });

  try {
    const response = await claudeService.chat(
      'You are a helpful sales coaching assistant. Be concise and friendly.',
      prompt,
      { maxTokens: 512 }
    );
    return response.content;
  } catch {
    return 'I\'m here to help you analyze sales calls and coach your team. Try asking me to "show calls for [agent name]" or "how is the team doing?"';
  }
}

export const responseFormatter = {
  formatResponse,
};
