/**
 * Centralized error messages for user-friendly responses
 *
 * Goals:
 * - Never expose raw technical errors to users
 * - Provide actionable suggestions when possible
 * - Maintain consistent tone and formatting
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  AI_SERVICE = 'AI_SERVICE',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classify an error into a category based on its message or type
 */
export function classifyError(error: unknown): ErrorCategory {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Database errors
  if (
    message.includes('database') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('supabase') ||
    message.includes('postgres') ||
    message.includes('relation') ||
    message.includes('column')
  ) {
    return ErrorCategory.DATABASE;
  }

  // AI service errors (Claude/OpenAI)
  if (
    message.includes('anthropic') ||
    message.includes('claude') ||
    message.includes('openai') ||
    message.includes('api key') ||
    message.includes('rate limit') ||
    message.includes('quota')
  ) {
    if (message.includes('rate limit') || message.includes('quota')) {
      return ErrorCategory.RATE_LIMIT;
    }
    return ErrorCategory.AI_SERVICE;
  }

  // Permission errors
  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('access denied')
  ) {
    return ErrorCategory.PERMISSION;
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('enotfound') ||
    message.includes('socket')
  ) {
    return ErrorCategory.NETWORK;
  }

  // Not found errors
  if (
    message.includes('not found') ||
    message.includes('does not exist') ||
    message.includes('no rows')
  ) {
    return ErrorCategory.NOT_FOUND;
  }

  // Validation errors
  if (
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('must be') ||
    message.includes('validation')
  ) {
    return ErrorCategory.VALIDATION;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * User-friendly error messages by category
 */
const errorMessages: Record<ErrorCategory, { message: string; suggestion: string }> = {
  [ErrorCategory.NOT_FOUND]: {
    message: 'The requested data could not be found.',
    suggestion: 'Please verify the ID or name and try again.',
  },
  [ErrorCategory.VALIDATION]: {
    message: 'The request contains invalid data.',
    suggestion: 'Please check your input and try again.',
  },
  [ErrorCategory.DATABASE]: {
    message: 'We\'re having trouble accessing the data right now.',
    suggestion: 'Please try again in a moment. If the issue persists, the data may be temporarily unavailable.',
  },
  [ErrorCategory.AI_SERVICE]: {
    message: 'The coaching analysis service is temporarily unavailable.',
    suggestion: 'Please try again in a few moments.',
  },
  [ErrorCategory.PERMISSION]: {
    message: 'You don\'t have permission to access this data.',
    suggestion: 'Please contact your administrator if you believe this is an error.',
  },
  [ErrorCategory.RATE_LIMIT]: {
    message: 'Too many requests. The service is temporarily limited.',
    suggestion: 'Please wait a moment before trying again.',
  },
  [ErrorCategory.NETWORK]: {
    message: 'A network error occurred while processing your request.',
    suggestion: 'Please check your connection and try again.',
  },
  [ErrorCategory.UNKNOWN]: {
    message: 'Something went wrong while processing your request.',
    suggestion: 'Please try again. If the issue persists, try rephrasing your question.',
  },
};

/**
 * Build a user-friendly error response
 */
export function buildErrorMessage(
  error: unknown,
  context?: {
    operation?: string;
    entityType?: string;
    entityName?: string;
  }
): string {
  const category = classifyError(error);
  const { message, suggestion } = errorMessages[category];

  // Build contextual message
  let errorResponse = message;

  // Add context if provided
  if (context?.operation) {
    errorResponse = `Unable to ${context.operation}. ${message}`;
  }

  // Add suggestion
  errorResponse += ` ${suggestion}`;

  // Log the actual error for debugging (but don't expose to user)
  const actualError = error instanceof Error ? error.message : String(error);
  console.error(`[error-messages] Category: ${category}, Original error: ${actualError}`);

  return errorResponse;
}

/**
 * Specific error messages for common scenarios
 */
export const ErrorMessages = {
  // Agent-related
  agentNotFound: (name: string) =>
    `I couldn't find an agent named "${name}". Try checking the spelling, or you can say "show agents" to see the full list.`,

  agentRequired: () =>
    `Please specify which agent you'd like to see. You can use their name (e.g., "show calls for Sarah") or click an agent in the sidebar.`,

  // Call-related
  callNotFound: (callId: string) =>
    `I couldn't find a call with ID "${callId.slice(0, 8)}...". The call may have been removed, or the ID might be incorrect. Try asking to "list calls" to see recent calls.`,

  callRequired: () =>
    `Please specify which call you'd like to see. You can provide a call ID, or first list an agent's calls by asking something like "show Sarah's calls."`,

  // Transcript-related
  transcriptNotReady: (callId: string) =>
    `The transcript for call "${callId.slice(0, 8)}..." isn't available yet. It may still be processing. Try again in a few minutes.`,

  transcriptNotFound: (callId: string) =>
    `No transcript was found for call "${callId.slice(0, 8)}...". The call may not have been recorded or the transcript may have been removed.`,

  // Search-related
  searchQueryRequired: () =>
    `Please tell me what you'd like to search for. For example: "search for calls about pricing" or "find calls where the customer mentioned competitors."`,

  noSearchResults: (query: string) =>
    `No calls matched "${query}". Try broadening your search terms, or check if the time period is correct. You can also search for specific phrases or topics.`,

  // Team-related
  noTeamData: (department: string, startDate: string, endDate: string) =>
    `No call data found for the ${department} team between ${startDate} and ${endDate}. Try expanding the date range or checking if agents have been assigned to this department.`,

  // Agent stats
  noAgentStats: (agentName: string, startDate: string, endDate: string) =>
    `No calls found for ${agentName} between ${startDate} and ${endDate}. Try expanding the date range, or check if ${agentName} has any recorded calls.`,

  // Date-related
  invalidDateRange: () =>
    `The date range appears to be invalid. Please specify dates in a format like "last 7 days", "this week", or "January 1 to January 15."`,

  // Coaching-related
  coachingAnalysisFailed: () =>
    `I wasn't able to complete the coaching analysis right now. This is usually temporary. Please try again in a moment.`,

  coachingCallRequired: () =>
    `To provide coaching feedback, I need a specific call to analyze. You can provide a call ID, or first list an agent's calls and then ask for coaching on one of them.`,

  // General
  genericError: () =>
    `Something went wrong while processing your request. Please try again. If the issue continues, try rephrasing your question or breaking it into smaller parts.`,

  // Empty states with suggestions
  emptyCallList: (agentName: string, startDate: string, endDate: string) =>
    `${agentName} has no recorded calls between ${startDate} and ${endDate}.\n\n**Suggestions:**\n- Try a different date range (e.g., "show calls from the last 30 days")\n- Check if the agent name is spelled correctly\n- Ask "show agents" to see the full team roster`,

  // Permission-related
  accessDenied: () =>
    `You don't have permission to access this data. If you believe this is an error, please contact your administrator.`,

  scopeLimited: (role: string) =>
    `As a${role === 'agent' ? 'n' : ''} ${role}, you can only view your own call data. Contact your manager for team-wide reports.`,
};

/**
 * Build an error response with consistent formatting
 */
export function formatError(message: string): {
  success: false;
  data: null;
  error: string;
} {
  return {
    success: false,
    data: null,
    error: message,
  };
}
