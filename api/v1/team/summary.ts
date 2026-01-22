/**
 * Team Summary Endpoint
 * GET /api/v1/team/summary - Get team summary metrics
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler } from '../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  requireManagerOrAdmin,
} from '../../../lib/middleware/auth';
import { callsService } from '../../../lib/services/calls.service';
import { agentsService } from '../../../lib/services/agents.service';

export default createApiHandler({
  GET: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      // Only managers and admins can see team summary
      requireManagerOrAdmin(req.profile!);

      const { start_date, end_date, department = 'Agent' } = req.query as {
        start_date?: string;
        end_date?: string;
        department?: string;
      };

      const dataScope = req.dataScope!;

      // Default to 7 days if no dates provided
      const endDate = end_date || new Date().toISOString().split('T')[0];
      const startDate =
        start_date ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

      // Get all agents in scope
      const agentIds = dataScope.agentUserIds;

      if (agentIds.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            total_calls: 0,
            total_agents: 0,
            avg_calls_per_agent: 0,
            agent_summaries: [],
          },
        });
        return;
      }

      // Get performance for each agent
      const agentSummaries = await Promise.all(
        agentIds.slice(0, 20).map(async (agentId) => {
          const agent = await agentsService.getAgentById(agentId);
          const performance = await callsService.getAgentPerformance(
            agentId,
            startDate,
            endDate
          );
          return {
            agent_user_id: agentId,
            agent_name: agent?.first_name || 'Unknown',
            ...performance,
          };
        })
      );

      // Calculate totals
      const totalCalls = agentSummaries.reduce(
        (sum, a) => sum + (a.total_calls || 0),
        0
      );

      res.status(200).json({
        success: true,
        data: {
          total_calls: totalCalls,
          total_agents: agentIds.length,
          avg_calls_per_agent:
            agentIds.length > 0 ? Math.round(totalCalls / agentIds.length) : 0,
          agent_summaries: agentSummaries,
        },
        filters: {
          department,
          start_date: startDate,
          end_date: endDate,
        },
        scope: {
          isFloorWide: dataScope.isFloorWide,
          isTeamScope: dataScope.isTeamScope,
          teamName: dataScope.teamName,
        },
      });
    }
  ),
});
