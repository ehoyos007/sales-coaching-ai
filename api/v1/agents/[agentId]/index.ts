/**
 * Agent Detail Endpoint
 * GET /api/v1/agents/:agentId - Get agent details
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  canAccessAgent,
} from '../../../../lib/middleware/auth';
import { agentsService } from '../../../../lib/services/agents.service';

export default createApiHandler({
  GET: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      const { agentId } = req.query as { agentId: string };

      if (!agentId) {
        throw ApiException.badRequest('Agent ID is required');
      }

      // Check access
      canAccessAgent(req.profile!, req.dataScope!, agentId);

      const agent = await agentsService.getAgentById(agentId);

      if (!agent) {
        throw ApiException.notFound('Agent not found');
      }

      res.status(200).json({
        success: true,
        data: agent,
      });
    }
  ),
});
