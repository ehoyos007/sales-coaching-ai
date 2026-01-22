/**
 * Agents Endpoint
 * GET /api/v1/agents - List agents
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler } from '../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
} from '../../../lib/middleware/auth';
import { agentsService, Agent } from '../../../lib/services/agents.service';

export default createApiHandler({
  GET: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      const dataScope = req.dataScope!;

      // Get agents based on data scope
      let agents: Agent[] = [];
      if (dataScope.isFloorWide || req.profile?.role === 'admin') {
        agents = await agentsService.listAgents();
      } else if (dataScope.teamId) {
        agents = await agentsService.getAgentsByTeam(dataScope.teamId);
      } else if (dataScope.agentUserIds.length > 0) {
        // Get agents by IDs for the scoped list
        const agentPromises = dataScope.agentUserIds.map((id) =>
          agentsService.getAgentById(id)
        );
        const results = await Promise.all(agentPromises);
        agents = results.filter((a): a is Agent => a !== null);
      } else {
        agents = [];
      }

      res.status(200).json({
        success: true,
        data: agents,
        scope: {
          isFloorWide: dataScope.isFloorWide,
          isTeamScope: dataScope.isTeamScope,
          teamName: dataScope.teamName,
          agentCount: agents.length,
        },
      });
    }
  ),
});
