import { intentService } from '../ai/intent.service.js';
import { agentsService } from '../database/agents.service.js';
import { sessionsService } from '../database/sessions.service.js';
import { getHandler } from './handlers/index.js';
import { responseFormatter } from './response.formatter.js';
import {
  ChatContext,
  ChatResponse,
  Intent,
  HandlerParams,
  UserContext,
  DataAccessScope,
} from '../../types/index.js';

/**
 * Get scope description for response messages
 */
function getScopeDescription(scope: DataAccessScope): string {
  if (scope.isFloorWide) {
    return 'floor-wide (all agents)';
  }
  if (scope.isTeamScope && scope.teamName) {
    return `${scope.teamName} team`;
  }
  if (scope.agentUserIds.length === 1) {
    return 'your calls';
  }
  return 'accessible agents';
}

/**
 * Main chat orchestrator - processes user messages and returns formatted responses
 */
export async function processMessage(
  message: string,
  context?: ChatContext,
  sessionId?: string,
  userContext?: UserContext,
  dataScope?: DataAccessScope
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
    console.log('[chat.service] Intent classification:', classification);

    // Log data scope info
    if (dataScope) {
      console.log(
        `[chat.service] Data scope: ${getScopeDescription(dataScope)} (${dataScope.agentUserIds.length} agents)`
      );
    }

    // 2. Build handler params with auth context
    const params: HandlerParams = {
      agentId: context?.agent_user_id,
      agentName: classification.agent_name || undefined,
      daysBack: classification.days_back,
      callId: classification.call_id || context?.call_id || undefined,
      searchQuery: classification.search_query || undefined,
      department: context?.department,
      // Auth context
      dataScope,
      userContext,
    };

    // 3. Resolve agent name to ID if needed
    if (classification.agent_name && !params.agentId) {
      const resolved = await agentsService.resolveByName(classification.agent_name);
      if (resolved) {
        params.agentId = resolved.agent_user_id;
        params.agentName = resolved.first_name;
      }
    }

    // 4. Check data access permissions for agent-specific queries
    if (params.agentId && dataScope) {
      // Check if the user can access this agent's data
      if (!dataScope.agentUserIds.includes(params.agentId)) {
        const errorMessage =
          userContext?.role === 'agent'
            ? 'You can only access your own data.'
            : `Agent is not in your team. Ask for "floor-wide" data to see all agents.`;

        const errorResponse: ChatResponse = {
          success: false,
          response: errorMessage,
          intent: classification.intent,
          timestamp,
          error: errorMessage,
        };

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
    }

    // 5. Check team summary access (manager/admin only)
    if (classification.intent === Intent.TEAM_SUMMARY && userContext?.role === 'agent') {
      const errorMessage =
        'Team summaries are only available to managers and admin. You can ask about your own calls instead.';

      const errorResponse: ChatResponse = {
        success: false,
        response: errorMessage,
        intent: classification.intent,
        timestamp,
        error: errorMessage,
      };

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

    // 6. Get the appropriate handler
    const handler = getHandler(classification.intent);

    // 7. Execute the handler
    const result = await handler(params, message);

    // 8. Handle errors
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

    // 9. Format the response
    const formattedResponse = await responseFormatter.formatResponse({
      intent: classification.intent,
      data: result.data as Record<string, unknown>,
      originalMessage: message,
    });

    // 10. Add scope context to response if available
    let responseWithScope = formattedResponse;
    if (dataScope && !dataScope.isFloorWide && dataScope.agentUserIds.length > 1) {
      // Add scope context for team-scoped queries
      const scopeNote = `\n\n*Showing results for ${getScopeDescription(dataScope)}*`;
      responseWithScope = formattedResponse + scopeNote;
    }

    const successResponse: ChatResponse = {
      success: true,
      response: responseWithScope,
      data: {
        type: getDataType(classification.intent),
        ...(result.data as Record<string, unknown>),
        // Include scope metadata
        _scope: dataScope
          ? {
              isFloorWide: dataScope.isFloorWide,
              isTeamScope: dataScope.isTeamScope,
              teamName: dataScope.teamName,
              agentCount: dataScope.agentUserIds.length,
            }
          : undefined,
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
    console.error('[chat.service] Processing error:', error);
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
        console.error('[chat.service] Failed to save error message to history:', saveError);
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
    [Intent.OBJECTION_ANALYSIS]: 'objection_analysis',
    [Intent.GENERAL]: 'general',
  };
  return typeMap[intent] || 'general';
}

export const chatService = {
  processMessage,
};
