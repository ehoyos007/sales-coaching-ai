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
      return formatTranscript(data);

    case Intent.COACHING:
      return formatCoaching(data);

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

  // Handle the actual RPC response structure
  const totalCalls = summary.total_calls as number;
  const avgDuration = summary.avg_duration_seconds as number;
  const avgMins = Math.floor(avgDuration / 60);
  const avgSecs = Math.round(avgDuration % 60);
  const avgTalkPct = summary.avg_agent_talk_pct as number | undefined;
  const totalTalkMinutes = summary.total_talk_time_minutes as number | undefined;
  const topAgentName = summary.agent_name as string | undefined;

  let response = `## ${department} Team Summary\n`;
  response += `*${startDate} to ${endDate}*\n\n`;

  response += `| Metric | Value |\n`;
  response += `|--------|-------|\n`;
  response += `| Total Calls | ${totalCalls} |\n`;
  response += `| Avg Call Duration | ${avgMins}m ${avgSecs}s |\n`;

  if (avgTalkPct !== undefined) {
    response += `| Avg Agent Talk % | ${Math.round(avgTalkPct)}% |\n`;
  }

  if (totalTalkMinutes !== undefined) {
    const hours = Math.floor(totalTalkMinutes / 60);
    const mins = Math.round(totalTalkMinutes % 60);
    response += `| Total Talk Time | ${hours}h ${mins}m |\n`;
  }

  if (topAgentName) {
    response += `\n🏆 **Top Performer:** ${topAgentName} with ${totalCalls} calls`;
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

function formatCoaching(data: Record<string, unknown>): string {
  // If we have a pre-generated summary from Claude, use it
  if (data.summary) {
    return data.summary as string;
  }

  // Otherwise, format the coaching analysis manually
  const agentName = data.agent_name as string;
  const callDate = data.call_date as string;
  const duration = data.duration as string;
  const analysis = data.analysis as {
    scores: Record<string, number>;
    overall_score: number;
    performance_level: string;
    strengths: string[];
    improvements: string[];
    action_items: string[];
    red_flags: { critical: string[]; high: string[]; medium: string[] };
  };

  if (!analysis) {
    return `Coaching analysis for ${agentName}'s call on ${callDate} is not available.`;
  }

  let response = `## Coaching Feedback for ${agentName}\n`;
  response += `*Call: ${callDate} (${duration})*\n\n`;

  // Overall score with emoji
  const scoreEmoji = analysis.overall_score >= 4.5 ? '🌟' :
                     analysis.overall_score >= 3.5 ? '✅' :
                     analysis.overall_score >= 2.5 ? '📈' : '⚠️';

  response += `### Overall Score: ${analysis.overall_score.toFixed(2)} ${scoreEmoji}\n`;
  response += `**Performance Level:** ${analysis.performance_level}\n\n`;

  // Score breakdown
  response += `### Score Breakdown\n\n`;
  response += `| Category | Score |\n`;
  response += `|----------|-------|\n`;

  const categoryNames: Record<string, string> = {
    opening_rapport: 'Opening & Rapport',
    needs_discovery: 'Needs Discovery',
    product_presentation: 'Product Presentation',
    objection_handling: 'Objection Handling',
    compliance_disclosures: 'Compliance & Disclosures',
    closing_enrollment: 'Closing & Enrollment',
  };

  for (const [key, score] of Object.entries(analysis.scores)) {
    const emoji = score >= 4 ? '⭐' : score >= 3 ? '✓' : '⚠️';
    const name = categoryNames[key] || key;
    response += `| ${name} | ${score}/5 ${emoji} |\n`;
  }

  // Strengths
  if (analysis.strengths && analysis.strengths.length > 0) {
    response += `\n### 💪 Strengths\n\n`;
    analysis.strengths.forEach((strength) => {
      response += `- ${strength}\n`;
    });
  }

  // Areas for improvement
  if (analysis.improvements && analysis.improvements.length > 0) {
    response += `\n### 📈 Areas for Improvement\n\n`;
    analysis.improvements.forEach((improvement) => {
      response += `- ${improvement}\n`;
    });
  }

  // Action items
  if (analysis.action_items && analysis.action_items.length > 0) {
    response += `\n### ✅ Action Items\n\n`;
    analysis.action_items.forEach((item, i) => {
      response += `${i + 1}. ${item}\n`;
    });
  }

  // Red flags
  const hasCritical = analysis.red_flags.critical && analysis.red_flags.critical.length > 0;
  const hasHigh = analysis.red_flags.high && analysis.red_flags.high.length > 0;

  if (hasCritical || hasHigh) {
    response += `\n### 🚨 Flags Requiring Attention\n\n`;

    if (hasCritical) {
      response += `**Critical:**\n`;
      analysis.red_flags.critical.forEach((flag) => {
        response += `- ❌ ${flag}\n`;
      });
    }

    if (hasHigh) {
      response += `**High Priority:**\n`;
      analysis.red_flags.high.forEach((flag) => {
        response += `- ⚠️ ${flag}\n`;
      });
    }
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
