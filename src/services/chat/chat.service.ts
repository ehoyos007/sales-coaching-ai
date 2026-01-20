import { intentService } from '../ai/intent.service.js';
import { agentsService } from '../database/agents.service.js';
import { sessionsService } from '../database/sessions.service.js';
import { getHandler } from './handlers/index.js';
import { responseFormatter } from './response.formatter.js';
import { ChatContext, ChatResponse, Intent, HandlerParams } from '../../types/index.js';

/**
 * Main chat orchestrator - processes user messages and returns formatted responses
 */
export async function processMessage(
  message: string,
  context?: ChatContext,
  sessionId?: string
): Promise<ChatResponse> {
  const timestamp = new Date().toISOString();

  try {
    // 0. Initialize session and save user message if sessionId provided
    if (sessionId) {
      await sessionsService.getOrCreateSession({
        session_id: sessionId,
        context,
      });

      await sessionsService.saveMessage({
        session_id: sessionId,
        role: 'user',
        content: message,
      });
    }

    // 1. Classify the user's intent
    const classification = await intentService.classify(message);
    console.log('Intent classification:', classification);

    // 2. Build handler params
    const params: HandlerParams = {
      agentId: context?.agent_user_id,
      agentName: classification.agent_name || undefined,
      daysBack: classification.days_back,
      callId: classification.call_id || context?.call_id || undefined,
      searchQuery: classification.search_query || undefined,
      department: context?.department,
    };

    // 3. Resolve agent name to ID if needed
    if (classification.agent_name && !params.agentId) {
      const resolved = await agentsService.resolveByName(classification.agent_name);
      if (resolved) {
        params.agentId = resolved.agent_user_id;
        params.agentName = resolved.first_name;
      }
    }

    // 4. Get the appropriate handler
    const handler = getHandler(classification.intent);

    // 5. Execute the handler
    const result = await handler(params, message);

    // 6. Handle errors
    if (!result.success) {
      const errorResponse: ChatResponse = {
        success: false,
        response: result.error || 'An error occurred processing your request.',
        intent: classification.intent,
        timestamp,
        error: result.error,
      };

      // Save error response to history
      if (sessionId) {
        await sessionsService.saveMessage({
          session_id: sessionId,
          role: 'assistant',
          content: errorResponse.response,
          intent: classification.intent,
        });
      }

      return errorResponse;
    }

    // 7. Format the response
    const formattedResponse = await responseFormatter.formatResponse({
      intent: classification.intent,
      data: result.data as Record<string, unknown>,
      originalMessage: message,
    });

    const successResponse: ChatResponse = {
      success: true,
      response: formattedResponse,
      data: {
        type: getDataType(classification.intent),
        ...(result.data as Record<string, unknown>),
      },
      intent: classification.intent,
      timestamp,
    };

    // Save assistant response to history
    if (sessionId) {
      await sessionsService.saveMessage({
        session_id: sessionId,
        role: 'assistant',
        content: formattedResponse,
        intent: classification.intent,
        data: successResponse.data,
      });
    }

    return successResponse;

  } catch (error) {
    console.error('Chat processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const errorResponse: ChatResponse = {
      success: false,
      response: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
      intent: Intent.GENERAL,
      timestamp,
      error: errorMessage,
    };

    // Save error response to history
    if (sessionId) {
      try {
        await sessionsService.saveMessage({
          session_id: sessionId,
          role: 'assistant',
          content: errorResponse.response,
          intent: Intent.GENERAL,
        });
      } catch (saveError) {
        console.error('Failed to save error message to history:', saveError);
      }
    }

    return errorResponse;
  }
}

/**
 * Get data type string from intent
 */
function getDataType(intent: Intent): string {
  const typeMap: Record<Intent, string> = {
    [Intent.LIST_CALLS]: 'call_list',
    [Intent.AGENT_STATS]: 'agent_stats',
    [Intent.TEAM_SUMMARY]: 'team_summary',
    [Intent.GET_TRANSCRIPT]: 'transcript',
    [Intent.SEARCH_CALLS]: 'search_results',
    [Intent.COACHING]: 'coaching',
    [Intent.GENERAL]: 'general',
  };
  return typeMap[intent] || 'general';
}

export const chatService = {
  processMessage,
};
