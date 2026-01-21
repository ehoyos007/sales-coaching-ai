import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { callsService } from '../../database/calls.service.js';
import { agentsService } from '../../database/agents.service.js';
import { getDateRange } from '../../../utils/date.utils.js';
import { ErrorMessages, buildErrorMessage, formatError } from '../../../utils/error-messages.js';

export async function handleListCalls(
  params: HandlerParams,
  _originalMessage: string
): Promise<HandlerResult> {
  try {
    // If no agent ID, we need to resolve from name
    let agentId = params.agentId;
    let agentName = params.agentName;

    if (!agentId && agentName) {
      const resolved = await agentsService.resolveByName(agentName);
      if (!resolved) {
        return formatError(ErrorMessages.agentNotFound(agentName));
      }
      agentId = resolved.agent_user_id;
      agentName = resolved.first_name;
    }

    if (!agentId) {
      return formatError(ErrorMessages.agentRequired());
    }

    // Get agent details if we don't have the name
    if (!agentName) {
      const agent = await agentsService.getAgentById(agentId);
      agentName = agent?.first_name || 'Unknown';
    }

    // Calculate date range
    const { startDate, endDate } = params.startDate && params.endDate
      ? { startDate: params.startDate, endDate: params.endDate }
      : getDateRange(params.daysBack);

    // Fetch calls
    const calls = await callsService.getAgentCalls(
      agentId,
      startDate,
      endDate,
      params.limit || 50
    );

    return {
      success: true,
      data: {
        type: 'call_list',
        agent_name: agentName,
        agent_user_id: agentId,
        start_date: startDate,
        end_date: endDate,
        call_count: calls.length,
        calls,
      },
    };
  } catch (error) {
    return formatError(buildErrorMessage(error, { operation: 'fetch calls' }));
  }
}
