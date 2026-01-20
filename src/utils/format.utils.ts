import { CallSummary, CallMetadata } from '../types/index.js';

/**
 * Format a list of calls for display
 */
export function formatCallList(calls: CallSummary[]): string {
  if (calls.length === 0) {
    return 'No calls found for the specified criteria.';
  }

  return calls.map((call, index) => {
    const direction = call.is_inbound_call ? 'Inbound' : 'Outbound';
    return `${index + 1}. **${call.call_date}** - ${call.total_duration_formatted} (${direction}, ${call.total_turns} turns) [ID: ${call.call_id.slice(0, 8)}...]`;
  }).join('\n');
}

/**
 * Format performance stats for display
 */
export function formatPerformanceStats(stats: {
  total_calls: number;
  avg_duration_seconds: number;
  avg_agent_talk_percentage: number;
}): string {
  const avgMins = Math.floor(stats.avg_duration_seconds / 60);
  const avgSecs = Math.round(stats.avg_duration_seconds % 60);

  return [
    `- **Total Calls**: ${stats.total_calls}`,
    `- **Avg Duration**: ${avgMins}m ${avgSecs}s`,
    `- **Avg Talk Ratio**: ${Math.round(stats.avg_agent_talk_percentage)}% agent / ${Math.round(100 - stats.avg_agent_talk_percentage)}% customer`,
  ].join('\n');
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}

/**
 * Format call metadata for transcript context
 */
export function formatCallContext(call: CallMetadata): string {
  const direction = call.is_inbound_call ? 'Inbound' : 'Outbound';
  return [
    `**Call Date**: ${call.call_date}`,
    `**Duration**: ${call.total_duration_formatted}`,
    `**Type**: ${direction}`,
    `**Talk Ratio**: Agent ${Math.round(call.agent_talk_percentage)}% / Customer ${Math.round(call.customer_talk_percentage)}%`,
    `**Total Turns**: ${call.total_turns}`,
  ].join('\n');
}
