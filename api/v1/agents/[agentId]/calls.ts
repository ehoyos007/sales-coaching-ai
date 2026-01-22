/**
 * Agent Calls Endpoint
 * GET /api/v1/agents/:agentId/calls - Get calls for an agent
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  canAccessAgent,
} from '../../../../lib/middleware/auth';
import { callsService } from '../../../../lib/services/calls.service';

export default createApiHandler({
  GET: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      const { agentId } = req.query as { agentId: string };
      const {
        start_date,
        end_date,
        limit = '50',
      } = req.query as {
        start_date?: string;
        end_date?: string;
        limit?: string;
      };

      if (!agentId) {
        throw ApiException.badRequest('Agent ID is required');
      }

      // Check access
      canAccessAgent(req.profile!, req.dataScope!, agentId);

      // Default to 7 days if no dates provided
      const endDate = end_date || new Date().toISOString().split('T')[0];
      const startDate =
        start_date ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

      const calls = await callsService.getAgentCalls(
        agentId,
        startDate,
        endDate,
        parseInt(limit, 10)
      );

      res.status(200).json({
        success: true,
        data: calls,
        filters: {
          agent_user_id: agentId,
          start_date: startDate,
          end_date: endDate,
          limit: parseInt(limit, 10),
        },
      });
    }
  ),
});
