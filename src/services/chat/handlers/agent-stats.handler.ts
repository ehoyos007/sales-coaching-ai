import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { callsService } from '../../database/calls.service.js';
import { agentsService } from '../../database/agents.service.js';
import { getDateRange } from '../../../utils/date.utils.js';

export async function handleAgentStats(
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
        return {
          success: false,
          data: null,
          error: `Could not find an agent named "${agentName}". Please check the spelling or try a different name.`,
        };
      }
      agentId = resolved.agent_user_id;
      agentName = resolved.first_name;
    }

    if (!agentId) {
      return {
        success: false,
        data: null,
        error: 'Please specify which agent\'s performance you want to see.',
      };
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

    // Fetch performance data
    const performance = await callsService.getAgentPerformance(
      agentId,
      startDate,
      endDate
    );

    if (!performance) {
      return {
        success: true,
        data: {
          type: 'agent_stats',
          agent_name: agentName,
          agent_user_id: agentId,
          start_date: startDate,
          end_date: endDate,
          performance: null,
          message: `No calls found for ${agentName} in the specified date range.`,
        },
      };
    }

    // Also get daily breakdown
    const dailyCalls = await callsService.getAgentDailyCalls(
      agentId,
      startDate,
      endDate
    );

    return {
      success: true,
      data: {
        type: 'agent_stats',
        agent_name: agentName,
        agent_user_id: agentId,
        start_date: startDate,
        end_date: endDate,
        performance,
        daily_calls: dailyCalls,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      data: null,
      error: `Failed to fetch agent stats: ${message}`,
    };
  }
}
