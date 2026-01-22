/**
 * Call Detail Endpoint
 * GET /api/v1/calls/:callId - Get call details
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
      const { callId } = req.query as { callId: string };

      if (!callId) {
        throw ApiException.badRequest('Call ID is required');
      }

      const call = await callsService.getCallById(callId);

      if (!call) {
        throw ApiException.notFound('Call not found');
      }

      // Check access based on agent_user_id of the call
      if (call.agent_user_id) {
        canAccessAgent(req.profile!, req.dataScope!, call.agent_user_id);
      }

      res.status(200).json({
        success: true,
        data: call,
      });
    }
  ),
});
